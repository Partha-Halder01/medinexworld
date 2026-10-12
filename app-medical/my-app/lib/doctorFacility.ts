import { facilityKindLabel, isFacilityKind } from '@/lib/facilityKind';

export interface DoctorFacilityInfo {
  type: 'hospital' | 'clinic';
  name: string;
  /** "Hospital" | "Nursing Home" | "Clinic" — what to show next to the name. */
  label: string;
  isHospital: boolean;
  hospitalId?: number | string | null;
  address?: string;
}

export function normalizeFacilityName(name: string): string {
  return (name || '')
    .replace(/AuraHealth/gi, 'Medinex World')
    .replace(/UpcharPath/gi, 'Medinex World')
    .replace(/North Bengal Medi Sathi/gi, 'Medinex World')
    .trim();
}

/**
 * Determines whether a doctor is associated with a Hospital or a Clinic,
 * along with the facility's clean name and icon classification.
 */
export function getDoctorFacilityInfo(doctor: any): DoctorFacilityInfo | null {
  if (!doctor) return null;

  // 1. Direct hospital relation object
  const hosp = doctor.hospital || (typeof doctor.hospitalId === 'object' && doctor.hospitalId !== null ? doctor.hospitalId : null);
  if (hosp && hosp.name) {
    const rawType = String(hosp.type || '').trim().toLowerCase();
    const nameLower = String(hosp.name || '').toLowerCase();
    // The facility's own chosen kind is authoritative; guess from the name only for older records without one.
    const hasKind = isFacilityKind(hosp.facilityKind);
    const isClinic = hasKind
      ? hosp.facilityKind === 'clinic'
      : rawType === 'clinic' || nameLower.includes('clinic') || nameLower.includes('polyclinic') || nameLower.includes('chamber');
    return {
      type: isClinic ? 'clinic' : 'hospital',
      name: normalizeFacilityName(hosp.name),
      label: hasKind ? facilityKindLabel(hosp.facilityKind) : isClinic ? 'Clinic' : 'Hospital',
      isHospital: !isClinic,
      hospitalId: hosp.id || hosp._id || (typeof doctor.hospitalId === 'number' ? doctor.hospitalId : null),
      address: hosp.address || doctor.address,
    };
  }

  // 2. Direct hospitalId (numeric ID)
  const numericHospitalId = typeof doctor.hospitalId === 'number' ? doctor.hospitalId : null;

  // 3. Active chamber now or nearest chamber
  const chamberName = doctor.inChamberNow?.name || doctor.nearestChamberName;
  if (chamberName) {
    const nameLower = chamberName.toLowerCase();
    const isHosp = nameLower.includes('hospital') || nameLower.includes('nursing home') || nameLower.includes('medical college');
    return {
      type: isHosp ? 'hospital' : 'clinic',
      name: normalizeFacilityName(chamberName),
      label: nameLower.includes('nursing home') ? 'Nursing Home' : isHosp ? 'Hospital' : 'Clinic',
      isHospital: isHosp,
      hospitalId: numericHospitalId,
      address: doctor.address,
    };
  }

  // 4. Fallback to doctor address prefix
  if (doctor.address) {
    const cleanAddr = normalizeFacilityName(doctor.address).split(',')[0].trim();
    if (cleanAddr) {
      const nameLower = cleanAddr.toLowerCase();
      const isHosp = nameLower.includes('hospital') || nameLower.includes('nursing home') || nameLower.includes('medical college');
      return {
        type: isHosp ? 'hospital' : 'clinic',
        name: cleanAddr,
        label: nameLower.includes('nursing home') ? 'Nursing Home' : isHosp ? 'Hospital' : 'Clinic',
        isHospital: isHosp,
        hospitalId: numericHospitalId,
        address: doctor.address,
      };
    }
  }

  return null;
}
