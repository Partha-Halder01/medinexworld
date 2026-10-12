import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateTargetRating } from '@/lib/rating';

async function isSuperAdmin(userId: string) {
  if (userId === 'admin_id_from_env') return true;
  const numId = parseInt(userId, 10);
  if (isNaN(numId)) return false;
  const user = await prisma.user.findUnique({ where: { id: numId } });
  return user && user.role === 'admin';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId || !(await isSuperAdmin(userId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const reviews = await prisma.review.findMany({
      include: {
        doctor: { select: { id: true, name: true, specialty: true } },
        hospital: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reviews.map(r => ({ ...r, _id: r.id })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, ...reviewData } = await req.json();
    if (!userId || !(await isSuperAdmin(userId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    if (!reviewData.doctorId) return NextResponse.json({ error: 'Review must target a doctor' }, { status: 400 });
    if (!reviewData.patientName || !reviewData.rating) return NextResponse.json({ error: 'Patient name and rating are required' }, { status: 400 });

    const review = await prisma.review.create({
      data: {
        doctorId: parseInt(reviewData.doctorId, 10),
        patientId: reviewData.patientId ? parseInt(reviewData.patientId, 10) : null,
        patientName: reviewData.patientName,
        rating: reviewData.rating,
        text: (reviewData.text || '').slice(0, 500),
        verified: false,
      },
    });

    await updateTargetRating(parseInt(reviewData.doctorId, 10), 'doctor');
    return NextResponse.json({ ...review, _id: review.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create review' }, { status: 500 });
  }
}