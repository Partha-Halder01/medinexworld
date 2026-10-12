import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizePlatformFeePercent, splitAmountByPlatformFee } from '@/lib/platformFee';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const numId = parseInt(rawId, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'Invalid Doctor ID' }, { status: 400 });

    const doctor = await prisma.doctor.findUnique({ where: { id: numId } });
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: numId },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({
      totalEarnings: onlineEarnings + cashEarnings, onlineEarnings, cashEarnings,
      totalPlatformCommission: onlinePlatformCommission + cashPlatformCommission,
      onlinePlatformCommission, cashPlatformCommission,
      totalPaidOut, remainingBalance: onlineEarnings - totalPaidOut,
      paymentLogs: (doctor.paymentLogs as any[]) || [],
      appointments: appointmentsWithSplit,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}