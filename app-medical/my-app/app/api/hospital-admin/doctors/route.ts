import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { safeErrorMessage } from '@/lib/apiError';
import { istNow, serializeChamber } from '@/lib/chamber';
import { parseChamberInput } from '@/lib/chamberInput';
import { syncDoctorFeeFromChambers } from '@/lib/chamberServer';
import { facilityChamberFields, getOwnedHospital, listFacilityDoctors } from '@/lib/hospitalServer';
import { isDisplayableImage } from '@/lib/imageUrl';

export const dynamic = 'force-dynamic';

// Doctors at a hospital / nursing home are "facility chambers": a DoctorChamber with hospitalId set.
// Name, address and map pin always mirror the facility; the facility sets the timetable and fee.

const SCHEDULE_KEYS = ['scheduleType', 'weekDays', 'monthDays', 'startTime', 'endTime', 'slotDuration', 'fee', 'isActive'] as const;

function pickSchedule(schedule: any) {
  const out: Record<string, unknown> = {};
  for (const key of SCHEDULE_KEYS) if (schedule?.[key] !== undefined) out[key] = schedule[key];
  return out;
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function GET(req: Request) {
  try {
    const hospital = await getOwnedHospital(new URL(req.url).searchParams.get('ownerId'));
    if (!hospital) return NextResponse.json({ error: 'Hospital not found for this owner.' }, { status: 404 });
    return NextResponse.json(await listFacilityDoctors(hospital.id));
  } catch (error: any) {
    console.error('Get hospital doctors error:', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Failed to fetch doctors.') }, { status: 500 });
  }
}

// POST { ownerId, mode: 'new' | 'existing', doctor?: {...}, existingEmail?, schedule: {...} }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const hospital = await getOwnedHospital(body.ownerId);
    if (!hospital) return NextResponse.json({ error: 'Hospital not found for this owner.' }, { status: 404 });

    const parsed = parseChamberInput({ ...pickSchedule(body.schedule), ...facilityChamberFields(hospital) }, null, false);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    let doctorId: number;
    if (body.mode === 'existing') {
      const email = clean(body.existingEmail, 255).toLowerCase();
      if (!email) return NextResponse.json({ error: "Enter the doctor's registered email." }, { status: 400 });
      const doctor = await prisma.doctor.findFirst({ where: { email }, select: { id: true } });
      if (!doctor) {
        return NextResponse.json({ error: 'No doctor is registered with this email. Use "New doctor" to create the account.' }, { status: 404 });
      }
      const already = await prisma.doctorChamber.findFirst({ where: { doctorId: doctor.id, hospitalId: hospital.id } });
      if (already) return NextResponse.json({ error: 'This doctor is already listed at your facility.' }, { status: 409 });
      doctorId = doctor.id;
    } else {
      const d = body.doctor || {};
      const name = clean(d.name, 120);
      const email = clean(d.email, 255).toLowerCase();
      const specialty = clean(d.specialty, 80);
      if (!name || !email || !specialty) return NextResponse.json({ error: 'Doctor name, email and specialty are required.' }, { status: 400 });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
      if (await prisma.doctor.findFirst({ where: { email }, select: { id: true } })) {
        return NextResponse.json({ error: 'A doctor with this email already exists. Use "Existing doctor" instead.' }, { status: 409 });
      }
      if (d.image && !isDisplayableImage(d.image)) return NextResponse.json({ error: 'Invalid photo.' }, { status: 400 });

      const created = await prisma.doctor.create({
        data: {
          // No password is set by the facility: the doctor signs in with an email OTP.
          // A random unguessable password keeps the account valid for the password column.
          name, email, password: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10),
          phone: clean(d.phone, 20),
          specialty,
          qual: clean(d.qual, 120) || 'MBBS',
          exp: clean(d.exp, 40),
          about: clean(d.about, 2000) || null,
          image: d.image || null,
          fee: Number(parsed.data?.fee) || 0,
          videoFee: 0,
          hospitalId: hospital.id,
          // New accounts still go through the platform's doctor verification before patients can book.
          isVerified: false,
        },
      });
      doctorId = created.id;
    }

    const chamber = await prisma.doctorChamber.create({ data: { ...(parsed.data as any), doctorId, hospitalId: hospital.id } });
    await syncDoctorFeeFromChambers(doctorId);
    return NextResponse.json(serializeChamber(chamber), { status: 201 });
  } catch (error: any) {
    console.error('Add hospital doctor error:', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Failed to add doctor.') }, { status: 500 });
  }
}

