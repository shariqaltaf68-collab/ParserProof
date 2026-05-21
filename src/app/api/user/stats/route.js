import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getUsageStats } from '@/lib/usage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const [totalProjects, scoreAggregate, usage] = await Promise.all([
      prisma.project.count({
        where: {
          userId,
          deletedAt: null,
        },
      }),
      prisma.project.aggregate({
        where: {
          userId,
          deletedAt: null,
          atsScore: { not: null },
        },
        _avg: {
          atsScore: true,
        },
      }),
      getUsageStats(userId),
    ]);

    const averageScore =
      scoreAggregate._avg.atsScore != null
        ? Math.round(scoreAggregate._avg.atsScore * 10) / 10
        : null;

    return NextResponse.json({
      totalProjects,
      averageScore,
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
        resetDate: usage.resetDate,
      },
    });
  } catch (error) {
    console.error('GET /api/user/stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
