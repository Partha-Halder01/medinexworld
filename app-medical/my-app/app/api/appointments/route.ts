import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateTotalWithPlatformFee, normalizePlatformFeePercent } from '@/lib/platformFee';
import { updateTargetRating } from '@/lib/rating';
import { bookableSlotsFor, formatDateLabel, isValidISODate, PENDING_SLOT_HOLD_MINUTES, serializeChamber } from '@/lib/chamber';
import { getChamberBookingFee, getTakenChamberSlots, PAID_OR_OFFLINE_FILTER } from '@/lib/chamberServer';

function apptToResponse(a: any) {
  return {
    ...a,
    _id: a.id,
    patientId: a.patient ? { ...a.patient, _id: a.patient.id } : a.patientId,
    doctorId: a.doctor ? { ...a.doctor, _id: a.doctor.id, location: a.doctor.locationLat != null ? { lat: a.doctor.locationLat, lng: a.doctor.locationLng } : null } : a.doctorId,
    hospitalId: a.hospital ? { ...a.hospital, _id: a.hospital.id, location: a.hospital.locationLat != null ? { lat: a.hospital.locationLat, lng: a.hospital.locationLng } : null } : a.hospitalId,
    chamber: a.chamber ? serializeChamber(a.chamber) : null,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const hospitalId = searchParams.get('hospitalId');
    const includePendingPayment = searchParams.get('includePendingPayment') === 'true';

    const where: any = {};
    if (patientId) where.patientId = parseInt(patientId, 10);
    if (doctorId) where.doctorId = parseInt(doctorId, 10);
    if (hospitalId) where.hospitalId = parseInt(hospitalId, 10);
    if (!includePendingPayment) {
      where.AND = PAID_OR_OFFLINE_FILTER;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true, role: true } },
        doctor: { select: { id: true, name: true, specialty: true, fee: true, videoFee: true, image: true, phone: true, isOnlineNow: true, locationLat: true, locationLng: true } },
        hospital: { select: { id: true, name: true, email: true, phone: true, address: true, locationLat: true, locationLng: true } },
        chamber: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(appointments.map(apptToResponse));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch appointments.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { patientId, doctorId, hospitalId, chamberId, visitDate, serviceType, serviceName, slot, date, type, price } = await req.json();

    const pId = parseInt(patientId, 10);
    const dId = doctorId ? parseInt(doctorId, 10) : null;
    const hId = hospitalId ? parseInt(hospitalId, 10) : null;

    if (chamberId) {
      if (isNaN(pId) || !dId || isNaN(dId)) return NextResponse.json({ error: 'Patient and doctor are required.' }, { status: 400 });
      return createChamberAppointment(pId, dId, parseInt(chamberId, 10), visitDate, slot);
    }

    if (!patientId || !slot || !date || !type) return NextResponse.json({ error: 'Required fields are missing.' }, { status: 400 });

    let basePrice = Math.max(0, Number(price) || 0);
    let finalPrice = basePrice;
    let platformFeePercent = 0;
    let platformFeeAmount = 0;

    const platformSettings = await prisma.platformSettings.findFirst();
    const adminDefaultPercent = normalizePlatformFeePercent(platformSettings?.defaultPlatformFeePercent);

    if (dId) {
      const doctor = await prisma.doctor.findUnique({ where: { id: dId }, select: { fee: true, videoFee: true, platformFeePercent: true, videoAvailability: true } });
      if (!doctor) return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });
      const normalizedType = type === 'video' ? 'video' : 'clinic';
      if (normalizedType === 'video' && doctor.videoAvailability === 'off') {
        return NextResponse.json({ error: 'Video consultation is currently turned off for this doctor.' }, { status: 400 });
      }
      basePrice = Number(normalizedType === 'video' ? (doctor.videoFee ?? doctor.fee) : doctor.fee) || 0;
      const doctorFeePercent = normalizePlatformFeePercent(doctor.platformFeePercent);
      platformFeePercent = doctorFeePercent || adminDefaultPercent;
      finalPrice = calculateTotalWithPlatformFee(basePrice, platformFeePercent);
      platformFeeAmount = Math.max(0, finalPrice - basePrice);
    } else if (hId) {
      const hospital = await prisma.hospital.findUnique({ where: { id: hId }, select: { platformFeePercent: true } });
      if (hospital) {
        const hospitalFeePercent = normalizePlatformFeePercent(hospital.platformFeePercent);
        platformFeePercent = hospitalFeePercent || adminDefaultPercent;
        finalPrice = calculateTotalWithPlatformFee(basePrice, platformFeePercent);
        platformFeeAmount = Math.max(0, finalPrice - basePrice);
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: pId, doctorId: dId, hospitalId: hId,
        serviceType: serviceType || 'doctor', serviceName: serviceName || '',
        slot, date, type, basePrice, price: finalPrice, paidAmount: 0,
        platformFeePercent, platformFeeAmount,
        paymentMethod: 'online', paymentStatus: 'pending', status: 'Confirmed',
      },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true, role: true } },
        doctor: { select: { id: true, name: true, specialty: true, fee: true, videoFee: true, image: true } },
        hospital: { select: { id: true, name: true, email: true, phone: true, address: true } },
      },
    });

    return NextResponse.json(apptToResponse(appointment), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create appointment.' }, { status: 500 });
  }
}

