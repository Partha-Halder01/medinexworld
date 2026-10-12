import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });

    const { isVerified, adminId, password } = await req.json();

    const doctor = await prisma.doctor.update({
      where: { id: numId },
      data: {
        isVerified: !!isVerified,
        verifiedAt: isVerified ? new Date() : null,
        verifiedById: isVerified && adminId ? parseInt(adminId, 10) : null,
      },
    });

    if (isVerified && doctor.email) {
      await sendVerificationEmail(doctor.email, doctor.name, password || 'As set during application');
    }

    const { password: _pw, ...doctorResponse } = doctor;
    return NextResponse.json({ ...doctorResponse, _id: doctorResponse.id });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to update verification.' }, { status: 500 });
  }
}