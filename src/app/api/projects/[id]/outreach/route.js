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

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // 1. Fetch active project context
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const jobTitle = project.jobTitle || 'Target Role';
    const company = project.company || 'Target Company';
    const originalText = project.resumeText || '';

    // 2. Perform Groq generation for highly tailored recruiter cold outreach & pitch
    const prompt = `You are a high-end executive career agent. Generate custom networking assets for a candidate applying to the "${jobTitle}" position at "${company}".
    
    Here is a summary of the candidate's resume/skills:
    ${originalText.substring(0, 1500)} // safely chunk to prevent token excess
    
    You MUST output a valid JSON object containing exactly these fields. Do not write any markdown blocks or headers outside the JSON:
    1. "linkedinMsg": (string) A connection request note under 95 words. It should be highly direct, professional, polite, and state the exact value/experience they bring (e.g. matching technical highlights) with a soft call-to-action.
    2. "recruiterEmail": (string) A highly engaging cold recruiter email under 140 words. Include a custom, curiosity-inducing subject line at the top. Reference 1-2 specific achievements or technical capabilities from the resume context above.
    3. "elevatorPitch": (string) A conversational, natural, and highly confident 30-second speaking script for networking calls, detailing who they are, their core aerospace/simulation expertise, and what they do.
    
    Do not use any asterisks (*) or bold formatting in your output strings. Ensure the tone is calm, professional, and completely realistic (no AI hype filler like "thrilled to connect").`;

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

    console.log(`[Outreach API] Querying Groq using model ${primaryModel} for recruiter networking assets...`);
    try {
      completion = await openai.chat.completions.create({
        model: primaryModel,
        messages: [
          { role: 'system', content: 'You are an elite career agent that outputs valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });
    } catch (primaryError) {
      console.warn(`[Outreach API] Primary model ${primaryModel} failed: ${primaryError.message}. Retrying with fallback llama-3.3-70b-versatile...`);
      try {
        completion = await openai.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are an elite career agent that outputs valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 1500,
          response_format: { type: "json_object" }
        });
      } catch (fallbackError) {
        console.error(`[Outreach API] Fallback model failed: ${fallbackError.message}`);
        throw fallbackError;
      }
    }

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Groq AI returned an empty response.');
    }

    const parsed = JSON.parse(content);

    return NextResponse.json({
      success: true,
      outreach: {
        linkedinMsg: parsed.linkedinMsg,
        recruiterEmail: parsed.recruiterEmail,
        elevatorPitch: parsed.elevatorPitch
      }
    });

  } catch (error) {
    console.error('[Outreach API] GET error:', error);
    return NextResponse.json({ error: 'Failed to generate tailored outreach materials.' }, { status: 500 });
  }
}
