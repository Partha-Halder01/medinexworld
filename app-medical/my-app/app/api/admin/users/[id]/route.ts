import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getAppointmentFee(apt: any): number {
  const doctor = apt?.doctor;
  if (!doctor) return 0;
  return apt?.type === 'video' ? Number(doctor.videoFee || 0) : Number(doctor.fee || 0);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: numId },
    });
    if (!user || user.role !== 'patient') {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Keep consistency with OTP-only registration flow for legacy records.
    if (user.isEmailVerified === false) {
      const pending = await prisma.pendingRegistration.findUnique({
        where: { email: user.email },
      });
      if (!pending) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isEmailVerified: true,
            authOtpHash: null,
            authOtpPurpose: null,
            authOtpExpires: null,
          },
        });
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: numId },
      include: {
        doctor: { select: { id: true, name: true, specialty: true, fee: true, videoFee: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = appointments.reduce(
      (acc, apt: any) => {
        acc.total += 1;
        if (apt.status === 'Confirmed') acc.confirmed += 1;
        if (apt.status === 'Completed') {
          acc.completed += 1;
          acc.revenue += getAppointmentFee(apt);
        }
        if (apt.status === 'Cancelled') acc.cancelled += 1;
        if (apt.reviewRating) acc.reviewedCount += 1;
        return acc;
      },
      { total: 0, confirmed: 0, completed: 0, cancelled: 0, reviewedCount: 0, revenue: 0 }
    );

    const userData: any = { ...user, _id: user.id };
    delete userData.authOtpHash;
    delete userData.authOtpPurpose;
    delete userData.authOtpExpires;
    delete userData.password;

    const mappedAppointments = appointments.map((a) => ({
      ...a,
      _id: a.id,
      doctorId: a.doctor ? { ...a.doctor, _id: a.doctor.id } : null,
    }));

    return NextResponse.json({
      user: userData,
      appointments: mappedAppointments,
      stats,
    });
  } catch (error: any) {
    console.error('Admin user detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user details.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: numId },
    });
    if (!user || user.role !== 'patient') {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const deletedAppointments = await prisma.appointment.deleteMany({
      where: { patientId: numId },
    });
    await prisma.user.delete({
      where: { id: numId },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully.',
      deletedAppointments: deletedAppointments.count || 0,
    });
  } catch (error: any) {
    console.error('Admin user delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user.' },
      { status: 500 }
    );
  }
}
