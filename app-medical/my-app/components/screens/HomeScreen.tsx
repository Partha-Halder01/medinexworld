"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, Baby, Bot, Brain, Clock3, Heart, MapPin,
  Navigation, Smile, Sparkles, Stethoscope, Syringe,
  User, Video, ChevronRight, CalendarDays, ArrowRight,
  Building2, Search, Star, ShieldCheck, FileText, CheckCircle2,
  Stethoscope as StethoscopeIcon, PhoneCall, Siren, FlaskConical, X, Mail
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { DoctorCard } from '../ui/DoctorCard';
import { BlogCard } from '../ui/BlogCard';
import { BrandLogo } from '../ui/BrandLogo';
import { TestReportEnquiryModal } from '@/components/screens/enquiry/TestReportEnquiryModal';
import { AmbulanceEnquiryModal } from '@/components/screens/enquiry/AmbulanceEnquiryModal';
import { SPECIALTIES } from '@/lib/data';
import Link from 'next/link';

type LocationStatus = 'idle' | 'locating' | 'active' | 'denied';
const GUEST_LOCATION_KEY = 'aurahealth_guest_location';

interface DoctorLite {
  _id: string; name: string; specialty: string; exp: string;
  fee: number; videoFee: number; rating: number;
  distance?: number; address?: string; image?: string; isOnlineNow?: boolean;
  hospitalId?: { name?: string }; isVerified?: boolean;
}
interface AppointmentDoctorLite { name?: string; specialty?: string; }
interface AppointmentLite {
  _id: string; date: string; slot: string; status: string;
  type: 'clinic' | 'video'; doctorId?: AppointmentDoctorLite | string | null;
}
interface AppointmentWithStart extends AppointmentLite { startsAt: Date; }

