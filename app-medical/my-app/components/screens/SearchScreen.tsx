"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, X, CheckCircle, ChevronRight, Navigation, MapPin,
  SlidersHorizontal, Star, Stethoscope, Heart, Sparkles, Baby,
  Smile, Brain, Activity, Syringe, Zap, Filter, LayoutGrid, List,
  Calendar, Clock, ArrowUpDown, Check
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useSearchParams } from 'next/navigation';
import { SPECIALTIES } from '@/lib/data';
import { DoctorCard } from '../ui/DoctorCard';

const GUEST_LOCATION_KEY = 'aurahealth_guest_location';

const SPECIALTY_ICONS: Record<string, React.ReactNode> = {
  'General Physician': <Stethoscope size={16} />,
  'Cardiologist': <Heart size={16} />,
  'Dermatologist': <Sparkles size={16} />,
  'Pediatrician': <Baby size={16} />,
  'Dentist': <Smile size={16} />,
  'Neurologist': <Brain size={16} />,
  'Orthopedic': <Activity size={16} />,
  'ENT Specialist': <Syringe size={16} />,
  'Gynecologist': <Heart size={16} />,
  'Psychiatrist': <Zap size={16} />,
};

function getCachedCoords(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem(GUEST_LOCATION_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p?.lat === 'number' && typeof p?.lng === 'number') return p;
    }
  } catch { }
  return null;
}

type SortOption = 'distance' | 'rating' | 'fee-asc' | 'fee-desc' | 'exp';

