import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateTargetRating } from '@/lib/rating';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');
    if (!doctorId) return NextResponse.json({ error: 'doctorId is required.' }, { status: 400 });

    const reviews = await prisma.review.findMany({
      where: { doctorId: parseInt(doctorId, 10) },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reviews.map((r: any) => ({ ...r, _id: r.id })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { doctorId, patientId, patientName, rating, text, appointmentId } = await req.json();
    if (!doctorId || !patientName || !rating) return NextResponse.json({ error: 'doctorId, patientName, and rating are required.' }, { status: 400 });
    if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });

    const review = await prisma.review.create({
      data: {
        doctorId: parseInt(doctorId, 10),
        patientId: patientId ? parseInt(patientId, 10) : null,
        patientName, rating,
        text: (text || '').trim().slice(0, 500),
        appointmentId: appointmentId ? parseInt(appointmentId, 10) : null,
        verified: !!appointmentId,
      },
    });

    await updateTargetRating(parseInt(doctorId, 10), 'doctor');
    return NextResponse.json({ ...review, _id: review.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save review.' }, { status: 500 });
  }
}