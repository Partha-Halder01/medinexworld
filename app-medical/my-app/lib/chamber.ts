// Shared chamber helpers — safe to import from both server routes and client components.
// All "today"/"now" calculations use Indian Standard Time so the result does not depend on
// the server's or the browser's timezone.

export type ChamberScheduleType = 'weekly' | 'monthly';

export interface ChamberLike {
  id?: number;
  _id?: number;
  name?: string;
  address?: string;
  scheduleType?: string;
  weekDays?: unknown;
  monthDays?: unknown;
  startTime?: string;
  endTime?: string;
  slotDuration?: number;
  isActive?: boolean;
  locationLat?: number | null;
  locationLng?: number | null;
  checkedInAt?: string | Date | null;
  checkedOutAt?: string | Date | null;
}

export type ChamberLiveStatus = 'in' | 'later_today' | 'finished_today' | 'not_today';

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const CHAMBER_TIMEZONE = 'Asia/Kolkata';
// Doctor may check in this many minutes before the session starts.
export const CHECK_IN_EARLY_MINUTES = 60;
// A check-in without a check-out stops counting this many minutes after the session ends.
export const CHECK_IN_GRACE_MINUTES = 60;
// Unpaid chamber bookings hold their slot for this long so two patients can't pay for the same slot.
export const PENDING_SLOT_HOLD_MINUTES = 15;

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_RE.test(value);
}

export function timeToMinutes(value: string): number {
  const m = TIME_RE.exec(value);
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function minutesTo12h(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function to12h(value: string): string {
  const mins = timeToMinutes(value);
  return Number.isFinite(mins) ? minutesTo12h(mins) : value;
}

export function normalizeWeekDays(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6))].sort((a, b) => a - b);
}

export function normalizeMonthDays(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 31))].sort((a, b) => a - b);
}

/** Current date/time in IST. */
export function istNow(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CHAMBER_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
  const dateISO = `${get('year')}-${get('month')}-${get('day')}`;
  return { dateISO, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

/** Calendar date (YYYY-MM-DD) of an instant, in IST. */
export function istDateOf(value: string | Date): string {
  return istNow(new Date(value)).dateISO;
}

export function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dateInfo(dateISO: string) {
  const d = new Date(`${dateISO}T00:00:00Z`);
  const weekday = d.getUTCDay();
  return {
    weekday,
    dayOfMonth: d.getUTCDate(),
    month: d.getUTCMonth(),
    year: d.getUTCFullYear(),
    weekdayShort: WEEKDAY_SHORT[weekday],
    weekdayName: WEEKDAY_NAMES[weekday],
    monthShort: MONTH_SHORT[d.getUTCMonth()],
  };
}

/** "Mon, 6 Oct 2026" */
export function formatDateLabel(dateISO: string): string {
  const i = dateInfo(dateISO);
  return `${i.weekdayShort}, ${i.dayOfMonth} ${i.monthShort} ${i.year}`;
}

export function isChamberOpenOn(chamber: ChamberLike, dateISO: string): boolean {
  if (chamber.isActive === false) return false;
  const info = dateInfo(dateISO);
  if (chamber.scheduleType === 'monthly') {
    return normalizeMonthDays(chamber.monthDays).includes(info.dayOfMonth);
  }
  return normalizeWeekDays(chamber.weekDays).includes(info.weekday);
}

export function generateChamberSlots(chamber: ChamberLike): string[] {
  const start = timeToMinutes(chamber.startTime || '');
  const end = timeToMinutes(chamber.endTime || '');
  const step = Math.min(120, Math.max(5, Number(chamber.slotDuration) || 15));
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  const slots: string[] = [];
  for (let t = start; t + step <= end; t += step) slots.push(minutesTo12h(t));
  return slots;
}

/** Slots that are still bookable on `dateISO` (drops past slots when the date is today). */
export function bookableSlotsFor(chamber: ChamberLike, dateISO: string, now = istNow()): string[] {
  if (!isChamberOpenOn(chamber, dateISO)) return [];
  const all = generateChamberSlots(chamber);
  if (dateISO !== now.dateISO) return dateISO > now.dateISO ? all : [];
  const start = timeToMinutes(chamber.startTime || '');
  const step = Math.min(120, Math.max(5, Number(chamber.slotDuration) || 15));
  return all.filter((_, idx) => start + idx * step > now.minutes);
}

export function upcomingChamberDates(chamber: ChamberLike, days = 30, now = istNow()): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    const iso = addDaysISO(now.dateISO, i);
    if (bookableSlotsFor(chamber, iso, now).length > 0) out.push(iso);
  }
  return out;
}

