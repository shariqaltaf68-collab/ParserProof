import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { projectSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const where = {
      userId: session.user.id,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { jobTitle: { contains: search } },
        { company: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const findArgs = {
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        jobTitle: true,
        company: true,
        status: true,
        atsScore: true,
        tone: true,
        length: true,
        createdAt: true,
        updatedAt: true,
      },
    };

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        findArgs.take = limit;
      }
    }

    const projects = await prisma.project.findMany(findArgs);

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { resumeText, jobDescription, jobTitle, company, tone, length } =
      parsed.data;

    const title =
      jobTitle && company
        ? `${jobTitle} at ${company}`
        : jobTitle || 'Untitled Project';

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        title,
        resumeText,
        jobDescription,
        jobTitle: jobTitle || null,
        company: company || null,
        tone,
        length,
        status: 'draft',
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
