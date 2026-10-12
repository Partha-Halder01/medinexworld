import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { safeErrorMessage } from '@/lib/apiError';
import { normalizeFacilityKind, syncFacilityChambers } from '@/lib/hospitalServer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerIdParam = searchParams.get('ownerId');

    if (!ownerIdParam) {
      return NextResponse.json({ error: 'Owner ID is required.' }, { status: 400 });
    }

    const ownerId = parseInt(ownerIdParam, 10);
    if (isNaN(ownerId)) {
      return NextResponse.json({ error: 'Invalid Owner ID.' }, { status: 400 });
    }

    let hospital = await prisma.hospital.findFirst({
      where: { ownerId },
    });

    if (!hospital) {
      // If newly registered owner, create default hospital
      const user = await prisma.user.findUnique({ where: { id: ownerId } });
      if (user && (user.role === 'hospital_owner' || user.role === 'hospital_admin' || user.role === 'admin')) {
        hospital = await prisma.hospital.create({
          data: {
            name: `${user.name}'s Medical Center`,
            ownerId: user.id,
            type: 'Private Hospital',
            address: 'Update hospital address',
            email: user.email,
            phone: user.phone || '+91 98765 43210',
            isActive: true,
            facilities: ['Emergency', 'OPD', 'Pharmacy'],
            departments: ['General Medicine'],
          },
        });
      } else {
        return NextResponse.json({ error: 'Hospital not found for this owner.' }, { status: 404 });
      }
    }

    return NextResponse.json({
      ...hospital,
      _id: hospital.id,
    });
  } catch (error: any) {
    console.error('Get hospital admin details error:', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Failed to fetch hospital details.') }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { ownerId: ownerIdParam, ...updateData } = body;

    if (!ownerIdParam) {
      return NextResponse.json({ error: 'Owner ID is required.' }, { status: 400 });
    }

    const ownerId = parseInt(ownerIdParam, 10);
    if (isNaN(ownerId)) {
      return NextResponse.json({ error: 'Invalid Owner ID.' }, { status: 400 });
    }

    const existing = await prisma.hospital.findFirst({ where: { ownerId } });
    if (!existing) {
      return NextResponse.json({ error: 'Hospital not found for this owner.' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.nameHi !== undefined) dataToUpdate.nameHi = updateData.nameHi;
    if (updateData.type !== undefined) dataToUpdate.type = updateData.type;
    if (updateData.facilityKind !== undefined) dataToUpdate.facilityKind = normalizeFacilityKind(updateData.facilityKind);
    if (updateData.location !== undefined) {
      const lat = Number(updateData.location?.lat);
      const lng = Number(updateData.location?.lng);
      const valid = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
      dataToUpdate.locationLat = valid ? lat : null;
      dataToUpdate.locationLng = valid ? lng : null;
    }
    if (updateData.phone !== undefined) dataToUpdate.phone = updateData.phone;
    if (updateData.email !== undefined) dataToUpdate.email = updateData.email;
    if (updateData.address !== undefined) dataToUpdate.address = updateData.address;
    if (updateData.addressHi !== undefined) dataToUpdate.addressHi = updateData.addressHi;
    if (updateData.about !== undefined) dataToUpdate.about = updateData.about;
    if (updateData.aboutHi !== undefined) dataToUpdate.aboutHi = updateData.aboutHi;
    if (updateData.facilities !== undefined) dataToUpdate.facilities = updateData.facilities;
    if (updateData.departments !== undefined) dataToUpdate.departments = updateData.departments;
    if (updateData.photos !== undefined) dataToUpdate.photos = updateData.photos;
    if (updateData.medicineShop !== undefined) dataToUpdate.medicineShop = Boolean(updateData.medicineShop);
    if (updateData.medicineDelivery !== undefined) dataToUpdate.medicineDelivery = Boolean(updateData.medicineDelivery);
    if (updateData.labServices !== undefined) dataToUpdate.labServices = updateData.labServices;
    if (updateData.surgeryServices !== undefined) dataToUpdate.surgeryServices = updateData.surgeryServices;
    if (updateData.serviceSlots !== undefined) dataToUpdate.serviceSlots = updateData.serviceSlots;
    // Platform fee is set by the platform admin, not by the facility.

    const updated = await prisma.hospital.update({
      where: { id: existing.id },
      data: dataToUpdate,
    });
    // Doctors' timetables at this facility show its name, address and map pin.
    await syncFacilityChambers(existing.id);

    return NextResponse.json({
      ...updated,
      _id: updated.id,
    });
  } catch (error: any) {
    console.error('Update hospital admin details error:', error);
    return NextResponse.json({ error: safeErrorMessage(error, 'Failed to update hospital details.') }, { status: 500 });
  }
}
