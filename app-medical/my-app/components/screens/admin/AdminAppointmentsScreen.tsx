"use client";
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Video, MapPin, Clock, Search, User, Filter, X, ChevronDown, 
  IndianRupee, CreditCard, Wallet, CheckCircle2, AlertCircle, Phone, Check, RefreshCw, Building2 
} from 'lucide-react';
import { SPECIALTIES } from '@/lib/data';
import { SafeImage } from '@/components/ui/SafeImage';
import { isDisplayableImage } from '@/lib/imageUrl';

const isValidImg = (img: string) => isDisplayableImage(img);

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

export const AdminAppointmentsScreen = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('All');       // All / clinic / video
  const [filterSpecialty, setFilterSpecialty] = useState('All');
  const [filterDoctor, setFilterDoctor] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Settlement Modal State
  const [settlingApt, setSettlingApt] = useState<any | null>(null);
  const [settlementRefInput, setSettlementRefInput] = useState('');
  const [settlingLoading, setSettlingLoading] = useState(false);

  const fetchAllData = () => {
    Promise.all([
      fetch('/api/appointments').then(r => r.json()),
      fetch('/api/doctors').then(r => r.json()),
    ]).then(([apts, docs]) => {
      if (Array.isArray(apts)) setAppointments(apts);
      if (Array.isArray(docs)) setDoctors(docs);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleConfirmSettlement = async () => {
    if (!settlingApt) return;
    setSettlingLoading(true);
    try {
      const res = await fetch(`/api/appointments/${settlingApt._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settlementStatus: 'settled',
          settlementRef: settlementRefInput.trim() || undefined,
          settledBy: 'Admin',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAppointments(prev => prev.map(a => a._id === settlingApt._id ? { ...a, ...updated } : a));
        setSettlingApt(null);
        setSettlementRefInput('');
      } else {
        alert('Failed to update settlement status.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update settlement status.');
    } finally {
      setSettlingLoading(false);
    }
  };

  const handleRevertSettlement = async (aptId: string | number) => {
    if (!confirm('Revert this doctor payout back to pending?')) return;
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settlementStatus: 'pending',
          settlementRef: null,
          settledBy: null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAppointments(prev => prev.map(a => a._id === aptId ? { ...a, ...updated } : a));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearFilters = () => {
    setFilterType('All');
    setFilterSpecialty('All');
    setFilterDoctor('All');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchTerm('');
    setActiveTab('All');
  };

  const pendingSettlementsCount = appointments.filter(
    (a: any) => a.paymentOption === 'full' && a.paymentStatus === 'paid' && a.settlementStatus === 'pending'
  ).length;

  const filtered = appointments.filter((apt: any) => {
    if (activeTab === 'Pending Settlements') {
      if (!(apt.paymentOption === 'full' && apt.paymentStatus === 'paid' && apt.settlementStatus === 'pending')) return false;
    } else if (activeTab !== 'All' && apt.status !== activeTab) {
      return false;
    }
    if (filterType !== 'All' && apt.type !== filterType) return false;
    if (filterSpecialty !== 'All' && apt.doctorId?.specialty !== filterSpecialty) return false;
    if (filterDoctor !== 'All' && String(apt.doctorId?._id || apt.doctorId?.id) !== filterDoctor) return false;
    if (filterDateFrom && apt.date < filterDateFrom) return false;
    if (filterDateTo && apt.date > filterDateTo) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const doc = (apt.doctorId?.name || '').toLowerCase();
      const pat = (apt.patientName || apt.patientId?.name || '').toLowerCase();
      const spec = (apt.doctorId?.specialty || '').toLowerCase();
      const phone = (apt.patientId?.phone || apt.doctorPhone || '').toLowerCase();
      if (!doc.includes(s) && !pat.includes(s) && !spec.includes(s) && !phone.includes(s)) return false;
    }
    return true;
  });

  const hasActiveFilters = filterType !== 'All' || filterSpecialty !== 'All' || filterDoctor !== 'All' || filterDateFrom || filterDateTo;

  const statusBadge = (status: string) => {
    const m: Record<string, string> = {
      Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      Cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };
    return m[status] || 'bg-gray-100 text-gray-500';
  };

  const DoctorAvatar = ({ doc }: { doc: any }) => {
    const initials = (
      <div className={`w-8 h-8 rounded-lg ${getAvatarColor(doc?.name || '')} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}>
        {getInitials(doc?.name || '')}
      </div>
    );
    if (isValidImg(doc?.image)) {
      return <SafeImage src={doc.image} alt={doc.name} className="w-8 h-8 rounded-lg object-cover border border-gray-100 dark:border-gray-700 shrink-0" fallback={initials} />;
    }
    return initials;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 md:pb-8 md:p-6 lg:p-8 w-full space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">All Appointments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs md:text-sm">{appointments.length} total appointments</p>
        </div>
        {pendingSettlementsCount > 0 && (
          <button
            onClick={() => setActiveTab('Pending Settlements')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all w-fit"
          >
            <AlertCircle size={15} />
            <span>{pendingSettlementsCount} Doctor Payout{pendingSettlementsCount > 1 ? 's' : ''} Pending</span>
          </button>
        )}
      </div>

      {/* Search & Status Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 shrink-0 overflow-x-auto">
          {[
            { key: 'All', label: 'All', count: appointments.length },
            { key: 'Pending Settlements', label: 'Pending Settlements', count: pendingSettlementsCount, alert: pendingSettlementsCount > 0 },
            { key: 'Confirmed', label: 'Confirmed', count: appointments.filter(a => a.status === 'Confirmed').length },
            { key: 'Completed', label: 'Completed', count: appointments.filter(a => a.status === 'Completed').length },
            { key: 'Cancelled', label: 'Cancelled', count: appointments.filter(a => a.status === 'Cancelled').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? tab.key === 'Pending Settlements'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : tab.alert
                    ? 'text-amber-600 dark:text-amber-400 font-black'
                    : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === tab.key
                  ? 'bg-black/15 text-white'
                  : tab.alert
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                    : 'text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctor, patient, phone, specialty..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border shrink-0 ${showFilters || hasActiveFilters ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
        >
          <Filter size={16} />
          Filters
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter size={15} className="text-emerald-600" /> Advanced Filters
            </h4>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1">
                <X size={13} /> Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visit Type</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['All', 'clinic', 'video'].map(t => (
                  <button key={t} onClick={() => setFilterType(t)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all capitalize ${filterType === t ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                    {t === 'clinic' ? '🏥 Clinic' : t === 'video' ? '📹 Video' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Specialty */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specialty</label>
              <div className="relative">
                <select value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                  <option value="All">All Specialties</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Doctor */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Doctor</label>
              <div className="relative">
                <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                  <option value="All">All Doctors</option>
                  {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Range</label>
              <div className="flex gap-1.5 items-center">
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                  className="flex-1 px-2.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                <span className="text-gray-400 text-xs shrink-0">to</span>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                  className="flex-1 px-2.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing <span className="font-bold text-gray-900 dark:text-white">{filtered.length}</span> of {appointments.length} appointments
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center py-16 text-gray-400">
          <Calendar size={40} className="mb-3 opacity-50" />
          <p className="font-bold">No appointments found</p>
          <p className="text-sm mt-1">{hasActiveFilters || searchTerm ? 'Try adjusting your filters.' : 'Appointments will appear here.'}</p>
          {(hasActiveFilters || searchTerm || activeTab !== 'All') && (
            <button onClick={clearFilters} className="mt-3 text-sm font-bold text-emerald-600 hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                  <th className="text-left px-4 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Serial #</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Patient</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Doctor</th>
                  <th className="text-left px-4 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Date & Time</th>
                  <th className="text-left px-4 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Type</th>
                  <th className="text-left px-4 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">User Paid</th>
                  <th className="text-left px-4 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Doctor Payout</th>
                  <th className="text-left px-4 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Settlement Action</th>
                  <th className="text-left px-4 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filtered.map((apt: any) => {
                  const isFullPaid = apt.paymentOption === 'full' && apt.paymentStatus === 'paid';
                  const userPaidAmount = Number(apt.paidAmount || apt.price || 0);
                  const docPayout = Number(apt.doctorPayoutAmount || apt.basePrice || 0);
                  const platformFee = Number(apt.platformFeeAmount || apt.bookingFee || 0);

                  return (
                    <tr key={apt._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-black text-xs">
                          #{apt.serialNumber || 1}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                            <User size={14} className="text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                {apt.patientName || apt.patientId?.name || 'Patient'}
                              </span>
                              {apt.patientName && apt.patientId?.name && apt.patientName !== apt.patientId.name && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 shrink-0">
                                  Family
                                </span>
                              )}
                            </div>
                            {(apt.patientGender || apt.patientAge != null) && (
                              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                                {[apt.patientGender, apt.patientAge != null ? `${apt.patientAge} yrs` : null].filter(Boolean).join(' • ')}
                              </p>
                            )}
                            {apt.patientId?.phone && (
                              <p className="text-[11px] text-gray-400">{apt.patientId.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <DoctorAvatar doc={apt.doctorId} />
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{apt.doctorId?.name || 'Doctor'}</p>
                            <p className="text-[11px] text-gray-400">{apt.doctorId?.specialty}</p>
                            {apt.doctorId?.phone && (
                              <p className="text-[10px] text-gray-400">{apt.doctorId.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-xs">
                          <Clock size={13} className="text-gray-400 shrink-0" />
                          <span className="whitespace-nowrap">{apt.date} · {apt.slot}</span>
                        </div>
                        {apt.chamberName && (
                          <p className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 truncate max-w-[160px] mt-0.5">
                            {apt.chamberName}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          apt.type === 'video'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {apt.type === 'video' ? <Video size={11} /> : <MapPin size={11} />}
                          {apt.type === 'video' ? 'Video' : 'Clinic'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center">
                            <IndianRupee size={13} /> {userPaidAmount}
                          </p>
                          <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded ${
                            isFullPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : apt.paymentMethod === 'chamber' && apt.bookingFeePaid
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {isFullPaid ? 'Full Paid Online' : apt.bookingFeePaid ? 'Platform Fee Paid' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm flex items-center">
                            <IndianRupee size={13} /> {docPayout}
                          </p>
                          {platformFee > 0 && (
                            <p className="text-[10px] text-gray-400">
                              +₹{platformFee} platform
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {isFullPaid ? (
                          apt.settlementStatus === 'settled' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <Check size={11} strokeWidth={3} /> Settled
                              </span>
                              <p className="text-[10px] text-gray-400 truncate max-w-[140px]" title={apt.settlementRef || 'Manual'}>
                                {apt.settlementRef ? `Ref: ${apt.settlementRef}` : 'Manual Transfer'}
                              </p>
                              <button
                                onClick={() => handleRevertSettlement(apt._id)}
                                className="text-[10px] text-slate-400 hover:text-red-500 underline flex items-center gap-0.5"
                                title="Revert to pending"
                              >
                                <RefreshCw size={9} /> Revert
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSettlingApt(apt);
                                setSettlementRefInput('');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                            >
                              <Wallet size={13} /> Mark Settled
                            </button>
                          )
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Direct Clinic Pay
                            </span>
                            <p className="text-[10px] text-slate-400">Patient pays at clinic</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBadge(apt.status)}`}>{apt.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Cards */}
          <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
            {filtered.map((apt: any) => {
              const isFullPaid = apt.paymentOption === 'full' && apt.paymentStatus === 'paid';
              const userPaidAmount = Number(apt.paidAmount || apt.price || 0);
              const docPayout = Number(apt.doctorPayoutAmount || apt.basePrice || 0);
              const platformFee = Number(apt.platformFeeAmount || apt.bookingFee || 0);

              return (
                <div key={apt._id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <DoctorAvatar doc={apt.doctorId} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{apt.doctorId?.name || 'Doctor'}</p>
                      <p className="text-[11px] text-gray-500">{apt.doctorId?.specialty}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px]">
                        Serial #{apt.serialNumber || 1}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(apt.status)}`}>{apt.status}</span>
                    </div>
                  </div>

                  {/* Patient & Booking Time Info */}
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-gray-400" />
                      <div>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{apt.patientName || apt.patientId?.name || 'Patient'}</span>
                        {(apt.patientGender || apt.patientAge != null) && (
                          <span className="ml-1 text-[10px] text-purple-600">
                            ({[apt.patientGender, apt.patientAge != null ? `${apt.patientAge}y` : null].filter(Boolean).join(',')})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock size={13} className="text-gray-400" /> {apt.date} · {apt.slot}
                    </div>
                  </div>

                  {/* Payment & Payout Breakdown Box */}
                  <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] text-gray-400 font-bold block uppercase">User Paid</span>
                        <span className="text-xs font-black text-gray-900 dark:text-white">₹{userPaidAmount}</span>
                      </div>
                      <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] text-emerald-600 font-bold block uppercase">Dr. Payout</span>
                        <span className="text-xs font-black text-emerald-600">₹{docPayout}</span>
                      </div>
                      <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] text-teal-600 font-bold block uppercase">Platform</span>
                        <span className="text-xs font-black text-teal-600">₹{platformFee}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isFullPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isFullPaid ? 'Full Paid Online' : 'Pay at Clinic'}
                      </span>

                      {isFullPaid && (
                        apt.settlementStatus === 'settled' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <Check size={11} strokeWidth={3} /> Settled
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSettlingApt(apt);
                              setSettlementRefInput('');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs active:scale-95"
                          >
                            <Wallet size={12} /> Settle ₹{docPayout}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Doctor Settlement Modal */}
      {settlingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Wallet className="text-emerald-600" size={20} /> Doctor Settlement Transfer
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Confirm payout transfer for Serial #{settlingApt.serialNumber || 1}
                </p>
              </div>
              <button
                onClick={() => { setSettlingApt(null); setSettlementRefInput(''); }}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">Doctor Name:</span>
                <span className="font-black text-gray-900 dark:text-white">{settlingApt.doctorId?.name || 'Doctor'}</span>
              </div>
              {settlingApt.doctorId?.phone && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Doctor Phone:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{settlingApt.doctorId.phone}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">Patient:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{settlingApt.patientName || settlingApt.patientId?.name || 'Patient'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">User Paid Online:</span>
                <span className="font-extrabold text-teal-600 dark:text-teal-400">₹{settlingApt.paidAmount || settlingApt.price}</span>
              </div>
              <div className="pt-2 border-t border-emerald-200/80 dark:border-emerald-800 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Amount Due to Doctor:</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center">
                  <IndianRupee size={16} strokeWidth={2.5} />
                  {settlingApt.doctorPayoutAmount || settlingApt.basePrice}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Payment Reference / UPI / IMPS Ref ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UPI/1234567890 or Bank Transfer Ref"
                value={settlementRefInput}
                onChange={e => setSettlementRefInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <p className="text-[11px] text-gray-400">
                Transfer the payout to the doctor via your bank / UPI and record the reference here.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setSettlingApt(null); setSettlementRefInput(''); }}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={settlingLoading}
                onClick={handleConfirmSettlement}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
              >
                {settlingLoading ? 'Saving...' : 'Confirm Settled ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
