import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { patientId } = await req.json().catch(() => ({}));

    const numId = parseInt(id, 10);
    const pId = parseInt(patientId, 10);
    if (isNaN(numId) || isNaN(pId)) return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });

    const appointment = await prisma.appointment.findUnique({ where: { id: numId } });
    if (!appointment) return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    if (appointment.patientId !== pId) return NextResponse.json({ error: 'Unauthorized for this appointment.' }, { status: 403 });
    if (appointment.status !== 'Confirmed') return NextResponse.json({ error: 'Only confirmed appointments can be updated.' }, { status: 400 });
    if (appointment.paymentStatus === 'paid') return NextResponse.json({ error: 'Appointment is already paid.' }, { status: 409 });

    // Chamber bookings only skip online payment when the platform booking fee is ₹0.
    if (appointment.paymentMethod === 'chamber') {
      if (appointment.bookingFee > 0 && !appointment.bookingFeePaid) {
        return NextResponse.json({ error: 'Please pay the booking fee online to confirm this chamber booking.' }, { status: 402 });
      }
      await prisma.appointment.update({ where: { id: numId }, data: { bookingFeePaid: true } });
      return NextResponse.json({ success: true });
    }

    let settings = await prisma.platformSettings.findFirst();
    if (!settings) settings = await prisma.platformSettings.create({ data: {} });

    const basePrice = Math.max(0, Number(appointment.basePrice || appointment.price || 0));
    const gstPercent = Math.max(0, Number(settings.gstPercent) || 0);
    const discountAmount = Math.max(0, Number(settings.discountAmount) || 0);
    const defaultPlatformPercent = Math.max(0, Number(settings.defaultPlatformFeePercent) || 0);
    const platformFeePercent = Math.max(0, Number(appointment.platformFeePercent) || defaultPlatformPercent);

    const gstAmount = Math.round((basePrice * gstPercent) / 100);
    const platformFeeAmount = Math.round((basePrice * platformFeePercent) / 100);
    const finalAmount = Math.max(0, basePrice + gstAmount + platformFeeAmount - discountAmount);

    await prisma.appointment.update({
      where: { id: numId },
      data: { paymentStatus: 'pending', paymentMethod: 'cash', price: finalAmount, paidAmount: 0, basePrice, gstAmount, platformFeeAmount, platformFeePercent, discountAmount },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process cash payment.' }, { status: 500 });
  }
}