const appointmentInclude = {
  patient: { select: { id: true, name: true, email: true, phone: true, role: true } },
  doctor: { select: { id: true, name: true, specialty: true, fee: true, videoFee: true, image: true } },
  chamber: true,
} as const;

// In-chamber booking: the patient pays only the platform booking fee online;
// the consultation fee is paid to the doctor at the chamber.
async function createChamberAppointment(patientId: number, doctorId: number, chamberId: number, visitDate: unknown, slot: unknown) {
  if (isNaN(chamberId)) return NextResponse.json({ error: 'Invalid chamber.' }, { status: 400 });
  if (!isValidISODate(visitDate)) return NextResponse.json({ error: 'Please choose a valid date.' }, { status: 400 });
  if (typeof slot !== 'string' || !slot) return NextResponse.json({ error: 'Please choose a time slot.' }, { status: 400 });

  const chamber = await prisma.doctorChamber.findUnique({ where: { id: chamberId } });
  if (!chamber || chamber.doctorId !== doctorId || !chamber.isActive) {
    return NextResponse.json({ error: 'This chamber is not available for booking.' }, { status: 404 });
  }
  if (!bookableSlotsFor(chamber, visitDate).includes(slot)) {
    return NextResponse.json({ error: 'The doctor is not available at this chamber at the selected time.' }, { status: 400 });
  }
  const taken = await getTakenChamberSlots(chamberId, visitDate);
  if (taken.has(slot)) {
    return NextResponse.json({ error: 'This slot was just booked by someone else. Please pick another slot.' }, { status: 409 });
  }

  const bookingFee = await getChamberBookingFee();
  const consultationFee = Math.max(0, Number(chamber.fee) || 0);

  const appointment = await prisma.appointment.create({
    data: {
      patientId, doctorId, chamberId,
      serviceType: 'doctor', serviceName: '',
      slot, date: formatDateLabel(visitDate), visitDate, type: 'clinic',
      chamberName: chamber.name, chamberAddress: chamber.address,
      basePrice: consultationFee, price: consultationFee + bookingFee, paidAmount: 0,
      bookingFee, bookingFeePaid: bookingFee <= 0,
      platformFeePercent: 0, platformFeeAmount: bookingFee,
      paymentMethod: 'chamber', paymentStatus: 'pending', status: 'Confirmed',
    },
    include: appointmentInclude,
  });

  // Guard against two patients grabbing the same slot at the same moment: the earliest booking wins.
  const holdSince = new Date(Date.now() - PENDING_SLOT_HOLD_MINUTES * 60_000);
  const first = await prisma.appointment.findFirst({
    where: {
      chamberId, visitDate, slot, status: { not: 'Cancelled' },
      OR: [{ bookingFeePaid: true }, { createdAt: { gte: holdSince } }],
    },
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  if (first && first.id !== appointment.id) {
    await prisma.appointment.delete({ where: { id: appointment.id } });
    return NextResponse.json({ error: 'This slot was just booked by someone else. Please pick another slot.' }, { status: 409 });
  }

  return NextResponse.json(apptToResponse(appointment), { status: 201 });
}

export async function PATCH(req: Request) {
  try {
    const { appointmentId, status, doctorId, patientId, rating, review } = await req.json();
    if (!appointmentId) return NextResponse.json({ error: 'appointmentId is required.' }, { status: 400 });

    const apptId = parseInt(appointmentId, 10);

    // REVIEW FLOW
    if (rating !== undefined || review !== undefined) {
      const reviewRating = Number(rating);
      if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
        return NextResponse.json({ error: 'rating must be between 1 and 5.' }, { status: 400 });
      }

      const existing = await prisma.appointment.findFirst({ where: { id: apptId, reviewRating: null, status: 'Completed' } });
      if (!existing) {
        const appt = await prisma.appointment.findUnique({ where: { id: apptId } });
        if (!appt) return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
        if (appt.status !== 'Completed') return NextResponse.json({ error: 'Only completed appointments can be reviewed.' }, { status: 400 });
        return NextResponse.json({ error: 'You already reviewed this appointment.' }, { status: 400 });
      }

      const updated = await prisma.appointment.update({
        where: { id: apptId },
        data: { reviewRating, reviewText: typeof review === 'string' ? review.trim().slice(0, 500) : '', reviewedAt: new Date() },
        include: {
          patient: { select: { id: true, name: true } },
          doctor: true,
        },
      });

      const patientName = (updated.patient as any)?.name || 'Patient';
      await prisma.review.create({
        data: {
          doctorId: updated.doctorId, patientId: updated.patientId,
          patientName, rating: reviewRating,
          text: typeof review === 'string' ? review.trim().slice(0, 500) : '',
          appointmentId: apptId, verified: true,
        },
      });

      if (updated.doctorId) await updateTargetRating(updated.doctorId, 'doctor');

      return NextResponse.json(apptToResponse({ ...updated, doctor: updated.doctor, patient: updated.patient }));
    }

    // STATUS FLOW
    if (!status) return NextResponse.json({ error: 'status is required.' }, { status: 400 });
    const validStatuses = ['Confirmed', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) return NextResponse.json({ error: `Invalid status.` }, { status: 400 });

    const where: any = { id: apptId };
    if (doctorId) where.doctorId = parseInt(doctorId, 10);
    if (patientId) where.patientId = parseInt(patientId, 10);
    if (status === 'Completed' || status === 'Cancelled') where.status = 'Confirmed';

    const updateData: any = { status };
    if (status === 'Completed') {
      const existing = await prisma.appointment.findUnique({ where: { id: apptId }, select: { paymentMethod: true, paymentStatus: true, bookingFeePaid: true } });
      if (!existing) return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
      if (existing.paymentMethod === 'online' && existing.paymentStatus !== 'paid') {
        return NextResponse.json({ error: 'Cannot complete appointment before payment.' }, { status: 400 });
      }
      if (existing.paymentMethod === 'chamber' && !existing.bookingFeePaid) {
        return NextResponse.json({ error: 'Cannot complete appointment before the booking fee is paid.' }, { status: 400 });
      }
      // Cash / chamber consultation fees are collected offline, so completing the visit settles them.
      if ((existing.paymentMethod === 'cash' || existing.paymentMethod === 'chamber') && existing.paymentStatus !== 'paid') {
        updateData.paymentStatus = 'paid';
      }
    }

    const updated = await prisma.appointment.updateMany({ where, data: updateData });
    if (updated.count === 0) return NextResponse.json({ error: 'Appointment not found or already updated.' }, { status: 404 });

    const result = await prisma.appointment.findUnique({
      where: { id: apptId },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        doctor: { select: { id: true, name: true, specialty: true } },
      },
    });

    return NextResponse.json(apptToResponse(result));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update appointment.' }, { status: 500 });
  }
}