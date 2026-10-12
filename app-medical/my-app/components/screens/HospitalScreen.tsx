"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Building2, FlaskConical, Stethoscope, Pill, Search, Loader2 } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { HospitalCard } from '@/components/ui/HospitalCard';

type Tab = 'all' | 'lab' | 'surgery' | 'medicine';
type HospitalType = 'all' | 'government' | 'private';

export const HospitalScreen = () => {
  const { t } = useLanguage();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [typeFilter, setTypeFilter] = useState<HospitalType>('all');
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab !== 'all') params.set('tab', tab);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (search) params.set('search', search);
      if (userLocation) {
        params.set('lat', String(userLocation.lat));
        params.set('lng', String(userLocation.lng));
      }
      const res = await fetch(`/api/hospitals?${params}`);
      if (res.ok) {
        const data = await res.json();
        setHospitals(data);
      }
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, typeFilter, search, userLocation]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const tabs = [
    { key: 'all' as Tab, label: t('hospital.all'), icon: Building2 },
    { key: 'lab' as Tab, label: t('hospital.labTesting'), icon: FlaskConical },
    { key: 'surgery' as Tab, label: t('hospital.surgery'), icon: Stethoscope },
    { key: 'medicine' as Tab, label: t('hospital.medicine'), icon: Pill },
  ];

  const typeOptions = [
    { key: 'all' as HospitalType, label: t('hospital.all') },
    { key: 'government' as HospitalType, label: t('hospital.government') },
    { key: 'private' as HospitalType, label: t('hospital.private') },
  ];

  return (
    <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 space-y-6">
      {/* ── Visual Hospital Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-teal-950 to-slate-900 text-white p-6 md:p-8 border border-teal-700/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30 px-3.5 py-1 rounded-full">
            <Building2 size={13} /> Certified Healthcare Infrastructure
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-snug">
            Accredited Hospitals, Nursing Homes & Clinics
          </h1>
          <p className="text-sm md:text-base text-slate-300/90 leading-relaxed font-medium">
            Discover premier hospitals and nursing homes equipped with advanced ICUs, automated pathology, surgical suites, and 24/7 emergency care.
          </p>
        </div>
        <div className="w-full md:w-72 h-36 rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0 group">
          <img
            src="/images/modern_hospital_care.jpg"
            alt="Modern Hospital Atrium"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>

      {/* Header and Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Directory & Search</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Filter by service type, hospital or nursing home classification</p>
        </div>

        {/* Search */}
        <div className="relative sm:w-80 group">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hospitals or nursing homes by name, city..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs font-medium"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1 border-y border-gray-100 dark:border-gray-800">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          {tabs.map((t_item) => (
            <button
              key={t_item.key}
              onClick={() => setTab(t_item.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                tab === t_item.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <t_item.icon size={16} />
              {t_item.label}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl w-fit">
          {typeOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTypeFilter(opt.key)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                typeFilter === opt.key
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p className="text-sm font-bold text-gray-400 animate-pulse">Finding hospitals & nursing homes...</p>
        </div>
      ) : hospitals.length === 0 ? (
        <div className="text-center py-32 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <Building2 size={64} className="mx-auto text-gray-300 dark:text-gray-700 mb-4 opacity-50" />
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">No results found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('hospital.noHospitals')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {hospitals.map((hospital: any) => (
            <HospitalCard key={hospital._id} hospital={hospital} />
          ))}
        </div>
      )}
    </div>
  );
};
