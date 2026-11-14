"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Activity, Baby, Bot, Brain, Clock3, Heart, MapPin,
  Navigation, Smile, Sparkles, Stethoscope, Syringe,
  User, Video, ChevronRight, CalendarDays, ArrowRight,
  Building2, Search, Star, ShieldCheck, FileText, CheckCircle2,
  Stethoscope as StethoscopeIcon, PhoneCall, Siren, FlaskConical, X, Mail,
  Pill, Truck, PackageCheck, HeartHandshake
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { DoctorCard } from '../ui/DoctorCard';
import { BlogCard } from '../ui/BlogCard';
import { BrandLogo } from '../ui/BrandLogo';
import { TestReportEnquiryModal } from '@/components/screens/enquiry/TestReportEnquiryModal';
import { AmbulanceEnquiryModal } from '@/components/screens/enquiry/AmbulanceEnquiryModal';
import { MedicineDeliveryModal } from '@/components/screens/enquiry/MedicineDeliveryModal';
import { HomeCareEnquiryModal } from '@/components/screens/enquiry/HomeCareEnquiryModal';
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
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showHomeCareModal, setShowHomeCareModal] = useState(false);

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
        <Link href="/" className="flex items-center">
          <BrandLogo width={155} height={52} imageClassName="h-[50px] sm:h-[56px] w-auto max-w-[170px] object-contain" showName={false} priority />
        </Link>
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

      {/* ── 🌟 REDESIGNED PREMIUM HEALTHCARE HERO CARD (BIG DOCTOR PHOTO) ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-500/[0.08] via-cyan-500/[0.04] to-emerald-500/[0.08] dark:from-slate-900 dark:via-slate-850 dark:to-teal-950/40 rounded-3xl border border-teal-200/70 dark:border-slate-700/80 p-4 sm:p-6 md:p-8 lg:p-9 shadow-sm">
        {/* Soft Ambient Background Glows */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-teal-400/15 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center relative z-10">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-4">
            {/* Trust Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold bg-white/95 dark:bg-slate-800/90 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-700/70 shadow-xs backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <CheckCircle2 size={15} className="text-teal-600 dark:text-teal-400" />
              <span>Verified Doctors & Instant Appointments</span>
            </div>

            {/* Hero Main Heading */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-[1.2] tracking-tight">
              Find & Book Top Doctors <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">Near You</span>{' '}
              <span className="text-slate-400 dark:text-slate-500 font-normal text-lg sm:text-2xl">for</span>{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">In-Clinic Visits</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Book confirmed in-clinic appointments with verified medical specialists in your city with guaranteed consultation slots.
            </p>

            {/* Modern Search Box */}
            <form onSubmit={handleSearchSubmit} className="pt-1">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-2 sm:p-2.5 shadow-sm transition-all focus-within:shadow-md focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20">
                {/* Mobile Location Micro-Row */}
                <div className="flex sm:hidden items-center justify-between px-3 py-1.5 mb-1.5 bg-teal-50/70 dark:bg-slate-800/70 rounded-xl border border-teal-100 dark:border-slate-700/80">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin size={14} className="text-teal-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                      {formattedLocation || 'Near You'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={requestCurrentLocation}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline shrink-0"
                  >
                    {locationStatus === 'locating' ? 'Locating...' : 'Change'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Desktop Location Segment */}
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 border-r border-slate-200 dark:border-slate-700 sm:max-w-xs shrink-0">
                    <MapPin size={17} className="text-teal-600 shrink-0" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                      {formattedLocation || 'Near You'}
                    </span>
                  </div>

                  {/* Search Input */}
                  <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 flex-1 min-w-0">
                    <Search size={18} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search doctor, clinic, or specialty..."
                      className="w-full text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-medium"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* Search Button */}
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm px-4 sm:px-6 py-2.5 rounded-xl shadow-xs transition-all shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>Search</span>
                    <ArrowRight size={14} className="hidden sm:inline" />
                  </button>
                </div>
              </div>
            </form>

            {/* Popular Searches */}
            <div className="flex items-center gap-1.5 pt-0.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto scrollbar-none py-0.5 -mx-1 px-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">Popular:</span>
              {['General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician', 'Dentist', 'Gynecologist'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleCategorySearch(tag)}
                  className="px-3 py-1 rounded-full bg-white/95 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 hover:text-teal-700 dark:hover:text-teal-300 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-all font-semibold text-xs shrink-0 shadow-2xs active:scale-95 whitespace-nowrap"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* 📸 MOBILE BIG DOCTOR HERO BANNER (Full-width, prominent, attractive AI Doctor photo) 📸 */}
            <div className="lg:hidden relative rounded-2xl overflow-hidden shadow-lg border-2 border-white dark:border-slate-700 bg-slate-900 group mt-3">
              <img
                src="/images/hero_doctor_banner.jpg"
                alt="Verified Top Doctor Specialist"
                className="w-full h-56 sm:h-64 object-cover object-top group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-between p-4 pointer-events-none" />

              {/* Floating Top Badges */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                <span className="bg-emerald-500/95 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>Doctors Available Now</span>
                </span>
                <span className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Star size={13} className="fill-amber-400 text-amber-400" /> 4.9 Rating
                </span>
              </div>

              {/* Bottom Info & CTA */}
              <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-white font-black text-base sm:text-lg drop-shadow-md">Consult Top Specialists</p>
                  <p className="text-teal-300 text-xs sm:text-sm font-semibold drop-shadow-sm truncate">Verified clinics in {formattedLocation || 'your area'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/search')}
                  className="bg-white hover:bg-teal-50 text-teal-700 text-xs sm:text-sm font-black px-4 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  <span>Book Visit</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Right Hero: AI Doctor Showcase with Floating Badges */}
          <div className="hidden lg:flex lg:col-span-5 relative items-center justify-center">
            <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border-2 border-white/80 dark:border-slate-700/80 group bg-slate-100 dark:bg-slate-800">
              <img
                src="/images/hero_doctor_banner.jpg"
                alt="Top Rated Verified Medical Specialist"
                className="w-full h-[430px] object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              {/* Soft gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

              {/* Floating Top Badge: Rating */}
              <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-white/50 dark:border-slate-700 flex items-center gap-1.5">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-extrabold text-slate-800 dark:text-white">4.9/5</span>
                <span className="text-[11px] text-slate-500 font-medium">(1,200+ Reviews)</span>
              </div>

              {/* Floating Top Right: Verified Badge */}
              <div className="absolute top-4 right-4 bg-emerald-500/95 text-white backdrop-blur-md px-2.5 py-1 rounded-xl shadow-md text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck size={14} />
                <span>100% Verified</span>
              </div>

              {/* Bottom Floating Glass Card */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">In-Clinic Consultations</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
                    Top specialists available today
                  </p>
                </div>
                <button
                  onClick={() => router.push('/search')}
                  className="text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95 shrink-0 flex items-center gap-1"
                >
                  <span>Book</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 🚀 CORE SERVICES (4 Healthcare Action Cards with Service Photos) ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: 'Book Doctor Visit',
            desc: 'Find clinics within 5km',
            image: '/images/doctor_consult_care.jpg',
            icon: <Stethoscope size={16} className="text-white" />,
            iconBg: 'bg-teal-600',
            badge: 'Instant Slot',
            hasPulse: true,
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60',
            cardBorder: 'border-teal-200/80 dark:border-teal-900/50 hover:border-teal-500',
            path: '/search',
            isComingSoon: false,
            toastMsg: '',
          },
          {
            title: 'AI Chatbot',
            desc: 'Instant Symptom Analysis',
            image: '/images/ai_symptom_checker.jpg',
            icon: <Bot size={16} className="text-white" />,
            iconBg: 'bg-cyan-600',
            badge: 'Coming Soon',
            hasPulse: false,
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/90 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80',
            cardBorder: 'border-slate-200/80 dark:border-slate-800 hover:border-amber-400',
            path: '#',
            isComingSoon: true,
            toastMsg: 'AI Chatbot is coming soon! Stay tuned.',
          },
          {
            title: 'Clinics & Hospitals',
            desc: 'Browse doctors by clinic',
            image: '/images/modern_hospital_care.jpg',
            icon: <Building2 size={16} className="text-white" />,
            iconBg: 'bg-indigo-600',
            badge: 'Verified',
            hasPulse: false,
            badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800/60',
            cardBorder: 'border-indigo-200/80 dark:border-indigo-900/50 hover:border-indigo-500',
            path: '/clinics',
            isComingSoon: false,
            toastMsg: '',
          },
          {
            title: 'Video Consultation',
            desc: 'Tele-consult from home',
            image: '/images/telemedicine_call.jpg',
            icon: <Video size={16} className="text-white" />,
            iconBg: 'bg-blue-600',
            badge: 'Coming Soon',
            hasPulse: false,
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/90 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80',
            cardBorder: 'border-slate-200/80 dark:border-slate-800 hover:border-amber-400',
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
            className={`group rounded-2xl sm:rounded-3xl overflow-hidden border bg-white dark:bg-slate-850 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all text-left flex flex-col justify-between active:scale-[0.98] min-w-0 ${item.cardBorder}`}
          >
            {/* Service Image Header with Badge Overlay */}
            <div className="relative w-full h-24 min-[400px]:h-28 sm:h-32 overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />
              
              {/* Top Row: Icon Pill & Status Badge */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl ${item.iconBg} flex items-center justify-center shadow-xs text-white`}>
                  {item.icon}
                </div>
                <span className={`inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-2xs backdrop-blur-xs ${item.badgeClass}`}>
                  {item.hasPulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  {item.isComingSoon && <Clock3 size={10} className="text-amber-600 dark:text-amber-400 shrink-0" />}
                  <span>{item.badge}</span>
                </span>
              </div>
            </div>

            {/* Service Info Content */}
            <div className="p-3 sm:p-3.5 min-w-0 w-full flex-1 flex flex-col justify-between">
              <div>
                <p className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                  {item.title}
                </p>
                <p className={`text-[11px] sm:text-xs mt-1 font-medium line-clamp-1 ${item.isComingSoon ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                  {item.desc}
                </p>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
                <span className="text-[11px]">Explore</span>
                <ArrowRight size={13} />
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* ── 🚑 🧪 💊 🏡 4 CORE HEALTHCARE ACTION SERVICES (Ambulance + Diagnostic Services + Medicine Door Delivery + Home Care Service with Brand Logo) ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Ambulance Services Card */}
        <div 
          onClick={() => setShowAmbulanceModal(true)}
          className="group relative overflow-hidden bg-white dark:bg-slate-850 rounded-2xl sm:rounded-3xl border border-red-200/90 dark:border-red-900/60 shadow-xs hover:shadow-xl hover:border-red-500/60 transition-all cursor-pointer flex flex-col justify-between"
        >
          {/* Header Image with Gradient Overlay & Brand Logo */}
          <div className="relative w-full h-36 sm:h-44 overflow-hidden bg-slate-900">
            <img
              src="/images/ambulance_service.jpg"
              alt="Emergency Ambulance Booking & Dispatch"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />
            
            {/* Floating Top Bar: Icon + Category Badge + Brand Logo */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/40">
                  <Siren size={18} className="animate-pulse" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-red-600/95 text-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>24/7 Rapid</span>
                </span>
              </div>
              
              {/* Brand Logo Badge */}
              <div className="flex items-center bg-white/95 dark:bg-slate-900/95 px-2.5 py-1 rounded-xl shadow-md border border-white/50 backdrop-blur-md shrink-0">
                <Image src="/newlogos.png" alt="Medinex World" width={68} height={22} className="h-4 w-auto object-contain" priority />
              </div>
            </div>

            {/* Image Overlay Title */}
            <div className="absolute bottom-3 left-3.5 right-3.5">
              <h3 className="font-black text-lg sm:text-xl text-white leading-tight drop-shadow-sm">
                Ambulance Services & Booking
              </h3>
              <p className="text-red-200 text-xs sm:text-sm font-medium mt-0.5 line-clamp-1">
                Normal, ICU & Air Ambulance emergency transfers
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Equipped with GPS tracking, oxygen & ventilator life support, and prompt dispatch for local & outstation transfers.
            </p>

            {/* 3 Ambulance Services Indicator Badges */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-lg border border-red-200/70 dark:border-red-800/60 flex items-center gap-1">
                <span>🚑</span>
                <span>Normal Ambulance</span>
              </span>
              <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-lg border border-red-200/70 dark:border-red-800/60 flex items-center gap-1">
                <span>🏥</span>
                <span>ICU Ambulance</span>
              </span>
              <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-lg border border-red-200/70 dark:border-red-800/60 flex items-center gap-1">
                <span>🚁</span>
                <span>Air Ambulance</span>
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-red-100 dark:border-red-900/30 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-extrabold text-red-600 dark:text-red-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Request Ambulance Now <ArrowRight size={14} />
              </span>
              <span className="text-[10px] font-extrabold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-md border border-red-200/60 dark:border-red-800/60">
                ⚡ Fast Dispatch
              </span>
            </div>
          </div>
        </div>

        {/* 2. Test Report Enquiry Card */}
        <div 
          onClick={() => setShowTestModal(true)}
          className="group relative overflow-hidden bg-white dark:bg-slate-850 rounded-2xl sm:rounded-3xl border border-teal-200/90 dark:border-teal-900/60 shadow-xs hover:shadow-xl hover:border-teal-500/60 transition-all cursor-pointer flex flex-col justify-between"
        >
          {/* Header Image with Gradient Overlay & Brand Logo */}
          <div className="relative w-full h-36 sm:h-44 overflow-hidden bg-slate-900">
            <img
              src="/images/lab_test_service.jpg"
              alt="Pathology Diagnostic Lab Test Enquiry"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />
            
            {/* Floating Top Bar: Icon + Category Badge + Brand Logo */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/40">
                  <FlaskConical size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-teal-600/95 text-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-xs">
                  <span>🧪 Diagnostic Services</span>
                </span>
              </div>
              
              {/* Brand Logo Badge */}
              <div className="flex items-center bg-white/95 dark:bg-slate-900/95 px-2.5 py-1 rounded-xl shadow-md border border-white/50 backdrop-blur-md shrink-0">
                <Image src="/newlogos.png" alt="Medinex World" width={68} height={22} className="h-4 w-auto object-contain" priority />
              </div>
            </div>

            {/* Image Overlay Title */}
            <div className="absolute bottom-3 left-3.5 right-3.5">
              <h3 className="font-black text-lg sm:text-xl text-white leading-tight drop-shadow-sm">
                Diagnostic Services
              </h3>
              <p className="text-teal-200 text-xs sm:text-sm font-medium mt-0.5 line-clamp-1">
                Pathology discounts & doorstep sample collection
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Upload your doctor's prescription or lab report to compare pathology costs, get discounts, and schedule doorstep sample pickup.
            </p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-lg border border-teal-200/70 dark:border-teal-800/60 flex items-center gap-1">
                <span>📋</span>
                <span>Upload Prescription</span>
              </span>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-lg border border-teal-200/70 dark:border-teal-800/60 flex items-center gap-1">
                <span>🏠</span>
                <span>Home Sample Pickup</span>
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-teal-100 dark:border-teal-900/30 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Enquire Test / Upload <ArrowRight size={14} />
              </span>
              <span className="text-[10px] font-extrabold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/60">
                🏠 Home Collection
              </span>
            </div>
          </div>
        </div>

        {/* 3. Medicine Door Delivery Card (NEW with Brand Logo) */}
        <div 
          onClick={() => setShowMedicineModal(true)}
          className="group relative overflow-hidden bg-white dark:bg-slate-850 rounded-2xl sm:rounded-3xl border border-blue-200/90 dark:border-blue-900/60 shadow-xs hover:shadow-xl hover:border-blue-500/60 transition-all cursor-pointer flex flex-col justify-between"
        >
          {/* Header Image with Gradient Overlay & Brand Logo */}
          <div className="relative w-full h-36 sm:h-44 overflow-hidden bg-slate-900">
            <img
              src="/images/medicine_door_delivery.jpg"
              alt="Medicine Door Delivery & Prescription Fulfillment"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />
            
            {/* Floating Top Bar: Icon + Category Badge + Brand Logo */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/40">
                  <Pill size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600/95 text-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-xs">
                  <span>💊 Doorstep Delivery</span>
                </span>
              </div>
              
              {/* Brand Logo Badge */}
              <div className="flex items-center bg-white/95 dark:bg-slate-900/95 px-2.5 py-1 rounded-xl shadow-md border border-white/50 backdrop-blur-md shrink-0">
                <Image src="/newlogos.png" alt="Medinex World" width={68} height={22} className="h-4 w-auto object-contain" priority />
              </div>
            </div>

            {/* Image Overlay Title */}
            <div className="absolute bottom-3 left-3.5 right-3.5">
              <h3 className="font-black text-lg sm:text-xl text-white leading-tight drop-shadow-sm">
                Medicine Door Delivery
              </h3>
              <p className="text-blue-200 text-xs sm:text-sm font-medium mt-0.5 line-clamp-1">
                Upload prescription & get genuine medicines delivered
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Upload your doctor's prescription or medicine list to get verified medicines from licensed pharmacies with fast doorstep delivery.
            </p>

            {/* Medicine Delivery Indicator Badges */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200/70 dark:border-blue-800/60 flex items-center gap-1">
                <span>📸</span>
                <span>Upload Prescription</span>
              </span>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200/70 dark:border-blue-800/60 flex items-center gap-1">
                <span>⚡</span>
                <span>Express Delivery</span>
              </span>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200/70 dark:border-blue-800/60 flex items-center gap-1">
                <span>🏷️</span>
                <span>Best Discounts</span>
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Order Medicines Now <ArrowRight size={14} />
              </span>
              <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60">
                ⚡ Fast Doorstep
              </span>
            </div>
          </div>
        </div>

        {/* 4. Home Care Service Card (NEW with Brand Logo) */}
        <div 
          onClick={() => setShowHomeCareModal(true)}
          className="group relative overflow-hidden bg-white dark:bg-slate-850 rounded-2xl sm:rounded-3xl border border-purple-200/90 dark:border-purple-900/60 shadow-xs hover:shadow-xl hover:border-purple-500/60 transition-all cursor-pointer flex flex-col justify-between"
        >
          {/* Header Image with Gradient Overlay & Brand Logo */}
          <div className="relative w-full h-36 sm:h-44 overflow-hidden bg-slate-900">
            <img
              src="/images/home_care_service.jpg"
              alt="Home Care Service - Physiotherapy, Elderly & Nursing Care"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />
            
            {/* Floating Top Bar: Icon + Category Badge + Brand Logo */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/40">
                  <HeartHandshake size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-600/95 text-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-xs">
                  <span>🏡 Home Care</span>
                </span>
              </div>
              
              {/* Brand Logo Badge */}
              <div className="flex items-center bg-white/95 dark:bg-slate-900/95 px-2.5 py-1 rounded-xl shadow-md border border-white/50 backdrop-blur-md shrink-0">
                <Image src="/newlogos.png" alt="Medinex World" width={68} height={22} className="h-4 w-auto object-contain" priority />
              </div>
            </div>

            {/* Image Overlay Title */}
            <div className="absolute bottom-3 left-3.5 right-3.5">
              <h3 className="font-black text-lg sm:text-xl text-white leading-tight drop-shadow-sm">
                Home Care Service
              </h3>
              <p className="text-purple-200 text-xs sm:text-sm font-medium mt-0.5 line-clamp-1">
                Physiotherapy, Attendants & Emergency Dr. Check-up
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Compassionate clinical & elderly care right at your doorstep with verified physiotherapists, nurses, attendants & visiting doctors.
            </p>

            {/* 5 Home Care Services Badges */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200/70 dark:border-purple-800/60 flex items-center gap-1">
                <span>✅</span>
                <span>Physiotherapy</span>
              </span>
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200/70 dark:border-purple-800/60 flex items-center gap-1">
                <span>✅</span>
                <span>Patient Attendant Care</span>
              </span>
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200/70 dark:border-purple-800/60 flex items-center gap-1">
                <span>✅</span>
                <span>Old age People Care</span>
              </span>
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200/70 dark:border-purple-800/60 flex items-center gap-1">
                <span>✅</span>
                <span>Emergency Dr. Check-up</span>
              </span>
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200/70 dark:border-purple-800/60 flex items-center gap-1">
                <span>✅</span>
                <span>Dressing</span>
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Book Home Care Now <ArrowRight size={14} />
              </span>
              <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/60">
                🏡 Doorstep Visit
              </span>
            </div>
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
          <Link href="/clinics" className="hover:text-teal-600">Clinics &amp; Hospitals</Link>
          <Link href="/blog" className="hover:text-teal-600">Health Blog</Link>
          <Link href="/doctor-apply" className="hover:text-teal-600">Join as Doctor</Link>
          <Link href="/doctor-login" className="hover:text-teal-600">Doctor Portal</Link>
          <Link href="/admin" className="hover:text-teal-600">Admin Login</Link>
        </div>

        {/* Dynamic Website Contact Bar */}
        <div className="flex flex-wrap items-center gap-y-2.5 gap-x-5 text-sm py-3 px-4 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
          <a
            href="https://wa.me/918145522359?text=Hello%20Medinex%20World%2C%20I%20need%20assistance"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
          >
            <svg className="w-4 h-4 fill-current text-emerald-500 shrink-0" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.155.57 4.18 1.572 5.928l-1.672 6.104 6.27-1.644c1.704.939 3.655 1.472 5.83 1.472 6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
            </svg>
            <span>WhatsApp: +91 81455 22359</span>
          </a>
          <a
            href="tel:+918145522359"
            className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 hover:text-teal-600 transition-colors"
          >
            <PhoneCall size={15} className="text-teal-600 shrink-0" />
            <span>Helpline: +91 81455 22359</span>
          </a>
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
      <MedicineDeliveryModal
        isOpen={showMedicineModal}
        onClose={() => setShowMedicineModal(false)}
      />
      <HomeCareEnquiryModal
        isOpen={showHomeCareModal}
        onClose={() => setShowHomeCareModal(false)}
      />

    </div>
  );
};
