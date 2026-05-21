import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateVerificationCode, sendPasswordResetEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lowerEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: lowerEmail, deletedAt: null },
    });

    if (!user) {
      // Security best practice: do not reveal that the user does not exist
      return NextResponse.json(
        {
          status: 'success',
          message: 'If an account exists with this email, a reset code has been sent.',
          email: lowerEmail,
          developmentFallback: false,
          userExists: false,
        },
        { status: 200 }
      );
    }

    // Generate code
    const resetCode = generateVerificationCode();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    // Save code to database under verification fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: resetCode,
        verificationExpires: resetExpires,
      },
    });

    // Send the password reset email
    const emailResult = await sendPasswordResetEmail(lowerEmail, user.name || 'User', resetCode);

    return NextResponse.json(
      {
        status: 'success',
        message: 'Password reset code processed.',
        email: lowerEmail,
        developmentFallback: emailResult.method !== 'smtp',
        smtpError: emailResult.error || null,
        userExists: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
