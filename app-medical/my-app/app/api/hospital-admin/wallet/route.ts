import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizePlatformFeePercent, splitAmountByPlatformFee } from '@/lib/platformFee';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerIdParam = searchParams.get('ownerId');

    if (!ownerIdParam) {
      return NextResponse.json({ error: 'Owner ID is required.' }, { status: 400 });
    }

    const ownerId = parseInt(ownerIdParam, 10);
    if (isNaN(ownerId)) {
      return NextResponse.json({ error: 'Invalid Owner ID.' }, { status: 400 });
    }

    const hospital = await prisma.hospital.findFirst({ where: { ownerId } });
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found.' }, { status: 404 });
    }

    const doctors = await prisma.doctor.findMany({
      where: { hospitalId: hospital.id },
      select: { id: true, name: true, specialty: true, platformFeePercent: true, fee: true, videoFee: true },
    });
    const doctorIds = doctors.map((d) => d.id);

    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { doctorId: { in: doctorIds } },
          { hospitalId: hospital.id },
        ],
      },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true, specialty: true, platformFeePercent: true, fee: true, videoFee: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const hospitalDefaultPercent = normalizePlatformFeePercent(hospital.platformFeePercent);
    const appointmentsWithSplit = appointments.map((a) => {
      const defaultPercent = normalizePlatformFeePercent(a.doctor?.platformFeePercent ?? hospitalDefaultPercent);
      const hasStoredPercent = a.platformFeePercent !== undefined && a.platformFeePercent !== null;
      const hasStoredBase = Number(a.basePrice || 0) > 0;
      const currentDoctorBase = Number(
        a.type === 'video' ? (a.doctor?.videoFee ?? a.doctor?.fee ?? 0) : (a.doctor?.fee ?? 0)
      );
      const inferredPercent = hasStoredPercent
        ? normalizePlatformFeePercent(a.platformFeePercent)
        : hasStoredBase && Number(a.price || 0) > Number(a.basePrice || 0)
          ? defaultPercent
          : defaultPercent > 0 && currentDoctorBase > 0 && Number(a.price || 0) > currentDoctorBase
            ? defaultPercent
            : 0;
      const split = splitAmountByPlatformFee(a.price || 0, inferredPercent);
      const platformFeeAmount = Number(a.platformFeeAmount);

      return {
        ...a,
        _id: a.id,
        patientId: a.patient ? { ...a.patient, _id: a.patient.id } : null,
        doctorId: a.doctor ? { ...a.doctor, _id: a.doctor.id } : null,
        platformFeePercent: inferredPercent,
        platformFeeAmount: Number.isFinite(platformFeeAmount) ? platformFeeAmount : split.platformFeeAmount,
        netAmount: split.netAmount,
      };
    });

    const onlineEarnings = appointmentsWithSplit.reduce((acc, a) => {
      return (a.paymentMethod || '').toLowerCase() === 'online' && a.paymentStatus === 'paid'
        ? acc + (a.netAmount || 0)
        : acc;
    }, 0);

    const cashEarnings = appointmentsWithSplit.reduce((acc, a) => {
      return (a.paymentMethod || 'cash').toLowerCase() === 'cash' && a.status === 'Completed'
        ? acc + (a.netAmount || 0)
        : acc;
    }, 0);

    const onlinePlatformCommission = appointmentsWithSplit.reduce((acc, a) => {
      return (a.paymentMethod || '').toLowerCase() === 'online' && a.paymentStatus === 'paid'
        ? acc + (a.platformFeeAmount || 0)
        : acc;
    }, 0);

    const cashPlatformCommission = appointmentsWithSplit.reduce((acc, a) => {
      return (a.paymentMethod || 'cash').toLowerCase() === 'cash' && a.status === 'Completed'
        ? acc + (a.platformFeeAmount || 0)
        : acc;
    }, 0);

    const totalPaidOut = hospital.totalPaidOut || 0;

    return NextResponse.json({
      hospitalId: hospital.id,
      totalEarnings: onlineEarnings + cashEarnings,
      onlineEarnings,
      cashEarnings,
      totalPlatformCommission: onlinePlatformCommission + cashPlatformCommission,
      onlinePlatformCommission,
      cashPlatformCommission,
      totalPaidOut,
      remainingBalance: Math.max(0, onlineEarnings - totalPaidOut),
      paymentLogs: (hospital.paymentLogs as any[]) || [],
      appointments: appointmentsWithSplit,
    });
  } catch (error: any) {
    console.error('Hospital wallet fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
