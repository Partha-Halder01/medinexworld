import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH /api/location — save GPS coordinates for a user or doctor
export async function PATCH(req: Request) {
  try {
    const { id, role, lat, lng } = await req.json();

    if (!id || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'id, lat and lng are required.' }, { status: 400 });
    }

    const numId = parseInt(String(id), 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID format.' }, { status: 400 });
    }

    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (role === 'doctor') {
      await prisma.doctor.update({
        where: { id: numId },
        data: { locationLat: latNum, locationLng: lngNum },
      });
    } else {
      await prisma.user.update({
        where: { id: numId },
        data: { locationLat: latNum, locationLng: lngNum },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Location update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update location.' }, { status: 500 });
  }
}
