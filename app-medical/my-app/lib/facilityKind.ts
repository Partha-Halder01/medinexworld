// Shared (client + server) labels for the kind of facility a hospital record is.
export type FacilityKindValue = 'hospital' | 'nursing_home' | 'clinic';

export const FACILITY_KIND_OPTIONS: { value: FacilityKindValue; label: string; hint: string }[] = [
  { value: 'hospital', label: 'Hospital', hint: 'Multi-department care' },
  { value: 'nursing_home', label: 'Nursing Home', hint: 'Smaller inpatient & care facility' },
  { value: 'clinic', label: 'Clinic', hint: 'Outpatient clinic / polyclinic' },
];

export function facilityKindLabel(kind?: string | null): string {
  return FACILITY_KIND_OPTIONS.find(o => o.value === kind)?.label ?? 'Hospital';
}

export function isFacilityKind(kind: unknown): kind is FacilityKindValue {
  return FACILITY_KIND_OPTIONS.some(o => o.value === kind);
}
