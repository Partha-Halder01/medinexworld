import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'Prescription not found.' }, { status: 404 });
    const prescription = await prisma.prescription.findUnique({ where: { id: numId } });
    if (!prescription) return NextResponse.json({ error: 'Prescription not found.' }, { status: 404 });
    return NextResponse.json({ ...prescription, _id: prescription.id });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to fetch prescription.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'Prescription not found.' }, { status: 404 });
    await prisma.prescription.delete({ where: { id: numId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to delete prescription.' }, { status: 500 });
  }
}