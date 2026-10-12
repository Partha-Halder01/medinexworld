import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizePlatformFeePercent, splitAmountByPlatformFee } from '@/lib/platformFee';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid Hospital ID' }, { status: 400 });

    const hospital = await prisma.hospital.findUnique({ where: { id } });
    if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });

    const doctors = await prisma.doctor.findMany({ where: { hospitalId: id }, select: { id: true } });
    const doctorIds = doctors.map(d => d.id);

    const appointments = await prisma.appointment.findMany({
      where: { OR: [{ doctorId: { in: doctorIds } }, { hospitalId: id }] },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        doctor: { select: { id: true, name: true, specialty: true, platformFeePercent: true, fee: true, videoFee: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const hospitalDefaultPercent = normalizePlatformFeePercent(hospital.platformFeePercent);
    const appointmentsWithSplit = appointments.map((a: any) => {
      const defaultPercent = normalizePlatformFeePercent(a.doctor?.platformFeePercent ?? hospitalDefaultPercent);
      const hasStoredPercent = a.platformFeePercent != null;
      const inferredPercent = hasStoredPercent ? normalizePlatformFeePercent(a.platformFeePercent) : defaultPercent;
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
    const totalPaidOut = hospital.totalPaidOut || 0;

    const stats = {
      totalAppointments: appointments.length, onlineEarnings, cashEarnings,
      onlinePlatformCommission, cashPlatformCommission,
      platformCommission: onlinePlatformCommission + cashPlatformCommission,
      totalEarnings: onlineEarnings + cashEarnings, totalPaidOut,
      remainingBalance: onlineEarnings - totalPaidOut,
      paymentLogs: (hospital.paymentLogs as any[]) || [],
      appointments: appointmentsWithSplit,
    };

    return NextResponse.json({ hospital: { ...hospital, _id: hospital.id }, appointments: appointmentsWithSplit, stats });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid Hospital ID' }, { status: 400 });

    const body = await req.json();

    if (body.action === 'pay') {
      const amount = Number(body.amount);
      if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });

      const hospital = await prisma.hospital.findUnique({ where: { id } });
      if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });

      const doctors = await prisma.doctor.findMany({ where: { hospitalId: id }, select: { id: true } });
      const doctorIds = doctors.map(d => d.id);
      const appointments = await prisma.appointment.findMany({
        where: { OR: [{ doctorId: { in: doctorIds } }, { hospitalId: id }] },
        include: { doctor: { select: { platformFeePercent: true, fee: true, videoFee: true } } },
      });

      const hospitalDefaultPercent = normalizePlatformFeePercent(hospital.platformFeePercent);
      const onlineEarnings = appointments.reduce((acc: number, a: any) => {
        if (!(a.paymentMethod === 'online' && a.paymentStatus === 'paid')) return acc;
        const defaultPercent = normalizePlatformFeePercent(a.doctor?.platformFeePercent ?? hospitalDefaultPercent);
        const percent = a.platformFeePercent != null ? normalizePlatformFeePercent(a.platformFeePercent) : defaultPercent;
        const split = splitAmountByPlatformFee(a.price || 0, percent);
        const platformFeeAmount = Number(a.platformFeeAmount);
        const netAmount = Math.max(0, (Number(a.price) || split.grossAmount) - (Number.isFinite(platformFeeAmount) ? platformFeeAmount : split.platformFeeAmount));
        return acc + netAmount;
      }, 0);

      const currentPaidOut = hospital.totalPaidOut || 0;
      const remaining = onlineEarnings - currentPaidOut;
      if (amount > remaining) return NextResponse.json({ error: `Amount exceeds remaining balance of Rs.${remaining}` }, { status: 400 });

      const paymentLog = { amount, date: new Date().toISOString(), note: body.note || 'Admin payment' };
      const newTotalPaidOut = currentPaidOut + amount;
      const existingLogs = (hospital.paymentLogs as any[]) || [];

      await prisma.hospital.update({ where: { id }, data: { totalPaidOut: newTotalPaidOut, paymentLogs: [...existingLogs, paymentLog] } });

      return NextResponse.json({ message: 'Payment recorded successfully', totalPaidOut: newTotalPaidOut, remainingBalance: onlineEarnings - newTotalPaidOut, paymentLog });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}