export function scheduleSummary(chamber: ChamberLike): string {
  const time = `${to12h(chamber.startTime || '')} – ${to12h(chamber.endTime || '')}`;
  if (chamber.scheduleType === 'monthly') {
    const days = normalizeMonthDays(chamber.monthDays);
    if (days.length === 0) return 'No dates set';
    return `Every month on ${days.map(ordinal).join(', ')} · ${time}`;
  }
  const days = normalizeWeekDays(chamber.weekDays);
  if (days.length === 0) return 'No days set';
  if (days.length === 7) return `Every day · ${time}`;
  return `${days.map(d => WEEKDAY_SHORT[d]).join(', ')} · ${time}`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/** Can the doctor press "I'm In" right now? */
export function checkInWindow(chamber: ChamberLike, now = istNow()): { allowed: boolean; reason?: string } {
  if (chamber.isActive === false) return { allowed: false, reason: 'This chamber is deactivated.' };
  if (!isChamberOpenOn(chamber, now.dateISO)) return { allowed: false, reason: 'This chamber is not scheduled for today.' };
  const start = timeToMinutes(chamber.startTime || '');
  const end = timeToMinutes(chamber.endTime || '');
  if (now.minutes < start - CHECK_IN_EARLY_MINUTES) {
    return { allowed: false, reason: `Check-in opens at ${minutesTo12h(Math.max(0, start - CHECK_IN_EARLY_MINUTES))}.` };
  }
  if (now.minutes > end) return { allowed: false, reason: "Today's chamber session is already over." };
  return { allowed: true };
}

export function isDoctorInChamber(chamber: ChamberLike, now = istNow()): boolean {
  if (!chamber.checkedInAt || chamber.isActive === false) return false;
  const inAt = new Date(chamber.checkedInAt);
  if (Number.isNaN(inAt.getTime())) return false;
  if (chamber.checkedOutAt && new Date(chamber.checkedOutAt) >= inAt) return false;
  if (istDateOf(inAt) !== now.dateISO) return false;
  const end = timeToMinutes(chamber.endTime || '');
  if (Number.isFinite(end) && now.minutes > end + CHECK_IN_GRACE_MINUTES) return false;
  return true;
}

export function chamberLiveStatus(chamber: ChamberLike, now = istNow()): ChamberLiveStatus {
  if (isDoctorInChamber(chamber, now)) return 'in';
  if (!isChamberOpenOn(chamber, now.dateISO)) return 'not_today';
  const end = timeToMinutes(chamber.endTime || '');
  return now.minutes > end ? 'finished_today' : 'later_today';
}

export function nextOpenDate(chamber: ChamberLike, now = istNow()): string | null {
  return upcomingChamberDates(chamber, 62, now)[0] || null;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${Math.round(km * 10) / 10} km`;
}

export function isValidLatLng(lat: unknown, lng: unknown): boolean {
  const a = Number(lat);
  const b = Number(lng);
  return lat !== null && lng !== null && lat !== '' && lng !== '' &&
    Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 && !(a === 0 && b === 0);
}

export function directionsUrl(chamber: { locationLat?: number | null; locationLng?: number | null; mapUrl?: string | null; address?: string | null }): string | null {
  if (isValidLatLng(chamber.locationLat, chamber.locationLng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${chamber.locationLat},${chamber.locationLng}`;
  }
  if (chamber.mapUrl) return chamber.mapUrl;
  if (chamber.address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chamber.address)}`;
  return null;
}

/**
 * Pulls coordinates out of a full Google Maps URL without calling any Google API.
 * Short links (maps.app.goo.gl) don't contain coordinates — those are expanded server-side
 * by /api/maps/resolve before being passed here.
 */
export function parseLatLngFromMapsUrl(raw: string): { lat: number; lng: number } | null {
  if (!raw) return null;
  let text = raw.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    /* keep raw text */
  }

  const patterns: RegExp[] = [
    /!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/, // exact pin of a place
    /[?&](?:q|query|ll|destination|daddr|center|sll)=(-?\d{1,2}\.\d+)\s*,\s*\+?(-?\d{1,3}\.\d+)/,
    /\/place\/(-?\d{1,2}\.\d+)\s*,\s*\+?(-?\d{1,3}\.\d+)/,
    /\/search\/(-?\d{1,2}\.\d+)\s*,\s*\+?(-?\d{1,3}\.\d+)/,
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, // map viewport centre
    /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/, // plain "lat,lng"
  ];
  for (const re of patterns) {
    const m = re.exec(text);
    if (m && isValidLatLng(m[1], m[2])) return { lat: Number(m[1]), lng: Number(m[2]) };
  }
  return null;
}

export function serializeChamber<T extends ChamberLike & { id: number }>(c: T, now = istNow()) {
  const liveStatus = chamberLiveStatus(c, now);
  return {
    ...c,
    _id: c.id,
    weekDays: normalizeWeekDays(c.weekDays),
    monthDays: normalizeMonthDays(c.monthDays),
    liveStatus,
    isDoctorIn: liveStatus === 'in',
    scheduleSummary: scheduleSummary(c),
    nextOpenDate: nextOpenDate(c, now),
  };
}
