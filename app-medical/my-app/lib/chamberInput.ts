import { displayableImages } from '@/lib/imageUrl';
import {
  isValidLatLng,
  isValidTime,
  normalizeMonthDays,
  normalizeWeekDays,
  parseLatLngFromMapsUrl,
  timeToMinutes,
} from '@/lib/chamber';

export const MAX_CHAMBERS_PER_DOCTOR = 20;
export const MAX_CHAMBER_PHOTOS = 8;
// ~1.5 MB per photo as base64; the editor compresses uploads well below this.
const MAX_PHOTO_CHARS = 2_000_000;

type ChamberInputResult = { data: Record<string, unknown>; error?: undefined } | { data?: undefined; error: string };

const cleanString = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Validates a create (partial = false) or update (partial = true) payload for a chamber.
 * Returns Prisma-ready data or a user-facing error message.
 */
export function parseChamberInput(body: any, existing: any | null, partial: boolean): ChamberInputResult {
  const data: Record<string, unknown> = {};
  const has = (key: string) => body?.[key] !== undefined;

  if (!partial || has('name')) {
    const name = cleanString(body?.name, 120);
    if (!name) return { error: 'Chamber name is required.' };
    data.name = name;
  }
  if (!partial || has('address')) {
    const address = cleanString(body?.address, 500);
    if (!address) return { error: 'Chamber address is required.' };
    data.address = address;
  }
  if (has('phone')) data.phone = cleanString(body.phone, 20);

  if (has('mapUrl')) {
    const mapUrl = cleanString(body.mapUrl, 2000);
    if (mapUrl && !isSafeHttpUrl(mapUrl)) return { error: 'Google Maps link must start with https://' };
    data.mapUrl = mapUrl || null;
  }

  if (has('locationLat') || has('locationLng')) {
    const lat = body.locationLat;
    const lng = body.locationLng;
    if ((lat === null || lat === '') && (lng === null || lng === '')) {
      data.locationLat = null;
      data.locationLng = null;
    } else if (isValidLatLng(lat, lng)) {
      data.locationLat = Number(lat);
      data.locationLng = Number(lng);
    } else {
      return { error: 'Invalid latitude/longitude.' };
    }
  } else if (typeof data.mapUrl === 'string') {
    // A full Google Maps URL already carries coordinates — use them when none were sent.
    const coords = parseLatLngFromMapsUrl(data.mapUrl);
    if (coords) {
      data.locationLat = coords.lat;
      data.locationLng = coords.lng;
    }
  }

  if (!partial || has('fee')) {
    const fee = Number(body?.fee);
    if (!Number.isFinite(fee) || fee < 0 || fee > 100000) return { error: 'Consultation fee must be between ₹0 and ₹1,00,000.' };
    data.fee = Math.round(fee);
  }

  const scheduleType = has('scheduleType') ? body.scheduleType : existing?.scheduleType ?? 'weekly';
  if (scheduleType !== 'weekly' && scheduleType !== 'monthly') return { error: 'Schedule type must be weekly or monthly.' };
  if (!partial || has('scheduleType')) data.scheduleType = scheduleType;

  if (!partial || has('weekDays')) data.weekDays = normalizeWeekDays(body?.weekDays);
  if (!partial || has('monthDays')) data.monthDays = normalizeMonthDays(body?.monthDays);
  const weekDays = (data.weekDays as number[] | undefined) ?? normalizeWeekDays(existing?.weekDays);
  const monthDays = (data.monthDays as number[] | undefined) ?? normalizeMonthDays(existing?.monthDays);
  if (scheduleType === 'weekly' && weekDays.length === 0) return { error: 'Select at least one day of the week.' };
  if (scheduleType === 'monthly' && monthDays.length === 0) return { error: 'Select at least one date of the month.' };

  if (!partial || has('startTime')) {
    if (!isValidTime(body?.startTime)) return { error: 'Start time is invalid.' };
    data.startTime = body.startTime;
  }
  if (!partial || has('endTime')) {
    if (!isValidTime(body?.endTime)) return { error: 'End time is invalid.' };
    data.endTime = body.endTime;
  }
  const start = timeToMinutes((data.startTime as string) ?? existing?.startTime ?? '');
  const end = timeToMinutes((data.endTime as string) ?? existing?.endTime ?? '');
  if (!(end > start)) return { error: 'End time must be after start time.' };

  if (!partial || has('slotDuration')) {
    const duration = Number(body?.slotDuration ?? 15);
    if (!Number.isInteger(duration) || duration < 5 || duration > 120) return { error: 'Slot duration must be 5–120 minutes.' };
    data.slotDuration = duration;
  }
  const duration = (data.slotDuration as number | undefined) ?? existing?.slotDuration ?? 15;
  if (end - start < duration) return { error: 'The session is shorter than one slot.' };

  if (has('isActive')) data.isActive = Boolean(body.isActive);

  if (has('photos')) {
    const photos = displayableImages(body.photos);
    if (photos.length > MAX_CHAMBER_PHOTOS) return { error: `You can add up to ${MAX_CHAMBER_PHOTOS} photos per chamber.` };
    if (photos.some(p => p.length > MAX_PHOTO_CHARS)) return { error: 'One of the photos is too large. Please use a smaller image.' };
    data.photos = photos;
  }

  return { data };
}
