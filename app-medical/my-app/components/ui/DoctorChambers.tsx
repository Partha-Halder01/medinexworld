"use client";
import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2, MapPin, Navigation, Clock, CalendarDays, Check, ArrowRight, Lock, Loader2, LocateFixed,
  Sunrise, Sun, Moon, IndianRupee, ShieldCheck, Wallet, Phone,
} from 'lucide-react';
import {
  dateInfo, directionsUrl, formatDistance, haversineKm, isValidLatLng, istNow, scheduleSummary, to12h,
  upcomingChamberDates, formatDateLabel,
} from '@/lib/chamber';
import { displayableImages } from '@/lib/imageUrl';
import { PhotoGallery } from '@/components/ui/PhotoGallery';

export type PublicChamber = {
  id: number;
  _id: number;
  name: string;
  address: string;
  phone?: string;
  mapUrl?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  fee: number;
  scheduleType: 'weekly' | 'monthly';
  weekDays: number[];
  monthDays: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  photos?: string[];
  isActive: boolean;
  liveStatus: 'in' | 'later_today' | 'finished_today' | 'not_today';
  isDoctorIn: boolean;
  nextOpenDate?: string | null;
};

type LatLng = { lat: number; lng: number } | null;

export function useUserLocation(initial?: LatLng) {
  const [located, setLocation] = useState<LatLng>(null);
  const [locating, setLocating] = useState(false);
  const location = located ?? (initial && isValidLatLng(initial.lat, initial.lng) ? initial : null);

  const locate = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return { location, locating, locate };
}

export function chamberDistanceKm(chamber: PublicChamber, userLocation: LatLng): number | null {
  if (!userLocation || !isValidLatLng(chamber.locationLat, chamber.locationLng)) return null;
  return haversineKm(userLocation.lat, userLocation.lng, chamber.locationLat as number, chamber.locationLng as number);
}