function parseAppointmentDateTime(dateLabel: string, slotLabel: string): Date | null {
  const withSlot = new Date(`${dateLabel} ${slotLabel}`);
  if (!Number.isNaN(withSlot.getTime())) return withSlot;
  const dateOnly = new Date(dateLabel);
  if (!Number.isNaN(dateOnly.getTime())) return dateOnly;
  return null;
}
function hasValidStart(apt: AppointmentLite & { startsAt: Date | null }): apt is AppointmentWithStart {
  return apt.startsAt instanceof Date;
}
function getUtcHourIST() {
  return Math.floor((Date.now() % 86_400_000 + 19800000) / 3600000) % 24;
}
function getGreeting() {
  const h = getUtcHourIST();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const AVATAR_COLORS = ['bg-blue-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500'];
const getAvatarColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const getInitials = (name: string) => {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

export const HomeScreen = () => {
  const router = useRouter();
  const { handleCategoryClick, currentUser, appointments, isLoggedIn, showToast, setSearchFilter, siteSettings } = useAppContext();
  const { t } = useLanguage();

  const [doctors, setDoctors] = useState<DoctorLite[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorTab, setDoctorTab] = useState<'all' | 'online' | 'nearby'>('all');
  const [showTestModal, setShowTestModal] = useState(false);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const greeting = mounted ? getGreeting() : 'Welcome';
  const displayName = currentUser?.name?.split(' ')[0] || 'there';
  const patientAppointments = appointments as AppointmentLite[];

  useEffect(() => {
    let cancelled = false;
    const loadLocationName = async () => {
      if (!userCoords) {
        if (!cancelled) setLocationName('');
        return;
      }
      const cacheKey = `aurahealth_geo_name_${userCoords.lat.toFixed(3)}_${userCoords.lng.toFixed(3)}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        if (!cancelled) setLocationName(cached);
        return;
      }
      try {
        const res = await fetch(`/api/location/reverse?lat=${userCoords.lat}&lng=${userCoords.lng}`);
        const data = await res.json();
        const shortName = typeof data?.shortName === 'string' ? data.shortName.trim() : '';
        if (!cancelled) setLocationName(shortName);
        if (shortName) localStorage.setItem(cacheKey, shortName);
      } catch {
        if (!cancelled) setLocationName('');
      }
    };
    loadLocationName();
    return () => { cancelled = true; };
  }, [userCoords]);

  const requestCurrentLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setLocationStatus('locating');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setLocationStatus('active');
          try { localStorage.setItem(GUEST_LOCATION_KEY, JSON.stringify(coords)); } catch {}
          setLocationReady(true);
        },
        () => {
          setLocationStatus('denied');
          setLocationReady(true);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationStatus('denied');
      setLocationReady(true);
    }
  };

  useEffect(() => {
    const savedLat = currentUser?.location?.lat;
    const savedLng = currentUser?.location?.lng;
    const hasUserCoords = typeof savedLat === 'number' && Number.isFinite(savedLat) &&
      typeof savedLng === 'number' && Number.isFinite(savedLng);

    if (hasUserCoords) {
      const coords = { lat: savedLat, lng: savedLng };
      setUserCoords(coords); setLocationStatus('active');
      try { localStorage.setItem(GUEST_LOCATION_KEY, JSON.stringify(coords)); } catch {}
      setLocationReady(true); return;
    }
    try {
      const raw = localStorage.getItem(GUEST_LOCATION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { lat?: number; lng?: number };
        if (typeof parsed?.lat === 'number' && Number.isFinite(parsed.lat) &&
          typeof parsed?.lng === 'number' && Number.isFinite(parsed.lng)) {
          setUserCoords({ lat: parsed.lat, lng: parsed.lng });
          setLocationStatus('active'); setLocationReady(true); return;
        }
      }
    } catch {}
    if (navigator.geolocation) {
      setLocationStatus('locating');
      const giveUp = setTimeout(() => {
        setLocationReady(true);
      }, 1500);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(giveUp);
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords); setLocationStatus('active');
          try { localStorage.setItem(GUEST_LOCATION_KEY, JSON.stringify(coords)); } catch {}
          setLocationReady(true);
        },
        () => {
          clearTimeout(giveUp);
          setLocationStatus('denied');
          setLocationReady(true);
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 300000 }
      );
    } else { setLocationStatus('denied'); setLocationReady(true); }
  }, [currentUser?.location?.lat, currentUser?.location?.lng]);

  useEffect(() => {
    let cancelled = false;
    setLoadingDoctors(true);
    const params = new URLSearchParams();
    if (userCoords) {
      params.set('lat', userCoords.lat.toString());
      params.set('lng', userCoords.lng.toString());
    }
    fetch(userCoords ? `/api/doctors?${params}` : '/api/doctors')
      .then(r => r.json())
      .then(data => {
        if (!cancelled && Array.isArray(data)) setDoctors(data);
      })
      .catch((err) => {
        console.error('Failed to fetch doctors:', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingDoctors(false);
      });
    return () => { cancelled = true; };
  }, [userCoords]);

  useEffect(() => {
    fetch(`/api/blogs?limit=3&t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json()).then(data => { if (data.blogs) setBlogs((data.blogs as any[]).slice(0, 3)); })
      .catch(() => {});
  }, []);

  const handleCategorySearch = (category: string) => {
    setSearchFilter(category);
    router.push(`/search?specialty=${encodeURIComponent(category)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchFilter('All');
      router.push('/search');
      return;
    }

    const matchedSpecialty = SPECIALTIES.find(
      s => s.toLowerCase() === query.toLowerCase()
    );

    if (matchedSpecialty) {
      setSearchFilter(matchedSpecialty);
      router.push(`/search?specialty=${encodeURIComponent(matchedSpecialty)}&q=${encodeURIComponent(query)}`);
    } else {
      setSearchFilter('All');
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const categories = [
    { name: 'General Physician', label: 'General Physician', short: 'General',       icon: <Stethoscope size={20} className="sm:w-[22px] sm:h-[22px]" />, bg: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300' },
    { name: 'Cardiologist',       label: 'Cardiology',       short: 'Cardio',        icon: <Heart size={20} className="sm:w-[22px] sm:h-[22px]" />,       bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300' },
    { name: 'Dermatologist',      label: 'Dermatology',      short: 'Derma',         icon: <Sparkles size={20} className="sm:w-[22px] sm:h-[22px]" />,    bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300' },
    { name: 'Pediatrician',       label: 'Pediatrics',       short: 'Pediatric',     icon: <Baby size={20} className="sm:w-[22px] sm:h-[22px]" />,        bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300' },
    { name: 'Dentist',            label: 'Dental Care',      short: 'Dentist',       icon: <Smile size={20} className="sm:w-[22px] sm:h-[22px]" />,       bg: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300' },
    { name: 'Neurologist',        label: 'Neurology',        short: 'Neurology',     icon: <Brain size={20} className="sm:w-[22px] sm:h-[22px]" />,       bg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300' },
    { name: 'Orthopedic',         label: 'Orthopedics',      short: 'Orthopedic',    icon: <Activity size={20} className="sm:w-[22px] sm:h-[22px]" />,    bg: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300' },
    { name: 'ENT Specialist',     label: 'ENT Specialist',   short: 'ENT Care',      icon: <Syringe size={20} className="sm:w-[22px] sm:h-[22px]" />,     bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' },
  ];

  const formattedLocation = useMemo(() => {
    if (!locationName) return '';
    return locationName
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
  }, [locationName]);

  const nearbyDoctors = useMemo(() =>
    locationStatus === 'active' ? doctors.filter(d => typeof d.distance === 'number' && d.distance < 9999) : doctors,
    [doctors, locationStatus]);
  // Live presence comes from chamber check-in, not a manual online toggle.
  const onlineDoctors = useMemo(() => doctors.filter(d => Boolean((d as { inChamberNow?: unknown }).inChamberNow)), [doctors]);

  const filteredDoctors = useMemo(() => {
    if (doctorTab === 'online') return onlineDoctors;
    if (doctorTab === 'nearby') return nearbyDoctors;
    return doctors;
  }, [doctorTab, onlineDoctors, nearbyDoctors, doctors]);

  const displayDoctors = useMemo(() => filteredDoctors.slice(0, 6), [filteredDoctors]);

  const upcomingAppointments = useMemo(() =>
    patientAppointments
      .filter(apt => apt.status === 'Confirmed')
      .map(apt => ({ ...apt, startsAt: parseAppointmentDateTime(apt.date, apt.slot) }))
      .filter(hasValidStart)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    [patientAppointments]);

  const nextAppointment = upcomingAppointments[0];
  const nextDoctor = nextAppointment && typeof nextAppointment.doctorId === 'object' ? nextAppointment.doctorId : null;

  return (
    <div className="px-4 sm:px-6 md:px-8 py-5 md:py-7 space-y-7 w-full max-w-[96rem] mx-auto antialiased">

      {/* ── Top Bar (Mobile) ── */}
      <div className="flex justify-between items-center md:hidden pb-1">
        <div className="flex flex-col">
          <BrandLogo width={115} height={38} imageClassName="h-[38px] w-auto max-w-[130px] object-contain" showName={false} priority />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-0.5">
            {greeting}, <span className="font-bold text-slate-800 dark:text-white">{displayName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {formattedLocation && (
            <button
              type="button"
              onClick={requestCurrentLocation}
              title="Detect or change location"
              className="flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200/80 dark:border-slate-700/80 shadow-2xs active:scale-95 transition-all shrink-0"
            >
              <Navigation size={13} className="text-teal-600 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[150px]">{formattedLocation}</span>
            </button>
          )}
          <button
            onClick={() => router.push('/profile')}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white dark:ring-slate-800 shadow-xs active:scale-95 transition-transform ${
              isLoggedIn && currentUser?.name ? `${getAvatarColor(currentUser.name)} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {isLoggedIn && currentUser?.name ? getInitials(currentUser.name) : <User size={17} />}
          </button>
        </div>
      </div>

      {/* ── Top Navigation Bar (Desktop) ── */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {greeting}, <span className="text-teal-700 dark:text-teal-400 font-extrabold">{displayName}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {locationStatus === 'active' && formattedLocation ? (
              <span className="flex items-center gap-1.5">
                <Navigation size={13} className="text-teal-600" /> Showing medical practitioners in <strong>{formattedLocation}</strong>
              </span>
            ) : (
              'Book in-clinic appointments and consult verified doctors near you'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/doctor-login"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <StethoscopeIcon size={14} className="text-teal-600" /> Doctor Portal
          </Link>
          <Link
            href="/hospital-admin/login"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Building2 size={14} className="text-blue-600" /> Hospital / Nursing Home
          </Link>
        </div>
      </div>

      {/* ── 🌟 CLEAN, AUTHENTIC HEALTHCARE HERO BANNER ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-blue-500/5 dark:from-slate-850 dark:via-slate-850 dark:to-slate-900 rounded-2xl sm:rounded-3xl border border-teal-100/80 dark:border-slate-700/80 p-4 sm:p-6 md:p-8 lg:p-10 shadow-xs">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-teal-400/10 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center relative z-10">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm sm:text-base font-bold bg-white/90 dark:bg-slate-800/90 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-700/60 shadow-2xs backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <CheckCircle2 size={16} className="text-teal-600 dark:text-teal-400" />
              <span>Verified Doctors & Clinics</span>
            </div>

            <h2 className="text-[27px] sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-[1.25] tracking-tight">
              Find & Book Top Doctors <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">Near You</span>{' '}
              <span className="text-slate-400 dark:text-slate-500 font-normal text-lg sm:text-2xl">for</span>{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">In-Clinic Visits</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Book confirmed in-clinic appointments with verified medical specialists in your city.
            </p>

            {/* Practical Search Box */}
            <form onSubmit={handleSearchSubmit} className="pt-1">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-2 sm:p-2.5 shadow-sm transition-all focus-within:shadow-md focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20">
                {/* Mobile Location Micro-Row */}
                <div className="flex sm:hidden items-center justify-between px-3 py-2 mb-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin size={15} className="text-teal-600 shrink-0" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                      {formattedLocation || 'Near You'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={requestCurrentLocation}
                    className="text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline shrink-0"
                  >
                    {locationStatus === 'locating' ? 'Locating...' : 'Change'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Desktop Location Segment */}
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 border-r border-slate-200 dark:border-slate-700 sm:max-w-xs shrink-0">
                    <MapPin size={18} className="text-teal-600 shrink-0" />
                    <span className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300 truncate">
                      {formattedLocation || 'Near You'}
                    </span>
                  </div>

                  {/* Search Input */}
                  <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 flex-1 min-w-0">
                    <Search size={19} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search doctor, clinic, or specialty..."
                      className="w-full text-sm sm:text-base bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-medium"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Search Button */}
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm sm:text-base px-5 sm:px-7 py-2.5 rounded-xl shadow-xs transition-all shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>Search</span>
                    <ArrowRight size={15} className="hidden sm:inline" />
                  </button>
                </div>
              </div>
            </form>

            {/* Popular Searches */}
            <div className="flex items-center gap-1.5 pt-1 text-sm text-slate-500 dark:text-slate-400 overflow-x-auto scrollbar-hide py-0.5 -mx-1 px-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-sm shrink-0">Popular:</span>
              {['General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician', 'Dentist', 'Gynecologist'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleCategorySearch(tag)}
                  className="px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 hover:text-teal-700 dark:hover:text-teal-300 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-all font-semibold text-sm shrink-0 shadow-2xs active:scale-95 whitespace-nowrap"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Mobile Trust & Quick Booking Ribbon */}
            <div className="lg:hidden flex items-center justify-between p-3 rounded-2xl bg-white/85 dark:bg-slate-850/85 border border-teal-100/90 dark:border-slate-700/80 shadow-2xs mt-2 backdrop-blur-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-xl overflow-hidden border border-teal-500/30 shadow-2xs">
                    <img
                      src="/images/doctor_priya_clinic.jpg"
                      alt="Verified In-Clinic Doctor"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-base font-black text-slate-900 dark:text-white leading-tight truncate">Verified In-Clinic Doctors</p>
                    <span className="text-xs font-bold uppercase px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 rounded shrink-0">Today</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 font-medium truncate">Top-rated specialists available in {locationName || 'your area'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/search')}
                className="shrink-0 text-sm font-black text-teal-700 dark:text-teal-300 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/40 dark:hover:bg-teal-900/70 border border-teal-200/80 dark:border-teal-700/80 px-4 py-2 rounded-xl transition-colors active:scale-95 ml-2"
              >
                Book →
              </button>
            </div>
          </div>

          {/* Desktop Right Hero: Real Clinic Photo */}
          <div className="hidden lg:flex lg:col-span-5 relative items-center justify-center">
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-md border border-slate-200/80 dark:border-slate-700 group">
              <img
                src="/images/doctor_priya_clinic.jpg"
                alt="Consultant Physician Clinic Consultation"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-2.5 shadow-sm border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Verified In-Clinic Doctors</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Consultations available today</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/search')}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Book →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 🚀 CORE SERVICES (Polished 4 Healthcare Action Cards) ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          {
            title: 'Book Doctor Visit',
            desc: 'Find clinics within 5km',
            icon: <Stethoscope size={20} className="text-white sm:w-[22px] sm:h-[22px]" />,
            iconBg: 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-500/25',
            badge: 'Instant Slot',
            hasPulse: false,
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
            cardBg: 'bg-gradient-to-br from-teal-500/6 via-emerald-500/3 to-white dark:from-teal-950/20 dark:via-slate-850 dark:to-slate-900 border-teal-200/70 dark:border-teal-900/50 hover:border-teal-400',
            path: '/search',
            isComingSoon: false,
            toastMsg: '',
          },
          {
            title: 'AI Chatbot',
            desc: 'Coming Soon',
            icon: <Bot size={20} className="text-white sm:w-[22px] sm:h-[22px]" />,
            iconBg: 'bg-gradient-to-br from-cyan-500 to-teal-600 shadow-cyan-500/25',
            badge: 'Coming Soon',
            hasPulse: false,
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/90 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80 font-bold',
            cardBg: 'bg-gradient-to-br from-cyan-500/5 via-amber-500/5 to-white dark:from-slate-800/60 dark:via-slate-850 dark:to-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700',
            path: '#',
            isComingSoon: true,
            toastMsg: 'AI Chatbot is coming soon! Stay tuned.',
          },
          {
            title: 'Hospitals / Nursing Homes',
            desc: 'Multi-specialty care',
            icon: <Building2 size={20} className="text-white sm:w-[22px] sm:h-[22px]" />,
            iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/25',
            badge: 'Verified',
            hasPulse: false,
            badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60',
            cardBg: 'bg-gradient-to-br from-indigo-500/6 via-purple-500/3 to-white dark:from-indigo-950/20 dark:via-slate-850 dark:to-slate-900 border-indigo-200/70 dark:border-indigo-900/50 hover:border-indigo-400',
            path: '/hospital',
            isComingSoon: false,
            toastMsg: '',
          },
          {
            title: 'Video Consultation',
            desc: 'Coming Soon',
            icon: <Video size={20} className="text-white sm:w-[22px] sm:h-[22px]" />,
            iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25',
            badge: 'Coming Soon',
            hasPulse: false,
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/90 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80 font-bold',
            cardBg: 'bg-gradient-to-br from-blue-500/5 via-amber-500/5 to-white dark:from-slate-800/60 dark:via-slate-850 dark:to-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700',
            path: '#',
            isComingSoon: true,
            toastMsg: 'Video Consultation is coming soon! Stay tuned.',
          },
        ].map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              if (item.isComingSoon) {
                showToast(item.toastMsg || `${item.title} is coming soon!`);
                return;
              }
              router.push(item.path);
            }}
            className={`group rounded-2xl sm:rounded-3xl p-3 sm:p-4 border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between active:scale-[0.98] min-w-0 ${item.cardBg}`}
          >
            <div className="flex items-center justify-between gap-1 w-full mb-2 sm:mb-3">
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${item.iconBg} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0`}>
                {item.icon}
              </div>
              <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border shadow-2xs whitespace-nowrap ${item.badgeClass}`}>
                {item.hasPulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                {item.isComingSoon && <Clock3 size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />}
                <span>{item.badge}</span>
              </span>
            </div>
            <div className="min-w-0 w-full">
              <p className="font-extrabold text-sm min-[380px]:text-[15px] sm:text-lg text-slate-900 dark:text-white leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                {item.title}
              </p>
              <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 font-medium line-clamp-1 ${item.isComingSoon ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                {item.desc}
              </p>
            </div>
          </button>
        ))}
      </section>

      {/* ── 🚑 🧪 TWO CORE ENQUIRY SERVICES (Ambulance + Test Reports) ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Ambulance Enquiry Card */}
        <div 
          onClick={() => setShowAmbulanceModal(true)}
          className="group relative overflow-hidden bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent dark:from-red-950/30 dark:via-slate-800 dark:to-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-red-200/80 dark:border-red-900/50 shadow-xs hover:shadow-md hover:border-red-500/50 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2.5 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform shrink-0">
              <Siren size={22} className="sm:w-[26px] sm:h-[26px] animate-pulse" />
            </div>
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300 px-3 py-1 rounded-full border border-red-200 dark:border-red-800 whitespace-nowrap">
              🚨 24/7 Rapid Response
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-lg sm:text-xl md:text-2xl text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
              Ambulance Booking & Enquiry
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 mt-1 sm:mt-2 line-clamp-2 leading-relaxed">
              Instant emergency dispatch & planned transfers with GPS tracking, oxygen & ICU life support.
            </p>
          </div>
          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-red-100 dark:border-red-900/30 flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2">
            <span className="text-sm sm:text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
              Request Ambulance Now <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-md self-start min-[420px]:self-auto">
              Fast Dispatch
            </span>
          </div>
        </div>

        {/* Test Report Enquiry Card */}
        <div 
          onClick={() => setShowTestModal(true)}
          className="group relative overflow-hidden bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-transparent dark:from-teal-950/30 dark:via-slate-800 dark:to-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-teal-200/80 dark:border-teal-900/50 shadow-xs hover:shadow-md hover:border-teal-500/50 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2.5 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30 group-hover:scale-105 transition-transform shrink-0">
              <FlaskConical size={22} className="sm:w-[26px] sm:h-[26px]" />
            </div>
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-300 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 whitespace-nowrap">
              🧪 Diagnostic Review
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-lg sm:text-xl md:text-2xl text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
              Test & Lab Report Enquiry
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 mt-1 sm:mt-2 line-clamp-2 leading-relaxed">
              Upload doctor prescription or test report to get pathology discount quotes and home sample pickup.
            </p>
          </div>
          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-teal-100 dark:border-teal-900/30 flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2">
            <span className="text-sm sm:text-base font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              Enquire Test / Upload Report <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-md self-start min-[420px]:self-auto">
              Home Sample Available
            </span>
          </div>
        </div>
      </section>

      {/* ── 📅 UPCOMING APPOINTMENT (If active) ── */}
      {nextAppointment && (
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-teal-200 dark:border-teal-800/60 shadow-xs p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shrink-0">
              <CalendarDays size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 px-2.5 py-0.5 rounded">
                  Upcoming Appointment
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">{nextAppointment.date} at {nextAppointment.slot}</span>
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-base mt-0.5">
                {nextDoctor?.name || 'Doctor Consultation'} • <span className="text-teal-600 font-semibold">{nextDoctor?.specialty || 'Specialist'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/appointments')}
            className="text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors self-end sm:self-auto"
          >
            View Details
          </button>
        </section>
      )}

      {/* ── 🩺 BROWSE BY MEDICAL SPECIALTY (Optimized 4-Col Grid on Mobile) ── */}
      <section className="space-y-3 sm:space-y-3.5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-lg sm:text-xl md:text-2xl text-slate-900 dark:text-white">Top Medical Specialties</h3>
            <p className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400">Consult with specialists for your health symptoms</p>
          </div>
          <button
            onClick={() => handleCategorySearch('All')}
            className="text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 shrink-0"
          >
            See All <ChevronRight size={14} />
          </button>
        </div>

        {/* 4 columns on mobile (neat 2 rows of 4 pills without character clipping) */}
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleCategorySearch(cat.name)}
              className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-700/60 flex flex-col items-center gap-1 sm:gap-2 text-center transition-all group active:scale-95 shadow-2xs hover:shadow-xs min-w-0"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${cat.bg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs shrink-0`}>
                {cat.icon}
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-teal-600 transition-colors w-full text-center line-clamp-2 min-h-[2.2em] flex items-center justify-center px-0.5">
                <span className="sm:hidden">{cat.short}</span>
                <span className="hidden sm:inline">{cat.label}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 👨‍⚕️ TOP RATED DOCTORS NEAR YOU ── */}
      <section className="space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div>
            <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white leading-tight break-words">
              Doctors Available in {formattedLocation || 'Your City'}
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400 mt-0.5">
              Verified clinical experience and patient ratings
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto text-xs sm:text-sm font-bold overflow-x-auto max-w-full">
            <button
              onClick={() => setDoctorTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                doctorTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Doctors ({doctors.length})
            </button>
            <button
              onClick={() => setDoctorTab('online')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
                doctorTab === 'online'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              In Chamber Now ({onlineDoctors.length})
            </button>
            {locationStatus === 'active' && (
              <button
                onClick={() => setDoctorTab('nearby')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  doctorTab === 'nearby'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Nearby ({nearbyDoctors.length})
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {loadingDoctors ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 animate-pulse flex gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </div>
              </div>
            ))
          ) : displayDoctors.length > 0 ? (
            displayDoctors.map((doc) => (
              <DoctorCard key={doc._id} doctor={doc} showDistance={locationStatus === 'active'} />
            ))
          ) : (
            <div className="col-span-full text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <Stethoscope size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-base font-semibold text-slate-500">No doctors match this filter currently.</p>
              <button
                onClick={() => setDoctorTab('all')}
                className="mt-2 text-base font-bold text-teal-600 hover:underline"
              >
                Show all doctors
              </button>
            </div>
          )}
        </div>

        <div className="text-center pt-1">
          <button
            onClick={() => router.push('/search')}
            className="inline-flex items-center gap-2 text-base font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 px-6 py-3 rounded-xl transition-colors border border-teal-200/60 dark:border-teal-800/40 shadow-xs"
          >
            <span>View All Doctors & Clinics</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── 📚 HEALTH & WELLNESS ARTICLES ── */}
      {blogs.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-2xl text-slate-900 dark:text-white">Health & Wellness Guides</h3>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Doctor-reviewed advice for everyday healthy living</p>
            </div>
            <Link href="/blog" className="text-sm sm:text-base font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5">
              All Articles <ChevronRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {blogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        </section>
      )}

      {/* ── 🩺 DOCTOR REGISTRATION PROMPT ── */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
            <StethoscopeIcon size={24} />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-lg md:text-xl">
              Are you a licensed doctor or clinic owner?
            </h4>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-0.5">
              Join the Medinex World network to manage patient bookings and digital prescriptions.
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/doctor-apply')}
          className="text-sm sm:text-base font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shrink-0"
        >
          Join as Doctor
        </button>
      </section>

      {/* ── 🌟 SIMPLE, CLEAN FOOTER ── */}
      <footer className="pt-6 pb-2 border-t border-slate-200/80 dark:border-slate-800 text-sm text-slate-500 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <BrandLogo width={120} height={42} showName={false} />
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Connecting you to trusted care • Verified healthcare network
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
          <Link href="/search" className="hover:text-teal-600">Find Doctors</Link>
          <button
            type="button"
            onClick={() => showToast('AI Chatbot is coming soon! Stay tuned.')}
            className="hover:text-teal-600 cursor-pointer flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            <span>AI Chatbot</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/60">Soon</span>
          </button>
          <Link href="/hospital" className="hover:text-teal-600">Hospitals / Nursing Homes</Link>
          <Link href="/blog" className="hover:text-teal-600">Health Blog</Link>
          <Link href="/doctor-apply" className="hover:text-teal-600">Join as Doctor</Link>
          <Link href="/doctor-login" className="hover:text-teal-600">Doctor Portal</Link>
          <Link href="/admin" className="hover:text-teal-600">Admin Login</Link>
        </div>

        {/* Dynamic Website Contact Bar */}
        <div className="flex flex-wrap items-center gap-y-2.5 gap-x-5 text-sm py-3 px-4 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
          {siteSettings?.supportPhone && (
            <a
              href={`tel:${siteSettings.supportPhone.replace(/[^\d+]/g, '')}`}
              className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 hover:text-teal-600 transition-colors"
            >
              <PhoneCall size={15} className="text-teal-600 shrink-0" />
              <span>Helpline: {siteSettings.supportPhone}</span>
            </a>
          )}
          {siteSettings?.supportEmail && (
            <a
              href={`mailto:${siteSettings.supportEmail}`}
              className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400 hover:text-teal-600 transition-colors"
            >
              <Mail size={15} className="text-blue-500 shrink-0" />
              <span>{siteSettings.supportEmail}</span>
            </a>
          )}
          {siteSettings?.emergencyPhone && (
            <a
              href={`tel:${siteSettings.emergencyPhone.replace(/[^\d+]/g, '')}`}
              className="flex items-center gap-1.5 font-black text-rose-600 dark:text-rose-400 hover:underline"
            >
              <Siren size={15} className="text-rose-500 shrink-0 animate-pulse" />
              <span>24/7 Emergency: {siteSettings.emergencyPhone}</span>
            </a>
          )}
          {siteSettings?.contactAddress && (
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <MapPin size={15} className="text-slate-400 shrink-0" />
              <span>{siteSettings.contactAddress}</span>
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          <strong className="text-rose-600 dark:text-rose-400 font-bold">Emergency notice:</strong> If you or someone with you is experiencing a medical emergency, request an ambulance or visit your nearest hospital emergency ward immediately.
        </div>

        <p className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
          © {new Date().getFullYear()} Medinex World. All rights reserved.
        </p>
      </footer>

      {/* ── Enquiry Modals ── */}
      <TestReportEnquiryModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
      />
      <AmbulanceEnquiryModal
        isOpen={showAmbulanceModal}
        onClose={() => setShowAmbulanceModal(false)}
      />

    </div>
  );
};
