import prisma from '@/lib/prisma';
import { istNow, serializeChamber } from '@/lib/chamber';

export const FACILITY_KINDS = ['hospital', 'nursing_home', 'clinic'] as const;
export type FacilityKind = (typeof FACILITY_KINDS)[number];

export function normalizeFacilityKind(value: unknown): FacilityKind {
  return (FACILITY_KINDS as readonly string[]).includes(value as string) ? (value as FacilityKind) : 'hospital';
}

export function facilityLabel(kind: unknown): string {
  return FACILITY_KIND_LABELS[normalizeFacilityKind(kind)];
}

export const FACILITY_KIND_LABELS: Record<FacilityKind, string> = { hospital: 'Hospital', nursing_home: 'Nursing Home', clinic: 'Clinic' };

/** The hospital owned by this user id (the panel's ownerId), or null. */
export async function getOwnedHospital(ownerIdParam: unknown) {
  const ownerId = parseInt(String(ownerIdParam ?? ''), 10);
  if (isNaN(ownerId)) return null;
  return prisma.hospital.findFirst({ where: { ownerId } });
}

/** Chamber fields that always mirror the facility (name, address, map pin). */
export function facilityChamberFields(hospital: { name: string; address: string; phone: string; locationLat: number | null; locationLng: number | null }) {
  return {
    name: hospital.name,
    address: hospital.address,
    phone: hospital.phone || '',
    locationLat: hospital.locationLat,
    locationLng: hospital.locationLng,
  };
}

/** Keep every doctor sitting at this facility in sync after the facility's details change. */
export async function syncFacilityChambers(hospitalId: number) {
  const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
  if (!hospital) return;
  await prisma.doctorChamber.updateMany({ where: { hospitalId }, data: facilityChamberFields(hospital) });
}

const SAFE_DOCTOR_SELECT = {
  id: true, name: true, email: true, phone: true, specialty: true, qual: true, exp: true,
  image: true, about: true, rating: true, reviews: true, isVerified: true, hospitalId: true,
} as const;

/** Doctors sitting at a facility, each with their timetable (chamber), live status and booking counts. */
export async function listFacilityDoctors(hospitalId: number, { activeOnly = false } = {}) {
  const now = istNow();
  const chambers = await prisma.doctorChamber.findMany({
    where: { hospitalId, ...(activeOnly ? { isActive: true, doctor: { isVerified: true } } : {}) },
    include: { doctor: { select: SAFE_DOCTOR_SELECT } },
    orderBy: { createdAt: 'asc' },
  });
  if (chambers.length === 0) return [];

  const ids = chambers.map(c => c.id);
  const [today, upcoming] = await Promise.all([
    prisma.appointment.groupBy({
      by: ['chamberId'],
      where: { chamberId: { in: ids }, visitDate: now.dateISO, status: { not: 'Cancelled' }, bookingFeePaid: true },
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ['chamberId'],
      where: { chamberId: { in: ids }, visitDate: { gte: now.dateISO }, status: 'Confirmed', bookingFeePaid: true },
      _count: { _all: true },
    }),
  ]);
  const count = (rows: typeof today, id: number) => rows.find(r => r.chamberId === id)?._count._all ?? 0;

  return chambers.map(({ doctor, ...chamber }) => ({
    chamber: { ...serializeChamber(chamber, now), todaysBookings: count(today, chamber.id), upcomingBookings: count(upcoming, chamber.id) },
    doctor: { ...doctor, _id: doctor.id },
  }));
}