export function ChamberStatusBadge({ chamber, size = 'sm' }: { chamber: PublicChamber; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'text-xs px-2.5 py-1' : 'text-[10px] px-2 py-0.5';
  if (chamber.isDoctorIn) {
    return (
      <span className={`inline-flex items-center gap-1 font-black rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ${cls}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Doctor is in chamber now
      </span>
    );
  }
  if (chamber.liveStatus === 'later_today') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 ${cls}`}>
        <Clock size={10} /> Today {to12h(chamber.startTime)}
      </span>
    );
  }
  if (chamber.nextOpenDate) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 ${cls}`}>
        Next: {formatDateLabel(chamber.nextOpenDate).replace(/ \d{4}$/, '')}
      </span>
    );
  }
  return null;
}

/* ----------------------------- Chambers tab ----------------------------- */

export function DoctorChamberList({ chambers, initialLocation, onBook }: {
  chambers: PublicChamber[];
  initialLocation?: LatLng;
  onBook?: (chamberId: number) => void;
}) {
  const { location, locating, locate } = useUserLocation(initialLocation);
  const sorted = useMemo(() => {
    return [...chambers].sort((a, b) => {
      if (a.isDoctorIn !== b.isDoctorIn) return a.isDoctorIn ? -1 : 1;
      const da = chamberDistanceKm(a, location);
      const db = chamberDistanceKm(b, location);
      if (da != null && db != null) return da - db;
      return 0;
    });
  }, [chambers, location]);

  return (
    <div className="space-y-4">
      {!location && chambers.some(c => isValidLatLng(c.locationLat, c.locationLng)) && (
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-3 py-2 rounded-xl hover:bg-teal-100 disabled:opacity-60"
        >
          {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />} Show distance from me
        </button>
      )}

      {sorted.map(chamber => {
        const km = chamberDistanceKm(chamber, location);
        const dirUrl = directionsUrl(chamber);
        return (
          <div
            key={chamber.id}
            className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border space-y-4 ${
              chamber.isDoctorIn ? 'border-emerald-300 dark:border-emerald-800' : 'border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-base text-slate-900 dark:text-white">{chamber.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1">
                    <MapPin size={12} className="shrink-0 mt-0.5" /> {chamber.address}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <ChamberStatusBadge chamber={chamber} />
                    {km != null && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full">
                        <Navigation size={10} /> {formatDistance(km)} away
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-black text-teal-600 dark:text-teal-400">₹{chamber.fee}</p>
                <p className="text-[10px] text-slate-400">at chamber</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <CalendarDays size={14} className="text-teal-600 shrink-0" />
              <span className="font-semibold">{scheduleSummary(chamber)}</span>
            </div>

            {displayableImages(chamber.photos).length > 0 && (
              <PhotoGallery
                compact
                photos={displayableImages(chamber.photos).map(src => ({ src, caption: chamber.name }))}
              />
            )}

            <div className="flex flex-wrap gap-2">
              {dirUrl && (
                <a
                  href={dirUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5"
                >
                  <Navigation size={13} className="text-teal-600" /> Directions
                </a>
              )}
              {chamber.phone && (
                <a
                  href={`tel:${chamber.phone.replace(/[^\d+]/g, '')}`}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5"
                >
                  <Phone size={13} className="text-teal-600" /> Call chamber
                </a>
              )}
              {onBook && (
                <button
                  type="button"
                  onClick={() => onBook(chamber.id)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold uppercase tracking-wider"
                >
                  Book here
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------- Booking panel ---------------------------- */

type SlotRow = { time: string; available: boolean; reason: string | null };

function slotHour(slot: string) {
  const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(slot);
  if (!m) return 9;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h;
}

export function ChamberBookingPanel({
  doctorId,
  chambers,
  bookingFee,
  isLoggedIn,
  initialLocation,
  selectedChamberId,
  onSelectChamber,
  onBook,
  onLogin,
  onRegister,
}: {
  doctorId: number | string;
  chambers: PublicChamber[];
  bookingFee: number;
  isLoggedIn: boolean;
  initialLocation?: LatLng;
  selectedChamberId: number | null;
  onSelectChamber: (id: number) => void;
  onBook: (args: { chamber: PublicChamber; visitDate: string; slot: string }) => Promise<void> | void;
  onLogin: () => void;
  onRegister: () => void;
}) {
  const { location, locating, locate } = useUserLocation(initialLocation);
  const chamber = chambers.find(c => c.id === selectedChamberId) || null;

  const dates = useMemo(() => (chamber ? upcomingChamberDates(chamber, 45).slice(0, 14) : []), [chamber]);
  // Picks are remembered per chamber/date, so switching chamber or date resets them without extra effects.
  const [pickedDate, setPickedDate] = useState<{ chamberId: number; date: string } | null>(null);
  const visitDate =
    chamber && pickedDate?.chamberId === chamber.id && dates.includes(pickedDate.date) ? pickedDate.date : dates[0] ?? null;
  const slotKey = chamber && visitDate ? `${chamber.id}|${visitDate}` : null;

  const [pickedSlot, setPickedSlot] = useState<{ key: string; slot: string } | null>(null);
  const selectedSlot = pickedSlot && pickedSlot.key === slotKey ? pickedSlot.slot : null;
  const setSelectedSlot = (slot: string | null) => setPickedSlot(slot && slotKey ? { key: slotKey, slot } : null);
  const setVisitDate = (date: string) => chamber && setPickedDate({ chamberId: chamber.id, date });

  const [refreshKey, setRefreshKey] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; refresh: number; slots: SlotRow[] } | null>(null);
  const slotsLoading = !!slotKey && (loaded?.key !== slotKey || loaded.refresh !== refreshKey);
  const slots = useMemo(() => (slotKey && loaded?.key === slotKey ? loaded.slots : []), [slotKey, loaded]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!chamber || !visitDate || !slotKey) return;
    let cancelled = false;
    const done = (rows: SlotRow[]) => { if (!cancelled) setLoaded({ key: slotKey, refresh: refreshKey, slots: rows }); };
    fetch(`/api/doctors/${doctorId}/chambers/${chamber.id}/slots?date=${visitDate}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => done(Array.isArray(data?.slots) ? data.slots : []))
      .catch(() => done([]));
    return () => { cancelled = true; };
  }, [doctorId, chamber, visitDate, slotKey, refreshKey]);

  const groups = useMemo(() => {
    const g = { morning: [] as SlotRow[], afternoon: [] as SlotRow[], evening: [] as SlotRow[] };
    for (const s of slots) {
      const h = slotHour(s.time);
      if (h < 12) g.morning.push(s);
      else if (h < 17) g.afternoon.push(s);
      else g.evening.push(s);
    }
    return g;
  }, [slots]);

  const openCount = slots.filter(s => s.available).length;
  const today = istNow().dateISO;

  const handleBook = async () => {
    if (!chamber || !visitDate || !selectedSlot) return;
    setSubmitting(true);
    try {
      await onBook({ chamber, visitDate, slot: selectedSlot });
    } finally {
      setSubmitting(false);
      setRefreshKey(k => k + 1);
    }
  };

  const slotGroup = (label: string, icon: React.ReactNode, rows: SlotRow[]) =>
    rows.length > 0 && (
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
          {icon}<span>{label} ({rows.filter(r => r.available).length}/{rows.length})</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {rows.map(s => {
            const isSelected = s.time === selectedSlot;
            return (
              <button
                key={s.time}
                type="button"
                disabled={!s.available}
                onClick={() => setSelectedSlot(isSelected ? null : s.time)}
                title={s.reason === 'booked' ? 'Already booked' : s.reason === 'past' ? 'Time has passed' : undefined}
                className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                  !s.available
                    ? 'bg-slate-100/70 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border-transparent line-through cursor-not-allowed'
                    : isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/30'
                    : 'bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:border-teal-500/50'
                }`}
              >
                {isSelected && <Check size={12} className="stroke-[3]" />}
                <span>{s.time}</span>
              </button>
            );
          })}
        </div>
      </div>
    );

  return (
    <div id="booking-widget" className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base tracking-tight">Book Chamber Visit</h3>
          <p className="text-xs text-teal-100 mt-0.5 font-medium">
            {bookingFee > 0 ? `Pay only ₹${bookingFee} online · rest at the chamber` : 'Free booking · pay at the chamber'}
          </p>
        </div>
        <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center">
          <Building2 size={18} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* 1. Chamber */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Choose Chamber
            </label>
            {!location && chambers.some(c => isValidLatLng(c.locationLat, c.locationLng)) && (
              <button type="button" onClick={locate} disabled={locating} className="text-[11px] font-bold text-teal-600 dark:text-teal-400 inline-flex items-center gap-1 hover:underline">
                {locating ? <Loader2 size={11} className="animate-spin" /> : <LocateFixed size={11} />} Nearest first
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {[...chambers]
              .sort((a, b) => {
                if (a.isDoctorIn !== b.isDoctorIn) return a.isDoctorIn ? -1 : 1;
                const da = chamberDistanceKm(a, location);
                const db = chamberDistanceKm(b, location);
                return da != null && db != null ? da - db : 0;
              })
              .map(c => {
                const isSel = c.id === selectedChamberId;
                const km = chamberDistanceKm(c, location);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectChamber(c.id)}
                    className={`w-full text-left p-3 rounded-2xl border-2 transition-all ${
                      isSel
                        ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 dark:border-teal-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`mt-0.5 w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${isSel ? 'bg-teal-600 text-white' : 'border-2 border-slate-300 dark:border-slate-600'}`}>
                        {isSel && <Check size={10} strokeWidth={3.5} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{c.name}</p>
                          <span className="text-sm font-black text-slate-800 dark:text-slate-200 shrink-0">₹{c.fee}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{c.address}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-semibold">{scheduleSummary(c)}</p>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <ChamberStatusBadge chamber={c} />
                          {km != null && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full">
                              <Navigation size={10} /> {formatDistance(km)}
                            </span>
                          )}
                          {(() => {
                            const url = directionsUrl(c);
                            return url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-[10px] font-bold text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-0.5"
                              >
                                <MapPin size={10} /> Map
                              </a>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* 2. Date */}
        {chamber && (
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              2. Choose Date
            </label>
            {dates.length === 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3">
                No upcoming dates open at this chamber. Please pick another chamber.
              </p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 snap-x">
                {dates.map(d => {
                  const info = dateInfo(d);
                  const active = d === visitDate;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setVisitDate(d)}
                      className={`flex flex-col items-center min-w-[60px] py-2 px-2 rounded-2xl text-xs font-bold transition-all shrink-0 snap-start ${
                        active
                          ? 'bg-gradient-to-b from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/30'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 hover:bg-teal-50'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider opacity-80">{d === today ? 'Today' : info.weekdayShort}</span>
                      <span className="text-lg font-black leading-tight">{info.dayOfMonth}</span>
                      <span className="text-[10px] opacity-75">{info.monthShort}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. Slot */}
        {chamber && visitDate && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">3. Choose Time</label>
              {!slotsLoading && slots.length > 0 && <span className="text-[11px] font-bold text-slate-500">{openCount} open</span>}
            </div>
            {slotsLoading ? (
              <div className="flex items-center justify-center py-6 text-slate-400"><Loader2 size={20} className="animate-spin" /></div>
            ) : openCount === 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-center">
                All slots on this date are booked. Try another date.
              </p>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {slotGroup('Morning', <Sunrise size={13} className="text-amber-500" />, groups.morning)}
                {slotGroup('Afternoon', <Sun size={13} className="text-amber-500" />, groups.afternoon)}
                {slotGroup('Evening', <Moon size={13} className="text-indigo-400" />, groups.evening)}
              </div>
            )}
          </div>
        )}

        {/* Price split */}
        {chamber && (
          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <ShieldCheck size={13} className="text-blue-600" /> Booking fee <span className="font-bold text-blue-700 dark:text-blue-300">(pay online now)</span>
              </span>
              <span className="font-black text-slate-900 dark:text-white">{bookingFee > 0 ? `₹${bookingFee}` : 'FREE'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Wallet size={13} className="text-emerald-600" /> Consultation fee <span className="font-bold text-emerald-700 dark:text-emerald-300">(pay at chamber)</span>
              </span>
              <span className="font-black text-slate-900 dark:text-white flex items-center"><IndianRupee size={12} />{chamber.fee}</span>
            </div>
            {visitDate && selectedSlot && (
              <p className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                {chamber.name} · {formatDateLabel(visitDate)} · {selectedSlot}
              </p>
            )}
          </div>
        )}

        {/* CTA */}
        {!isLoggedIn ? (
          <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0"><Lock size={16} /></div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Quick Login to Book</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Takes less than 30 seconds</p>
              </div>
            </div>
            <button type="button" onClick={onLogin} className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-wider">
              Sign In to Book
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              New patient?{' '}
              <button type="button" onClick={onRegister} className="text-teal-600 dark:text-teal-400 font-bold hover:underline">Create Account</button>
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleBook}
            disabled={!chamber || !visitDate || !selectedSlot || submitting}
            className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              !chamber || !visitDate || !selectedSlot
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white shadow-lg shadow-teal-600/25 active:scale-[0.98]'
            }`}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : !chamber ? (
              'Select a Chamber'
            ) : !selectedSlot ? (
              'Select a Time Slot'
            ) : (
              <>
                {bookingFee > 0 ? `Pay ₹${bookingFee} & Book` : 'Confirm Booking'} <ArrowRight size={15} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
