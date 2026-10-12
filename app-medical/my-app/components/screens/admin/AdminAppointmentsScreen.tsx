"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Video, MapPin, Clock, Search, User, Filter, X, ChevronDown } from 'lucide-react';
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

  useEffect(() => {
    Promise.all([
      fetch('/api/appointments').then(r => r.json()),
      fetch('/api/doctors').then(r => r.json()),
    ]).then(([apts, docs]) => {
      if (Array.isArray(apts)) setAppointments(apts);
      if (Array.isArray(docs)) setDoctors(docs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const clearFilters = () => {
    setFilterType('All');
    setFilterSpecialty('All');
    setFilterDoctor('All');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchTerm('');
    setActiveTab('All');
  };

  const filtered = appointments.filter((apt: any) => {
    if (activeTab !== 'All' && apt.status !== activeTab) return false;
    if (filterType !== 'All' && apt.type !== filterType) return false;
    if (filterSpecialty !== 'All' && apt.doctorId?.specialty !== filterSpecialty) return false;
    if (filterDoctor !== 'All' && apt.doctorId?._id !== filterDoctor) return false;
    if (filterDateFrom && apt.date < filterDateFrom) return false;
    if (filterDateTo && apt.date > filterDateTo) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const doc = (apt.doctorId?.name || '').toLowerCase();
      const pat = (apt.patientId?.name || '').toLowerCase();
      const spec = (apt.doctorId?.specialty || '').toLowerCase();
      if (!doc.includes(s) && !pat.includes(s) && !spec.includes(s)) return false;
    }
    return true;
  });

  // Stats
  const confirmed = appointments.filter(a => a.status === 'Confirmed').length;
  const completed = appointments.filter(a => a.status === 'Completed').length;
  const cancelled = appointments.filter(a => a.status === 'Cancelled').length;

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
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">All Appointments</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs md:text-sm">{appointments.length} total appointments</p>
      </div>
      {/* Search & Status Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 shrink-0 overflow-x-auto">
          {['All', 'Confirmed', 'Completed', 'Cancelled'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              {tab}
              <span className={`ml-1.5 text-[10px] font-bold ${activeTab === tab ? 'text-emerald-600' : 'text-gray-400'}`}>
                ({appointments.filter(a => tab === 'All' || a.status === tab).length})
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search doctor, patient, specialty..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
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
          {(hasActiveFilters || searchTerm) && (
            <button onClick={clearFilters} className="mt-3 text-sm font-bold text-emerald-600 hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                  <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Patient</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Doctor</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Date & Time</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Type</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Fee</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filtered.map((apt: any) => (
                  <tr key={apt._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                          <User size={14} className="text-gray-500" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{apt.patientId?.name || 'Patient'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <DoctorAvatar doc={apt.doctorId} />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{apt.doctorId?.name || 'Doctor'}</p>
                          <p className="text-[11px] text-gray-400">{apt.doctorId?.specialty}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm">
                        <Clock size={13} className="text-gray-400 shrink-0" />
                        {apt.date} · {apt.slot}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${apt.type === 'video' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                        {apt.type === 'video' ? <Video size={11} /> : <MapPin size={11} />}
                        {apt.type === 'video' ? 'Video' : 'Clinic'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white text-sm">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">₹{apt.price || 0}</p>
                      <div className="flex flex-col mt-1">
                        <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md w-fit ${
                          apt.paymentMethod === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {apt.paymentMethod || 'cash'}
                        </span>
                        <span className={`text-[8px] font-bold uppercase mt-0.5 ${
                          apt.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                          {apt.paymentStatus || 'pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBadge(apt.status)}`}>{apt.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-700/50">
            {filtered.map((apt: any) => (
              <div key={apt._id} className="p-4 space-y-2.5">
                <div className="flex items-center gap-3">
                  <DoctorAvatar doc={apt.doctorId} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{apt.doctorId?.name || 'Doctor'}</p>
                    <p className="text-[11px] text-gray-500">{apt.doctorId?.specialty}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusBadge(apt.status)}`}>{apt.status}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <User size={12} /> {apt.patientId?.name || 'Patient'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} /> {apt.date} · {apt.slot}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${apt.type === 'video' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {apt.type === 'video' ? <Video size={10} /> : <MapPin size={10} />}
                    {apt.type === 'video' ? 'Video' : 'Clinic'}
                  </span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    ₹{apt.type === 'video' ? (apt.doctorId?.videoFee || '—') : (apt.doctorId?.fee || '—')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

