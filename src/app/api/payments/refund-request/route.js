import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendRefundRequestEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { reason } = body;

    // 1. Fetch user to verify active plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, plan: true, email: true },
    });

    if (!user || user.plan === 'free') {
      return NextResponse.json({ error: 'You do not have an active premium plan to cancel.' }, { status: 400 });
    }

    // 2. Fetch user's latest plan upgrade audit log
    const upgradeLog = await prisma.auditLog.findFirst({
      where: {
        userId,
        action: 'plan_upgrade',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!upgradeLog) {
      return NextResponse.json({ error: 'Upgrade transaction record not found. Please contact support.' }, { status: 404 });
    }

    // 3. Determine if eligible for refund (1-hour window: 3,600,000 milliseconds)
    const logTime = new Date(upgradeLog.createdAt).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const isRefundable = (now - logTime <= oneHour);

    // Parse purchase details
    let orderId = 'N/A';
    let paymentId = 'N/A';
    let planId = user.plan;
    try {
      const details = JSON.parse(upgradeLog.details || '{}');
      orderId = details.razorpay_order_id || 'N/A';
      paymentId = details.razorpay_payment_id || 'N/A';
      planId = details.planId || user.plan;
    } catch (e) {
      console.error('Failed to parse upgrade log details:', e);
    }

    // 4. Update the user back to the free plan
    await prisma.user.update({
      where: { id: userId },
      data: { plan: 'free' },
    });

    // 5. Create audit logs
    await prisma.auditLog.create({
      data: {
        userId,
        action: isRefundable ? 'refund_requested' : 'subscription_cancelled',
        details: JSON.stringify({
          planId,
          orderId,
          paymentId,
          reason,
          isRefundable,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // 6. Send alert email to admin
    await sendRefundRequestEmail({
      userEmail: user.email,
      userId,
      planId,
      orderId,
      paymentId,
      reason,
      isRefundable,
    });

    return NextResponse.json({
      success: true,
      isRefundable,
      message: isRefundable
        ? 'Plan successfully cancelled and refund request submitted to billing support. Your plan has been reset to Free.'
        : 'Plan successfully cancelled. Your subscription has been downgraded to Free.',
    });
  } catch (error) {
    console.error('Refund request error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while processing your request.' }, { status: 500 });
  }
}
