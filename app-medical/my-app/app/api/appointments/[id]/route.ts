import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serializeChamber } from '@/lib/chamber';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const patientIdParam = searchParams.get('patientId');
    const includePendingPayment = searchParams.get('includePendingPayment') === 'true';

    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'Invalid appointment id.' }, { status: 400 });

    const appointment = await prisma.appointment.findUnique({
      where: { id: numId },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true, role: true, walletBalance: true } },
        doctor: { include: { hospital: { select: { id: true, name: true, phone: true, email: true, address: true, locationLat: true, locationLng: true } } } },
        hospital: { select: { id: true, name: true, email: true, phone: true, address: true, locationLat: true, locationLng: true } },
        chamber: true,
      },
    });

    if (!appointment) return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });

    if (patientIdParam) {
      const pId = parseInt(patientIdParam, 10);
      if (!isNaN(pId) && appointment.patientId !== pId) return NextResponse.json({ error: 'Unauthorized for this appointment.' }, { status: 403 });
    }

    if (!includePendingPayment && appointment.paymentMethod === 'online' && appointment.paymentStatus !== 'paid') {
      return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    }
    if (!includePendingPayment && appointment.paymentMethod === 'chamber' && !appointment.bookingFeePaid) {
      return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    }

    const { doctor: rawDoctor, patient, hospital, chamber, ...rest } = appointment as any;
    const { password: _password, authOtpHash: _otp, ...doctor } = rawDoctor || {};
    return NextResponse.json({
      ...rest, _id: rest.id,
      serialNumber: rest.serialNumber || 1,
      patientId: patient ? { ...patient, _id: patient.id } : rest.patientId,
      chamber: chamber ? serializeChamber(chamber) : null,
      doctorId: rawDoctor ? { ...doctor, _id: doctor.id, location: doctor.locationLat != null ? { lat: doctor.locationLat, lng: doctor.locationLng } : null } : rest.doctorId,
      hospitalId: hospital ? { ...hospital, _id: hospital.id, location: hospital.locationLat != null ? { lat: hospital.locationLat, lng: hospital.locationLng } : null } : rest.hospitalId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch appointment.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'Invalid appointment id.' }, { status: 400 });

    const body = await req.json();
    const { patientName, patientAge, patientGender, patientId, settlementStatus, settlementRef, settledBy } = body;

    const where: any = { id: numId };
    if (patientId) where.patientId = parseInt(patientId, 10);

    const data: any = {};
    if (patientName !== undefined) {
      data.patientName = typeof patientName === 'string' && patientName.trim() ? patientName.trim() : null;
    }
    if (patientAge !== undefined) {
      data.patientAge = patientAge != null && patientAge !== '' ? parseInt(String(patientAge), 10) : null;
    }
    if (patientGender !== undefined) {
      data.patientGender = typeof patientGender === 'string' && patientGender.trim() ? patientGender.trim() : null;
    }
    if (settlementStatus !== undefined) {
      data.settlementStatus = settlementStatus;
      if (settlementStatus === 'settled') {
        data.settledAt = new Date();
        data.settledBy = settledBy || 'Admin';
      } else if (settlementStatus === 'pending') {
        data.settledAt = null;
        data.settledBy = null;
      }
    }
    if (settlementRef !== undefined) {
      data.settlementRef = typeof settlementRef === 'string' ? settlementRef.trim() : null;
    }

    const updated = await prisma.appointment.update({
      where,
      data,
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true, role: true } },
        doctor: { select: { id: true, name: true, specialty: true, fee: true, videoFee: true, image: true } },
        hospital: { select: { id: true, name: true, email: true, phone: true, address: true } },
        chamber: true,
      },
    });

    const { doctor: rawDoctor, patient, hospital, chamber, ...rest } = updated as any;
    return NextResponse.json({
      ...rest, _id: rest.id,
      serialNumber: rest.serialNumber || 1,
      patientId: patient ? { ...patient, _id: patient.id } : rest.patientId,
      chamber: chamber ? serializeChamber(chamber) : null,
      doctorId: rawDoctor ? { ...rawDoctor, _id: rawDoctor.id } : rest.doctorId,
      hospitalId: hospital ? { ...hospital, _id: hospital.id } : rest.hospitalId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update appointment.' }, { status: 500 });
  }
}