export const SearchScreen = () => {
  const { searchFilter, setSearchFilter, currentUser } = useAppContext();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') || searchParams.get('search') || '';
  const specialtyParam = searchParams.get('specialty') || '';

  // Search input & debouncing initialized with query param if present
  const [searchTerm, setSearchTerm] = useState(qParam);
  const [debouncedSearch, setDebouncedSearch] = useState(qParam);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync URL search params into search state
  useEffect(() => {
    if (qParam) {
      setSearchTerm(qParam);
      setDebouncedSearch(qParam);
    }
  }, [qParam]);

  useEffect(() => {
    if (specialtyParam) {
      setSearchFilter(specialtyParam);
    } else if (qParam) {
      const matched = SPECIALTIES.find(s => s.toLowerCase() === qParam.toLowerCase());
      if (matched) {
        setSearchFilter(matched);
      } else {
        setSearchFilter('All');
      }
    }
  }, [specialtyParam, qParam, setSearchFilter]);

  const handleSearchChange = useCallback((val: string) => {
    setSearchTerm(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(val), 250);
  }, []);

  // Data & Filters
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Location state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'active' | 'denied'>('idle');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationResolved, setLocationResolved] = useState(false);

  // Hydrate location
  useEffect(() => {
    const cached = getCachedCoords();
    if (cached) {
      setUserCoords(cached);
      setLocationStatus('active');
      setLocationResolved(true);
    }
  }, []);

  // Resolve location
  useEffect(() => {
    if (currentUser?.location?.lat && currentUser?.location?.lng) {
      const coords = { lat: currentUser.location.lat, lng: currentUser.location.lng };
      setUserCoords(coords);
      setLocationStatus('active');
      setLocationResolved(true);
      return;
    }

    if (locationResolved) return;

    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setLocationResolved(true);
      return;
    }

    setLocationStatus('locating');
    const giveUpTimer = setTimeout(() => setLocationResolved(true), 1500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(giveUpTimer);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setLocationStatus('active');
        setLocationResolved(true);
        setShowLocationPrompt(false);
        try { localStorage.setItem(GUEST_LOCATION_KEY, JSON.stringify(coords)); } catch { }
      },
      () => {
        clearTimeout(giveUpTimer);
        setLocationStatus('denied');
        setShowLocationPrompt(true);
        setLocationResolved(true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 120_000 }
    );

    return () => clearTimeout(giveUpTimer);
  }, [currentUser?._id, locationResolved]);

  // Fetch doctors
  useEffect(() => {
    if (!locationResolved) return;

    setLoading(true);
    const params = new URLSearchParams();
    if (searchFilter && searchFilter !== 'All') params.set('specialty', searchFilter);
    if (userCoords) {
      params.set('lat', String(userCoords.lat));
      params.set('lng', String(userCoords.lng));
    }
    fetch(`/api/doctors?${params}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          // De-duplicate by ID as safe guard
          const map = new Map();
          data.forEach(d => { if (!map.has(d.id)) map.set(d.id, d); });
          setDoctors(Array.from(map.values()));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchFilter, userCoords, locationResolved]);

  // Request location manually
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationStatus('locating');
    setShowLocationPrompt(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setLocationStatus('active');
        setLocationResolved(true);
        try { localStorage.setItem(GUEST_LOCATION_KEY, JSON.stringify(coords)); } catch { }
      },
      () => { setLocationStatus('denied'); setShowLocationPrompt(true); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Client filtering & sorting
  const filteredDoctors = useMemo(() => {
    const s = debouncedSearch.toLowerCase().trim();
    const sClean = s.replace(/\./g, '').trim();

    let result = doctors.filter(doc => {
      const docName = (doc.name || '').toLowerCase();
      const docNameClean = docName.replace(/\./g, '');
      const docSpecialty = (doc.specialty || '').toLowerCase();
      const docQual = (doc.qual || '').toLowerCase();
      const docAddress = (doc.address || '').toLowerCase();
      const hospitalName = (doc.hospital?.name || '').toLowerCase();
      const hospitalIdName = (typeof doc.hospitalId === 'object' && doc.hospitalId?.name ? doc.hospitalId.name.toLowerCase() : '');

      const matchesSearch = !s ||
        docName.includes(s) ||
        docNameClean.includes(sClean) ||
        docSpecialty.includes(s) ||
        docQual.includes(s) ||
        docAddress.includes(s) ||
        hospitalName.includes(s) ||
        hospitalIdName.includes(s);

      return matchesSearch;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'distance') {
        const da = typeof a.distance === 'number' ? a.distance : 9999;
        const db = typeof b.distance === 'number' ? b.distance : 9999;
        return da - db;
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'fee-asc') {
        return (a.fee || 0) - (b.fee || 0);
      }
      if (sortBy === 'fee-desc') {
        return (b.fee || 0) - (a.fee || 0);
      }
      if (sortBy === 'exp') {
        const expA = parseInt(a.exp || '0', 10) || 0;
        const expB = parseInt(b.exp || '0', 10) || 0;
        return expB - expA;
      }
      return 0;
    });

    return result;
  }, [doctors, debouncedSearch, sortBy]);

  const clearAllFilters = () => {
    setSearchFilter('All');
    setSearchTerm('');
    setDebouncedSearch('');
    setSortBy('distance');
  };

  const hasActiveFilters = searchFilter !== 'All' || debouncedSearch;

  return (
    <div className="min-h-full bg-slate-50/70 dark:bg-gray-900 py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* ── 📍 GPS PROMPT BANNER (if denied) ──────────────────────────────── */}
        {showLocationPrompt && locationStatus === 'denied' && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-teal-500/10 border border-amber-300/60 dark:border-amber-700/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Navigation size={18} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">Enable GPS for Exact Distance Sorting</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Allow browser location to see the closest doctors, travel distance, and nearest clinics.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={requestLocation}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Navigation size={13} /> Enable Location
              </button>
              <button
                onClick={() => setShowLocationPrompt(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ── 🔍 SMART SEARCH & LOCATION COMMAND BAR ─────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search by doctor name, specialty, qualification, or clinic..."
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl py-3.5 pl-12 pr-11 text-sm sm:text-base focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition-all placeholder:text-gray-400 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setDebouncedSearch(''); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-200 dark:bg-gray-700 p-1.5 rounded-full transition-colors"
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Location Badge / Button */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {locationStatus === 'active' ? (
              <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 px-4 py-2.5 rounded-2xl text-sm font-bold text-teal-800 dark:text-teal-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                </span>
                <Navigation size={14} className="text-teal-600 dark:text-teal-400" />
                <span>GPS Location Active</span>
              </div>
            ) : locationStatus === 'locating' ? (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 px-4 py-2.5 rounded-2xl text-sm font-semibold text-blue-700 dark:text-blue-300">
                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Detecting GPS...</span>
              </div>
            ) : (
              <button
                onClick={requestLocation}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-slate-200 dark:border-gray-600 px-4 py-2.5 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-200 transition-colors"
              >
                <MapPin size={15} className="text-teal-600 dark:text-teal-400" />
                <span>Detect Nearby</span>
              </button>
            )}
          </div>
        </div>

        {/* ── 🩺 SPECIALTIES HORIZONTAL CAROUSEL ──────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-teal-600" />
              Filter by Medical Specialty
            </p>
            {searchFilter !== 'All' && (
              <button
                onClick={() => setSearchFilter('All')}
                className="text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline"
              >
                Reset to All Specialties
              </button>
            )}
          </div>

          <div className="flex overflow-x-auto pb-2 gap-2.5 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => setSearchFilter('All')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap border transition-all duration-200 shrink-0 ${
                searchFilter === 'All'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-slate-200/90 dark:border-gray-700 hover:border-teal-400/60'
              }`}
            >
              <Stethoscope size={16} />
              <span>All Specialties</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                searchFilter === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-gray-700 text-gray-500'
              }`}>
                {doctors.length}
              </span>
            </button>

            {SPECIALTIES.map(spec => {
              const isSelected = searchFilter === spec;
              const count = doctors.filter(d => d.specialty?.toLowerCase().includes(spec.toLowerCase())).length;
              return (
                <button
                  key={spec}
                  onClick={() => setSearchFilter(spec)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap border transition-all duration-200 shrink-0 ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-slate-200/90 dark:border-gray-700 hover:border-teal-400/60 hover:text-teal-600'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : 'text-teal-600 dark:text-teal-400'}>
                    {SPECIALTY_ICONS[spec] || <Stethoscope size={16} />}
                  </span>
                  <span>{spec}</span>
                  {count > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 📊 RESULTS CONTROL BAR (COUNT + ACTIVE FILTERS + SORT + VIEW) ──── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
          {/* Left: Results Count & Active Filter Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-extrabold text-gray-900 dark:text-white">
              {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">available</span>

            {locationStatus === 'active' && (
              <span className="text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/50 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Navigation size={12} /> Sorted Nearest First
              </span>
            )}

            {searchFilter !== 'All' && (
              <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 px-3 py-1 rounded-full flex items-center gap-1.5">
                {searchFilter}
                <button onClick={() => setSearchFilter('All')} className="hover:text-red-500 ml-0.5">
                  <X size={12} />
                </button>
              </span>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs sm:text-sm font-bold text-red-500 hover:text-red-600 dark:text-red-400 hover:underline ml-1"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Right: Sort Dropdown & Grid/List View Toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-slate-200/90 dark:border-gray-700 px-3.5 py-2 rounded-xl shadow-2xs text-sm font-semibold text-gray-700 dark:text-gray-300">
              <ArrowUpDown size={14} className="text-gray-400" />
              <span className="hidden sm:inline text-gray-400">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                aria-label="Sort doctors by"
                className="bg-transparent border-none text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="distance">Nearest Distance</option>
                <option value="rating">Highest Rated</option>
                <option value="fee-asc">Fee: Low to High</option>
                <option value="fee-desc">Fee: High to Low</option>
                <option value="exp">Most Experienced</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-gray-800 p-1 rounded-xl border border-slate-200/60 dark:border-gray-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-300 shadow-2xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-300 shadow-2xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="List View"
                aria-label="List View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── 🩺 DOCTOR CARDS LIST / GRID ───────────────────────────────────── */}
        {loading || !locationResolved ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200/80 dark:border-gray-700 animate-pulse flex flex-col justify-between h-52">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-gray-700 shrink-0" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
                <div className="h-9 bg-slate-200 dark:bg-gray-700 rounded-xl w-full mt-4" />
              </div>
            ))}
          </div>
        ) : filteredDoctors.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDoctors.map(doc => (
                <DoctorCard
                  key={doc.id || doc._id}
                  doctor={doc}
                  showDistance={locationStatus === 'active'}
                  layout="grid"
                  hideVideoAndOnline
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredDoctors.map(doc => (
                <DoctorCard
                  key={doc.id || doc._id}
                  doctor={doc}
                  showDistance={locationStatus === 'active'}
                  layout="list"
                  hideVideoAndOnline
                />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-3xl border border-slate-200/80 dark:border-gray-700 text-center max-w-md mx-auto shadow-sm my-8">
            <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mb-4">
              <Search size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">No doctors match your criteria</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
              We couldn't find any doctors matching your search or filters. Try removing filters or searching for another specialty.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
