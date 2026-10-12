import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateOtpCode, getOtpExpiryDate } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';

const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

// Same reply whether or not the account exists, so the endpoint can't be used to find registered emails.
const genericSentResponse = () =>
  NextResponse.json({
    success: true,
    message: "If an account exists for this email, an OTP has been sent. Didn't get it? Check the email address or create an account first.",
  });

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    const normalizedEmail = String(email).toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const normalizedRole = role === 'doctor' ? 'doctor' : 'patient';
    const otp = generateOtpCode();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = getOtpExpiryDate(10);
    const now = Date.now();

    if (normalizedRole === 'doctor') {
      const doctor = await prisma.doctor.findFirst({ where: { email: normalizedEmail } });
      if (!doctor) return genericSentResponse();
      if (doctor.authOtpLockedUntil && new Date(doctor.authOtpLockedUntil).getTime() > now) {
        return NextResponse.json({ error: 'Too many failed OTP attempts. Please try again later.' }, { status: 429 });
      }
      if (doctor.authOtpLastSentAt && now - new Date(doctor.authOtpLastSentAt).getTime() < OTP_RESEND_COOLDOWN_MS) {
        return NextResponse.json({ error: 'Please wait before requesting another OTP.' }, { status: 429 });
      }
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: { authOtpHash: otpHash, authOtpPurpose: 'login', authOtpExpires: otpExpires, authOtpLastSentAt: new Date(now), authOtpAttempts: 0, authOtpLockedUntil: null },
      });
    } else {
      const user = await prisma.user.findFirst({ where: { email: normalizedEmail, role: 'patient' } });
      if (!user) {
        const pending = await prisma.pendingRegistration.findFirst({ where: { email: normalizedEmail } });
        if (pending) return NextResponse.json({ error: 'Your account is pending OTP verification. Please verify from the registration page.' }, { status: 403 });
        return genericSentResponse();
      }
      if (user.isEmailVerified === false) {
        const pending = await prisma.pendingRegistration.findFirst({ where: { email: normalizedEmail } });
        if (pending) return NextResponse.json({ error: 'Please verify your email first via registration OTP.' }, { status: 403 });
        await prisma.user.update({ where: { id: user.id }, data: { isEmailVerified: true, authOtpHash: null, authOtpPurpose: null, authOtpExpires: null } });
      }
      if (user.authOtpLockedUntil && new Date(user.authOtpLockedUntil).getTime() > now) {
        return NextResponse.json({ error: 'Too many failed OTP attempts. Please try again later.' }, { status: 429 });
      }
      if (user.authOtpLastSentAt && now - new Date(user.authOtpLastSentAt).getTime() < OTP_RESEND_COOLDOWN_MS) {
        return NextResponse.json({ error: 'Please wait before requesting another OTP.' }, { status: 429 });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { authOtpHash: otpHash, authOtpPurpose: 'login', authOtpExpires: otpExpires, authOtpLastSentAt: new Date(now), authOtpAttempts: 0, authOtpLockedUntil: null },
      });
    }

    const otpSendResult = await sendOtpEmail(normalizedEmail, otp, 'login');
    return NextResponse.json({
      success: true,
      message: otpSendResult.deliveryMode === 'smtp'
        ? 'OTP sent to your email. It is valid for 10 minutes.'
        : 'OTP generated for local development. Check your server logs.',
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send OTP. Please try again later.' }, { status: 500 });
  }
}
