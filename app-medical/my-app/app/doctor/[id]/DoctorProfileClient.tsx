"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Star, MapPin, Video, Share2, Clock, CalendarDays,
  Phone, Lock, ExternalLink, MessageSquare, CheckCircle2,
  Stethoscope, Award, Navigation, ThumbsUp, Send, ChevronLeft,
  CheckCircle, Building2, Mail, ShieldCheck, Zap, Sparkles,
  ArrowRight, Heart, Brain, Calendar, Info, Check, CheckCheck,
  Activity, Users, AlertCircle, FileText, ChevronRight, Sun, Moon, Sunrise,
  GraduationCap, Image as ImageIcon
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { buildDoctorProfilePath, extractDoctorIdFromSlugParam } from '@/lib/doctorProfileUrl';
import Link from 'next/link';
import { ChamberBookingPanel, ChamberStatusBadge, DoctorChamberList, type PublicChamber } from '@/components/ui/DoctorChambers';
import { formatDateLabel } from '@/lib/chamber';
import { PhotoGallery, type GalleryPhoto } from '@/components/ui/PhotoGallery';
import { displayableImages } from '@/lib/imageUrl';
import { isDisplayableImage } from '@/lib/imageUrl';
import { getDoctorFacilityInfo } from '@/lib/doctorFacility';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AVATAR_COLORS = [
  'bg-teal-600', 'bg-blue-600', 'bg-indigo-600', 'bg-rose-600',
  'bg-emerald-600', 'bg-purple-600', 'bg-cyan-600',
];

const getAvatarColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const getInitials = (name: string) => {
  if (!name) return 'DR';
  const p = name.trim().split(/\s+/);
  return p.length === 1
    ? p[0][0].toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const getDoctorAvatar = (doc: any) => (doc && isDisplayableImage(doc.image) ? doc.image.trim() : null);

const normalizeAddress = (addr: string) =>
  addr?.replace(/AuraHealth/gi, 'Medinex Clinic').replace(/UpcharPath/gi, 'Medinex Care').trim();

const getBaseConsultFee = (doctor: any, consultType: 'clinic' | 'video') => {
  const rawFee =
    consultType === 'video'
      ? doctor?.videoFee ?? doctor?.fee ?? 0
      : doctor?.fee ?? 0;
  const normalized = Number(rawFee);
  return Number.isFinite(normalized) ? normalized : 0;
};

const getConsultFeeWithPlatform = (doctor: any, consultType: 'clinic' | 'video') => {
  const baseFee = getBaseConsultFee(doctor, consultType);
  const percent = Math.min(
    100,
    Math.max(0, Number(doctor?.platformFeePercent) || 0)
  );
  return Math.round(baseFee * (1 + percent / 100));
};

const isValidEntityId = (value: unknown): boolean =>
  (typeof value === 'number' && Number.isInteger(value) && value > 0) ||
  (typeof value === 'string' && (/^[1-9]\d*$/.test(value) || /^[a-f\d]{24}$/i.test(value)));

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getNext7Days() {
  const days = [];
  const nowMs = Date.now();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(nowMs + i * 86_400_000);
    const dow = d.getUTCDay();
    const dom = d.getUTCDate();
    const mon = d.getUTCMonth();
    days.push({
      date: d,
      dayName: DAYS[dow],
      label: DAYS_SHORT[dow],
      dateNum: `${MONTHS_SHORT[mon]} ${dom}`,
      full: DAYS[dow],
      isTomorrow: i === 1,
    });
  }
  return days;
}

const getSpecialtyHighlights = (specialty: string = '') => {
  const s = specialty.toLowerCase();
  if (s.includes('neuro')) {
    return {
      icon: <Brain size={16} className="text-indigo-600 dark:text-indigo-400" />,
      colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-800/50',
      badge: 'Brain & Nervous System',
      conditions: [
        'Stroke & Paralysis Care',
        'Migraine & Severe Headaches',
        'Epilepsy & Seizures',
        'Parkinson\'s & Tremors',
        'Neuropathy & Nerve Pain',
        'Spine Disorders & Cervical Pain',
        'Memory Loss & Dementia',
      ],
      procedures: ['EEG & EMG Interpretation', 'Nerve Conduction Velocity (NCV)', 'Neuro-Rehabilitation Planning'],
    };
  }
  if (s.includes('cardio')) {
    return {
      icon: <Heart size={16} className="text-rose-600 dark:text-rose-400" />,
      colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/50',
      badge: 'Heart & Vascular Care',
      conditions: [
        'Hypertension (High BP)',
        'Coronary Artery Disease',
        'Heart Failure Management',
        'Arrhythmia & Palpitations',
        'High Cholesterol & Lipid Care',
        'Chest Pain Evaluation',
      ],
      procedures: ['2D Echocardiography', 'TMT Stress Testing', 'Holter Monitoring & ECG'],
    };
  }
  if (s.includes('derma')) {
    return {
      icon: <Sparkles size={16} className="text-amber-600 dark:text-amber-400" />,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/50',
      badge: 'Skin, Hair & Aesthetics',
      conditions: [
        'Acne, Pimples & Scars',
        'Hair Fall & Alopecia',
        'Eczema, Psoriasis & Rashes',
        'Skin Allergy & Dermatitis',
        'Fungal & Bacterial Infections',
        'Pigmentation & Melasma',
      ],
      procedures: ['Clinical Dermoscopy', 'Chemical Peels', 'Laser Skin Therapy'],
    };
  }
  if (s.includes('dent')) {
    return {
      icon: <Sparkles size={16} className="text-cyan-600 dark:text-cyan-400" />,
      colorClass: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200/80 dark:border-cyan-800/50',
      badge: 'Oral & Dental Surgery',
      conditions: [
        'Toothache & Cavity Filling',
        'Root Canal Treatment (RCT)',
        'Teeth Alignment & Braces',
        'Gum Disease & Bleeding',
        'Wisdom Tooth Extraction',
        'Teeth Whitening & Cleaning',
      ],
      procedures: ['Digital Dental X-Ray', 'Dental Implants', 'Scaling & Polishing'],
    };
  }
  return {
    icon: <Stethoscope size={16} className="text-teal-600 dark:text-teal-400" />,
    colorClass: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200/80 dark:border-teal-800/50',
    badge: 'Clinical Healthcare Specialist',
    conditions: [
      'Chronic Disease Management',
      'Fever, Viral & Infection Care',
      'Diabetes & Thyroid Disorders',
      'Preventive Health Screening',
      'Diagnostic Test Evaluation',
      'Personalized Medication Review',
    ],
    procedures: ['Comprehensive Health Assessment', 'Vitals & BMI Monitoring', 'Holistic Wellness Planning'],
  };
};

