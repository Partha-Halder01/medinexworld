"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, Navigation, CheckCircle, Clock, Video, Calendar, ArrowRight, ShieldCheck, Building2, Stethoscope } from 'lucide-react';
import { buildDoctorProfilePath } from '@/lib/doctorProfileUrl';
import { isDisplayableImage } from '@/lib/imageUrl';
import { getDoctorFacilityInfo } from '@/lib/doctorFacility';

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
const normalizeClinicAddress = (address: string) =>
  (address || '')
    .replace(/AuraHealth/gi, 'Medinex World')
    .replace(/UpcharPath/gi, 'Medinex World')
    .replace(/North Bengal Medi Sathi/gi, 'Medinex World');

interface DoctorCardProps {
  doctor: any;
  showDistance?: boolean;
  layout?: 'grid' | 'list';
  hideVideoAndOnline?: boolean;
}

export const DoctorCard = ({ doctor, showDistance, layout = 'grid', hideVideoAndOnline = false }: DoctorCardProps) => {
  const [imgErr, setImgErr] = useState(false);

  const distanceKm = typeof doctor.distance === 'number' && doctor.distance < 9999
    ? doctor.distance
    : null;

  const facilityInfo = getDoctorFacilityInfo(doctor);

  const clinicDisplay = facilityInfo?.name
    || doctor.inChamberNow?.name
    || doctor.nearestChamberName
    || (doctor.chamberCount > 1 ? `${doctor.chamberCount} chambers` : null)
    || doctor.hospitalId?.name
    || normalizeClinicAddress(doctor.address || 'Medinex Care Center').split(',')[0];
  const inChamberBadge = doctor.inChamberNow ? (
    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-bold" title={`In chamber now: ${doctor.inChamberNow.name}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      In chamber now
    </span>
  ) : null;
  const hasValidPhoto = !imgErr && isDisplayableImage(doctor.image);
  const nextSlot = Array.isArray(doctor.slots) && doctor.slots.length > 0 ? doctor.slots[0] : null;

  if (layout === 'list') {
    return (
      <Link
        href={buildDoctorProfilePath(doctor)}
        className="group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200/90 dark:border-gray-700/80 shadow-xs hover:shadow-xl hover:border-teal-500/50 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 cursor-pointer"
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            {hasValidPhoto ? (
              <img
                src={doctor.image}
                alt={doctor.name}
                onError={() => setImgErr(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 flex flex-col items-center justify-center font-bold shadow-sm">
                <span className="text-xl leading-none">{getInitials(doctor.name)}</span>
                <span className="text-xs text-teal-600/80 dark:text-teal-400 font-bold mt-1">MD</span>
              </div>
            )}
            {doctor.isOnlineNow && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-gray-800" title="Online Now"></span>
              </span>
            )}
            {/* Facility Icon on Profile Avatar Corner */}
            {facilityInfo && (
              <span
                className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white dark:border-gray-800 shadow-xs flex items-center justify-center ${
                  facilityInfo.isHospital
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
                title={`${facilityInfo.label}: ${facilityInfo.name}`}
              >
                {facilityInfo.isHospital ? <Building2 size={11} /> : <Stethoscope size={11} />}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-gray-900 dark:text-white text-lg sm:text-2xl group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {doctor.name}
              </h4>
              {doctor.isVerified && (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/40 px-2.5 py-0.5 rounded-full border border-teal-200/60 dark:border-teal-800/50">
                  <CheckCircle size={14} className="text-teal-600 dark:text-teal-400" />
                  Verified
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-sm sm:text-base">
              <span className="font-bold text-teal-700 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-lg border border-teal-100 dark:border-teal-900">
                {doctor.specialty}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 dark:text-gray-300">{doctor.qual || 'MBBS, MD'}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 dark:text-gray-300">{doctor.exp || '5+ yrs'} exp</span>
            </div>

            {/* Prominent Hospital / Clinic Affiliation Badge */}
            {facilityInfo && (
              <div className="pt-0.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors max-w-full ${
                    facilityInfo.isHospital
                      ? 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/60'
                      : 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/60'
                  }`}
                  title={`${facilityInfo.label}: ${facilityInfo.name}`}
                >
                  {facilityInfo.isHospital ? (
                    <Building2 size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  ) : (
                    <Stethoscope size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span className="text-[10px] uppercase font-black tracking-wider opacity-80 shrink-0">
                    {facilityInfo.label}:
                  </span>
                  <span className="truncate max-w-[260px] font-semibold">{facilityInfo.name}</span>
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm sm:text-base text-gray-500 dark:text-gray-400 flex-wrap pt-0.5">
              <span className="flex items-center gap-1">
                <MapPin size={15} className="text-gray-400 shrink-0" />
                <span className="truncate max-w-[240px]">{clinicDisplay}</span>
              </span>
              {showDistance && distanceKm !== null && (
                <span className="flex items-center gap-1 text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-md font-semibold text-sm">
                  <Navigation size={12} />
                  {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm} km`} away
                </span>
              )}
              {inChamberBadge}
              {nextSlot && (
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md text-sm font-medium">
                  <Clock size={13} className="text-teal-600 dark:text-teal-400" />
                  Next Slot: {nextSlot}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2.5 sm:gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-gray-700/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-amber-200/60 dark:border-amber-700/50">
              <Star size={13} className="fill-amber-400 text-amber-500 sm:w-[15px] sm:h-[15px]" />
              <span>{doctor.rating || '4.9'}</span>
              <span className="text-xs text-amber-600/80 font-normal">({doctor.reviews || 80}+)</span>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">₹{doctor.fee}</span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">clinic</span>
            </div>
            {!hideVideoAndOnline && doctor.videoFee ? (
              <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                <Video size={12} /> ₹{doctor.videoFee} video
              </p>
            ) : null}
          </div>

          <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-base px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1 sm:gap-1.5 shrink-0 group-hover:bg-teal-700">
            <Calendar size={14} className="sm:w-[15px] sm:h-[15px]" />
            <span>Book Visit</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </Link>
    );
  }

  // Grid layout (default)
  return (
    <Link
      href={buildDoctorProfilePath(doctor)}
      className="group bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-gray-700/80 shadow-xs hover:shadow-xl hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Top Header Row: Avatar + Details */}
        <div className="flex gap-3.5 items-start">
          {/* Avatar with Online indicator and Facility Badge */}
          <div className="relative shrink-0">
            {hasValidPhoto ? (
              <img
                src={doctor.image}
                alt={doctor.name}
                onError={() => setImgErr(true)}
                className="w-16 h-16 rounded-2xl object-cover bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 flex flex-col items-center justify-center font-bold shadow-sm">
                <span className="text-lg leading-none">{getInitials(doctor.name)}</span>
                <span className="text-xs text-teal-600/80 dark:text-teal-400 font-bold mt-1">MD</span>
              </div>
            )}
            {!hideVideoAndOnline && doctor.isOnlineNow && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-gray-800" title="Online Now"></span>
              </span>
            )}
            {/* Facility Icon on Profile Avatar Corner */}
            {facilityInfo && (
              <span
                className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white dark:border-gray-800 shadow-xs flex items-center justify-center ${
                  facilityInfo.isHospital
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
                title={`${facilityInfo.label}: ${facilityInfo.name}`}
              >
                {facilityInfo.isHospital ? <Building2 size={10} /> : <Stethoscope size={10} />}
              </span>
            )}
          </div>

          {/* Name & Specialty Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <h4 className="font-extrabold text-gray-900 dark:text-white text-base sm:text-lg leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                {doctor.name}
              </h4>
              <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 border border-amber-200/60 dark:border-amber-700/50">
                <Star size={12} className="fill-amber-400 text-amber-500 sm:w-[13px] sm:h-[13px]" />
                <span>{doctor.rating || '4.9'}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-300 bg-teal-50/90 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-100 dark:border-teal-900/60">
                {doctor.specialty}
              </span>
              {doctor.isVerified && (
                <span className="text-xs sm:text-sm text-teal-600 dark:text-teal-400 flex items-center gap-1 font-semibold">
                  <CheckCircle size={12} /> Verified
                </span>
              )}
            </div>

            {/* Prominent Hospital / Clinic Affiliation Badge */}
            {facilityInfo && (
              <div className="mt-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold border transition-colors max-w-full ${
                    facilityInfo.isHospital
                      ? 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/60'
                      : 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/60'
                  }`}
                  title={`${facilityInfo.label}: ${facilityInfo.name}`}
                >
                  {facilityInfo.isHospital ? (
                    <Building2 size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  ) : (
                    <Stethoscope size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span className="text-[10px] uppercase font-black tracking-wider opacity-80 shrink-0">
                    {facilityInfo.label}:
                  </span>
                  <span className="truncate max-w-[170px] sm:max-w-[200px] font-semibold">{facilityInfo.name}</span>
                </span>
              </div>
            )}

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1 truncate font-medium">
              <span>{doctor.exp || '5+ yrs'} exp</span>
              {doctor.qual && (
                <>
                  <span>•</span>
                  <span className="truncate">{doctor.qual}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Badges / Distance / Next slot */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-gray-700/60 text-xs sm:text-sm flex-wrap">
          {showDistance && distanceKm !== null && (
            <span className="flex items-center gap-1 text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-md font-semibold">
              <Navigation size={11} />
              {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm} km`}
            </span>
          )}
          {inChamberBadge}
          {nextSlot ? (
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md font-medium">
              <Clock size={12} className="text-teal-600 dark:text-teal-400" />
              Next: {nextSlot}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md font-medium">
              <CheckCircle size={12} /> Available Today
            </span>
          )}
        </div>
      </div>

      {/* Pricing & Booking action Footer */}
      <div className="flex items-center justify-between gap-2 mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-gray-700/60">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">₹{doctor.fee}</span>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">visit</span>
          </div>
          {!hideVideoAndOnline && doctor.videoFee ? (
            <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Video size={11} /> ₹{doctor.videoFee} video
            </span>
          ) : null}
        </div>

        <button className="text-xs sm:text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1 shrink-0 group-hover:bg-teal-700">
          <span>Book Visit</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </Link>
  );
};
