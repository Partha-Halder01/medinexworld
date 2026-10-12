import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/enquiries - Fetch all enquiries with filters and stats
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all'; // 'all' | 'test_report' | 'ambulance'
    const status = searchParams.get('status') || 'all'; // 'all' | 'pending' | 'in_progress' | 'contacted' | 'resolved' | 'cancelled'
    const search = searchParams.get('search')?.trim() || '';

    const where: any = {};

    if (type !== 'all') {
      where.type = type;
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { patientName: { contains: search } },
        { patientPhone: { contains: search } },
        { patientEmail: { contains: search } },
        { city: { contains: search } },
        { testName: { contains: search } },
        { pickupAddress: { contains: search } },
        { dropAddress: { contains: search } },
      ];
    }

    const [enquiries, totalCount, pendingCount, ambulanceCount, urgentAmbulanceCount] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        orderBy: [
          // Emergency ambulances that are pending come first
          { createdAt: 'desc' }
        ],
      }),
      prisma.enquiry.count(),
      prisma.enquiry.count({ where: { status: 'pending' } }),
      prisma.enquiry.count({ where: { type: 'ambulance' } }),
      prisma.enquiry.count({ where: { type: 'ambulance', urgency: 'emergency', status: 'pending' } }),
    ]);

    return NextResponse.json({
      enquiries,
      stats: {
        total: totalCount,
        pending: pendingCount,
        ambulanceTotal: ambulanceCount,
        urgentAmbulance: urgentAmbulanceCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin enquiries:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch enquiries.' }, { status: 500 });
  }
}
