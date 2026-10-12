type DoctorUrlInput = {
  _id?: string;
  id?: string | number;
  name?: string;
  specialty?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function extractDoctorIdFromSlugParam(param: string): string {
  const value = decodeURIComponent(param || '').trim();
  if (!value) return '';

  const mongoIdMatch = value.match(/([a-fA-F0-9]{24})$/);
  if (mongoIdMatch) return mongoIdMatch[1];

  const numericIdMatch = value.match(/(\d+)$/);
  if (numericIdMatch) return numericIdMatch[1];

  return value;
}

export function buildDoctorProfilePath(doctor: DoctorUrlInput): string {
  const id = String(doctor?._id ?? doctor?.id ?? '').trim();
  if (!id) return '/doctor';

  const nameSlug = slugify(doctor?.name || 'doctor');
  const specialtySlug = slugify(doctor?.specialty || 'specialist');
  const combinedSlug = [nameSlug, specialtySlug].filter(Boolean).join('-');

  return `/doctor/${combinedSlug ? `${combinedSlug}-${id}` : id}`;
}
