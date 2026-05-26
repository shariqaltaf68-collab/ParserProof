import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Retrieve list of saved versions for a project
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const versions = await prisma.resumeVersion.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        atsScore: true,
        createdAt: true,
        resumeText: true,
        improvedResume: true,
        keywordMatch: true,
      },
    });

    return NextResponse.json({ success: true, versions });
  } catch (error) {
    console.error('[Versions API] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch version history.' }, { status: 500 });
  }
}

// POST: Restore a specific version
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID is required.' }, { status: 400 });
    }

    // 1. Fetch the project to verify user ownership
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    // 2. Fetch the target version
    const version = await prisma.resumeVersion.findFirst({
      where: {
        id: versionId,
        projectId: id,
      },
    });

    if (!version) {
      return NextResponse.json({ error: 'Target version not found.' }, { status: 404 });
    }

    // 3. Save the current state as a new version first so they can undo/redo!
    await prisma.resumeVersion.create({
      data: {
        projectId: project.id,
        resumeText: project.resumeText,
        improvedResume: project.improvedResume || '',
        atsScore: project.atsScore || 0,
        keywordMatch: project.keywordMatch || '{"matched":[],"missing":[]}',
      },
    });

    // 4. Update the project to the restored details
    const restoredProject = await prisma.project.update({
      where: { id },
      data: {
        resumeText: version.resumeText,
        improvedResume: version.improvedResume,
        atsScore: version.atsScore,
        keywordMatch: version.keywordMatch,
      },
    });

    // 5. Log the restore in the audit trail
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'resume_version_restore',
        details: JSON.stringify({
          projectId: id,
          versionId: version.id,
          restoredScore: version.atsScore,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully restored to selected version.',
      project: {
        id: restoredProject.id,
        resumeText: restoredProject.resumeText,
        improvedResume: restoredProject.improvedResume,
        atsScore: restoredProject.atsScore,
        keywordMatch: restoredProject.keywordMatch,
      },
    });
  } catch (error) {
    console.error('[Versions API] POST restore error:', error);
    return NextResponse.json({ error: 'Failed to restore selected version.' }, { status: 500 });
  }
}
