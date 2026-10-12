import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  bookableSlotsFor,
  generateChamberSlots,
  isChamberOpenOn,
  isValidISODate,
} from '@/lib/chamber';
import { getTakenChamberSlots } from '@/lib/chamberServer';

export const dynamic = 'force-dynamic';

// GET ?date=YYYY-MM-DD
export async function GET(req: Request, { params }: { params: Promise<{ id: string; chamberId: string }> }) {
  try {
    const { id, chamberId } = await params;
    const doctorId = parseInt(id, 10);
    const cId = parseInt(chamberId, 10);
    const date = new URL(req.url).searchParams.get('date');
    if (isNaN(doctorId) || isNaN(cId)) return NextResponse.json({ error: 'Chamber not found.' }, { status: 404 });
    if (!isValidISODate(date)) return NextResponse.json({ error: 'date must be YYYY-MM-DD.' }, { status: 400 });

    const chamber = await prisma.doctorChamber.findUnique({ where: { id: cId } });
    if (!chamber || chamber.doctorId !== doctorId || !chamber.isActive) {
      return NextResponse.json({ error: 'Chamber not found.' }, { status: 404 });
    }

    const isOpen = isChamberOpenOn(chamber, date);
    const bookable = new Set(bookableSlotsFor(chamber, date));
    const taken = isOpen ? await getTakenChamberSlots(cId, date) : new Set<string>();

    const slots = isOpen
      ? generateChamberSlots(chamber).map(time => ({
          time,
          available: bookable.has(time) && !taken.has(time),
          reason: !bookable.has(time) ? 'past' : taken.has(time) ? 'booked' : null,
        }))
      : [];

    return NextResponse.json({ date, isOpen, slots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load slots.' }, { status: 500 });
  }
}
