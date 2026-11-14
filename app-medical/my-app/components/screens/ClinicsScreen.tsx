"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Building2, ChevronRight, MapPin, Navigation, Search, Stethoscope, X } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { SafeImage } from '@/components/ui/SafeImage';
import { BrowseModeToggle } from '@/components/ui/BrowseModeToggle';
import { facilityKindLabel, type FacilityKindValue } from '@/lib/facilityKind';

const GUEST_LOCATION_KEY = 'aurahealth_guest_location';

type KindFilter = 'all' | FacilityKindValue;

const KIND_FILTERS: { key: KindFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'clinic', label: 'Clinics' },
  { key: 'hospital', label: 'Hospitals' },
  { key: 'nursing_home', label: 'Nursing Homes' },
];

function readCachedCoords(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem(GUEST_LOCATION_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p?.lat === 'number' && typeof p?.lng === 'number') return { lat: p.lat, lng: p.lng };
    }
  } catch { }
  return null;
}

function initials(name: string) {
  return (name || 'Dr').replace(/^dr\.?\s*/i, '').split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
}

export const ClinicsScreen = () => {
  const { currentUser } = useAppContext();
  const { locale } = useLanguage();
  const [result, setResult] = useState<{ key: string; data: any[] } | null>(null);
  const [kind, setKind] = useState<KindFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cachedCoords] = useState(() => (typeof window === 'undefined' ? null : readCachedCoords()));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userLat = currentUser?.location?.lat;
  const userLng = currentUser?.location?.lng;
  const coords = useMemo(
    () => (userLat && userLng ? { lat: userLat, lng: userLng } : cachedCoords),
    [userLat, userLng, cachedCoords],
  );

  const onSearch = (val: string) => {
    setSearchTerm(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedSearch(val.trim()), 250);
  };

  const queryKey = useMemo(() => {
    const params = new URLSearchParams({ withDoctors: '1' });
    if (kind !== 'all') params.set('kind', kind);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (coords) {
      params.set('lat', String(coords.lat));
      params.set('lng', String(coords.lng));
    }
    return params.toString();
  }, [kind, debouncedSearch, coords]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/hospitals?${queryKey}`, { signal: controller.signal })
      .then(r => (r.ok ? r.json() : []))
      .then(data => setResult({ key: queryKey, data: Array.isArray(data) ? data : [] }))
      .catch(err => { if (err?.name !== 'AbortError') setResult({ key: queryKey, data: [] }); });
    return () => controller.abort();
  }, [queryKey]);

  const loading = result?.key !== queryKey;
  const facilities = useMemo(() => result?.data ?? [], [result]);

  // Facilities with bookable doctors first; the API already ordered by distance / rating.
  const sorted = useMemo(
    () => [...facilities].sort((a, b) => Number((b.doctorCount || 0) > 0) - Number((a.doctorCount || 0) > 0)),
    [facilities],
  );

  return (
    <div className="min-h-full bg-slate-50/70 dark:bg-gray-900 py-4 sm:py-6 px-4 sm:px-6 lg:px-8 pb-28 md:pb-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <BrowseModeToggle active="clinics" />

        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">Clinics &amp; Hospitals</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pick a clinic or hospital to see its doctors, their timings, and book a visit.
          </p>
        </div>

        {/* Search + kind filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={e => onSearch(e.target.value)}
              placeholder="Search clinic, hospital or area"
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            {searchTerm && (
              <button onClick={() => onSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {KIND_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setKind(f.key)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                  kind === f.key
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-teal-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {!loading && (
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {sorted.length} {sorted.length === 1 ? 'facility' : 'facilities'}{coords ? ' · nearest first' : ''}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-white dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-gray-700">
            <Building2 size={44} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="font-bold text-gray-700 dark:text-gray-200">No clinics or hospitals found</p>
            <p className="text-sm text-gray-500 mt-1">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map(f => (
              <ClinicCard key={f._id} facility={f} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function ClinicCard({ facility, locale }: { facility: any; locale: string }) {
  const name = locale === 'hi' && facility.nameHi ? facility.nameHi : facility.name;
  const address = locale === 'hi' && facility.addressHi ? facility.addressHi : facility.address;
  const photo = Array.isArray(facility.photos) ? facility.photos[0] : null;
  const distanceKm = typeof facility.distance === 'number' && facility.distance < 9999 ? facility.distance : null;
  const doctorCount: number = facility.doctorCount || 0;
  const inNow: number = facility.inNowCount || 0;
  const preview: any[] = facility.doctorPreview || [];
  const specialties: string[] = facility.specialties || [];

  return (
    <Link
      href={`/hospital/${facility._id}`}
      className="group flex flex-col bg-white dark:bg-gray-800 rounded-3xl border border-slate-200/80 dark:border-gray-700 overflow-hidden shadow-xs hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-700 transition-all active:scale-[0.99]"
    >
      {/* Cover */}
      <div className="relative h-28 sm:h-32 bg-gradient-to-br from-teal-600 to-blue-700">
        <SafeImage
          src={photo}
          alt={name}
          className="w-full h-full object-cover"
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <Building2 size={40} className="text-white/70" />
            </div>
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute top-3 left-3 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/95 text-teal-700">
          {facilityKindLabel(facility.facilityKind)}
        </span>
        {inNow > 0 && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-500 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {inNow} IN now
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4 gap-3">
        <div className="min-w-0">
          <h3 className="font-black text-base sm:text-lg text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-teal-700 dark:group-hover:text-teal-400">{name}</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
            {distanceKm !== null ? (
              <Navigation size={13} className="text-teal-600 shrink-0 mt-0.5" />
            ) : (
              <MapPin size={13} className="shrink-0 mt-0.5" />
            )}
            <span className="line-clamp-1">
              {distanceKm !== null && (
                <strong className="text-teal-700 dark:text-teal-400 font-bold">
                  {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm} km`} ·{' '}
                </strong>
              )}
              {address}
            </span>
          </p>
        </div>

        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {specialties.slice(0, 3).map(s => (
              <span key={s} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{s}</span>
            ))}
            {specialties.length > 3 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-gray-500">+{specialties.length - 3}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-gray-700 flex items-center justify-between gap-3">
          {doctorCount > 0 ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex -space-x-2 shrink-0">
                {preview.slice(0, 3).map(d => (
                  <SafeImage
                    key={d._id}
                    src={d.image}
                    alt={d.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                    fallback={
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                        {initials(d.name)}
                      </div>
                    }
                  />
                ))}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-gray-900 dark:text-white">{doctorCount} {doctorCount === 1 ? 'Doctor' : 'Doctors'}</p>
                {facility.minFee > 0 && <p className="text-[11px] font-bold text-gray-500">From ₹{facility.minFee}</p>}
              </div>
            </div>
          ) : (
            <p className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
              <Stethoscope size={14} /> Doctors coming soon
            </p>
          )}
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
            View doctors <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
