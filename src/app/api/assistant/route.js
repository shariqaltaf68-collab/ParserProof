import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';
import { retrieveContext } from '@/lib/rag';
import { sanitizeInput } from '@/lib/utils';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const DAILY_LIMIT = 25;

// GET: Retrieve authenticated user's chat history & check remaining limit
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // Guest: Retrieve IP rate limits
      const guestIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const cleanIp = guestIp.split(',')[0].trim();
      
      const guestUsageRecord = await prisma.guestUsage.findUnique({
        where: { ip: cleanIp },
      });

      let currentCount = 0;
      if (guestUsageRecord) {
        const isExpired = Date.now() - new Date(guestUsageRecord.updatedAt).getTime() > 24 * 60 * 60 * 1000;
        if (!isExpired) {
          currentCount = guestUsageRecord.count;
        }
      }

      return NextResponse.json({
        messages: [],
        isGuest: true,
        limit: DAILY_LIMIT,
        remainingMessages: Math.max(0, DAILY_LIMIT - currentCount),
      });
    }

    const userId = session.user.id;
    const messages = await prisma.assistantMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const userCount = await prisma.assistantMessage.count({
      where: {
        userId,
        role: 'user',
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    return NextResponse.json({
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
      isGuest: false,
      limit: DAILY_LIMIT,
      remainingMessages: Math.max(0, DAILY_LIMIT - userCount),
    });
  } catch (error) {
    console.error('[Assistant API] GET history error:', error);
    return NextResponse.json({ error: 'Failed to retrieve conversation history.' }, { status: 500 });
  }
}

// DELETE: Clear authenticated user's chat history
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.assistantMessage.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true, message: 'Conversation history cleared successfully.' });
  } catch (error) {
    console.error('[Assistant API] DELETE history error:', error);
    return NextResponse.json({ error: 'Failed to clear conversation history.' }, { status: 500 });
  }
}

