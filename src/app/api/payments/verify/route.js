import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return NextResponse.json(
        { error: 'Missing payment verification data.' },
        { status: 400 }
      );
    }

    // Verify signature using HMAC SHA256
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Payment signature verification failed');
      return NextResponse.json(
        { error: 'Payment verification failed. Invalid signature.' },
        { status: 400 }
      );
    }

    // Update user's plan in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { plan: planId },
      select: { id: true, plan: true, email: true },
    });

    // Log the payment for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'plan_upgrade',
        details: JSON.stringify({
          planId,
          razorpay_order_id,
          razorpay_payment_id,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    console.log(`✅ Plan upgraded: ${updatedUser.email} -> ${planId}`);

    return NextResponse.json({
      success: true,
      plan: updatedUser.plan,
      message: `Successfully upgraded to ${planId} plan!`,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed. Please contact support.' },
      { status: 500 }
    );
  }
}