// PATCH { ownerId, chamberId, schedule?, doctor? }  — doctor profile edits only for accounts the facility created.
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const hospital = await getOwnedHospital(body.ownerId);
    if (!hospital) return NextResponse.json({ error: 'Hospital not found for this owner.' }, { status: 404 });

    const chamberId = parseInt(String(body.chamberId), 10);
    const chamber = isNaN(chamberId) ? null : await prisma.doctorChamber.findUnique({ where: { id: chamberId } });
    if (!chamber || chamber.hospitalId !== hospital.id) return NextResponse.json({ error: 'Doctor not found at your facility.' }, { status: 404 });

    if (body.schedule) {
      const parsed = parseChamberInput({ ...pickSchedule(body.schedule), ...facilityChamberFields(hospital) }, chamber, true);
      if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
      await prisma.doctorChamber.update({ where: { id: chamber.id }, data: parsed.data as any });
      await syncDoctorFeeFromChambers(chamber.doctorId);
    }

    if (body.doctor) {
      const doctor = await prisma.doctor.findUnique({ where: { id: chamber.doctorId }, select: { hospitalId: true } });
      if (doctor?.hospitalId !== hospital.id) {
        return NextResponse.json({ error: "This doctor manages their own profile. You can only change their timetable here." }, { status: 403 });
      }
      const d = body.doctor;
      const data: Record<string, unknown> = {};
      if (d.name !== undefined) data.name = clean(d.name, 120);
      if (d.phone !== undefined) data.phone = clean(d.phone, 20);
      if (d.specialty !== undefined) data.specialty = clean(d.specialty, 80);
      if (d.qual !== undefined) data.qual = clean(d.qual, 120);
      if (d.exp !== undefined) data.exp = clean(d.exp, 40);
      if (d.about !== undefined) data.about = clean(d.about, 2000) || null;
      if (d.image !== undefined) {
        if (d.image && !isDisplayableImage(d.image)) return NextResponse.json({ error: 'Invalid photo.' }, { status: 400 });
        data.image = d.image || null;
      }
      if (data.name === '' || data.specialty === '') return NextResponse.json({ error: 'Name and specialty cannot be empty.' }, { status: 400 });
      await prisma.doctor.update({ where: { id: chamber.doctorId }, data });
    }

    const updated = await prisma.doctorChamber.findUnique({ where: { id: chamber.id } });
    return NextResponse.json(serializeChamber(updated!));
  } catch (error: any) {
    console.error('Update hospital doctor error:', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Failed to update doctor.') }, { status: 500 });
  }
}

// DELETE ?ownerId=&chamberId=  — removes the doctor from this facility (their account stays).
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const hospital = await getOwnedHospital(searchParams.get('ownerId'));
    if (!hospital) return NextResponse.json({ error: 'Hospital not found for this owner.' }, { status: 404 });

    const chamberId = parseInt(searchParams.get('chamberId') || '', 10);
    const chamber = isNaN(chamberId) ? null : await prisma.doctorChamber.findUnique({ where: { id: chamberId } });
    if (!chamber || chamber.hospitalId !== hospital.id) return NextResponse.json({ error: 'Doctor not found at your facility.' }, { status: 404 });

    const upcoming = await prisma.appointment.count({
      where: { chamberId: chamber.id, status: 'Confirmed', bookingFeePaid: true, visitDate: { gte: istNow().dateISO } },
    });
    if (upcoming > 0) {
      return NextResponse.json(
        { error: `This doctor has ${upcoming} upcoming booking(s) here. Pause their bookings instead, or wait until those visits are done.` },
        { status: 409 }
      );
    }

    await prisma.doctorChamber.delete({ where: { id: chamber.id } });
    await prisma.doctor.updateMany({ where: { id: chamber.doctorId, hospitalId: hospital.id }, data: { hospitalId: null } });
    await syncDoctorFeeFromChambers(chamber.doctorId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Remove hospital doctor error:', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Failed to remove doctor.') }, { status: 500 });
  }
}