// POST: Process message, run RAG, query Groq, save history & track 25 cap limit
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { message, projectId, history = [] } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    const cleanMessage = sanitizeInput(message);
    const userId = session?.user?.id;
    const isGuest = !userId;

    let guestIp = '127.0.0.1';
    let guestUsageRecord = null;
    let currentGuestCount = 0;
    let guestNextCount = 1;

    // 1. Guest Usage Limit Check
    if (isGuest) {
      guestIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      guestIp = guestIp.split(',')[0].trim();

      guestUsageRecord = await prisma.guestUsage.findUnique({
        where: { ip: guestIp },
      });

      if (guestUsageRecord) {
        const isExpired = Date.now() - new Date(guestUsageRecord.updatedAt).getTime() > 24 * 60 * 60 * 1000;
        if (isExpired) {
          currentGuestCount = 0;
          guestNextCount = 1;
        } else {
          currentGuestCount = guestUsageRecord.count;
          guestNextCount = currentGuestCount + 1;
        }
      }

      if (currentGuestCount >= DAILY_LIMIT) {
        console.warn(`[Assistant API] Guest IP ${guestIp} hit the free messages limit: ${currentGuestCount}/${DAILY_LIMIT}`);
        return NextResponse.json({
          error: 'limit_reached',
          message: 'Free assistant limit reached (25 messages per 24 hours). Log in to continue or wait.',
          limit: DAILY_LIMIT,
          count: currentGuestCount,
          remainingMessages: 0,
        }, { status: 403 });
      }
    }

    // 2. Authenticated User Limit Check
    let userCount = 0;
    if (!isGuest) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      userCount = await prisma.assistantMessage.count({
        where: {
          userId,
          role: 'user',
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });

      if (userCount >= DAILY_LIMIT) {
        console.warn(`[Assistant API] User ${userId} hit the daily limit: ${userCount}/${DAILY_LIMIT}`);
        return NextResponse.json({
          error: 'limit_reached',
          message: 'Daily AI Assistant limit reached (25 messages per 24 hours).',
          limit: DAILY_LIMIT,
          count: userCount,
          remainingMessages: 0,
        }, { status: 403 });
      }
    }

    // 3. Project Context Load (Resume-Aware Mode)
    let projectContextText = '';
    let selectedProject = null;

    if (projectId) {
      selectedProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          ...(userId ? { userId } : {}),
        },
      });

      if (selectedProject) {
        projectContextText = `
Candidate Target Job Title: ${selectedProject.jobTitle || 'N/A'}
Candidate Target Company: ${selectedProject.company || 'N/A'}
Target Job Description:
${selectedProject.jobDescription || ''}
Candidate Original Resume Text:
${selectedProject.resumeText || ''}
Programmatic ATS Score: ${selectedProject.atsScore || 'N/A'}%
        `.trim();
      }
    }

    // 4. Perform Hybrid RAG Search
    const searchTokens = [
      cleanMessage,
      selectedProject ? `${selectedProject.jobTitle} ${selectedProject.company}` : '',
      history.slice(-3).map(h => h.content).join(' '),
    ].filter(Boolean).join(' ');

    const ragResult = retrieveContext(searchTokens, 3);
    const formattedContext = ragResult.chunks
      .map(
        (chunk, idx) => `[TRUSTED SOURCE #${idx + 1}]
Title: ${chunk.title}
Category: ${chunk.category}
Grounded Rules:
${chunk.content}`
      )
      .join('\n\n');

    // 5. Construct System Prompts and Enforce Anti-Hallucination & Brevity Constraints
    const systemPrompt = `You are the ParserProof AI Assistant—a grounded, practical, direct, and highly realistic career coach and executive recruitment advisor.
Your job is to assist the user with resume analysis, ATS optimization explanations, keyword gaps, STAR writing improvements, cover letters, and preparation.

=========================================
TRUSTED RETRIEVED CONTEXT (GROUNDING CORE)
=========================================
You MUST ground your advice, recommendations, and pricing claims strictly in the following retrieved guidelines. Do NOT invent rules, pricing options, or fake recruitment stats.

${formattedContext}

${projectContextText ? `
=========================================
CANDIDATE WORKSPACE CONTEXT (RESUME-AWARE)
=========================================
The candidate is actively working on a resume optimization project. Refer to this data when they ask about their score, bullet points, keywords, or interview queries:
${projectContextText}
` : ''}STRICT ANTI-HALLUCINATION ENFORCEMENT & FORMATTING:
- Never invent experience, achievements, tools, degrees, or certifications for the user.
- If the user asks you to write or optimize a bullet point, do NOT fabricate percentages or dollar metrics. Instead, use a clear bracketed placeholder such as "[quantify: metrics]" and explain why they must populate it themselves.
- Maintain a direct, calm, blunt, and highly realistic tone. Avoid fake motivational AI fluff (e.g. "you are off to an amazing start!" or "Congratulations!"). Stay practical.
- Never guarantee job placements, interview callbacks, or direct hiring outcomes.
- ParserProof plans and prices are: Free Plan (₹0/mo, 3 generations), Starter Plan (₹499/mo, 15 generations, Cover Letters), Pro Plan (₹999/mo, 50 generations, Interview Prep & Skill Gaps). Do not invent other prices.
- **NO ASTERISKS OR BOLDING AT ALL**: You MUST NEVER use any asterisks (neither ** nor *) or italic symbols. Do not bold or italicize any words. Speak in plain, unadorned text.
- **NO LISTS, TABLES, OR MARKDOWN**: Do NOT use raw markdown headings (e.g., #, ##, ###), markdown horizontal rules, markdown tables, or raw bullet lists (e.g., lines starting with -, *, or numbering). Avoid complex bulleted outlines, situation/action/result tables, or generic checklist templates.
- **STRICT BREVITY & Executive PARAGRAPHS**: You MUST write your responses in extremely clean, smooth, polished, and highly professional prose paragraphs. Keep your entire response exceptionally brief (strictly under 75 words maximum, preferably a single short paragraph of 2-3 clean, realistic sentences). Speak like a busy, elite executive recruitment director who communicates directly with zero robotic AI filler.
- **DIRECT RESUME INTEGRATION**: If the user clicks any action or asks about their resume, do not give generic examples or STAR/XYZ tutorials. Directly find a relevant bullet point from their actual resume and rewrite it in place using the Google XYZ formula, using brackets like "[quantify: metric]" for missing metrics. Output only the replacement bullet point itself inside smooth, plain prose.`;

    // 6. Assemble Messages for Groq completion
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: sanitizeInput(msg.content),
      })),
      { role: 'user', content: cleanMessage },
    ];

    console.log(`[Assistant API] Dispatching prompt to Groq for user. RAG match confidence: ${ragResult.averageConfidence}%`);

    const completion = await openai.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: apiMessages,
      temperature: 0.3,
      max_tokens: 1500,
    });

    const aiResponse = completion.choices?.[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('Groq AI returned an empty response.');
    }

    // 7. DB Persistence & Usage Increment
    let remainingVal = DAILY_LIMIT;

    if (isGuest) {
      const updatedUsage = await prisma.guestUsage.upsert({
        where: { ip: guestIp },
        update: { count: guestNextCount, updatedAt: new Date() },
        create: { ip: guestIp, count: 1 }
      });
      remainingVal = Math.max(0, DAILY_LIMIT - guestNextCount);
      console.log(`[Assistant API] Guest ${guestIp} interaction incremented: ${guestNextCount}/${DAILY_LIMIT}`);
    } else {
      await prisma.$transaction([
        prisma.assistantMessage.create({
          data: {
            userId,
            role: 'user',
            content: cleanMessage,
            projectId: projectId || null,
          }
        }),
        prisma.assistantMessage.create({
          data: {
            userId,
            role: 'assistant',
            content: aiResponse,
            projectId: projectId || null,
          }
        })
      ]);
      remainingVal = Math.max(0, DAILY_LIMIT - (userCount + 1));
      console.log(`[Assistant API] Messages saved in DB for user: ${userId}`);
    }

    return NextResponse.json({
      response: aiResponse,
      ragConfidence: ragResult.averageConfidence,
      ragSources: ragResult.chunks.map(c => ({ id: c.id, title: c.title, category: c.category })),
      remainingMessages: remainingVal,
      isGuest,
    });

  } catch (error) {
    console.error('[Assistant API] POST chat processing error:', error);
    
    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred while processing your message. Please try again.';

    if (error.status === 429) {
      statusCode = 429;
      errorMessage = 'AI service is currently rate-limited. Please wait a moment before sending another message.';
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
