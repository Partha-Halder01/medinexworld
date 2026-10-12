import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { safeErrorMessage } from '@/lib/apiError';
import { getOwnedHospital } from '@/lib/hospitalServer';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointmentId = parseInt(id, 10);

    if (isNaN(appointmentId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    const body = await req.json();

    const hospital = await getOwnedHospital(body.ownerId);
    if (!hospital) return NextResponse.json({ error: 'Hospital not found for this owner.' }, { status: 403 });

    const booking = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { chamber: { select: { hospitalId: true } }, doctor: { select: { hospitalId: true } } },
    });
    // Only bookings at this facility: its own services, its doctors' sittings, or legacy hospital doctors.
    const belongs = !!booking && (
      booking.hospitalId === hospital.id ||
      booking.chamber?.hospitalId === hospital.id ||
      (!booking.chamberId && booking.doctor?.hospitalId === hospital.id)
    );
    if (!booking || !belongs) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (body.action === 'complete') {
      if (booking.status === 'Completed') {
        return NextResponse.json({ error: 'Booking is already completed' }, { status: 400 });
      }

      if (booking.paymentMethod === 'online' && booking.paymentStatus !== 'paid') {
        return NextResponse.json({ error: 'Cannot complete booking before payment.' }, { status: 400 });
      }

      if (booking.paymentMethod === 'chamber' && !booking.bookingFeePaid) {
        return NextResponse.json({ error: 'Cannot complete booking before the booking fee is paid.' }, { status: 400 });
      }
      const updateData: any = { status: 'Completed' };
      // Cash / chamber consultation fees are collected at the desk when the visit is completed.
      if (booking.paymentMethod === 'cash' || booking.paymentMethod === 'chamber') {
        updateData.paymentStatus = 'paid';
      }

      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: updateData,
        include: {
          patient: { select: { id: true, name: true, phone: true } },
          doctor: { select: { id: true, name: true, specialty: true } },
        },
      });

      return NextResponse.json({
        message: 'Booking marked as completed',
        booking: {
          ...updated,
          _id: updated.id,
          patientId: updated.patient ? { ...updated.patient, _id: updated.patient.id } : null,
          doctorId: updated.doctor ? { ...updated.doctor, _id: updated.doctor.id } : null,
        },
      });
    }

    if (body.action === 'cancel') {
      if (booking.status === 'Cancelled') {
        return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 });
      }

      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'Cancelled' },
        include: {
          patient: { select: { id: true, name: true, phone: true } },
          doctor: { select: { id: true, name: true, specialty: true } },
        },
      });

      return NextResponse.json({
        message: 'Booking marked as cancelled',
        booking: {
          ...updated,
          _id: updated.id,
          patientId: updated.patient ? { ...updated.patient, _id: updated.patient.id } : null,
          doctorId: updated.doctor ? { ...updated.doctor, _id: updated.doctor.id } : null,
        },
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Hospital booking patch error:', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Internal Server Error') }, { status: 500 });
  }
}
