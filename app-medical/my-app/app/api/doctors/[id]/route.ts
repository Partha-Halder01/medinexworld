import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { istNow, serializeChamber } from '@/lib/chamber';
import { displayableImages, isDisplayableImage } from '@/lib/imageUrl';
import { getActiveSpecialtyNames } from '@/lib/specialties';

export const dynamic = 'force-dynamic';

function docToResponse(doc: any) {
  const { password, authOtpHash, chambers, ...rest } = doc;
  const now = istNow();
  return {
    ...rest,
    _id: rest.id,
    location: rest.locationLat != null ? { lat: rest.locationLat, lng: rest.locationLng } : null,
    ...(Array.isArray(chambers) ? { chambers: chambers.map((c: any) => serializeChamber(c, now)) } : {}),
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const numId = parseInt(rawId, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });

    const doctor = await prisma.doctor.findUnique({
      where: { id: numId },
      include: { hospital: true, chambers: { where: { isActive: true }, orderBy: { createdAt: 'asc' } } },
    });
    if (!doctor) return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });

    const isAdmin = req.headers.get('x-admin-request') === 'true';
    if (!doctor.isVerified && !isAdmin) return NextResponse.json({ error: 'Doctor not verified yet.' }, { status: 403 });

    return NextResponse.json(docToResponse(doctor));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch doctor.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const numId = parseInt(rawId, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });
    const updates = await req.json();

    const allowedFields = ['slots', 'weeklySchedule', 'fee', 'name', 'qual', 'about', 'address', 'email', 'phone'];
    const data: any = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) data[key] = updates[key];
    }

    if (updates.specialty !== undefined) {
      const activeSpecialties = await getActiveSpecialtyNames();
      const matched = activeSpecialties.find(s => s.toLowerCase() === String(updates.specialty).trim().toLowerCase());
      if (!matched) {
        return NextResponse.json({ error: 'Please select a valid specialty from the allowed specialties list.' }, { status: 400 });
      }
      data.specialty = matched;
    }

    // Profile highlight stats (shown on the public profile). Short free text like "12 years", "3,500+", "~15 mins".
    for (const key of ['exp', 'patientsTreated', 'avgWaitTime'] as const) {
      if (updates[key] !== undefined) data[key] = String(updates[key] ?? '').trim().slice(0, 40);
    }
    if (updates.rating !== undefined) {
      const rating = Number(updates.rating);
      if (!Number.isFinite(rating) || rating < 0 || rating > 5) return NextResponse.json({ error: 'Rating must be between 0 and 5.' }, { status: 400 });
      data.rating = Math.round(rating * 10) / 10;
    }
    if (updates.reviews !== undefined) {
      const reviews = Number(updates.reviews);
      if (!Number.isInteger(reviews) || reviews < 0) return NextResponse.json({ error: 'Review count must be a whole number.' }, { status: 400 });
      data.reviews = reviews;
    }
    if (updates.platformFeePercent !== undefined) {
      data.platformFeePercent = Math.min(100, Math.max(0, Number(updates.platformFeePercent) || 0));
    }

    if (updates.image !== undefined) {
      if (updates.image && !isDisplayableImage(updates.image)) return NextResponse.json({ error: 'Invalid profile photo.' }, { status: 400 });
      data.image = updates.image || '';
    }
    if (updates.clinicPhotos !== undefined) {
      const photos = displayableImages(updates.clinicPhotos);
      if (photos.length > 10) return NextResponse.json({ error: 'You can upload up to 10 clinic photos.' }, { status: 400 });
      data.clinicPhotos = photos;
    }
    if (updates.location !== undefined) {
      data.locationLat = updates.location?.lat ?? null;
      data.locationLng = updates.location?.lng ?? null;
    }

    const doctor = await prisma.doctor.update({ where: { id: numId }, data });
    return NextResponse.json(docToResponse(doctor));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update doctor.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const numId = parseInt(rawId, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });
    await prisma.doctor.delete({ where: { id: numId } });
    return NextResponse.json({ success: true, message: 'Doctor deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete doctor.' }, { status: 500 });
  }
}