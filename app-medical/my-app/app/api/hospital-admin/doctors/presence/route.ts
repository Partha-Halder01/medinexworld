import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { safeErrorMessage } from '@/lib/apiError';
import { setChamberPresence } from '@/lib/chamberServer';
import { getOwnedHospital } from '@/lib/hospitalServer';

export const dynamic = 'force-dynamic';

// POST { ownerId, chamberId, action: 'in' | 'out' } — front desk marks a doctor as arrived / left.
export async function POST(req: Request) {
  try {
    const { ownerId, chamberId, action } = await req.json().catch(() => ({}));
    const hospital = await getOwnedHospital(ownerId);
    if (!hospital) return NextResponse.json({ error: 'Hospital not found for this owner.' }, { status: 404 });

    const id = parseInt(String(chamberId), 10);
    const chamber = isNaN(id) ? null : await prisma.doctorChamber.findUnique({ where: { id } });
    if (!chamber || chamber.hospitalId !== hospital.id) return NextResponse.json({ error: 'Doctor not found at your facility.' }, { status: 404 });

    const result = await setChamberPresence(chamber, action);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.chamber);
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error, 'Failed to update status.') }, { status: 500 });
  }
}
