import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateTargetRating } from '@/lib/rating';

async function isSuperAdmin(userId: string) {
  if (userId === 'admin_id_from_env') return true;
  const numId = parseInt(userId, 10);
  if (isNaN(numId)) return false;
  const user = await prisma.user.findUnique({ where: { id: numId } });
  return user?.role === 'admin';
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, ...updates } = await req.json();
    const { id } = await params;
    const numId = parseInt(id, 10);
    
    if (!userId || !(await isSuperAdmin(userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const review = await prisma.review.update({
      where: { id: numId },
      data: updates,
    });

    if (review.doctorId) {
      await updateTargetRating(review.doctorId.toString(), 'doctor');
    }

    return NextResponse.json({ ...review, _id: review.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const { id } = await params;
    const numId = parseInt(id, 10);

    if (!userId || !(await isSuperAdmin(userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const review = await prisma.review.delete({
      where: { id: numId },
    });

    if (review.doctorId) {
      await updateTargetRating(review.doctorId.toString(), 'doctor');
    }

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete review' }, { status: 500 });
  }
}