function StarRating({
  value,
  onChange,
  size = 20,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className={onChange ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
        >
          <Star
            size={size}
            className={`transition-colors ${
              (hovered || value) >= s
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-200 dark:text-slate-700'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// --- BOOKING PANEL (High-Converting Widget) ---
function BookingPanel({
  doctor,
  consultType,
  setConsultType,
  selectedSlot,
  setSelectedSlot,
  selectedDayIdx,
  setSelectedDayIdx,
  showSlotPicker,
  slotsToShow,
  dayEnabled,
  hasWeeklySchedule,
  isAlwaysAvailable,
  isLoggedIn,
  handleBookAppointment,
  showToast,
  router,
}: {
  doctor: any;
  consultType: 'clinic' | 'video';
  setConsultType: (t: 'clinic' | 'video') => void;
  selectedSlot: string | null;
  setSelectedSlot: (s: string | null) => void;
  selectedDayIdx: number;
  setSelectedDayIdx: (i: number) => void;
  showSlotPicker: boolean;
  slotsToShow: string[];
  dayEnabled: boolean;
  hasWeeklySchedule: boolean;
  isAlwaysAvailable: boolean;
  isLoggedIn: boolean;
  handleBookAppointment: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  router: any;
}) {
  const isVideoOff = true;
  const next7Days = useMemo(() => getNext7Days(), []);
  const consultModes: ('clinic' | 'video')[] = isVideoOff ? ['clinic'] : ['clinic', 'video'];

  useEffect(() => {
    if (consultType === 'video') {
      setConsultType('clinic');
      setSelectedSlot(null);
    }
  }, [consultType, setConsultType, setSelectedSlot]);

  // Check if day is bookable
  const isDayBookable = (dayName: string) => {
    const shortName = dayName.slice(0, 3);
    const hospitalSlot = doctor?.availableSlots?.find((s: any) => s.day === dayName || s.day === shortName);
    if (hospitalSlot) {
      return !!hospitalSlot.active;
    }

    const weekly = doctor?.schedule?.weekly || doctor?.weeklySchedule || [];
    if (Array.isArray(weekly) && weekly.length > 0) {
      const daySchedule = weekly.find((s: any) => s.day === dayName || s.day === shortName);
      if (!daySchedule?.enabled) return false;
      return Array.isArray(daySchedule.slots) ? daySchedule.slots.length > 0 : true;
    }

    return Array.isArray(doctor?.slots) ? doctor.slots.length > 0 : false;
  };

  // Group slots by time of day
  const { morning, afternoon, evening } = useMemo(() => {
    const morningSlots: string[] = [];
    const afternoonSlots: string[] = [];
    const eveningSlots: string[] = [];

    slotsToShow.forEach(slot => {
      const isPM = /pm/i.test(slot);
      const isAM = /am/i.test(slot);
      const m = slot.match(/(\d+):?(\d*)/);
      let hour = m ? parseInt(m[1], 10) : 9;
      if (isPM && hour < 12) hour += 12;
      if (isAM && hour === 12) hour = 0;

      if (hour < 12) morningSlots.push(slot);
      else if (hour < 17) afternoonSlots.push(slot);
      else eveningSlots.push(slot);
    });

    return { morning: morningSlots, afternoon: afternoonSlots, evening: eveningSlots };
  }, [slotsToShow]);

  const currentDay = next7Days[selectedDayIdx];

  const handleNextAvailableDay = () => {
    const nextIdx = next7Days.findIndex((d, idx) => idx > selectedDayIdx && isDayBookable(d.dayName));
    if (nextIdx !== -1) {
      setSelectedDayIdx(nextIdx);
    } else {
      const firstAvail = next7Days.findIndex(d => isDayBookable(d.dayName));
      if (firstAvail !== -1) setSelectedDayIdx(firstAvail);
    }
  };

  const consultFee = getConsultFeeWithPlatform(doctor, consultType);

  return (
    <div id="booking-widget" className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden transition-all duration-300">
      {/* Widget Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base tracking-tight">Book Appointment</h3>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <p className="text-xs text-teal-100 mt-0.5 font-medium flex items-center gap-1">
            <Zap size={12} className="text-amber-300" /> Instant Confirmation & 0% Fee
          </p>
        </div>
        <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
          <CalendarDays size={18} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* 1. Consult Mode Toggle */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            Select Consultation Type
          </label>
          <div className={`grid ${consultModes.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2.5 sm:gap-3`}>
            {consultModes.map(type => {
              const isClinic = type === 'clinic';
              const isSelected = consultType === type;
              const fee = getConsultFeeWithPlatform(doctor, type);

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (type === 'video' && isVideoOff) return;
                    setConsultType(type);
                    setSelectedSlot(null);
                  }}
                  disabled={type === 'video' && isVideoOff}
                  className={`group relative p-3 sm:p-3.5 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between border-2 ${
                    isSelected
                      ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-600 dark:border-teal-500 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/60 dark:hover:bg-slate-800'
                  } ${type === 'video' && isVideoOff ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-900 border-dashed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200/70'
                      }`}>
                        {isClinic ? <Building2 size={15} /> : <Video size={15} />}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-sm font-bold block truncate leading-tight ${
                          isSelected ? 'text-teal-950 dark:text-teal-100' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {isClinic ? 'In-Clinic' : 'Video Call'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 leading-none">
                          {isClinic ? 'Clinic Visit' : 'Online Consult'}
                        </span>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white ring-2 ring-teal-200 dark:ring-teal-900'
                        : 'border-2 border-slate-300 dark:border-slate-600 group-hover:border-slate-400'
                    }`}>
                      {isSelected && <Check size={10} strokeWidth={3.5} />}
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-base sm:text-lg font-black ${
                        isSelected
                          ? 'text-teal-700 dark:text-teal-300'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        ₹{fee}
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-teal-600/10 text-teal-700 dark:text-teal-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {isClinic ? 'In-Person' : 'Instant'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Date Picker */}
        {showSlotPicker && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Choose Date
              </label>
              <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                {currentDay?.full}, {currentDay?.dateNum}
              </span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x">
              {next7Days.map((day, idx) => {
                const isActive = idx === selectedDayIdx;
                const available = isDayBookable(day.dayName);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDayIdx(idx)}
                    disabled={hasWeeklySchedule && !available}
                    className={`relative flex flex-col items-center min-w-[66px] py-2.5 px-2 rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 snap-start ${
                      isActive
                        ? 'bg-gradient-to-b from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/30 scale-105'
                        : available
                        ? 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700'
                        : 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60 border border-transparent'
                    }`}
                  >
                    {day.isTomorrow && (
                      <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full mb-1 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        Tomorrow
                      </span>
                    )}
                    <span className="text-[11px] uppercase font-bold tracking-wider opacity-80">
                      {day.label}
                    </span>
                    <span className="text-lg font-black leading-tight my-0.5">
                      {day.date.getUTCDate()}
                    </span>
                    <span className="text-[11px] opacity-75 font-semibold">
                      {MONTHS_SHORT[day.date.getUTCMonth()]}
                    </span>
                    {available && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Time Slots */}
        {showSlotPicker && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Available Time Slots
              </label>
              {slotsToShow.length > 0 && (
                <span className="text-[11px] font-bold text-slate-500">
                  {slotsToShow.length} slots open
                </span>
              )}
            </div>

            {slotsToShow.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-center">
                <Clock size={20} className="mx-auto text-amber-500 mb-1.5" />
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  No slots available on {currentDay?.full}
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                  Doctor is unavailable on this date.
                </p>
                <button
                  type="button"
                  onClick={handleNextAvailableDay}
                  className="mt-2 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                >
                  Find next open day <ArrowRight size={12} />
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {/* Morning Slots */}
                {morning.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                      <Sunrise size={13} className="text-amber-500" />
                      <span>Morning ({morning.length})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {morning.map(slot => {
                        const isSelected = slot === selectedSlot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(isSelected ? null : slot)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1 border ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/30 scale-[1.02]'
                                : 'bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isSelected && <Check size={12} className="stroke-[3]" />}
                            <span>{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Afternoon Slots */}
                {afternoon.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                      <Sun size={13} className="text-amber-500" />
                      <span>Afternoon ({afternoon.length})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {afternoon.map(slot => {
                        const isSelected = slot === selectedSlot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(isSelected ? null : slot)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1 border ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/30 scale-[1.02]'
                                : 'bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isSelected && <Check size={12} className="stroke-[3]" />}
                            <span>{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Evening Slots */}
                {evening.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                      <Moon size={13} className="text-indigo-400" />
                      <span>Evening ({evening.length})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {evening.map(slot => {
                        const isSelected = slot === selectedSlot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(isSelected ? null : slot)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1 border ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/30 scale-[1.02]'
                                : 'bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isSelected && <Check size={12} className="stroke-[3]" />}
                            <span>{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. Price Transparency Card */}
        <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Consultation Fee ({consultType === 'clinic' ? 'In-Clinic' : 'Video Call'})</span>
            <span className="font-bold text-slate-900 dark:text-white">₹{consultFee}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Medinex Booking Fee</span>
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                100% Free
              </span>
            </span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">FREE</span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">Total Amount</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {consultType === 'clinic' ? 'Pay at Clinic or Online' : 'Pay before video connection'}
              </p>
            </div>
            <span className="text-xl font-black text-teal-600 dark:text-teal-400">
              ₹{consultFee}
            </span>
          </div>
        </div>

        {/* 5. Booking CTA Action */}
        {!isLoggedIn ? (
          <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Lock size={16} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Quick Login to Book</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Takes less than 30 seconds</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              Sign In to Confirm Appointment
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              New patient?{' '}
              <button
                type="button"
                onClick={() => router.push('/register?redirect=' + encodeURIComponent(window.location.pathname))}
                className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
              >
                Create Account
              </button>
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleBookAppointment}
            disabled={showSlotPicker && !selectedSlot}
            className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
              showSlotPicker && !selectedSlot
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-600/25 active:scale-[0.98]'
            }`}
          >
            {showSlotPicker && !selectedSlot ? (
              <span>Select a Time Slot Above</span>
            ) : (
              <>
                <span>
                  Confirm Appointment {selectedSlot ? `• ${selectedSlot}` : ''}
                </span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        )}

        {/* 6. Trust & Guarantees */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Free Cancellation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={13} className="text-amber-500 shrink-0" />
            <span>Instant Confirmed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            <span>Verified Chamber</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare size={13} className="text-blue-500 shrink-0" />
            <span>SMS & WhatsApp Alert</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN DOCTOR PROFILE CLIENT ---
export default function DoctorProfileClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const {
    handleBookAppointment,
    showToast,
    isLoggedIn,
    currentUser,
    siteSettings,
  } = useAppContext();

  const [consultType, setConsultType] = useState<'clinic' | 'video'>('clinic');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'gallery' | 'location' | 'reviews'>('overview');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submitReview, setSubmitReview] = useState(false);
  const [eligibleAppointment, setEligibleAppointment] = useState<any | undefined>(undefined);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [imgError, setImgError] = useState(false);
  const [selectedChamberId, setSelectedChamberId] = useState<number | null>(null);

  const next7Days = useMemo(() => getNext7Days(), []);

  useEffect(() => {
    const id = extractDoctorIdFromSlugParam(params?.id as string);
    if (id) {
      fetch(`/api/doctors/${id}?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          setDoctor(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));

      // Fetch reviews
      fetch(`/api/reviews?doctorId=${id}`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setReviewsData(data); })
        .catch(() => {});
    }

    // Check if patient completed appointment
    if (isLoggedIn && currentUser?.role === 'patient' && isValidEntityId(currentUser?._id)) {
      fetch(`/api/appointments?patientId=${currentUser._id}`)
        .then(r => r.json())
        .then(data => {
          const apt = Array.isArray(data)
            ? data.find(
                (a: any) =>
                  String(a.doctorId?._id ?? a.doctorId) === String(id) && a.status === 'Completed'
              )
            : undefined;
          setEligibleAppointment(apt);
        })
        .catch(() => {});
    }
  }, [params?.id]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDayIdx, consultType]);

  const chambers: PublicChamber[] = useMemo(() => (Array.isArray(doctor?.chambers) ? doctor.chambers : []), [doctor]);
  const hasChambers = chambers.length > 0;
  const chamberBookingFee = Math.max(0, Number(siteSettings?.chamberBookingFee ?? 50) || 0);
  // Until the patient picks one, pre-select the chamber the doctor is in now, else the next open one.
  const preferredChamber = chambers.find(c => c.isDoctorIn) || chambers.find(c => c.nextOpenDate) || chambers[0];
  // ?chamber=<id> (e.g. coming from a hospital page) pre-selects that sitting.
  const linkedChamberId = Number(searchParams?.get('chamber'));
  const linkedChamber = chambers.find(c => c.id === linkedChamberId);
  const activeChamberId = selectedChamberId ?? linkedChamber?.id ?? preferredChamber?.id ?? null;

  const weeklySchedule = doctor?.schedule?.weekly || doctor?.weeklySchedule || [];
  const currentDay = next7Days[selectedDayIdx];

  const hospitalSlot = doctor?.availableSlots?.find(
    (s: any) => s.day === currentDay?.dayName || s.day === currentDay?.dayName.slice(0, 3)
  );

  let dayEnabled = false;
  let daySlots: string[] = [];

  if (hospitalSlot) {
    dayEnabled = hospitalSlot.active;
    if (dayEnabled) {
      const slots = [];
      try {
        let curr = new Date(`2000-01-01T${hospitalSlot.start}`);
        const end = new Date(`2000-01-01T${hospitalSlot.end}`);
        while (curr < end) {
          slots.push(curr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          curr.setMinutes(curr.getMinutes() + 30);
        }
      } catch (e) {
        console.error("Error generating slots", e);
      }
      daySlots = slots;
    }
  } else {
    const daySchedule = weeklySchedule.find(
      (s: any) => s.day === currentDay?.dayName || s.day === currentDay?.dayName.slice(0, 3)
    );
    dayEnabled = daySchedule?.enabled ?? false;
    daySlots = dayEnabled ? daySchedule?.slots || [] : [];
  }

  const hasWeeklySchedule = (weeklySchedule.length > 0 && weeklySchedule.some((s: any) => s.enabled)) || (doctor?.availableSlots?.some((s: any) => s.active));
  const slotsToShow: string[] = hasWeeklySchedule ? daySlots : doctor?.slots || [];

  const availability = doctor?.videoAvailability || doctor?.availability || 'always';
  const isAlwaysAvailable = availability === 'always';
  const showSlotPicker = !(isAlwaysAvailable && consultType === 'video');

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book with ${doctor?.name}`,
          text: `Consult with ${doctor?.name}, top ${doctor?.specialty} on Medinex World!`,
          url,
        });
      } catch (err) {
        /* cancelled */
      }
    } else {
      navigator.clipboard.writeText(url);
      showToast('Doctor profile link copied to clipboard!', 'success');
    }
  };

  const handleBookSlot = () => {
    if (!isLoggedIn) {
      const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
      router.push('/login?redirect=' + encodeURIComponent(currentUrl));
      return;
    }
    if (showSlotPicker && !selectedSlot) {
      showToast('Please select an appointment time slot first.', 'error');
      return;
    }
    const slotLabel = showSlotPicker
      ? `${currentDay?.full}, ${selectedSlot}`
      : 'Anytime';
    handleBookAppointment(doctor, slotLabel, currentDay?.dateNum || '', consultType);
  };

  const handleBookChamber = async ({ chamber, visitDate, slot }: { chamber: PublicChamber; visitDate: string; slot: string }) => {
    await handleBookAppointment(doctor, slot, formatDateLabel(visitDate), 'clinic', { chamberId: chamber.id, visitDate });
  };

  const goToLogin = () => router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
  const goToRegister = () => router.push('/register?redirect=' + encodeURIComponent(window.location.pathname));

  const handleSubmitReview = async () => {
    if (reviewRating === 0 || !eligibleAppointment) return;
    setSubmitReview(true);
    try {
      const res = await fetch(`/api/appointments/${eligibleAppointment._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, review: reviewText }),
      });
      if (res.ok) {
        showToast('Review submitted! Thank you.', 'success');
        setShowReviewForm(false);
        const d = await fetch(`/api/doctors/${doctor._id}`).then(r => r.json());
        setDoctor(d);
        const revs = await fetch(`/api/reviews?doctorId=${doctor._id}`).then(r => r.json());
        if (Array.isArray(revs)) setReviewsData(revs);
      } else {
        showToast('Failed to submit review', 'error');
      }
    } finally {
      setSubmitReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading Doctor Profile...</p>
        </div>
      </div>
    );
  }

  if (!doctor || doctor.error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <AlertCircle size={44} className="text-rose-500 mb-3" />
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Doctor Profile Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">The doctor profile you requested might have been relocated or updated.</p>
        <button
          onClick={() => router.push('/search')}
          className="mt-5 px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-teal-700 transition-all"
        >
          Browse All Doctors
        </button>
      </div>
    );
  }

  const reviewCount = reviewsData.length || (typeof doctor?.reviews === 'number' ? doctor.reviews : 0);
  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviewsData.filter((r: any) => (r.rating ?? r.reviewRating) === star).length,
  }));

  const specialtyInfo = getSpecialtyHighlights(doctor?.specialty);
  const facilityInfo = getDoctorFacilityInfo(doctor);
  const doctorAvatarUrl = !imgError ? getDoctorAvatar(doctor) : null;
  const clinicAddressDisplay = hasChambers
    ? `${chambers.length} chamber${chambers.length > 1 ? 's' : ''}: ${chambers.map(c => c.name).join(' · ')}`
    : normalizeAddress(doctor?.address || 'Medinex Multi-Specialty Clinic & Chamber');
  const chamberIn = chambers.find(c => c.isDoctorIn) || null;
  const galleryPhotos: GalleryPhoto[] = [
    ...chambers.flatMap(c => displayableImages(c.photos).map(src => ({ src, caption: c.name }))),
    ...displayableImages(doctor?.clinicPhotos).map(src => ({ src, caption: 'Clinic' })),
  ];

  const bookingProps = {
    doctor,
    consultType,
    setConsultType,
    selectedSlot,
    setSelectedSlot,
    selectedDayIdx,
    setSelectedDayIdx,
    showSlotPicker,
    slotsToShow,
    dayEnabled,
    hasWeeklySchedule,
    isAlwaysAvailable,
    isLoggedIn: isLoggedIn && currentUser?.role === 'patient',
    handleBookAppointment: handleBookSlot,
    showToast,
    router,
  };

  const scrollToBooking = (mode?: 'clinic' | 'video') => {
    if (mode) setConsultType(mode);
    const el = document.getElementById('booking-widget');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 pb-28 md:pb-16 antialiased">
      {/* ── Top Breadcrumb & Actions Bar ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <button
              onClick={() => router.back()}
              className="p-1.5 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              title="Go Back"
            >
              <ChevronLeft size={20} />
            </button>
            <Link href="/" className="hover:text-teal-600 transition-colors hidden sm:inline">Home</Link>
            <ChevronRight size={13} className="hidden sm:inline text-slate-400" />
            <Link href="/search" className="hover:text-teal-600 transition-colors hidden sm:inline">Doctors</Link>
            <ChevronRight size={13} className="hidden sm:inline text-slate-400" />
            <span className="text-slate-900 dark:text-white font-bold truncate max-w-[200px] sm:max-w-none">
              {doctor.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
            >
              <Share2 size={14} className="text-teal-600 dark:text-teal-400" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout Container ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3.5 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================
              LEFT COLUMN (Hero Profile + Navigation Tabs + Details)
              ======================================================== */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">

            {/* 1. Doctor Hero Header Card */}
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              {/* Modern Healthcare Banner with Ambient Glow */}
              <div className="relative h-36 sm:h-52 w-full overflow-hidden bg-gradient-to-r from-teal-700 via-emerald-800 to-cyan-900 dark:from-teal-950 dark:via-slate-900 dark:to-cyan-950">
                {/* Ambient Glow Circles */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 dark:bg-teal-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                {/* Subtle Clinic Interior Overlay */}
                <img
                  src="/images/clinic_interior_banner.jpg"
                  alt="Modern Clinic Consultation"
                  className="w-full h-full object-cover object-center opacity-30 mix-blend-overlay scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/35 to-transparent" />

                {/* Top Banner Badges */}
                <div className="absolute top-3 sm:top-4 inset-x-3.5 sm:inset-x-5 flex items-center justify-between pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-teal-100 text-[10px] sm:text-[11px] font-extrabold px-3 py-1 rounded-full border border-white/20 shadow-sm">
                    <Sparkles size={11} className="text-amber-300 shrink-0" />
                    <span className="hidden xs:inline">Verified Care Specialist</span>
                    <span className="xs:hidden">Verified</span>
                  </span>

                  {typeof doctor.distance === 'number' && doctor.distance < 9999 && (
                    <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full border border-white/20 shadow-sm">
                      <MapPin size={11} className="text-teal-300 shrink-0" />
                      <span>
                        {doctor.distance < 1
                          ? `${Math.round(doctor.distance * 1000)} m away`
                          : `${doctor.distance.toFixed(1)} km away`}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Doctor Avatar + Identity Body */}
              <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-0 relative">
                {/* Main Avatar & Heading Row */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 -mt-12 sm:-mt-20 mb-3.5 sm:mb-4">
                  {/* Left: Avatar + Mobile Beside-Avatar Info */}
                  <div className="flex items-end gap-3.5 sm:gap-5 min-w-0">
                    {/* Avatar */}
                    <div className="relative inline-block shrink-0">
                      {doctorAvatarUrl ? (
                        <img
                          src={doctorAvatarUrl}
                          alt={doctor.name}
                          onError={() => setImgError(true)}
                          className="w-24 h-24 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-xl sm:shadow-2xl bg-white dark:bg-slate-800"
                        />
                      ) : (
                        <div className={`w-24 h-24 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xl sm:shadow-2xl ${getAvatarColor(doctor.name)} text-white`}>
                          <span className="text-2xl sm:text-4xl font-black select-none tracking-tight">
                            {getInitials(doctor.name)}
                          </span>
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider mt-1 opacity-80">
                            {doctor.qual ? doctor.qual.split(',')[0] : 'Specialist'}
                          </span>
                        </div>
                      )}

                      {/* Live Online / Accepting Status */}
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-0.5 sm:p-1 rounded-full shadow-md">
                        <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Available
                        </span>
                      </div>

                      {/* Facility Icon on Profile Avatar Corner */}
                      {facilityInfo && (
                        <div
                          className={`absolute -top-1.5 -left-1.5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center ${
                            facilityInfo.isHospital ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                          }`}
                          title={`${facilityInfo.label}: ${facilityInfo.name}`}
                        >
                          {facilityInfo.isHospital ? <Building2 size={16} /> : <Stethoscope size={16} />}
                        </div>
                      )}
                    </div>

                    {/* Mobile Identity Snippet (Fills that space beside the avatar on small screens!) */}
                    <div className="sm:hidden flex-1 min-w-0 pb-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {doctor.isVerified && (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 px-2 py-0.5 rounded-full">
                            <ShieldCheck size={12} className="text-blue-600 dark:text-blue-400" />
                            Verified
                          </span>
                        )}
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-0.5 rounded-full border border-teal-200/60 dark:border-teal-800/60">
                          {doctor.exp || '10+ Yrs'}
                        </span>
                      </div>
                      <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                        {doctor.name}
                      </h1>
                      <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400 truncate mt-0.5">
                        {doctor.specialty}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Pill on Desktop */}
                  <div className="hidden sm:flex items-center gap-3">
                    <button
                      onClick={() => scrollToBooking('clinic')}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5"
                    >
                      <CalendarDays size={15} /> Book In-Clinic
                    </button>
                  </div>
                </div>

                {/* Doctor Name & Credentials Block */}
                <div className="space-y-3">
                  {/* Desktop Doctor Name & Verification */}
                  <div className="hidden sm:flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {doctor.name}
                    </h1>
                    {doctor.isVerified && (
                      <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 px-3 py-1 rounded-full shadow-2xs">
                        <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />
                        Medinex Verified
                      </span>
                    )}
                  </div>

                  {chamberIn && (
                    <div className="inline-flex items-center gap-2 flex-wrap">
                      <ChamberStatusBadge chamber={chamberIn} size="md" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">at {chamberIn.name}</span>
                    </div>
                  )}

                  {/* Specialty and Qualification Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-black border shadow-2xs ${specialtyInfo.colorClass}`}>
                      {specialtyInfo.icon}
                      {doctor.specialty}
                    </span>

                    {doctor.qual && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 shadow-2xs">
                        <GraduationCap size={14} className="text-slate-500" />
                        {doctor.qual}
                      </span>
                    )}

                    {facilityInfo && (
                      <Link
                        href={facilityInfo.hospitalId ? `/hospital/${facilityInfo.hospitalId}` : '#chambers'}
                        className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1 rounded-xl transition-colors border shadow-2xs ${
                          facilityInfo.isHospital
                            ? 'text-blue-700 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 border-blue-200/80 dark:border-blue-900/60'
                            : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 border-emerald-200/80 dark:border-emerald-900/60'
                        }`}
                      >
                        {facilityInfo.isHospital ? (
                          <Building2 size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        ) : (
                          <Stethoscope size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        <span className="text-[10px] uppercase font-black tracking-wider opacity-80">
                          {facilityInfo.label}:
                        </span>
                        <span>{facilityInfo.name}</span>
                      </Link>
                    )}
                  </div>

                  {/* Trust Metrics Ribbon — values are editable by the doctor (Profile) and admin (Doctors) */}
                  {(() => {
                    const ratingValue = Number(doctor.rating);
                    const reviewsShown = Number(doctor.reviews) > 0 ? Number(doctor.reviews) : reviewCount;
                    const stats = [
                      ratingValue > 0 && {
                        key: 'rating',
                        box: 'from-amber-500/10 via-amber-500/5 border-amber-200/70 dark:border-amber-900/50',
                        color: 'text-amber-500',
                        icon: <Star size={17} className="fill-amber-400 text-amber-500" />,
                        value: ratingValue.toFixed(1),
                        label: reviewsShown > 0 ? `${reviewsShown} Reviews` : 'Rating',
                      },
                      doctor.exp && {
                        key: 'exp',
                        box: 'from-teal-500/10 via-teal-500/5 border-teal-200/70 dark:border-teal-900/50',
                        color: 'text-teal-600 dark:text-teal-400',
                        icon: <Award size={17} />,
                        value: doctor.exp,
                        label: 'Clinical Experience',
                      },
                      doctor.patientsTreated && {
                        key: 'patients',
                        box: 'from-blue-500/10 via-blue-500/5 border-blue-200/70 dark:border-blue-900/50',
                        color: 'text-blue-600 dark:text-blue-400',
                        icon: <Users size={17} />,
                        value: doctor.patientsTreated,
                        label: 'Patients Treated',
                      },
                      doctor.avgWaitTime && {
                        key: 'wait',
                        box: 'from-emerald-500/10 via-emerald-500/5 border-emerald-200/70 dark:border-emerald-900/50',
                        color: 'text-emerald-600 dark:text-emerald-400',
                        icon: <Zap size={17} />,
                        value: doctor.avgWaitTime,
                        label: 'Avg Chamber Wait',
                      },
                    ].filter(Boolean) as { key: string; box: string; color: string; icon: React.ReactNode; value: string; label: string }[];
                    if (stats.length === 0) return null;
                    const cols = ['', 'sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3', 'sm:grid-cols-4'][stats.length];
                    return (
                      <div className={`grid grid-cols-2 ${cols} gap-2.5 sm:gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 mt-3.5`}>
                        {stats.map(stat => (
                          <div key={stat.key} className={`p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br to-transparent border hover:shadow-xs transition-all ${stat.box}`}>
                            <div className={`flex items-center gap-1.5 font-black text-base sm:text-lg ${stat.color}`}>
                              {stat.icon}
                              <span className="truncate">{stat.value}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-0.5 truncate">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* 2. Interactive Navigation Tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {[
                { id: 'overview', label: 'Overview & Bio', shortLabel: 'Overview', icon: <FileText size={15} /> },
                { id: 'location', label: 'Chamber & Timings', shortLabel: 'Timings', icon: <Building2 size={15} /> },
                ...(galleryPhotos.length > 0
                  ? [{ id: 'gallery', label: `Gallery (${galleryPhotos.length})`, shortLabel: `Gallery (${galleryPhotos.length})`, icon: <ImageIcon size={15} /> }]
                  : []),
                { id: 'reviews', label: `Reviews (${reviewCount})`, shortLabel: `Reviews (${reviewCount})`, icon: <Star size={15} /> },
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`shrink-0 sm:flex-1 py-2.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/25 scale-[1.01]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* 3. Tab Contents */}

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {galleryPhotos.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <ImageIcon size={18} className="text-teal-600" /> Chamber Gallery
                      </h3>
                      {galleryPhotos.length > 5 && (
                        <button type="button" onClick={() => setActiveTab('gallery')} className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">
                          View all {galleryPhotos.length}
                        </button>
                      )}
                    </div>
                    <PhotoGallery photos={galleryPhotos} limit={5} compact onViewAll={() => setActiveTab('gallery')} />
                  </div>
                )}

                {/* Associated Hospital or Clinic Practice Affiliation — Separately Mentioned */}
                {facilityInfo && (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                          facilityInfo.isHospital
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60'
                        }`}>
                          {facilityInfo.isHospital ? <Building2 size={24} /> : <Stethoscope size={24} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              facilityInfo.isHospital
                                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                                : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                            }`}>
                              {`Affiliated ${facilityInfo.label}`}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">Official Medical Facility</span>
                          </div>
                          <h3 className="font-extrabold text-xl text-slate-900 dark:text-white mt-1">
                            {facilityInfo.name}
                          </h3>
                        </div>
                      </div>

                      {facilityInfo.hospitalId && (
                        <Link
                          href={`/hospital/${facilityInfo.hospitalId}`}
                          className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white px-4 py-2 rounded-xl transition-all shadow-xs ${
                            facilityInfo.isHospital ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          <span>View {facilityInfo.label} Profile</span>
                          <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <MapPin size={15} className={facilityInfo.isHospital ? "text-blue-600" : "text-emerald-600"} /> Facility Location &amp; Address
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 font-semibold">
                          {facilityInfo.address || clinicAddressDisplay}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Clock size={15} className={facilityInfo.isHospital ? "text-blue-600" : "text-emerald-600"} /> Clinical OPD Availability
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 font-semibold">
                          {doctor.slots && doctor.slots.length > 0
                            ? `Consultation slot from ${doctor.slots[0]} • OPD In-person`
                            : 'Regular scheduled consultation slots & OPD service available'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* About Doctor Bio */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <Stethoscope size={20} />
                    </div>
                    <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">
                      About {doctor.name}
                    </h3>
                  </div>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {doctor.about || `${doctor.name} is a ${doctor.specialty} on Medinex World.`}
                  </p>
                </div>

                {/* Medical Qualifications & Credential Verification */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white">
                        Verified Qualifications & Registrations
                      </h3>
                      <p className="text-xs text-slate-500">Official medical council verification and degrees</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <GraduationCap size={15} className="text-teal-600 dark:text-teal-400" /> Medical Education
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-semibold">
                        {doctor.qual || 'MBBS, MD, Advanced Clinical Specialization'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Award size={15} className="text-blue-600 dark:text-blue-400" /> Medical Registration
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-semibold">
                        Verified by State Medical Council & Medinex Clinical Panel
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GALLERY */}
            {activeTab === 'gallery' && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Chamber &amp; Clinic Photos</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Photos uploaded by {doctor.name}. Tap a photo to enlarge.</p>
                </div>
                <PhotoGallery photos={galleryPhotos} />
              </div>
            )}

            {/* TAB: CLINIC & LOCATION */}
            {activeTab === 'location' && hasChambers && (
              <DoctorChamberList
                chambers={chambers}
                initialLocation={currentUser?.location ?? null}
                onBook={id => { setSelectedChamberId(id); scrollToBooking('clinic'); }}
              />
            )}
            {activeTab === 'location' && !hasChambers && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                        <MapPin size={22} />
                      </div>
                      <div>
                        <h3 className="font-black text-base text-slate-900 dark:text-white">
                          Chamber & Clinic Location
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {clinicAddressDisplay}
                        </p>
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(clinicAddressDisplay)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Navigation size={13} className="text-teal-600" />
                      <span>Google Maps</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">🅿️ Free Parking</p>
                      <p className="text-[10px] text-slate-500">Car & Bike space</p>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">♿ Wheelchair</p>
                      <p className="text-[10px] text-slate-500">Ramp & Elevator</p>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">❄️ AC Chamber</p>
                      <p className="text-[10px] text-slate-500">Climate controlled</p>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">🧪 Lab Diagnostic</p>
                      <p className="text-[10px] text-slate-500">On-site test counter</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Rating Breakdown Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="text-center sm:border-r sm:pr-8 border-slate-200 dark:border-slate-800 shrink-0">
                      <p className="text-5xl font-black text-slate-900 dark:text-white">
                        {doctor.rating?.toFixed?.(1) ?? doctor.rating ?? '4.8'}
                      </p>
                      <div className="mt-2 flex justify-center">
                        <StarRating value={Math.round(doctor.rating || 5)} size={18} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">
                        Based on {reviewCount} verified ratings
                      </p>
                    </div>

                    <div className="flex-1 w-full space-y-1.5">
                      {ratingBreakdown.map(({ star, count }) => (
                        <div key={star} className="flex items-center gap-2.5 text-xs text-slate-500">
                          <span className="w-7 font-bold">{star} ★</span>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-500"
                              style={{
                                width: reviewCount > 0 ? `${(count / reviewCount) * 100}%` : star >= 4 ? '70%' : '10%',
                              }}
                            />
                          </div>
                          <span className="w-5 text-right font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {eligibleAppointment && !showReviewForm && (
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="flex items-center gap-2 text-white text-xs font-bold bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl transition-all shadow-md shadow-teal-600/20"
                      >
                        <ThumbsUp size={13} /> Write a Review
                      </button>
                    </div>
                  )}
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      Rate Your Consultation with {doctor.name}
                    </h4>
                    <StarRating value={reviewRating} onChange={setReviewRating} size={28} />
                    <textarea
                      rows={3}
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      placeholder="Share your experience (treatment, doctor behavior, wait time)..."
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitReview}
                        disabled={reviewRating === 0 || submitReview}
                        className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <Send size={13} />
                        {submitReview ? 'Submitting...' : 'Post Review'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-3">
                  {reviewsData.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800">
                      <MessageSquare size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        No written reviews yet
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {doctor.name} has a 98% positive consultation score from verified patients.
                      </p>
                    </div>
                  ) : (
                    reviewsData.map((rev: any) => {
                      const pname = rev.patientName || 'Verified Patient';
                      const initials = getInitials(pname);
                      const color = getAvatarColor(pname);

                      return (
                        <div key={rev._id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200/70 dark:border-slate-800 flex gap-3.5">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} text-white font-black text-xs shrink-0`}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  {pname}
                                </span>
                                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                  <CheckCircle2 size={10} /> Verified Patient
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              <StarRating value={rev.rating || 5} size={12} />
                            </div>
                            {rev.text && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                                {rev.text}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </div>

          {/* ========================================================
              RIGHT COLUMN: STICKY BOOKING PANEL
              ======================================================== */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-20 self-start space-y-4">
            {hasChambers ? (
              <ChamberBookingPanel
                doctorId={doctor._id}
                chambers={chambers}
                bookingFee={chamberBookingFee}
                isLoggedIn={isLoggedIn && currentUser?.role === 'patient'}
                initialLocation={currentUser?.location ?? null}
                selectedChamberId={activeChamberId}
                onSelectChamber={setSelectedChamberId}
                onBook={handleBookChamber}
                onLogin={goToLogin}
                onRegister={goToRegister}
              />
            ) : (
              <BookingPanel {...bookingProps} />
            )}

            {/* Quick Doctor Help Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-white">Need Booking Assistance?</h4>
                  <p className="text-[11px] text-slate-500">{siteSettings?.supportPhone || 'Our care desk is available 24/7'}</p>
                </div>
              </div>
              <a
                href={siteSettings?.supportPhone ? `tel:${siteSettings.supportPhone.replace(/[^\d+]/g, '')}` : 'tel:112'}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
              >
                Call Desk
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile Floating Bottom Booking Action ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 pt-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
              ₹{hasChambers ? chamberBookingFee : getConsultFeeWithPlatform(doctor, consultType)}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-900/60 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {hasChambers ? 'Token Fee' : 'Free Booking'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate mt-1">
            {hasChambers
              ? 'Rest payable at chamber'
              : consultType === 'clinic'
                ? 'In-Clinic • Pay at visit'
                : 'Video Call Consultation'}
          </p>
        </div>

        <button
          onClick={() => {
            if (!isLoggedIn) {
              const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
              router.push('/login?redirect=' + encodeURIComponent(currentPath));
              return;
            }
            if (selectedSlot && !hasChambers) {
              handleBookSlot();
            } else {
              scrollToBooking();
            }
          }}
          className="px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-teal-600/30 flex items-center gap-1.5 shrink-0 transition-transform"
        >
          <span>{!isLoggedIn ? 'Book Visit' : selectedSlot && !hasChambers ? 'Confirm Slot' : 'Book Visit'}</span>
          <ArrowRight size={14} className="stroke-[2.5]" />
        </button>
      </div>

    </div>
  );
}
