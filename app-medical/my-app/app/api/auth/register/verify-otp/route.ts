import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCK_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) return NextResponse.json({ error: 'Email and OTP are required.' }, { status: 400 });
    if (!/^\d{6}$/.test(String(otp))) return NextResponse.json({ error: 'OTP must be a 6-digit code.' }, { status: 400 });

    const normalizedEmail = String(email).toLowerCase();
    const pending = await prisma.pendingRegistration.findFirst({ where: { email: normalizedEmail } });
    const now = Date.now();

    if (!pending) return NextResponse.json({ error: 'No pending registration found for this email. Please register again.' }, { status: 404 });
    if (pending.otpLockedUntil && new Date(pending.otpLockedUntil).getTime() > now) {
      return NextResponse.json({ error: 'Too many failed OTP attempts. Please request a new OTP later.' }, { status: 429 });
    }
    if (!pending.otpHash || !pending.otpExpires || new Date(pending.otpExpires).getTime() < now) {
      return NextResponse.json({ error: 'OTP expired or invalid. Please request a new OTP.' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(String(otp), pending.otpHash);
    if (!isMatch) {
      const attempts = (pending.otpAttempts || 0) + 1;
      await prisma.pendingRegistration.update({
        where: { id: pending.id },
        data: { otpAttempts: attempts, otpLockedUntil: attempts >= MAX_OTP_ATTEMPTS ? new Date(now + OTP_LOCK_MS) : null },
      });
      return NextResponse.json({ error: 'Invalid OTP.' }, { status: 401 });
    }

    const existingUser = await prisma.user.findFirst({ where: { email: normalizedEmail } });
    if (existingUser && existingUser.isEmailVerified !== false) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    let verifiedUser;
    if (existingUser) {
      verifiedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { name: pending.name, phone: pending.phone, password: pending.password, role: 'patient', isEmailVerified: true, authOtpHash: null, authOtpPurpose: null, authOtpExpires: null },
      });
    } else {
      verifiedUser = await prisma.user.create({
        data: { name: pending.name, email: normalizedEmail, phone: pending.phone, password: pending.password, role: 'patient', isEmailVerified: true },
      });
    }

    await prisma.pendingRegistration.delete({ where: { id: pending.id } });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully.',
      user: { _id: verifiedUser.id, name: verifiedUser.name, email: verifiedUser.email, phone: verifiedUser.phone, role: verifiedUser.role },
    });
  } catch (error: any) {
    console.error('Verify registration OTP error:', error);
    return NextResponse.json({ error: error.message || 'OTP verification failed.' }, { status: 500 });
  }
}
