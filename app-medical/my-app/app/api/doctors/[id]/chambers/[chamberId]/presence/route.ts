import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { setChamberPresence } from '@/lib/chamberServer';

export const dynamic = 'force-dynamic';

// POST { action: 'in' | 'out', lat?, lng? }
// "in" marks the doctor as present in this chamber (shown live to patients).
export async function POST(req: Request, { params }: { params: Promise<{ id: string; chamberId: string }> }) {
  try {
    const { id, chamberId } = await params;
    const doctorId = parseInt(id, 10);
    const cId = parseInt(chamberId, 10);
    if (isNaN(doctorId) || isNaN(cId)) return NextResponse.json({ error: 'Chamber not found.' }, { status: 404 });

    const chamber = await prisma.doctorChamber.findUnique({ where: { id: cId } });
    if (!chamber || chamber.doctorId !== doctorId) return NextResponse.json({ error: 'Chamber not found.' }, { status: 404 });

    const { action, lat, lng } = await req.json().catch(() => ({}));
    const result = await setChamberPresence(chamber, action, { lat, lng });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.chamber);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update chamber status.' }, { status: 500 });
  }
}
