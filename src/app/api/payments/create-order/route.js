import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import razorpay from '@/lib/razorpay';
import { PLAN_PRICING } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await request.json();

    if (!planId || !PLAN_PRICING[planId]) {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
    }

    const pricing = PLAN_PRICING[planId];

    const order = await razorpay.orders.create({
      amount: pricing.amount,
      currency: pricing.currency,
      receipt: `rcpt_${session.user.id.slice(-8)}_${planId}_${Date.now()}`,
      notes: {
        userId: session.user.id,
        planId: planId,
        email: session.user.email || '',
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planId,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order. Please try again.' },
      { status: 500 }
    );
  }
}
