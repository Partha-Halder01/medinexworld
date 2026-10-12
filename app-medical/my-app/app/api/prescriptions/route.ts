import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    if (!userId) return NextResponse.json({ error: 'userId is required.' }, { status: 400 });

    const where: any = { userId: parseInt(userId, 10) };
    if (type) where.type = type;

    const prescriptions = await prisma.prescription.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(prescriptions.map((p: any) => ({ ...p, _id: p.id })));
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to fetch prescriptions.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, type, title, date, fileData, fileType } = body;
    if (!userId || !type || !title || !date || !fileData || !fileType) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    const prescription = await prisma.prescription.create({
      data: {
        userId: parseInt(userId, 10), type, title,
        doctorName: body.doctorName || '', hospitalName: body.hospitalName || '',
        date, fileData, fileType, notes: body.notes || '',
        appointmentId: body.appointmentId ? parseInt(body.appointmentId, 10) : null,
      },
    });
    return NextResponse.json({ ...prescription, _id: prescription.id }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to create prescription.' }, { status: 500 });
  }
}