import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, code, and new password are required.' },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    // Password strength validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }
    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter.' },
        { status: 400 }
      );
    }
    if (!/[a-z]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one lowercase letter.' },
        { status: 400 }
      );
    }
    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: lowerEmail, deletedAt: null },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Account not found.' },
        { status: 404 }
      );
    }

    // Verify code match
    if (!user.verificationCode || user.verificationCode !== cleanCode) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check and try again.' },
        { status: 400 }
      );
    }

    // Verify expiration time
    if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user to new password and clear verification fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        verificationCode: null,
        verificationExpires: null,
      },
    });

    // Log the password reset action for security
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'reset_password',
        details: JSON.stringify({ email: lowerEmail }),
      },
    });

    return NextResponse.json(
      { success: true, message: 'Password has been reset successfully! You can now log in.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
