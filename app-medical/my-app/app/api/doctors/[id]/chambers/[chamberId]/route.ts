import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { istNow, serializeChamber } from '@/lib/chamber';
import { parseChamberInput } from '@/lib/chamberInput';
import { syncDoctorFeeFromChambers } from '@/lib/chamberServer';

export const dynamic = 'force-dynamic';

async function findOwnedChamber(params: Promise<{ id: string; chamberId: string }>) {
  const { id, chamberId } = await params;
  const doctorId = parseInt(id, 10);
  const cId = parseInt(chamberId, 10);
  if (isNaN(doctorId) || isNaN(cId)) return null;
  const chamber = await prisma.doctorChamber.findUnique({ where: { id: cId } });
  return chamber && chamber.doctorId === doctorId ? chamber : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; chamberId: string }> }) {
  try {
    const chamber = await findOwnedChamber(params);
    if (!chamber) return NextResponse.json({ error: 'Chamber not found.' }, { status: 404 });
    return NextResponse.json(serializeChamber(chamber));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch chamber.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; chamberId: string }> }) {
  try {
    const chamber = await findOwnedChamber(params);
    if (!chamber) return NextResponse.json({ error: 'Chamber not found.' }, { status: 404 });
    if (chamber.hospitalId) {
      return NextResponse.json({ error: 'This timetable is managed by the hospital / nursing home. Ask them to change it.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = parseChamberInput(body, chamber, true);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const updated = await prisma.doctorChamber.update({ where: { id: chamber.id }, data: parsed.data as any });
    await syncDoctorFeeFromChambers(chamber.doctorId);
    return NextResponse.json(serializeChamber(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update chamber.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; chamberId: string }> }) {
  try {
    const chamber = await findOwnedChamber(params);
    if (!chamber) return NextResponse.json({ error: 'Chamber not found.' }, { status: 404 });
    if (chamber.hospitalId) {
      return NextResponse.json({ error: 'This chamber is managed by the hospital / nursing home.' }, { status: 403 });
    }

    const upcoming = await prisma.appointment.count({
      where: { chamberId: chamber.id, status: 'Confirmed', bookingFeePaid: true, visitDate: { gte: istNow().dateISO } },
    });
    if (upcoming > 0) {
      return NextResponse.json(
        { error: `This chamber has ${upcoming} upcoming booking(s). Deactivate it instead, or complete/cancel those bookings first.` },
        { status: 409 }
      );
    }

    // Past appointments keep their chamberName/chamberAddress snapshot; chamberId becomes null.
    await prisma.doctorChamber.delete({ where: { id: chamber.id } });
    await syncDoctorFeeFromChambers(chamber.doctorId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete chamber.' }, { status: 500 });
  }
}
