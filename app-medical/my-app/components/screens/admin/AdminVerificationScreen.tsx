"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldX, 
  ShieldAlert, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ExternalLink, 
  X, 
  Phone, 
  Mail, 
  User, 
  Briefcase, 
  Calendar, 
  AlertTriangle, 
  Trash2, 
  Building2, 
  MapPin, 
  Search, 
  Clock, 
  Star, 
  Award, 
  Copy, 
  Check, 
  IndianRupee, 
  Video, 
  Download,
  Stethoscope,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  CheckCircle
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { directionsUrl, isValidLatLng, scheduleSummary } from '@/lib/chamber';
import { isDisplayableImage } from '@/lib/imageUrl';

export const AdminVerificationScreen = () => {
  const { currentUser, showToast } = useAppContext();
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/doctors');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
        if (data.length > 0) {
          setSelectedDoctor((prev: any) => {
            if (!prev) return data[0];
            const found = data.find((d: any) => d._id === prev._id);
            return found || data[0];
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      showToast('Failed to load doctors list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName} to clipboard`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleVerification = async (doctorId: string, isVerified: boolean, password?: string) => {
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/admin/doctors/${doctorId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified, adminId: currentUser?._id, password }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDoctors(prev => prev.map(d => d._id === doctorId ? { ...d, isVerified: updated.isVerified, verifiedAt: updated.verifiedAt } : d));
        setSelectedDoctor((prev: any) => (prev?._id === doctorId ? { ...prev, isVerified: updated.isVerified, verifiedAt: updated.verifiedAt } : prev));
        showToast(isVerified ? 'Doctor verified & credentials emailed!' : 'Verification revoked.', 'success');
      } else {
        showToast('Failed to update verification.', 'error');
      }
    } catch {
      showToast('Failed to update verification.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = async (doctorId: string) => {
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/admin/doctors/${doctorId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDoctors(prev => prev.filter(d => d._id !== doctorId));
        showToast('Doctor application rejected and removed.', 'success');
        setShowRejectionModal(false);
        setSelectedDoctor(null);
        setMobileView('list');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || 'Failed to reject application.', 'error');
      }
    } catch (err) {
      console.error('Reject error:', err);
      showToast('An error occurred during rejection.', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  // Filter & search
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      // Tab filter
      if (filter === 'verified' && !doc.isVerified) return false;
      if (filter === 'unverified' && doc.isVerified) return false;

      // Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const name = (doc.name || '').toLowerCase();
      const spec = (doc.specialty || '').toLowerCase();
      const email = (doc.email || '').toLowerCase();
      const qual = (doc.qual || '').toLowerCase();
      const hospitalName = (doc.hospitalId?.name || '').toLowerCase();

      return name.includes(q) || spec.includes(q) || email.includes(q) || qual.includes(q) || hospitalName.includes(q);
    });
  }, [doctors, filter, searchQuery]);

  // Pending applications first (they need action), then verified; newest first within each group.
  const sortedDoctors = useMemo(
    () =>
      [...filteredDoctors].sort((a, b) => {
        if (!!a.isVerified !== !!b.isVerified) return a.isVerified ? 1 : -1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }),
    [filteredDoctors]
  );

  const verifiedCount = doctors.filter(d => d.isVerified).length;
  const unverifiedCount = doctors.filter(d => !d.isVerified).length;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string) =>
    (name || 'Doctor')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');

  const ImageWithFallback = ({ src, alt, className }: { src?: string; alt: string; className: string }) => {
    const isLoadable = (url?: unknown): url is string => isDisplayableImage(url);

    const initialValid = isLoadable(src);
    const [imgSrc, setImgSrc] = useState<string | null>(initialValid ? (src as string).trim() : null);
    const [hasError, setHasError] = useState(!initialValid);

    useEffect(() => {
      const valid = isLoadable(src);
      if (!valid) {
        setHasError(true);
        setImgSrc(null);
      } else {
        setImgSrc(src!.trim());
        setHasError(false);
      }
    }, [src]);

    if (hasError || !imgSrc) {
      return (
        <div className={`${className} bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white font-black shadow-inner select-none`}>
          <span>{getInitials(alt) || <User size={20} />}</span>
        </div>
      );
    }

    return (
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        onError={() => {
          setHasError(true);
          setImgSrc(null);
        }}
      />
    );
  };

  const handleSelectDoctor = (doctor: any) => {
    setSelectedDoctor(doctor);
    setMobileView('detail');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
      {/* ── Top Header & KPI Ribbon ────────────────────────────── */}
      <div className={`pb-5 border-b border-slate-200/80 dark:border-slate-800 ${mobileView === 'detail' ? 'hidden lg:block' : 'block'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold tracking-wide uppercase mb-1.5">
              <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
              Credentials &amp; Medical Compliance
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              Doctor Verification
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-medium">
              Audit council licenses, qualifications, consultation fees, and authorize medical practitioners for patient bookings.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Stethoscope size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total</p>
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">{doctors.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Verified</p>
                <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 leading-none">{verifiedCount}</p>
              </div>
            </div>

            <div className={`flex items-center gap-2.5 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border shadow-xs ${
              unverifiedCount > 0 ? 'border-amber-300 dark:border-amber-800 ring-2 ring-amber-400/20' : 'border-slate-200/80 dark:border-slate-800'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                unverifiedCount > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-400'
              }`}>
                <ShieldAlert size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Pending</p>
                <p className="text-sm sm:text-base font-black text-amber-600 leading-none">{unverifiedCount}</p>
              </div>
            </div>

            <button
              onClick={fetchDoctors}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 hover:text-teal-600 hover:border-teal-300 transition-colors shadow-xs"
              title="Refresh list"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Search & Filter Controls ─────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mt-5">
          {/* Segmented Filter Pills */}
          <div className="flex items-center p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/60 dark:border-slate-700/60 w-full sm:w-fit overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>All Doctors</span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 dark:bg-slate-700 text-[10px] font-black">
                {doctors.length}
              </span>
            </button>

            <button
              onClick={() => setFilter('verified')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'verified'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>Verified</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                {verifiedCount}
              </span>
            </button>

            <button
              onClick={() => setFilter('unverified')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'unverified'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-amber-600'
              }`}
            >
              <Clock size={13} className="text-amber-500" />
              <span>Pending Review</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                unverifiedCount > 0 
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 animate-pulse' 
                  : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500'
              }`}>
                {unverifiedCount}
              </span>
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctor name, specialty, qualification, email..."
              className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Master-Detail Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ── Left Column: Doctor Application List (5 cols on lg) ── */}
        <div className={`lg:col-span-5 2xl:col-span-4 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden ${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Practitioners ({filteredDoctors.length})
            </span>
            {searchQuery ? (
              <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">Filtered results</span>
            ) : unverifiedCount > 0 ? (
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">{unverifiedCount} need review</span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">All reviewed</span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-teal-600 mb-2" />
              <p className="text-xs font-bold text-slate-500">Loading doctor profiles...</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2.5">
                <Search size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No doctors found</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                No practitioner matches the selected filter or search query.
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 text-xs font-bold hover:bg-teal-100 transition-colors"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 min-h-0 space-y-2 overflow-y-auto p-3 custom-scrollbar max-lg:max-h-[70vh]">
              {sortedDoctors.map(doctor => {
                const isSelected = selectedDoctor?._id === doctor._id;
                return (
                  <div
                    key={doctor._id}
                    onClick={() => handleSelectDoctor(doctor)}
                    className={`group relative rounded-2xl p-3.5 transition-all duration-200 cursor-pointer border select-none active:scale-[0.99] ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                    }`}
                  >
                    {/* Left Accent indicator for active */}
                    {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-gradient-to-b from-teal-500 to-emerald-600 rounded-r-full shadow-xs" />
                    )}

                    <div className="flex items-center gap-3.5 pl-1.5">
                      {/* Avatar with Status badge */}
                      <div className="relative shrink-0">
                        <ImageWithFallback
                          src={doctor.image}
                          alt={doctor.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-2xs"
                        />
                        {doctor.isVerified ? (
                          <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-0.5 rounded-full shadow-xs border-2 border-white dark:border-slate-900" title="Verified Practitioner">
                            <CheckCircle2 size={10} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full shadow-xs border-2 border-white dark:border-slate-900" title="Pending Verification">
                            <Clock size={10} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Doctor summary */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-teal-600 transition-colors">
                            {doctor.name}
                          </h3>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${
                            doctor.isVerified
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
                          }`}>
                            {doctor.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5 truncate">
                          <span>{doctor.specialty}</span>
                          {doctor.qual && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] truncate">{doctor.qual}</span>
                            </>
                          )}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                          <span className="truncate flex items-center gap-1 max-w-[180px]">
                            <Mail size={11} className="shrink-0 opacity-70" />
                            <span className="truncate">{doctor.email}</span>
                          </span>
                          <span className="shrink-0 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-md">
                            <IndianRupee size={10} />
                            {doctor.fee}
                          </span>
                        </div>
                      </div>

                      <ChevronRight size={16} className={`shrink-0 transition-transform ${isSelected ? 'text-teal-600 translate-x-0.5' : 'text-slate-300 dark:text-slate-600'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right Column: Doctor Inspection Dossier (7 cols on lg) ── */}
        <div className={`lg:col-span-7 2xl:col-span-8 min-w-0 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
          
          {/* Mobile Back Button Navigation */}
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <button
              onClick={() => setMobileView('list')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs active:scale-95 transition-all"
            >
              <ArrowLeft size={15} />
              <span>Back to Doctors ({filteredDoctors.length})</span>
            </button>
            <span className="text-[10px] font-black tracking-wider uppercase text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-200/60 dark:border-teal-800/40">
              Inspection Dossier
            </span>
          </div>

          {selectedDoctor ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-clip">
              
              {/* ── Hero Practitioner Identity Card ────────────────────── */}
              <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-5 sm:p-7 text-white overflow-hidden">
                {/* Subtle Ambient Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Banner Top Row: Status badge + External Profile Link */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-[11px] font-bold tracking-wide">
                    {selectedDoctor.isVerified ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-300" />
                        <span className="text-emerald-200">VERIFIED PRACTITIONER</span>
                      </>
                    ) : (
                      <>
                        <Clock size={13} className="text-amber-300" />
                        <span className="text-amber-200">PENDING AUDIT &amp; VERIFICATION</span>
                      </>
                    )}
                  </div>

                  <a
                    href={`/doctor/${selectedDoctor._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition-all hover:scale-105 active:scale-95 ml-auto"
                    title="Inspect public doctor profile as seen by patients"
                  >
                    <span>View Public Page</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* Doctor Identity Header */}
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                  <div className="relative shrink-0">
                    <ImageWithFallback
                      src={selectedDoctor.image}
                      alt={selectedDoctor.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/30 shadow-lg"
                    />
                    {selectedDoctor.isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-xl shadow-md border-2 border-slate-900" title="Verified">
                        <CheckCircle2 size={13} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {selectedDoctor.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-0.5 rounded-lg text-xs font-bold text-teal-200">
                        <Stethoscope size={12} />
                        {selectedDoctor.specialty}
                      </span>
                      {selectedDoctor.qual && (
                        <span className="bg-white/10 px-2 py-0.5 rounded-lg text-xs font-medium text-slate-300">
                          {selectedDoctor.qual}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs text-white/80">
                      {selectedDoctor.exp && (
                        <span className="flex items-center gap-1 font-medium bg-black/20 px-2.5 py-0.5 rounded-lg">
                          <Award size={12} className="text-amber-300" />
                          {selectedDoctor.exp} Experience
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-medium bg-black/20 px-2.5 py-0.5 rounded-lg">
                        <Star size={12} className="text-amber-300 fill-amber-300" />
                        {selectedDoctor.rating || 5.0} Rating ({selectedDoctor.reviews || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Body Details ──────────────────────────────────────── */}
              <div className="p-4 sm:p-6 space-y-5">

                {/* Verification Status Banner */}
                {selectedDoctor.isVerified ? (
                  <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                          Doctor Profile Verified &amp; Active
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                          Active &amp; accepting appointments. Verified on {formatDate(selectedDoctor.verifiedAt || selectedDoctor.createdAt)}.
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-black tracking-wide shrink-0">
                      ACTIVE
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                          Verification Audit Required
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                          Inspect qualifications and license below, then confirm profile activation.
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-black tracking-wide shrink-0">
                      PENDING
                    </span>
                  </div>
                )}

                {/* Key Metrics & Contact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-teal-300 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email Address</p>
                      <button
                        onClick={() => copyToClipboard(selectedDoctor.email, 'email')}
                        className="text-slate-400 hover:text-teal-600 transition-colors p-1"
                        title="Copy email"
                      >
                        {copiedField === 'email' ? <Check size={12} className="text-teal-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <a
                      href={`mailto:${selectedDoctor.email}`}
                      className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 hover:text-teal-600 truncate"
                    >
                      <Mail size={13} className="text-teal-500 shrink-0" />
                      <span className="truncate">{selectedDoctor.email}</span>
                    </a>
                  </div>

                  {/* Phone */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-teal-300 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contact Number</p>
                      {selectedDoctor.phone && (
                        <button
                          onClick={() => copyToClipboard(selectedDoctor.phone, 'phone')}
                          className="text-slate-400 hover:text-teal-600 transition-colors p-1"
                          title="Copy phone"
                        >
                          {copiedField === 'phone' ? <Check size={12} className="text-teal-600" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Phone size={13} className="text-teal-500 shrink-0" />
                      <span>{selectedDoctor.phone || 'Not provided'}</span>
                    </div>
                  </div>

                  {/* Consultation Fee */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Consultation Fees</p>
                      <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">INR (₹)</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1">
                        <IndianRupee size={12} className="text-teal-600" />
                        <span>In-Clinic: ₹{selectedDoctor.fee}</span>
                      </div>
                      {selectedDoctor.videoFee && (
                        <div className="flex items-center gap-1 text-slate-500 font-medium">
                          <Video size={12} className="text-teal-500" />
                          <span>Video: ₹{selectedDoctor.videoFee}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registered On */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Application Date</p>
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Calendar size={13} className="text-teal-500 shrink-0" />
                      <span>{formatDate(selectedDoctor.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* About Bio if present */}
                {selectedDoctor.about && (
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Professional Statement / Bio
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      {selectedDoctor.about}
                    </p>
                  </div>
                )}

                {/* Hospital / Clinic Affiliation & Address */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Practice Location &amp; Affiliation
                  </p>
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    {selectedDoctor.hospitalId ? (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Building2 size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                            Affiliated Hospital
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {selectedDoctor.hospitalId.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {typeof selectedDoctor.hospitalId.address === 'string' 
                              ? selectedDoctor.hospitalId.address 
                              : selectedDoctor.hospitalId.address?.text || 'Address on file'}
                          </p>
                        </div>
                      </div>
                    ) : selectedDoctor.address ? (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Clinic / Chamber Address
                          </span>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                            {selectedDoctor.address}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                        <MapPin size={13} />
                        <span>Independent Practitioner • Direct chamber address not specified</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chambers added by the doctor (multi-chamber) */}
                {selectedDoctor.chambers?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                      <Building2 size={12} />
                      Chambers ({selectedDoctor.chambers.length})
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {selectedDoctor.chambers.map((c: any) => {
                        const mapLink = directionsUrl(c);
                        const pinned = isValidLatLng(c.locationLat, c.locationLng);
                        return (
                          <div key={c.id} className={`p-3.5 rounded-2xl border bg-white dark:bg-slate-900 ${c.isActive ? 'border-slate-200/80 dark:border-slate-800' : 'border-dashed border-slate-300 dark:border-slate-700 opacity-70'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{c.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.address}</p>
                              </div>
                              <span className="shrink-0 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                <IndianRupee size={11} />{c.fee}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5 text-[11px] font-semibold">
                              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                <Clock size={11} className="text-teal-600" /> {scheduleSummary(c)}
                              </span>
                              {pinned ? (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={11} /> GPS pinned</span>
                              ) : (
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><AlertTriangle size={11} /> No GPS pin</span>
                              )}
                              {!c.isActive && <span className="text-slate-400">Hidden</span>}
                              {mapLink && (
                                <a href={mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-teal-700 dark:text-teal-400 hover:underline ml-auto">
                                  <MapPin size={11} /> View on map <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Chamber Weekly Schedule */}
                {(selectedDoctor.availableSlots?.length > 0 || selectedDoctor.weeklySchedule?.length > 0) && (
                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                        <Clock size={12} />
                        Weekly Chamber Schedule
                      </p>
                      <span className="text-[11px] text-slate-400 font-medium">Standard Hours</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(selectedDoctor.availableSlots || []).map((slot: any) => (
                        <div
                          key={slot.day}
                          className={`p-2 rounded-xl border transition-all ${
                            slot.active
                              ? 'bg-white dark:bg-slate-900 border-teal-200 dark:border-teal-800/60 shadow-2xs'
                              : 'bg-slate-100/40 dark:bg-slate-800/20 border-transparent opacity-40'
                          }`}
                        >
                          <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${slot.active ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400'}`}>
                            {slot.day}
                          </p>
                          {slot.active ? (
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {slot.start} - {slot.end}
                            </p>
                          ) : (
                            <p className="text-[11px] font-semibold text-slate-400">Off Duty</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medical Certificate / Council Registration Dossier */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Medical Certificate &amp; Council Registration
                    </p>
                    {selectedDoctor.certificateUrl && (
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                        <FileText size={12} />
                        Attached
                      </span>
                    )}
                  </div>

                  {selectedDoctor.certificateUrl ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          onClick={() => {
                            const newTab = window.open();
                            if (newTab) {
                              newTab.document.write(`
                                <html>
                                  <head><title>Medical License - ${selectedDoctor.name}</title></head>
                                  <body style="margin:0; background:#0f172a; display:flex; align-items:center; justify-content:center; min-height:100vh;">
                                    ${selectedDoctor.certificateUrl.startsWith('data:application/pdf') 
                                      ? `<embed src="${selectedDoctor.certificateUrl}" type="application/pdf" width="100%" height="100%" />`
                                      : `<img src="${selectedDoctor.certificateUrl}" style="max-width:95%; max-height:95vh; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); border-radius:1rem;" />`
                                    }
                                  </body>
                                </html>
                              `);
                            }
                          }}
                          className="flex items-center justify-center gap-2 p-2.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl text-teal-800 dark:text-teal-300 font-bold text-xs hover:bg-teal-100 transition-all shadow-2xs"
                        >
                          <ExternalLink size={13} />
                          <span>Open Full Document</span>
                        </button>

                        <a
                          href={selectedDoctor.certificateUrl}
                          download={`medical_certificate_${selectedDoctor.name.replace(/\s+/g, '_').toLowerCase()}`}
                          className="flex items-center justify-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-all shadow-2xs"
                        >
                          <Download size={13} />
                          <span>Download Certificate</span>
                        </a>
                      </div>

                      {/* Document Preview Box */}
                      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-2 flex items-center justify-center min-h-[140px] max-h-[260px]">
                        {(selectedDoctor.certificateUrl.startsWith('data:image/') || selectedDoctor.certificateUrl.includes('image')) && !selectedDoctor.certificateUrl.trim().startsWith('blob:') ? (
                          <img
                            src={selectedDoctor.certificateUrl.trim()}
                            alt="Certificate Preview"
                            className="max-h-[240px] w-auto object-contain rounded-xl hover:scale-102 transition-transform cursor-pointer"
                            onClick={() => window.open(selectedDoctor.certificateUrl, '_blank')}
                          />
                        ) : (
                          <div className="text-center p-5">
                            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-2 shadow-xs">
                              <FileText size={24} />
                            </div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Official Certificate Attached</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Open Full Document&quot; above to inspect</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-800/20">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                        <FileText size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No Digital Certificate Attached</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                        The doctor applied without an attached certificate file. You can verify based on council registration or request documents by email.
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Action Decision Buttons (pinned to the bottom while scrolling) ── */}
                <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 pt-4 pb-4 sm:pb-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 space-y-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)]">
                  {!selectedDoctor.isVerified ? (
                    <div className="space-y-2.5">
                      <button
                        disabled={isVerifying || isRejecting}
                        onClick={() => toggleVerification(selectedDoctor._id, true)}
                        className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-800 text-white font-black text-sm shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Verifying &amp; Sending Access Email...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
                            <span>Confirm &amp; Verify Profile</span>
                          </>
                        )}
                      </button>

                      <button
                        disabled={isVerifying || isRejecting}
                        onClick={() => setShowRejectionModal(true)}
                        className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle size={14} />
                        <span>Reject Application</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-center">
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          ✓ This profile is verified and actively accepting patient appointments.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          disabled={isVerifying || isRejecting}
                          onClick={() => toggleVerification(selectedDoctor._id, false)}
                          className="py-2.5 px-4 rounded-xl border border-amber-300 dark:border-amber-800/70 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isVerifying ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <ShieldX size={14} />
                          )}
                          <span>Unverify Profile</span>
                        </button>

                        <button
                          disabled={isVerifying || isRejecting}
                          onClick={() => setShowRejectionModal(true)}
                          className="py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          <span>Delete Doctor</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 font-medium px-2">
                    Verifying a doctor automatically authorizes their portal credentials and dispatches an onboarding confirmation email.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <ShieldCheck size={40} className="text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">Select a Doctor</h3>
              <p className="text-xs text-slate-400 mt-1">Choose an application from the left panel to inspect credentials.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Rejection Confirmation Modal ───────────────────────────────── */}
      {showRejectionModal && selectedDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Reject Doctor Application?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Are you sure you want to reject and remove <strong className="text-slate-900 dark:text-white">{selectedDoctor.name}</strong>? This action cannot be undone and will delete the doctor record from the platform.
              </p>

              <div className="flex items-center gap-2.5 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRejectionModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isRejecting}
                  onClick={() => handleReject(selectedDoctor._id)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isRejecting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Confirm Rejection</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
