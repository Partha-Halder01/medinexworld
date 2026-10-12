import { NextResponse } from 'next/server';
import { getSpecialtiesForAdmin, createSpecialty } from '@/lib/specialties';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const specialties = await getSpecialtiesForAdmin();
    return NextResponse.json(specialties);
  } catch (error: any) {
    console.error('Admin get specialties error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch specialties.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, icon } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Specialty name is required.' }, { status: 400 });
    }

    const created = await createSpecialty({
      name: name.trim(),
      description: description ? String(description).trim() : undefined,
      icon: icon ? String(icon).trim() : undefined,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Admin create specialty error:', error);
    const message = error.message || 'Failed to create specialty.';
    const status = message.includes('already exists') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
