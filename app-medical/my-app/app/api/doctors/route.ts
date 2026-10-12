import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { haversineKm, isDoctorInChamber, istNow, isValidLatLng } from '@/lib/chamber';
import { getActiveSpecialtyNames } from '@/lib/specialties';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function docToResponse(doc: any, now = istNow()) {
  // clinicPhotos can be several MB of base64 per doctor; list views don't need them.
  const { password, authOtpHash, chambers, clinicPhotos: _photos, ...rest } = doc;
  const activeChambers: any[] = Array.isArray(chambers) ? chambers : [];
  const inChamber = activeChambers.find(c => isDoctorInChamber(c, now));
  return {
    ...rest,
    _id: rest.id,
    location: rest.locationLat != null ? { lat: rest.locationLat, lng: rest.locationLng } : null,
    hospitalId: rest.hospitalId,
    chamberCount: activeChambers.length,
    chamberLocations: activeChambers
      .filter(c => isValidLatLng(c.locationLat, c.locationLng))
      .map(c => ({ id: c.id, name: c.name, lat: c.locationLat, lng: c.locationLng })),
    inChamberNow: inChamber ? { id: inChamber.id, name: inChamber.name } : null,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const specialty = searchParams.get('specialty');
    const online = searchParams.get('online');
    const userLat = searchParams.get('lat');
    const userLng = searchParams.get('lng');

    const where: any = { isVerified: true };
    if (specialty && specialty !== 'All') {
      where.specialty = { contains: specialty };
    }
    if (online === 'true') where.isOnlineNow = true;

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        hospital: { select: { id: true, name: true, type: true, facilityKind: true, email: true, phone: true } },
        chambers: {
          where: { isActive: true },
          select: {
            id: true, name: true, locationLat: true, locationLng: true, isActive: true,
            scheduleType: true, weekDays: true, monthDays: true, startTime: true, endTime: true,
            checkedInAt: true, checkedOutAt: true,
          },
        },
      },
      orderBy: { rating: 'desc' },
    });

    const now = istNow();
    const mapped = doctors.map(d => docToResponse(d, now));

    if (userLat && userLng) {
      const uLat = parseFloat(userLat);
      const uLng = parseFloat(userLng);
      if (Number.isFinite(uLat) && Number.isFinite(uLng)) {
        const withDistance = mapped.map((d: any) => {
          // Distance to the doctor's nearest chamber; falls back to the doctor's own saved location.
          const points: { lat: number; lng: number; name?: string }[] = [...d.chamberLocations];
          if (points.length === 0 && typeof d.location?.lat === 'number' && Number.isFinite(d.location.lat)) {
            points.push({ lat: d.location.lat, lng: d.location.lng });
          }
          let best: { km: number; name?: string } | null = null;
          for (const p of points) {
            const km = haversineKm(uLat, uLng, p.lat, p.lng);
            if (!best || km < best.km) best = { km, name: p.name };
          }
          return {
            ...d,
            distance: best ? Math.round(best.km * 10) / 10 : d.distance ?? 9999,
            nearestChamberName: best?.name ?? null,
          };
        });
        withDistance.sort((a: any, b: any) => (a.distance ?? 9999) - (b.distance ?? 9999));
        return NextResponse.json(withDistance);
      }
    }

    return NextResponse.json(mapped);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to fetch doctors.') }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, specialty, fee, image, certificateUrl, platformFeePercent } = body;

    if (!name || !email || !password || !specialty) {
      return NextResponse.json({ error: 'Name, email, password, and specialty are required.' }, { status: 400 });
    }

    const activeSpecialties = await getActiveSpecialtyNames();
    const matchedSpecialty = activeSpecialties.find(s => s.toLowerCase() === String(specialty).trim().toLowerCase());
    if (!matchedSpecialty) {
      return NextResponse.json({ error: 'Please select a valid specialty from the allowed specialties list.' }, { status: 400 });
    }

    const existingDoctor = await prisma.doctor.findFirst({ where: { email: email.toLowerCase() } });
    if (existingDoctor) return NextResponse.json({ error: 'A doctor with this email already exists.' }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedPlatformFeePercent = Math.min(100, Math.max(0, Number(platformFeePercent) || 0));

    const newDoctor = await prisma.doctor.create({
      data: {
        name, email: email.toLowerCase(), phone: phone || '', password: hashedPassword,
        specialty: matchedSpecialty, qual: 'MBBS, MD', exp: '5 years',
        fee: Number(fee) || 500, videoFee: Math.floor((Number(fee) || 500) * 0.8),
        platformFeePercent: normalizedPlatformFeePercent,
        image: typeof image === 'string' ? image.trim() : '',
        certificateUrl: certificateUrl || '',
        rating: 4.5, reviews: 0, distance: 0,
        about: `${name} is a dedicated ${specialty}.`,
        address: 'Medinex Virtual Clinic',
        slots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
        isOnlineNow: false,
      },
    });

    const { password: _pw, ...doctorResponse } = newDoctor;
    return NextResponse.json({ ...doctorResponse, _id: doctorResponse.id }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to create doctor.') }, { status: 500 });
  }
}
