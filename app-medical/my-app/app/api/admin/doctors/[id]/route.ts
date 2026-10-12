import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizePlatformFeePercent, splitAmountByPlatformFee } from '@/lib/platformFee';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid Doctor ID' }, { status: 400 });

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    const { password, authOtpHash, ...doctorData } = doctor;

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: id },
      include: { patient: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const defaultPlatformFeePercent = normalizePlatformFeePercent(doctor.platformFeePercent);
    const appointmentsWithSplit = appointments.map((a: any) => {
      const hasStoredPercent = a.platformFeePercent != null;
      const currentBaseFee = Number(a.type === 'video' ? (doctor.videoFee ?? doctor.fee) : doctor.fee) || 0;
      const inferredPercent = hasStoredPercent ? normalizePlatformFeePercent(a.platformFeePercent)
        : defaultPlatformFeePercent > 0 && Number(a.price || 0) > currentBaseFee ? defaultPlatformFeePercent : 0;
      const split = splitAmountByPlatformFee(a.price || 0, inferredPercent);
      const platformFeeAmount = Number(a.platformFeeAmount);
      return {
        ...a, _id: a.id,
        platformFeePercent: inferredPercent,
        platformFeeAmount: Number.isFinite(platformFeeAmount) ? platformFeeAmount : split.platformFeeAmount,
        netAmount: split.netAmount,
      };
    });

    const onlineEarnings = appointmentsWithSplit.reduce((acc: number, a: any) => a.paymentMethod === 'online' && a.paymentStatus === 'paid' ? acc + (a.netAmount || 0) : acc, 0);
    const cashEarnings = appointmentsWithSplit.reduce((acc: number, a: any) => a.paymentMethod === 'cash' && a.status === 'Completed' ? acc + (a.netAmount || 0) : acc, 0);
    const onlinePlatformCommission = appointmentsWithSplit.reduce((acc: number, a: any) => a.paymentMethod === 'online' && a.paymentStatus === 'paid' ? acc + (a.platformFeeAmount || 0) : acc, 0);
    const cashPlatformCommission = appointmentsWithSplit.reduce((acc: number, a: any) => a.paymentMethod === 'cash' && a.status === 'Completed' ? acc + (a.platformFeeAmount || 0) : acc, 0);
    const totalPaidOut = doctor.totalPaidOut || 0;

    const stats = {
      totalAppointments: appointments.length,
      completed: appointments.filter(a => a.status === 'Completed').length,
      confirmed: appointments.filter(a => a.status === 'Confirmed').length,
      cancelled: appointments.filter(a => a.status === 'Cancelled').length,
      revenue: appointments.reduce((acc, a) => a.status === 'Completed' ? acc + (a.price || 0) : acc, 0),
      totalEarnings: onlineEarnings + cashEarnings, onlineEarnings, cashEarnings,
      onlinePlatformCommission, cashPlatformCommission,
      platformCommission: onlinePlatformCommission + cashPlatformCommission,
      totalPaidOut, remainingBalance: onlineEarnings - totalPaidOut,
      paymentLogs: (doctor.paymentLogs as any[]) || [],
    };

    return NextResponse.json({ doctor: { ...doctorData, _id: doctorData.id }, appointments: appointmentsWithSplit, stats });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid Doctor ID' }, { status: 400 });

    const body = await req.json();

    if (body.action === 'pay') {
      const amount = Number(body.amount);
      if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });

      const doctor = await prisma.doctor.findUnique({ where: { id } });
      if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

      const defaultPlatformFeePercent = normalizePlatformFeePercent(doctor.platformFeePercent);
      const appointments = await prisma.appointment.findMany({ where: { doctorId: id } });
      const onlineEarnings = appointments.reduce((acc: number, a: any) => {
        if (!(a.paymentMethod === 'online' && a.paymentStatus === 'paid')) return acc;
        const hasStoredPercent = a.platformFeePercent != null;
        const currentBaseFee = Number(a.type === 'video' ? (doctor.videoFee ?? doctor.fee) : doctor.fee) || 0;
        const percent = hasStoredPercent ? normalizePlatformFeePercent(a.platformFeePercent)
          : defaultPlatformFeePercent > 0 && Number(a.price || 0) > currentBaseFee ? defaultPlatformFeePercent : 0;
        const split = splitAmountByPlatformFee(a.price || 0, percent);
        const platformFeeAmount = Number(a.platformFeeAmount);
        const netAmount = Math.max(0, (Number(a.price) || split.grossAmount) - (Number.isFinite(platformFeeAmount) ? platformFeeAmount : split.platformFeeAmount));
        return acc + netAmount;
      }, 0);

      const currentPaidOut = doctor.totalPaidOut || 0;
      const remaining = onlineEarnings - currentPaidOut;
      if (amount > remaining) return NextResponse.json({ error: `Amount exceeds remaining balance of Rs.${remaining}` }, { status: 400 });

      const paymentLog = { amount, date: new Date().toISOString(), note: body.note || 'Admin payment' };
      const newTotalPaidOut = currentPaidOut + amount;
      const existingLogs = (doctor.paymentLogs as any[]) || [];

      await prisma.doctor.update({
        where: { id },
        data: { totalPaidOut: newTotalPaidOut, paymentLogs: [...existingLogs, paymentLog] },
      });

      return NextResponse.json({ message: 'Payment recorded successfully', totalPaidOut: newTotalPaidOut, remainingBalance: onlineEarnings - newTotalPaidOut, paymentLog });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid Doctor ID format' }, { status: 400 });

    const doctor = await prisma.doctor.delete({ where: { id } });
    return NextResponse.json({ message: 'Doctor deleted successfully', deletedEmail: doctor.email });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete doctor.', details: error.message }, { status: 500 });
  }
}