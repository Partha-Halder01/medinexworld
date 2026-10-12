import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      facilityType = 'hospital',
      ownerName,
      email,
      password,
      phone,
      address,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Facility name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanType = String(facilityType).toLowerCase() === 'clinic' ? 'clinic' : 'hospital';

    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      // Check if user already owns a hospital
      const existingHospital = await prisma.hospital.findFirst({
        where: { ownerId: user.id },
      });
      if (existingHospital) {
        return NextResponse.json(
          { error: 'An account with this email already manages a facility. Please sign in.' },
          { status: 409 }
        );
      }

      // Upgrade existing user to hospital_owner role
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'hospital_owner',
          password: hashedPassword,
          name: ownerName || user.name || `${name} Admin`,
          phone: phone || user.phone || '0000000000',
        },
      });
    } else {
      // Create new user with hospital_owner role
      user = await prisma.user.create({
        data: {
          name: ownerName || `${name} Admin`,
          email: normalizedEmail,
          password: hashedPassword,
          role: 'hospital_owner',
          phone: phone || '0000000000',
          isEmailVerified: true,
        },
      });
    }

    // Create the Hospital or Clinic facility record
    const hospital = await prisma.hospital.create({
      data: {
        name: name.trim(),
        nameHi: '',
        type: cleanType,
        email: normalizedEmail,
        phone: phone || '',
        address: address || 'Siliguri, West Bengal',
        addressHi: '',
        facilities: ['OPD', 'Pharmacy', 'Consultation'],
        departments: ['General Medicine'],
        photos: [],
        ownerId: user.id,
        isActive: true,
        medicineShop: false,
        medicineDelivery: false,
        serviceSlots: ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM', '07:00 PM'],
        about: `${name} is a verified ${cleanType === 'clinic' ? 'outpatient clinic' : 'hospital'} providing exceptional medical care.`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `${cleanType === 'clinic' ? 'Clinic' : 'Hospital'} registered successfully!`,
        facility: {
          id: hospital.id,
          name: hospital.name,
          type: hospital.type,
          ownerId: user.id,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Hospital registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register facility.' },
      { status: 500 }
    );
  }
}
