import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { safeErrorMessage } from '@/lib/apiError';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerIdParam = searchParams.get('ownerId');

    if (!ownerIdParam) {
      return NextResponse.json({ error: 'Owner ID is required.' }, { status: 400 });
    }

    const ownerId = parseInt(ownerIdParam, 10);
    if (isNaN(ownerId)) {
      return NextResponse.json({ error: 'Invalid Owner ID.' }, { status: 400 });
    }

    const hospital = await prisma.hospital.findFirst({ where: { ownerId } });
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found for this owner.' }, { status: 404 });
    }

    // Doctors belonging to this hospital
    const doctors = await prisma.doctor.findMany({
      where: { hospitalId: hospital.id },
      select: { id: true },
    });
    const doctorIds = doctors.map((d) => d.id);

    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { doctorId: { in: doctorIds }, chamberId: null },
          { hospitalId: hospital.id },
          { chamber: { hospitalId: hospital.id } },
        ],
        // Hide bookings whose online payment never completed.
        AND: [
          { OR: [{ paymentMethod: { not: 'online' } }, { paymentStatus: 'paid' }] },
          { OR: [{ paymentMethod: { not: 'chamber' } }, { bookingFeePaid: true }] },
        ],
      },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
        doctor: { select: { id: true, name: true, specialty: true, fee: true, videoFee: true, platformFeePercent: true } },
        hospital: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = appointments.map((a) => ({
      ...a,
      _id: a.id,
      patientId: a.patient ? { ...a.patient, _id: a.patient.id } : null,
      doctorId: a.doctor ? { ...a.doctor, _id: a.doctor.id } : null,
      hospitalId: a.hospital ? { ...a.hospital, _id: a.hospital.id } : null,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Get hospital admin bookings error:', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Failed to fetch bookings.') }, { status: 500 });
  }
}
