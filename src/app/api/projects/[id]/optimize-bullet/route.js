import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { bulletText } = body;

    if (!bulletText || typeof bulletText !== 'string' || bulletText.trim() === '') {
      return NextResponse.json({ error: 'Bullet text is required.' }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        jobTitle: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const jobTitle = project.jobTitle || 'Target Role';

    const prompt = `You are a professional resume optimization engine. Optimize the following original resume bullet point for a "${jobTitle}" role using the Google XYZ formula (Accomplished [X], as measured by [Y], by doing [Z]):
    
    Original Bullet: "${bulletText}"
    
    Generate exactly 3 distinct, highly professional, direct, and recruiters-grade alternative optimized bullets.
    You MUST output a valid JSON object containing exactly a single key:
    "suggestions": (array of strings) The 3 optimized options.
    
    Constraints:
    1. Use bracketed placeholders like "[quantify: percentage]%" or "[quantify: metrics]" for missing numbers/metrics. Do not invent fake statistics.
    2. Start each bullet directly with a strong active recruiter verb (e.g. Engineered, Accelerated, Designed).
    3. Absolutely NO asterisks (*) or bold formatting in the output strings. Output plain, unadorned text only.`;

    // Helper to resolve custom GROQ_MODEL name typos
    const getValidModelName = (envModel) => {
      if (!envModel) return 'llama-3.3-70b-versatile';
      const clean = envModel.toLowerCase().trim();
      if (clean === 'qwen') return 'qwen-2.5-coder-32b';
      if (clean === 'llama' || clean === 'llama3') return 'llama-3.3-70b-versatile';
      return envModel;
    };

    let completion;
    let primaryModel = getValidModelName(process.env.GROQ_MODEL);

    console.log(`[Bullet Optimizer API] Fetching 3 STAR bullet optimizations using model ${primaryModel}...`);
    try {
      completion = await openai.chat.completions.create({
        model: primaryModel,
        messages: [
          { role: 'system', content: 'You are an elite recruiter assistant that outputs valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });
    } catch (primaryError) {
      console.warn(`[Bullet Optimizer API] Primary model ${primaryModel} failed: ${primaryError.message}. Retrying with fallback llama-3.3-70b-versatile...`);
      try {
        completion = await openai.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are an elite recruiter assistant that outputs valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 800,
          response_format: { type: "json_object" }
        });
      } catch (fallbackError) {
        console.error(`[Bullet Optimizer API] Fallback model failed: ${fallbackError.message}`);
        throw fallbackError;
      }
    }

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Groq AI returned empty response.');
    }

    const parsed = JSON.parse(content);
    return NextResponse.json({
      success: true,
      suggestions: parsed.suggestions || []
    });

  } catch (error) {
    console.error('[Bullet Optimizer API] POST error:', error);
    return NextResponse.json({ error: 'Failed to generate bullet point optimizations.' }, { status: 500 });
  }
}
