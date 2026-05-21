import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required.' },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    const user = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Account not found.' },
        { status: 404 }
      );
    }

    // If already verified, allow proceeding
    if (user.emailVerified !== null) {
      return NextResponse.json(
        { message: 'Email is already verified.', success: true },
        { status: 200 }
      );
    }

    // Verify code match
    if (!user.verificationCode || user.verificationCode !== cleanCode) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check your code and try again.' },
        { status: 400 }
      );
    }

    // Verify expiration time
    if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please sign up again to receive a new code.' },
        { status: 400 }
      );
    }

    // Update user to verified state
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationCode: null,
        verificationExpires: null,
      },
    });

    // Log user verification action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'verify_email',
        details: JSON.stringify({ email: lowerEmail }),
      },
    });

    return NextResponse.json(
      { success: true, message: 'Email verified successfully!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
