import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateOtpCode, getOtpExpiryDate } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';

const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await prisma.user.findFirst({ where: { email: normalizedEmail } });
    if (existingUser && existingUser.isEmailVerified !== false) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtpCode();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = getOtpExpiryDate(10);
    const now = Date.now();

    const existingPending = await prisma.pendingRegistration.findFirst({ where: { email: normalizedEmail } });
    if (existingPending?.otpLockedUntil && new Date(existingPending.otpLockedUntil).getTime() > now) {
      return NextResponse.json({ error: 'Too many failed OTP attempts. Please try again later.' }, { status: 429 });
    }
    if (existingPending?.otpLastSentAt && now - new Date(existingPending.otpLastSentAt).getTime() < OTP_RESEND_COOLDOWN_MS) {
      return NextResponse.json({ error: 'Please wait before requesting another OTP.' }, { status: 429 });
    }

    if (existingPending) {
      await prisma.pendingRegistration.update({
        where: { email: normalizedEmail },
        data: { name, phone, password: hashedPassword, otpHash, otpExpires, otpLastSentAt: new Date(now), otpAttempts: 0, otpLockedUntil: null },
      });
    } else {
      await prisma.pendingRegistration.create({
        data: { name, email: normalizedEmail, phone, password: hashedPassword, otpHash, otpExpires, otpLastSentAt: new Date(now) },
      });
    }

    // Migration cleanup
    if (existingUser && existingUser.isEmailVerified === false) {
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    const otpSendResult = await sendOtpEmail(normalizedEmail, otp, 'register');

    return NextResponse.json({
      success: true,
      requiresOtp: true,
      email: normalizedEmail,
      message: otpSendResult.deliveryMode === 'smtp'
        ? 'OTP sent to your email. Please verify to complete registration.'
        : 'OTP generated for local development. Check your server logs.',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed.' }, { status: 500 });
  }
}
