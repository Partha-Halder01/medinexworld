import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { listFacilityDoctors } from '@/lib/hospitalServer';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'Hospital not found.' }, { status: 404 });

    const hospital = await prisma.hospital.findUnique({
      where: { id: numId },
      include: { owner: { select: { id: true, name: true, email: true, phone: true } } },
    });
    if (!hospital) return NextResponse.json({ error: 'Hospital not found.' }, { status: 404 });

    const sittings = await listFacilityDoctors(hospital.id, { activeOnly: true });
    const doctors = sittings.map(({ doctor, chamber }) => ({
      ...doctor,
      fee: chamber.fee,
      chamber,
    }));

    return NextResponse.json({ ...hospital, _id: hospital.id, location: hospital.locationLat != null ? { lat: hospital.locationLat, lng: hospital.locationLng } : null, doctors });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to fetch hospital.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'Hospital not found.' }, { status: 404 });
    const body = await req.json();
    const { ownerEmail, ownerPassword, ...hospitalData } = body;

    let finalOwnerId: number | undefined = undefined;

    if (ownerEmail) {
      let user = await prisma.user.findFirst({ where: { email: ownerEmail.toLowerCase() } });
      if (user) {
        const updateData: any = { role: 'hospital_owner' };
        if (ownerPassword) updateData.password = await bcrypt.hash(ownerPassword, 10);
        user = await prisma.user.update({ where: { id: user.id }, data: updateData });
        finalOwnerId = user.id;
      } else if (ownerPassword) {
        const hashedPw = await bcrypt.hash(ownerPassword, 10);
        user = await prisma.user.create({ data: { name: (hospitalData.name || 'Hospital') + ' Admin', email: ownerEmail.toLowerCase(), password: hashedPw, role: 'hospital_owner', phone: hospitalData.phone || '0000000000' } });
        finalOwnerId = user.id;
      }
    }

    const updateData: any = {};
    const allowedFields = ['name', 'nameHi', 'type', 'phone', 'email', 'address', 'addressHi', 'facilities', 'departments', 'photos', 'labServices', 'surgeryServices', 'serviceSlots', 'medicineShop', 'medicineDelivery', 'about', 'aboutHi', 'isActive'];
    for (const key of allowedFields) {
      if (hospitalData[key] !== undefined) updateData[key] = hospitalData[key];
    }
    if (hospitalData.location) {
      updateData.locationLat = parseFloat(hospitalData.location.lat) || null;
      updateData.locationLng = parseFloat(hospitalData.location.lng) || null;
    }
    if (hospitalData.platformFeePercent !== undefined) updateData.platformFeePercent = Math.min(100, Math.max(0, Number(hospitalData.platformFeePercent) || 0));
    if (finalOwnerId !== undefined) updateData.ownerId = finalOwnerId;

    const hospital = await prisma.hospital.update({ where: { id: numId }, data: updateData });
    return NextResponse.json({ ...hospital, _id: hospital.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update hospital.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'Hospital not found.' }, { status: 404 });
    await prisma.hospital.delete({ where: { id: numId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to delete hospital.' }, { status: 500 });
  }
}