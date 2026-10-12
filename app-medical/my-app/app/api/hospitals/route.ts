import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hospitalToResponse(h: any) {
  return {
    ...h,
    _id: h.id,
    location: h.locationLat != null ? { lat: h.locationLat, lng: h.locationLng } : null,
    ownerId: h.ownerId,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    const userLat = searchParams.get('lat');
    const userLng = searchParams.get('lng');
    const tab = searchParams.get('tab');

    const where: any = { isActive: true };
    if (type && type !== 'all') where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameHi: { contains: search } },
        { address: { contains: search } },
      ];
    }

    const hospitals = await prisma.hospital.findMany({
      where,
      include: { owner: { select: { id: true, name: true, email: true, phone: true } } },
    });
    hospitals.sort((a: any, b: any) => (Number(b.rating) || 0) - (Number(a.rating) || 0));

    let mapped = hospitals.map(hospitalToResponse);

    // Filter by tab
    if (tab === 'lab') mapped = mapped.filter((h: any) => Array.isArray(h.labServices) && h.labServices.length > 0);
    else if (tab === 'surgery') mapped = mapped.filter((h: any) => Array.isArray(h.surgeryServices) && h.surgeryServices.length > 0);
    else if (tab === 'medicine') mapped = mapped.filter((h: any) => h.medicineShop === true);

    // Filter by department
    if (department) mapped = mapped.filter((h: any) => Array.isArray(h.departments) && h.departments.some((d: string) => d.toLowerCase().includes(department.toLowerCase())));

    if (userLat && userLng) {
      const uLat = parseFloat(userLat);
      const uLng = parseFloat(userLng);
      if (Number.isFinite(uLat) && Number.isFinite(uLng)) {
        const withDistance = mapped.map((obj: any) => ({
          ...obj,
          distance: (typeof obj.location?.lat === 'number' && Number.isFinite(obj.location.lat))
            ? Math.round(haversineKm(uLat, uLng, obj.location.lat, obj.location.lng) * 10) / 10
            : 9999,
        }));
        withDistance.sort((a: any, b: any) => (a.distance ?? 9999) - (b.distance ?? 9999));
        return NextResponse.json(withDistance);
      }
    }

    return NextResponse.json(mapped);
  } catch (error: unknown) {
    console.error('Get hospitals error:', error);
    return NextResponse.json({ error: 'Failed to fetch hospitals.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ownerEmail, ownerPassword, ...hospitalData } = body;

    let finalOwnerId: number | null = null;

    if (ownerEmail) {
      let user = await prisma.user.findFirst({ where: { email: ownerEmail.toLowerCase() } });
      if (user) {
        const updateData: any = { role: 'hospital_owner' };
        if (ownerPassword) updateData.password = await bcrypt.hash(ownerPassword, 10);
        user = await prisma.user.update({ where: { id: user.id }, data: updateData });
        finalOwnerId = user.id;
      } else if (ownerPassword) {
        const hashedPw = await bcrypt.hash(ownerPassword, 10);
        user = await prisma.user.create({
          data: { name: hospitalData.name + ' Admin', email: ownerEmail.toLowerCase(), password: hashedPw, role: 'hospital_owner', phone: hospitalData.phone || '0000000000' },
        });
        finalOwnerId = user.id;
      } else {
        return NextResponse.json({ error: 'Password is required for new owner accounts.' }, { status: 400 });
      }
    }

    const locationLat = hospitalData.location ? (parseFloat(hospitalData.location.lat) || null) : null;
    const locationLng = hospitalData.location ? (parseFloat(hospitalData.location.lng) || null) : null;
    const platformFeePercent = Math.min(100, Math.max(0, Number(hospitalData.platformFeePercent) || 0));

    const hospital = await prisma.hospital.create({
      data: {
        name: hospitalData.name, nameHi: hospitalData.nameHi || '',
        type: hospitalData.type || 'private',
        phone: hospitalData.phone || '', email: hospitalData.email || '',
        address: hospitalData.address || '', addressHi: hospitalData.addressHi || '',
        locationLat, locationLng,
        facilities: hospitalData.facilities || [],
        departments: hospitalData.departments || [],
        photos: hospitalData.photos || [],
        ownerId: finalOwnerId,
        labServices: hospitalData.labServices || [],
        surgeryServices: hospitalData.surgeryServices || [],
        serviceSlots: hospitalData.serviceSlots || ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM', '07:00 PM'],
        medicineShop: hospitalData.medicineShop || false,
        medicineDelivery: hospitalData.medicineDelivery || false,
        platformFeePercent,
        about: hospitalData.about || '', aboutHi: hospitalData.aboutHi || '',
      },
    });

    return NextResponse.json(hospitalToResponse(hospital), { status: 201 });
  } catch (error: any) {
    console.error('Create hospital error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create hospital.' }, { status: 500 });
  }
}