import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { istNow, serializeChamber } from '@/lib/chamber';
import { MAX_CHAMBERS_PER_DOCTOR, parseChamberInput } from '@/lib/chamberInput';
import { syncDoctorFeeFromChambers } from '@/lib/chamberServer';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doctorId = parseInt(id, 10);
    if (isNaN(doctorId)) return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });

    const activeOnly = new URL(req.url).searchParams.get('active') === 'true';
    const chambers = await prisma.doctorChamber.findMany({
      where: { doctorId, ...(activeOnly ? { isActive: true } : {}) },
      orderBy: { createdAt: 'asc' },
    });

    const now = istNow();
    const upcoming = await prisma.appointment.groupBy({
      by: ['chamberId'],
      where: {
        doctorId,
        chamberId: { not: null },
        status: 'Confirmed',
        bookingFeePaid: true,
        visitDate: { gte: now.dateISO },
      },
      _count: { _all: true },
    });
    const todays = await prisma.appointment.groupBy({
      by: ['chamberId'],
      where: { doctorId, chamberId: { not: null }, status: { not: 'Cancelled' }, bookingFeePaid: true, visitDate: now.dateISO },
      _count: { _all: true },
    });
    const countFor = (rows: typeof upcoming, chamberId: number) =>
      rows.find(r => r.chamberId === chamberId)?._count._all ?? 0;

    return NextResponse.json(
      chambers.map(c => ({
        ...serializeChamber(c, now),
        upcomingBookings: countFor(upcoming, c.id),
        todaysBookings: countFor(todays, c.id),
      }))
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch chambers.' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doctorId = parseInt(id, 10);
    if (isNaN(doctorId)) return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } });
    if (!doctor) return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });

    const count = await prisma.doctorChamber.count({ where: { doctorId } });
    if (count >= MAX_CHAMBERS_PER_DOCTOR) {
      return NextResponse.json({ error: `You can add up to ${MAX_CHAMBERS_PER_DOCTOR} chambers.` }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = parseChamberInput(body, null, false);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const chamber = await prisma.doctorChamber.create({ data: { ...(parsed.data as any), doctorId } });
    await syncDoctorFeeFromChambers(doctorId);
    return NextResponse.json(serializeChamber(chamber), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create chamber.' }, { status: 500 });
  }
}
