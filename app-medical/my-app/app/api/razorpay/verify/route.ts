import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '@/lib/prisma';
import { normalizePlatformFeePercent, splitAmountByPlatformFee } from '@/lib/platformFee';

const getRazorpayCredentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured.');
  return { keyId, keySecret };
};

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId, patientId } = await req.json();

    const apptId = parseInt(appointmentId, 10);
    const pId = parseInt(patientId, 10);
    if (isNaN(apptId) || isNaN(pId) || typeof razorpay_order_id !== 'string' || typeof razorpay_payment_id !== 'string' || typeof razorpay_signature !== 'string') {
      return NextResponse.json({ error: 'Invalid payment verification payload.' }, { status: 400 });
    }

    const { keyId, keySecret } = getRazorpayCredentials();
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    if (hmac.digest('hex') !== razorpay_signature) return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 });

    const appointment = await prisma.appointment.findUnique({ where: { id: apptId } });
    if (!appointment) return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    if (appointment.patientId !== pId) return NextResponse.json({ error: 'Unauthorized for this appointment.' }, { status: 403 });
    if (appointment.status !== 'Confirmed') return NextResponse.json({ error: 'Only confirmed appointments can be paid.' }, { status: 400 });

    if (appointment.razorpayPaymentId === razorpay_payment_id && appointment.razorpayOrderId === razorpay_order_id) {
      return NextResponse.json({ success: true, idempotent: true });
    }
    if (appointment.razorpayPaymentId && appointment.razorpayPaymentId !== razorpay_payment_id) {
      return NextResponse.json({ error: 'Appointment payment already finalized.' }, { status: 409 });
    }
    if (!appointment.razorpayOrderId || appointment.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json({ error: 'Order mismatch for appointment.' }, { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const expectedAmountPaise = Math.round(Math.max(0, Number(appointment.paidAmount || appointment.price || 0)) * 100);
    if (payment.order_id !== razorpay_order_id) return NextResponse.json({ error: 'Payment does not belong to this order.' }, { status: 400 });
    if (payment.currency !== 'INR') return NextResponse.json({ error: 'Invalid payment currency.' }, { status: 400 });
    if (Number(payment.amount) !== expectedAmountPaise) return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 400 });
    if (payment.status !== 'captured' && payment.status !== 'authorized') return NextResponse.json({ error: 'Payment not successful.' }, { status: 400 });

    if (appointment.paymentMethod === 'chamber') {
      // Booking fee is platform revenue; the consultation fee stays pending until it is paid at the chamber.
      await prisma.appointment.update({
        where: { id: apptId },
        data: { bookingFeePaid: true, razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature },
      });
      return NextResponse.json({ success: true });
    }

    const isCashSettlement = appointment.paymentMethod === 'cash';
    await prisma.appointment.update({
      where: { id: apptId },
      data: {
        paymentStatus: isCashSettlement ? 'pending' : 'paid',
        bookingFeePaid: true,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    });

    if (!isCashSettlement) {
      const percent = normalizePlatformFeePercent(appointment.platformFeePercent);
      const split = splitAmountByPlatformFee(appointment.price || 0, percent);
      const platformFeeAmount = Number(appointment.platformFeeAmount);
      const netAmount = Math.max(0, (appointment.price || 0) - (Number.isFinite(platformFeeAmount) ? platformFeeAmount : split.platformFeeAmount));

      const existingCredit = await prisma.transaction.findFirst({
        where: { appointmentId: apptId, paymentMethod: 'online', type: 'credit' },
      });

      if (!existingCredit) {
        if (appointment.doctorId) {
          await prisma.doctor.update({ where: { id: appointment.doctorId }, data: { walletBalance: { increment: netAmount } } });
          await prisma.transaction.create({
            data: { doctorId: appointment.doctorId, ownerType: 'Doctor', appointmentId: apptId, amount: netAmount, type: 'credit', paymentMethod: 'online', description: `Payment for ${appointment.serviceName || 'Consultation'}` },
          });
        } else if (appointment.hospitalId) {
          const hospital = await prisma.hospital.findUnique({ where: { id: appointment.hospitalId }, select: { ownerId: true } });
          if (hospital?.ownerId) {
            await prisma.user.update({ where: { id: hospital.ownerId }, data: { walletBalance: { increment: netAmount } } });
            await prisma.transaction.create({
              data: { userId: hospital.ownerId, ownerType: 'User', appointmentId: apptId, amount: netAmount, type: 'credit', paymentMethod: 'online', description: `Payment for ${appointment.serviceName || 'Hospital Service'}` },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed.' }, { status: 500 });
  }
}