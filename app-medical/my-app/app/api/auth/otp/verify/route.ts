import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCK_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const { email, otp, role } = await req.json();
    if (!email || !otp) return NextResponse.json({ error: 'Email and OTP are required.' }, { status: 400 });
    if (!/^\d{6}$/.test(String(otp))) return NextResponse.json({ error: 'OTP must be a 6-digit code.' }, { status: 400 });

    const normalizedEmail = String(email).toLowerCase();
    const normalizedRole = role === 'doctor' ? 'doctor' : 'patient';
    const now = Date.now();

    if (normalizedRole === 'doctor') {
      const doctor = await prisma.doctor.findFirst({ where: { email: normalizedEmail } });
      if (!doctor) return NextResponse.json({ error: 'Invalid OTP.' }, { status: 401 });
      if (doctor.authOtpLockedUntil && new Date(doctor.authOtpLockedUntil).getTime() > now) {
        return NextResponse.json({ error: 'Too many failed OTP attempts. Please request a new OTP later.' }, { status: 429 });
      }
      if (doctor.authOtpPurpose !== 'login' || !doctor.authOtpHash || !doctor.authOtpExpires || new Date(doctor.authOtpExpires).getTime() < now) {
        return NextResponse.json({ error: 'OTP expired or invalid. Please request a new OTP.' }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(String(otp), doctor.authOtpHash);
      if (!isMatch) {
        const attempts = (doctor.authOtpAttempts || 0) + 1;
        await prisma.doctor.update({
          where: { id: doctor.id },
          data: { authOtpAttempts: attempts, authOtpLockedUntil: attempts >= MAX_OTP_ATTEMPTS ? new Date(now + OTP_LOCK_MS) : null },
        });
        return NextResponse.json({ error: 'Invalid OTP.' }, { status: 401 });
      }
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: { authOtpHash: null, authOtpPurpose: null, authOtpExpires: null, authOtpAttempts: 0, authOtpLockedUntil: null },
      });
      return NextResponse.json({ _id: doctor.id, name: doctor.name, email: doctor.email, specialty: doctor.specialty, role: 'doctor' });
    }

    const user = await prisma.user.findFirst({ where: { email: normalizedEmail, role: 'patient' } });
    if (!user) return NextResponse.json({ error: 'Invalid OTP.' }, { status: 401 });
    if (user.isEmailVerified === false) return NextResponse.json({ error: 'Please verify your email first.' }, { status: 403 });
    if (user.authOtpLockedUntil && new Date(user.authOtpLockedUntil).getTime() > now) {
      return NextResponse.json({ error: 'Too many failed OTP attempts. Please request a new OTP later.' }, { status: 429 });
    }
    if (user.authOtpPurpose !== 'login' || !user.authOtpHash || !user.authOtpExpires || new Date(user.authOtpExpires).getTime() < now) {
      return NextResponse.json({ error: 'OTP expired or invalid. Please request a new OTP.' }, { status: 400 });
    }
    const isMatch = await bcrypt.compare(String(otp), user.authOtpHash);
    if (!isMatch) {
      const attempts = (user.authOtpAttempts || 0) + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: { authOtpAttempts: attempts, authOtpLockedUntil: attempts >= MAX_OTP_ATTEMPTS ? new Date(now + OTP_LOCK_MS) : null },
      });
      return NextResponse.json({ error: 'Invalid OTP.' }, { status: 401 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { authOtpHash: null, authOtpPurpose: null, authOtpExpires: null, authOtpAttempts: 0, authOtpLockedUntil: null },
    });
    return NextResponse.json({ _id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role });
  } catch (error: any) {
    console.error('Verify OTP login error:', error);
    return NextResponse.json({ error: error.message || 'OTP login failed.' }, { status: 500 });
  }
}
