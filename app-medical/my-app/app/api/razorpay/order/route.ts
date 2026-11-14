import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import prisma from '@/lib/prisma';

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured.');
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

export async function POST(req: Request) {
  try {
    const { appointmentId, paymentMethod, patientId, paymentOption } = await req.json();

    const apptId = parseInt(appointmentId, 10);
    const pId = parseInt(patientId, 10);
    if (isNaN(apptId) || isNaN(pId)) return NextResponse.json({ error: 'Invalid appointment or patient id.' }, { status: 400 });
    if (paymentMethod && paymentMethod !== 'online' && paymentMethod !== 'cash') return NextResponse.json({ error: 'Invalid payment method.' }, { status: 400 });

    const isFullPayment = paymentOption === 'full';
    const appointment = await prisma.appointment.findUnique({ where: { id: apptId } });
    if (!appointment) return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    if (appointment.patientId !== pId) return NextResponse.json({ error: 'Unauthorized for this appointment.' }, { status: 403 });
    if (appointment.status !== 'Confirmed') return NextResponse.json({ error: 'Payment allowed only for confirmed appointments.' }, { status: 400 });
    if (appointment.paymentStatus === 'paid') return NextResponse.json({ error: 'Appointment is already paid.' }, { status: 409 });

    // Chamber booking
    if (appointment.paymentMethod === 'chamber') {
      if (appointment.bookingFeePaid && !isFullPayment) {
        return NextResponse.json({ error: 'Booking fee is already paid.' }, { status: 409 });
      }
      const bookingFee = Math.max(0, Math.round(Number(appointment.bookingFee) || 0));
      const consultFee = Math.max(0, Math.round(Number(appointment.basePrice || appointment.price) || 0));
      
      const payableAmount = isFullPayment ? (bookingFee + consultFee) : bookingFee;
      if (payableAmount <= 0) {
        return NextResponse.json({ error: 'No online payment required for this booking.' }, { status: 400 });
      }

      const razorpay = getRazorpayClient();
      const order = await razorpay.orders.create({
        amount: Math.round(payableAmount * 100),
        currency: 'INR',
        receipt: String(apptId),
        notes: { 
          appointmentId: String(apptId), 
          patientId: String(pId), 
          purpose: isFullPayment ? 'chamber_full_payment' : 'chamber_booking_fee',
          paymentOption: isFullPayment ? 'full' : 'partial',
        },
      });

      await prisma.appointment.update({
        where: { id: apptId },
        data: { 
          razorpayOrderId: order.id, 
          paidAmount: payableAmount, 
          platformFeeAmount: bookingFee,
          doctorPayoutAmount: isFullPayment ? consultFee : 0,
          paymentOption: isFullPayment ? 'full' : 'partial',
          settlementStatus: isFullPayment ? 'pending' : 'not_applicable',
        },
      });
      return NextResponse.json({ id: order.id, amount: order.amount, currency: order.currency });
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
    const fullPrice = Math.max(0, basePrice + gstAmount + platformFeeAmount - discountAmount);

    const onlinePayableAmount = isFullPayment 
      ? fullPrice 
      : Math.max(0, gstAmount + platformFeeAmount - discountAmount);

    if (onlinePayableAmount <= 0) {
      return NextResponse.json({ error: 'No online payment required for this booking. Please use the cash confirmation flow.' }, { status: 400 });
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(onlinePayableAmount * 100),
      currency: 'INR',
      receipt: String(apptId),
      notes: { 
        appointmentId: String(apptId), 
        patientId: String(pId), 
        purpose: isFullPayment ? 'full_consult_payment' : 'platform_fee',
        paymentOption: isFullPayment ? 'full' : 'partial',
      },
    });

    await prisma.appointment.update({
      where: { id: apptId },
      data: {
        razorpayOrderId: order.id,
        paymentMethod: isFullPayment ? 'online' : 'cash',
        paymentStatus: 'pending',
        price: fullPrice,
        paidAmount: onlinePayableAmount,
        basePrice,
        gstAmount,
        platformFeeAmount,
        platformFeePercent,
        discountAmount,
        paymentOption: isFullPayment ? 'full' : 'partial',
        doctorPayoutAmount: isFullPayment ? basePrice : 0,
        settlementStatus: isFullPayment ? 'pending' : 'not_applicable',
      },
    });

    return NextResponse.json({ id: order.id, amount: order.amount, currency: order.currency });
  } catch (error: any) {
    console.error('Razorpay order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create Razorpay order.' }, { status: 500 });
  }
}