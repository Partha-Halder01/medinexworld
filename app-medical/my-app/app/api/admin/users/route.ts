import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Cleanup: mark all unverified users not in pending_registrations as verified
    const pendingEmails = (await prisma.pendingRegistration.findMany({ select: { email: true } })).map(p => p.email);
    await prisma.user.updateMany({
      where: { role: 'patient', isEmailVerified: false, email: { notIn: pendingEmails } },
      data: { isEmailVerified: true, authOtpHash: null, authOtpPurpose: null, authOtpExpires: null },
    });

    const users = await prisma.user.findMany({
      where: { role: 'patient' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, phone: true, role: true, isEmailVerified: true, walletBalance: true, createdAt: true, locationLat: true, locationLng: true },
    });

    const userIds = users.map(u => u.id);
    const appointments = await prisma.appointment.findMany({
      where: { patientId: { in: userIds } },
      select: {
        patientId: true,
        status: true,
        type: true,
        createdAt: true,
        doctorId: true,
        doctor: { select: { fee: true, videoFee: true } },
      },
    });

    type UserStats = { totalBookings: number; confirmedBookings: number; completedBookings: number; cancelledBookings: number; totalSpent: number; lastBookingAt: Date | null };
    const statsMap = new Map<number, UserStats>();

    for (const apt of appointments as any[]) {
      const pid = apt.patientId;
      const current = statsMap.get(pid) || { totalBookings: 0, confirmedBookings: 0, completedBookings: 0, cancelledBookings: 0, totalSpent: 0, lastBookingAt: null };
      current.totalBookings += 1;
      if (apt.status === 'Confirmed') current.confirmedBookings += 1;
      if (apt.status === 'Completed') {
        current.completedBookings += 1;
        const fee = apt.type === 'video' ? (apt.doctor?.videoFee || 0) : (apt.doctor?.fee || 0);
        current.totalSpent += fee;
      }
      if (apt.status === 'Cancelled') current.cancelledBookings += 1;
      if (apt.createdAt) {
        if (!current.lastBookingAt || new Date(apt.createdAt) > current.lastBookingAt) current.lastBookingAt = new Date(apt.createdAt);
      }
      statsMap.set(pid, current);
    }

    const payload = users.map(u => ({
      ...u, _id: u.id,
      location: u.locationLat != null ? { lat: u.locationLat, lng: u.locationLng } : null,
      stats: statsMap.get(u.id) || { totalBookings: 0, confirmedBookings: 0, completedBookings: 0, cancelledBookings: 0, totalSpent: 0, lastBookingAt: null },
    }));

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch users.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, name, email } = await req.json();
    if (!userId) return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    const numId = parseInt(userId, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'Invalid user ID.' }, { status: 400 });

    const updatedUser = await prisma.user.update({
      where: { id: numId },
      data: { name, email: email?.toLowerCase() },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    return NextResponse.json({ ...updatedUser, _id: updatedUser.id });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}