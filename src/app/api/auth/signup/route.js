import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signUpSchema } from '@/lib/validators';
import { generateVerificationCode, sendVerificationEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const body = await request.json();

    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    // If a user exists and is already verified, block registration
    if (existingUser && existingUser.emailVerified !== null) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    if (existingUser) {
      // If the user exists but is unverified, update their credentials and code to allow retrying signup
      await prisma.user.update({
        where: { email: lowerEmail },
        data: {
          name,
          passwordHash,
          verificationCode,
          verificationExpires,
        },
      });
    } else {
      // If new user, create an unverified record
      await prisma.user.create({
        data: {
          name,
          email: lowerEmail,
          passwordHash,
          verificationCode,
          verificationExpires,
          emailVerified: null, // Explicitly unverified
        },
      });
    }

    // Send or log the verification email
    const emailResult = await sendVerificationEmail(lowerEmail, name, verificationCode);

    return NextResponse.json(
      {
        status: 'pending_verification',
        email: lowerEmail,
        developmentFallback: emailResult.method !== 'smtp',
        smtpError: emailResult.error || null,
        message: 'Verification code processed.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
