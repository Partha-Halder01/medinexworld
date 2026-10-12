import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        hospital: {
          select: { id: true, name: true, email: true, phone: true, address: true },
        },
        chambers: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = doctors.map((d: any) => {
      const doc = { ...d, _id: d.id };
      delete doc.password;
      delete doc.authOtpHash;
      doc.hospitalId = d.hospital ? { ...d.hospital, _id: d.hospital.id } : null;
      return doc;
    });

    return NextResponse.json(mapped);
  } catch (error: unknown) {
    console.error('Admin get doctors error:', error);
    return NextResponse.json({ error: 'Failed to fetch doctors.' }, { status: 500 });
  }
}
