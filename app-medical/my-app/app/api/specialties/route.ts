import { NextResponse } from 'next/server';
import { getActiveSpecialtyNames } from '@/lib/specialties';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const specialties = await getActiveSpecialtyNames();
    return NextResponse.json({ specialties });
  } catch (error: any) {
    console.error('Failed to get specialties:', error);
    return NextResponse.json({ error: 'Failed to fetch specialties' }, { status: 500 });
  }
}
