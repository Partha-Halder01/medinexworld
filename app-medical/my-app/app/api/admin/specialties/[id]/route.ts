import { NextResponse } from 'next/server';
import { updateSpecialty, deleteSpecialty } from '@/lib/specialties';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid specialty ID.' }, { status: 400 });
    }

    const updates = await req.json();
    const updated = await updateSpecialty(id, updates);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Admin update specialty error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update specialty.' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid specialty ID.' }, { status: 400 });
    }

    const result = await deleteSpecialty(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Admin delete specialty error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete specialty.' }, { status: 400 });
  }
}
