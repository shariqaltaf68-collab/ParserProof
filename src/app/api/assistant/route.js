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

const GUEST_MESSAGE_LIMIT = 5;

// GET: Retrieve authenticated user's chat history
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // Guests don't have saved DB history, return empty
      return NextResponse.json({ messages: [], isGuest: true, limit: GUEST_MESSAGE_LIMIT });
    }

    const userId = session.user.id;
    const messages = await prisma.assistantMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
      isGuest: false,
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

// POST: Process message, run RAG, query Groq, save history & track guest limits
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

    // 1. Guest Usage Limit Check
    if (isGuest) {
      guestIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      // Normalize IP string if multiple are sent in a proxy chain
      guestIp = guestIp.split(',')[0].trim();

      guestUsageRecord = await prisma.guestUsage.findUnique({
        where: { ip: guestIp },
      });

      const currentCount = guestUsageRecord?.count || 0;

      if (currentCount >= GUEST_MESSAGE_LIMIT) {
        console.warn(`[Assistant API] Guest IP ${guestIp} hit the free messages limit: ${currentCount}/${GUEST_MESSAGE_LIMIT}`);
        return NextResponse.json({
          error: 'limit_reached',
          message: 'Free assistant limit reached. Log in to continue getting personalized ATS, resume, and interview guidance.',
          limit: GUEST_MESSAGE_LIMIT,
          count: currentCount,
        }, { status: 403 });
      }
    }

    // 2. Project Context Load (Resume-Aware Mode)
    let projectContextText = '';
    let selectedProject = null;

    if (projectId) {
      // If user is logged in, ensure the project belongs to them.
      // If guest, allow reading the project structure if it's the one they just generated (highly convenient)
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

    // 3. Perform Hybrid RAG Search
    // Combine the user's latest prompt, historical context tokens, and active project metadata to find optimized guidelines
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

    // 4. Construct System Prompts and Enforce Anti-Hallucination Constraints
    const systemPrompt = `You are the ParserProof AI Assistant—a grounded, practical, direct, and highly realistic career coach and ATS verification expert.
Your job is to assist the user with resume analysis, ATS optimization explanations, keyword gaps, STAR writing improvements, cover letters, and technical/behavioral interview preparation.

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
` : ''}

STRICT ANTI-HALLUCINATION ENFORCEMENT & FORMATTING:
- Never invent experience, achievements, tools, degrees, or certifications for the user.
- If the user asks you to write or optimize a bullet point and they haven't provided enough metrics, do NOT fabricate percentages or dollar metrics. Instead, use a clear bracketed placeholder such as "[quantify: e.g., reduced load time by X%]" or "[add tool name]" and explain why they must populate it themselves.
- Maintain a direct, calm, blunt, and highly realistic tone. Avoid fake motivational AI fluff (e.g. "you are off to an amazing start!"). Stay practical.
- Never pretend to know exact proprietary ATS algorithms. Explain ATS parsing behaviors as probabilities and practical extraction heuristics (e.g. single-column formats read cleaner horizontally).
- Never guarantee job placements, interview callbacks, or direct hiring outcomes.
- If the user's query is unrelated to resumes, job applications, cover letters, interviews, or ParserProof features, politely pivot them back to career topics.
- ParserProof plans and prices are: Free Plan (₹0/mo, 3 generations), Starter Plan (₹499/mo, 15 generations, Cover Letters), Pro Plan (₹999/mo, 50 generations, Interview Prep & Skill Gaps). Do not invent other prices.
- **ZERO LATEX RULE**: NEVER use raw LaTeX syntax, blocks, or wrappers (such as $$, \[, \], \(, \), \text, or \frac) for formulas, weight breakdowns, equations, or percentages. The browser terminal cannot parse LaTeX and it renders as ugly raw text.
- **ELITE TYPOGRAPHIC MATH**: Format all math equations, weights, and scoring distributions in extremely clean, high-contrast, beautiful standard Markdown (e.g. bold numbers, clean fractions like 1/2, bullet points, or simple inline equations like **Score = (50% * Keywords) + (25% * Structure) + (25% * STAR Format)**) for pristine scannability on all screens.

Remember: Be helpful, concise, realistic, and blunt. Speak like a professional recruiting consultant, not a chatty assistant. Keep responses reasonably short and scannable.`;

    // 5. Assemble Messages for Groq completion
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

    // 6. DB Persistence & Usage Increment
    if (isGuest) {
      // Upsert guest usage count
      const updatedUsage = await prisma.guestUsage.upsert({
        where: { ip: guestIp },
        update: { count: { increment: 1 } },
        create: { ip: guestIp, count: 1 }
      });
      console.log(`[Assistant API] Guest ${guestIp} interaction incremented: ${updatedUsage.count}/${GUEST_MESSAGE_LIMIT}`);
    } else {
      // Save authenticated messages (both user input and assistant response)
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
      console.log(`[Assistant API] Messages saved in DB for user: ${userId}`);
    }

    return NextResponse.json({
      response: aiResponse,
      ragConfidence: ragResult.averageConfidence,
      ragSources: ragResult.chunks.map(c => ({ id: c.id, title: c.title, category: c.category })),
      remainingMessages: isGuest ? Math.max(0, GUEST_MESSAGE_LIMIT - ((guestUsageRecord?.count || 0) + 1)) : null,
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
