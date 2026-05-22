import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { projectSchema } from '@/lib/validators';
import { generateTailoredContent } from '@/lib/ai';
import { checkUsageLimit, incrementUsage, resetUsageIfNeeded } from '@/lib/usage';
import { rateLimit } from '@/lib/rateLimit';
import { sanitizeInput } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to generate content.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const rateLimitResult = rateLimit(userId, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait a moment before trying again.',
          resetIn: rateLimitResult.resetIn,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: 'Please check your inputs and try again.', details: errors },
        { status: 400 }
      );
    }

    const { resumeText, jobDescription, jobTitle, company, tone, length } = parsed.data;

    await resetUsageIfNeeded(userId);

    const usageCheck = await checkUsageLimit(userId);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: `You have used all ${usageCheck.limit} generations for this month. Upgrade your plan for more.`,
          usage: usageCheck,
        },
        { status: 429 }
      );
    }

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your-groq-api-key') {
      return NextResponse.json(
        {
          error: 'AI service is not configured. Please set the GROQ_API_KEY environment variable to use this feature.',
        },
        { status: 503 }
      );
    }

    const cleanResume = sanitizeInput(resumeText);
    const cleanJD = sanitizeInput(jobDescription);
    const cleanJobTitle = jobTitle ? sanitizeInput(jobTitle) : '';
    const cleanCompany = company ? sanitizeInput(company) : '';

    const aiResult = await generateTailoredContent(cleanResume, cleanJD, tone, length);

    const projectTitle = [cleanJobTitle, cleanCompany].filter(Boolean).join(' at ') || 'Untitled Project';

    const project = await prisma.project.create({
      data: {
        userId,
        title: projectTitle,
        resumeText: cleanResume,
        jobDescription: cleanJD,
        jobTitle: cleanJobTitle || null,
        company: cleanCompany || null,
        tone,
        length,
        status: 'generated',
        atsScore: aiResult.atsScore,
        keywordMatch: JSON.stringify(aiResult.keywordMatch),
        improvedResume: aiResult.improvedResume,
        coverLetter: aiResult.coverLetter,
        interviewQs: JSON.stringify(aiResult.interviewQuestions),
        skillGap: aiResult.skillGap,
        ragSources: aiResult.ragSources || null,
        ragConfidence: aiResult.ragConfidence || null,
      },
    });

    await incrementUsage(userId);

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'generate',
        details: JSON.stringify({
          projectId: project.id,
          jobTitle: cleanJobTitle,
          company: cleanCompany,
          tone,
          length,
        }),
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Generation error:', error);

    if (error.message?.includes('AI service')) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while generating your content. Please try again.' },
      { status: 500 }
    );
  }
}
