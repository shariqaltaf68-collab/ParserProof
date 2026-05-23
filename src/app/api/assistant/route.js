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

const getPlanLimit = (plan) => {
  if (plan === 'pro') return 50;
  return 30; // free, starter, and guests get 30
};

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
 
      const guestLimit = getPlanLimit('free');
      return NextResponse.json({
        messages: [],
        isGuest: true,
        limit: guestLimit,
        remainingMessages: Math.max(0, guestLimit - currentCount),
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
 
    const userLimit = getPlanLimit(session.user.plan);
    return NextResponse.json({
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
      isGuest: false,
      limit: userLimit,
      remainingMessages: Math.max(0, userLimit - userCount),
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
    const { message, projectId, history = [], displayMessage } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    const cleanMessage = sanitizeInput(message);
    const cleanDisplayMessage = displayMessage ? sanitizeInput(displayMessage) : null;
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

      const guestLimit = getPlanLimit('free');
      if (currentGuestCount >= guestLimit) {
        console.warn(`[Assistant API] Guest IP ${guestIp} hit the free messages limit: ${currentGuestCount}/${guestLimit}`);
        return NextResponse.json({
          error: 'limit_reached',
          message: 'Free assistant limit reached (30 messages per 24 hours). Log in to continue or wait.',
          limit: guestLimit,
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

      const userLimit = getPlanLimit(session.user.plan);
      if (userCount >= userLimit) {
        console.warn(`[Assistant API] User ${userId} (${session.user.plan}) hit the daily limit: ${userCount}/${userLimit}`);
        return NextResponse.json({
          error: 'limit_reached',
          message: `Daily AI Assistant limit reached (${userLimit} messages per 24 hours).`,
          limit: userLimit,
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
Current Improved Resume (Optimized Markdown):
${selectedProject.improvedResume || ''}
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
` : ''}

STRICT ANTI-HALLUCINATION & NO-MARKDOWN FORMATTING CONSTRAINTS:
1. Never invent experience, achievements, tools, degrees, or certifications for the user. If they ask to optimize a bullet, do NOT fabricate metrics; use a bracketed placeholder like "[quantify: metrics]" instead.
2. Maintain a direct, calm, blunt, and highly realistic tone. Avoid motivational AI fluff (e.g. "off to an amazing start!" or "Congratulations!").
3. ParserProof plans are: Free Plan (₹0/mo, 3 generations), Starter Plan (₹499/mo, 15 generations, Cover Letters), Pro Plan (₹999/mo, 50 generations, Interview Prep & Skill Gaps).
4. ABSOLUTELY ZERO ASTERISKS OR BOLDING in your response text: You MUST NEVER use any asterisks (*) or double asterisks (**). Do not bold or italicize any words. Output plain, unadorned text only.
5. NO HEADINGS, LISTS, OR TABLES in your response text: Do NOT use raw markdown headings (e.g., #, ##, ###), markdown tables, lists, or bullets. If listing multiple points, combine them into a single continuous sentence separated by commas.
6. STICK TO DIRECT WORKSPACE DATA: If Candidate Original Resume Text is available, you MUST read it directly.
7. CRITICAL BREVITY: Limit your verbal response explanation/message to a single, smooth, elegant paragraph under 60 words.

CRITICAL PERFORMANCE & TOKEN-SAVING DIRECTIVE:
- Always prefer using targeted, highly precise actions like APPEND_SKILLS, REPLACE_TEXT, and APPEND_TEXT for normal edits.
- Only use UPDATE_FULL_RESUME as a last resort if the user explicitly demands a total redesign of the entire resume or renaming of all headers simultaneously. This prevents token truncation and response slowdown.

OUTPUT FORMAT:
You MUST respond ONLY with a JSON object. You are strictly forbidden from writing any conversational filler outside the JSON. The JSON object must contain exactly:
1. "response": (string) Your single-paragraph plain-text advice or answer, following all constraints above.
2. "actions": (array of objects, optional) If the user explicitly asks to edit, add, update, remove, or modify their resume content, include the structured action object(s) here. Supported action types are:
   - {"type": "APPEND_SKILLS", "skills": ["Skill1", "Skill2"]} -> To add new technical/soft skills to the skills section.
   - {"type": "REPLACE_TEXT", "target": "exact old text to find", "replacement": "new text to replace it with"} -> To update/optimize specific experience bullets, project sentences, or summaries.
   - {"type": "APPEND_TEXT", "text": "Markdown-formatted text to append to the end of the resume"} -> Use this to add entirely new sections (e.g. adding a "Languages" section, a new "Certifications" section, or an "Education" section) if they do not yet exist.
   - {"type": "UPDATE_FULL_RESUME", "improvedResume": "new full resume text in Markdown format"} -> Use this only when the user requests comprehensive structural changes, renaming multiple headings (e.g. to standard ATS headings), or a complete resume overhaul.

Example JSON output when asked to add a new languages section:
{
  "response": "I have successfully added English and Hindi with fluent proficiency under a Languages section on your resume.",
  "actions": [
    {
      "type": "APPEND_TEXT",
      "text": "## Languages\n\n- English: Fluent Proficiency\n- Hindi: Fluent Proficiency"
    }
  ]
}

Example JSON output when asked to rewrite the entire resume with standard ATS headings:
{
  "response": "I have successfully renamed all headings on your resume to standard ATS formats (Experience, Projects, Skills, Education).",
  "actions": [
    {
      "type": "UPDATE_FULL_RESUME",
      "improvedResume": "# Candidate Name\n\n## Experience\n...\n\n## Education\n...\n\n## Skills\n..."
    }
  ]
}

Example JSON output when asked to optimize a bullet point:
{
  "response": "I have optimized the structural finite element analysis bullet under Clavrit Digital using the STAR Google XYZ format.",
  "actions": [
    {
      "type": "REPLACE_TEXT",
      "target": "Performed static structural and fluid flow simulations in ANSYS for preliminary design validation.",
      "replacement": "Engineered static structural and fluid-flow simulations in Ansys Mechanical (Workbench), scripting mesh convergence with APDL and post-processing results, accomplishing a [quantify: stress reduction] as measured by peak-stress decrease of [quantify: %] by optimizing mesh density."
    }
  ]
}

Example JSON output when asked a standard question:
{
  "response": "Your ATS score is 61% because your resume lacks critical target keywords like APDL scripting and ANSYS CFX, which are essential for CFD simulation engineer roles.",
  "actions": []
}`;

    // 6. Assemble Messages for Groq completion
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: sanitizeInput(msg.content),
      })),
      { role: 'user', content: cleanMessage },
    ];

    // Helper to resolve custom GROQ_MODEL name typos
    const getValidModelName = (envModel) => {
      if (!envModel) return 'llama-3.3-70b-versatile';
      const clean = envModel.toLowerCase().trim();
      if (clean === 'qwen') return 'qwen-2.5-coder-32b'; // heal common typo
      if (clean === 'llama' || clean === 'llama3') return 'llama-3.3-70b-versatile';
      return envModel;
    };

    let completion;
    let primaryModel = getValidModelName(process.env.GROQ_MODEL);

    try {
      console.log(`[Assistant API] Attempting completion using model: ${primaryModel}`);
      completion = await openai.chat.completions.create({
        model: primaryModel,
        messages: apiMessages,
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      });
    } catch (primaryError) {
      console.warn(`[Assistant API] Primary model ${primaryModel} failed: ${primaryError.message}. Retrying with fallback llama-3.3-70b-versatile...`);
      try {
        completion = await openai.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: apiMessages,
          temperature: 0.3,
          max_tokens: 4000,
          response_format: { type: "json_object" },
        });
      } catch (fallbackError) {
        console.error(`[Assistant API] Fallback model failed: ${fallbackError.message}`);
        throw fallbackError;
      }
    }

    const aiResponse = completion.choices?.[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('Groq AI returned an empty response.');
    }

    let responseText = aiResponse;
    let actions = [];

    try {
      const parsed = JSON.parse(aiResponse);
      responseText = parsed.response || aiResponse;
      actions = parsed.actions || [];
    } catch (e) {
      console.warn('[Assistant API] Failed to parse AI JSON response, falling back to raw text:', e);
    }

    // 7. DB Persistence & Usage Increment
    const resolvedLimit = isGuest ? getPlanLimit('free') : getPlanLimit(session.user.plan);
    let remainingVal = resolvedLimit;

    if (isGuest) {
      const updatedUsage = await prisma.guestUsage.upsert({
        where: { ip: guestIp },
        update: { count: guestNextCount, updatedAt: new Date() },
        create: { ip: guestIp, count: 1 }
      });
      remainingVal = Math.max(0, resolvedLimit - guestNextCount);
      console.log(`[Assistant API] Guest ${guestIp} interaction incremented: ${guestNextCount}/${resolvedLimit}`);
    } else {
      await prisma.$transaction([
        prisma.assistantMessage.create({
          data: {
            userId,
            role: 'user',
            content: cleanDisplayMessage || cleanMessage,
            projectId: projectId || null,
          }
        }),
        prisma.assistantMessage.create({
          data: {
            userId,
            role: 'assistant',
            content: responseText,
            projectId: projectId || null,
          }
        })
      ]);
      remainingVal = Math.max(0, resolvedLimit - (userCount + 1));
      console.log(`[Assistant API] Messages saved in DB for user: ${userId}`);
    }

    return NextResponse.json({
      response: responseText,
      actions: actions,
      ragConfidence: ragResult.averageConfidence,
      ragSources: ragResult.chunks.map(c => ({ id: c.id, title: c.title, category: c.category })),
      remainingMessages: remainingVal,
      isGuest,
      limit: resolvedLimit,
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
