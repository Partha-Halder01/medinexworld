import prisma from '@/lib/prisma';
import { PENDING_SLOT_HOLD_MINUTES, checkInWindow, haversineKm, isValidLatLng, serializeChamber } from '@/lib/chamber';

export const DEFAULT_CHAMBER_BOOKING_FEE = 50;

// Appointments still waiting for their online payment are hidden from normal listings.
export const PAID_OR_OFFLINE_FILTER = [
  { OR: [{ paymentMethod: { not: 'online' } }, { paymentStatus: 'paid' }] },
  { OR: [{ paymentMethod: { not: 'chamber' } }, { bookingFeePaid: true }] },
];

/** Slots already taken at a chamber on a date (paid, or unpaid but still inside the payment hold window). */
export async function getTakenChamberSlots(chamberId: number, visitDate: string, excludeAppointmentId?: number) {
  const holdSince = new Date(Date.now() - PENDING_SLOT_HOLD_MINUTES * 60_000);
  const rows = await prisma.appointment.findMany({
    where: {
      chamberId,
      visitDate,
      status: { not: 'Cancelled' },
      OR: [{ bookingFeePaid: true }, { createdAt: { gte: holdSince } }],
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { slot: true },
  });
  return new Set(rows.map(r => r.slot));
}

/**
 * Keeps the doctor's listed fee (shown on search cards) equal to the lowest fee among their active chambers.
 * Doctors without chambers keep whatever fee they already had.
 */
export async function syncDoctorFeeFromChambers(doctorId: number) {
  const cheapest = await prisma.doctorChamber.findFirst({
    where: { doctorId, isActive: true },
    orderBy: { fee: 'asc' },
    select: { fee: true },
  });
  if (cheapest) await prisma.doctor.update({ where: { id: doctorId }, data: { fee: cheapest.fee } });
}

export async function getChamberBookingFee(): Promise<number> {
  const settings = await prisma.platformSettings.findFirst({ select: { chamberBookingFee: true } });
  const fee = Number(settings?.chamberBookingFee ?? DEFAULT_CHAMBER_BOOKING_FEE);
  return Number.isFinite(fee) && fee >= 0 ? Math.round(fee) : DEFAULT_CHAMBER_BOOKING_FEE;
}

type ChamberRow = NonNullable<Awaited<ReturnType<typeof prisma.doctorChamber.findUnique>>>;

/**
 * Marks a doctor IN / OUT at a chamber. Used by the doctor's own panel (with optional GPS)
 * and by a hospital's front desk. Returns { error } when check-in isn't allowed right now.
 */
export async function setChamberPresence(chamber: ChamberRow, action: unknown, gps?: { lat?: unknown; lng?: unknown }) {
  const now = new Date();
  if (action === 'out') {
    const updated = await prisma.doctorChamber.update({ where: { id: chamber.id }, data: { checkedOutAt: now } });
    return { chamber: { ...serializeChamber(updated), distanceFromChamberKm: null as number | null } };
  }
  if (action !== 'in') return { error: 'action must be "in" or "out".' };

  const window = checkInWindow(chamber);
  if (!window.allowed) return { error: window.reason || 'Check-in is not open right now.' };

  const hasGps = isValidLatLng(gps?.lat, gps?.lng);
  const data: Record<string, unknown> = {
    checkedInAt: now,
    checkedOutAt: null,
    checkInLat: hasGps ? Number(gps!.lat) : null,
    checkInLng: hasGps ? Number(gps!.lng) : null,
  };
  // First GPS check-in pins the chamber on the map if it has no location yet (not for facility chambers,
  // whose location always comes from the hospital profile).
  if (hasGps && !chamber.hospitalId && !isValidLatLng(chamber.locationLat, chamber.locationLng)) {
    data.locationLat = Number(gps!.lat);
    data.locationLng = Number(gps!.lng);
  }

  // A doctor can only be inside one chamber at a time.
  const [, updated] = await prisma.$transaction([
    prisma.doctorChamber.updateMany({
      where: { doctorId: chamber.doctorId, id: { not: chamber.id }, checkedInAt: { not: null } },
      data: { checkedOutAt: now },
    }),
    prisma.doctorChamber.update({ where: { id: chamber.id }, data }),
  ]);

  let distanceFromChamberKm: number | null = null;
  if (hasGps && isValidLatLng(chamber.locationLat, chamber.locationLng)) {
    distanceFromChamberKm =
      Math.round(haversineKm(Number(gps!.lat), Number(gps!.lng), chamber.locationLat as number, chamber.locationLng as number) * 100) / 100;
  }
  return { chamber: { ...serializeChamber(updated), distanceFromChamberKm } };
}
