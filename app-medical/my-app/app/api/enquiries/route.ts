import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/enquiries - Public/User creation of Test Report or Ambulance Enquiry
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      type, // 'test_report' | 'ambulance'
      patientName,
      patientPhone,
      patientEmail,
      city,
      // Test Report fields
      testName,
      reportText,
      fileData,
      fileType,
      preferredDate,
      // Ambulance fields
      ambulanceType,
      pickupAddress,
      pickupLat,
      pickupLng,
      dropAddress,
      urgency,
      scheduledTime,
      patientCondition,
    } = body;

    if (!type || (type !== 'test_report' && type !== 'ambulance')) {
      return NextResponse.json({ error: 'Valid inquiry type (test_report or ambulance) is required.' }, { status: 400 });
    }

    if (!patientName || !patientName.trim()) {
      return NextResponse.json({ error: 'Patient name is required.' }, { status: 400 });
    }

    if (!patientPhone || !patientPhone.trim()) {
      return NextResponse.json({ error: 'Patient contact phone is required.' }, { status: 400 });
    }

    // Additional validations per type
    if (type === 'ambulance' && !pickupAddress?.trim()) {
      return NextResponse.json({ error: 'Pickup location/address is required for ambulance service.' }, { status: 400 });
    }

    if (type === 'test_report' && !testName?.trim() && !reportText?.trim() && !fileData) {
      return NextResponse.json({ error: 'Please provide test name, description, or attach a report document/photo.' }, { status: 400 });
    }

    let parsedUserId: number | null = null;
    if (userId) {
      const parsed = typeof userId === 'number' ? userId : parseInt(userId, 10);
      if (!isNaN(parsed) && parsed > 0) {
        parsedUserId = parsed;
      }
    }

    // Auto-link guest enquiry to user account if phone or email matches an existing user
    if (!parsedUserId) {
      const cleanPhone = patientPhone.trim().replace(/[^0-9]/g, '');
      const userMatch = await prisma.user.findFirst({
        where: {
          OR: [
            ...(cleanPhone.length >= 8 ? [{ phone: { contains: cleanPhone.slice(-10) } }] : []),
            ...(patientEmail?.trim() ? [{ email: patientEmail.trim().toLowerCase() }] : []),
          ],
        },
      });
      if (userMatch) {
        parsedUserId = userMatch.id;
      }
    }

    const newEnquiry = await prisma.enquiry.create({
      data: {
        userId: parsedUserId,
        type,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail?.trim() || null,
        city: city?.trim() || null,
        // Test Report fields
        testName: testName?.trim() || null,
        reportText: reportText?.trim() || null,
        fileData: fileData || null,
        fileType: fileType || null,
        preferredDate: preferredDate || null,
        // Ambulance fields
        ambulanceType: ambulanceType || (type === 'ambulance' ? 'Basic Life Support (BLS)' : null),
        pickupAddress: pickupAddress?.trim() || null,
        pickupLat: typeof pickupLat === 'number' ? pickupLat : null,
        pickupLng: typeof pickupLng === 'number' ? pickupLng : null,
        dropAddress: dropAddress?.trim() || null,
        urgency: urgency || 'emergency',
        scheduledTime: scheduledTime || null,
        patientCondition: patientCondition?.trim() || null,
        status: 'pending',
      },
    });

    return NextResponse.json(newEnquiry, { status: 201 });
  } catch (error: any) {
    console.error('Error creating enquiry:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit enquiry.' }, { status: 500 });
  }
}

// GET /api/enquiries?userId=... OR ?phone=... OR ?id=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get('userId');
    const phoneParam = searchParams.get('phone');
    const idParam = searchParams.get('id');

    if (!userIdParam && !phoneParam && !idParam) {
      return NextResponse.json({ error: 'User ID, Phone number, or Enquiry ID is required.' }, { status: 400 });
    }

    // 1. Query by Logged-in User ID
    if (userIdParam) {
      const userId = parseInt(userIdParam, 10);
      if (isNaN(userId)) {
        return NextResponse.json({ error: 'Invalid User ID.' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const cleanUserPhone = user?.phone ? user.phone.replace(/[^0-9]/g, '') : '';
      const userEmail = user?.email ? user.email.toLowerCase() : '';

      const all = await prisma.enquiry.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const userEnquiries = all.filter(e => {
        if (e.userId === userId) return true;
        if (cleanUserPhone && cleanUserPhone.length >= 8) {
          const eClean = (e.patientPhone || '').replace(/[^0-9]/g, '');
          if (eClean.length >= 8 && (eClean.endsWith(cleanUserPhone.slice(-8)) || cleanUserPhone.endsWith(eClean.slice(-8)))) {
            return true;
          }
        }
        if (userEmail && e.patientEmail && e.patientEmail.toLowerCase() === userEmail) {
          return true;
        }
        return false;
      });

      // Auto-update unlinked enquiries to this user
      const unlinkedIds = userEnquiries.filter(e => e.userId === null).map(e => e.id);
      if (unlinkedIds.length > 0) {
        try {
          await prisma.enquiry.updateMany({
            where: { id: { in: unlinkedIds } },
            data: { userId },
          });
        } catch { }
      }

      return NextResponse.json(userEnquiries);
    }

    // 2. Query by Phone Number (Public tracking)
    if (phoneParam) {
      const cleanPhone = phoneParam.trim().replace(/[^0-9]/g, '');
      if (cleanPhone.length < 5) {
        return NextResponse.json({ error: 'Please provide at least 5 digits of your phone number.' }, { status: 400 });
      }

      const all = await prisma.enquiry.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const matched = all.filter(e => {
        const eClean = (e.patientPhone || '').replace(/[^0-9]/g, '');
        if (!eClean) return false;
        return eClean.includes(cleanPhone) || cleanPhone.includes(eClean) || (cleanPhone.length >= 8 && eClean.slice(-8) === cleanPhone.slice(-8));
      });

      return NextResponse.json(matched);
    }

    // 3. Query by Enquiry ID
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid Enquiry ID.' }, { status: 400 });
      }

      const enquiry = await prisma.enquiry.findUnique({ where: { id } });
      return NextResponse.json(enquiry ? [enquiry] : []);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error('Error fetching user enquiries:', error);
    return NextResponse.json({ error: error.message || 'Failed to load enquiries.' }, { status: 500 });
  }
}
