import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [doctors, patientCount, appointments, pendingEnquiriesCount, urgentAmbulanceCount] = await Promise.all([
      prisma.doctor.findMany({ select: { id: true, name: true, specialty: true, image: true, fee: true, videoFee: true, isOnlineNow: true, rating: true, isVerified: true } }),
      prisma.user.count({ where: { role: 'patient' } }),
      prisma.appointment.findMany({
        include: {
          doctor: { select: { id: true, name: true, specialty: true, image: true, fee: true, videoFee: true, isOnlineNow: true } },
          patient: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.enquiry.count({ where: { status: 'pending' } }),
      prisma.enquiry.count({ where: { type: 'ambulance', urgency: 'emergency', status: 'pending' } }),
    ]);

    const confirmed = appointments.filter(a => a.status === 'Confirmed').length;
    const completed = appointments.filter(a => a.status === 'Completed').length;
    const cancelled = appointments.filter(a => a.status === 'Cancelled').length;

    const revenue = appointments
      .filter(a => a.status === 'Completed')
      .reduce((sum, a) => {
        const doc = a.doctor as any;
        const fee = a.type === 'video' ? (doc?.videoFee || 0) : (doc?.fee || 0);
        return sum + fee;
      }, 0);

    return NextResponse.json({
      doctors: doctors.map(d => ({ ...d, _id: d.id })),
      patientCount,
      appointments: appointments.map(a => ({ ...a, _id: a.id })),
      stats: { confirmed, completed, cancelled, revenue, pendingEnquiries: pendingEnquiriesCount, urgentAmbulances: urgentAmbulanceCount },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch stats.' }, { status: 500 });
  }
}