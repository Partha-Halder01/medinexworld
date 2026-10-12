"use client";
import React, { useState, useEffect } from 'react';
import { Users, Calendar, IndianRupee, Clock, Video, MapPin, TrendingUp, CheckCircle, XCircle, UserCheck, Stethoscope, Activity, ArrowUpRight, Settings, Percent, Tag, Save, Loader2, Siren, Phone, Mail, ExternalLink } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isDisplayableImage } from '@/lib/imageUrl';

const formatRevenue = (amount: number) => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AVATAR_COLORS = ['bg-blue-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500'];
const getAvatarColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const isValidImg = (img: string) => isDisplayableImage(img);

export const AdminDashboardScreen = () => {
  const router = useRouter();
  const { currentUser, showToast, fetchSiteSettings } = useAppContext();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [stats, setStats] = useState({ confirmed: 0, completed: 0, cancelled: 0, revenue: 0, pendingEnquiries: 0, urgentAmbulances: 0 });
  const [loading, setLoading] = useState(true);

  // Platform Settings state
  const [platformSettings, setPlatformSettings] = useState({ 
    gstPercent: 0, 
    discountAmount: 0, 
    defaultPlatformFeePercent: 10,
    supportPhone: '+91 98765 43210',
    supportEmail: 'support@medinexworld.com',
    emergencyPhone: '112',
    contactAddress: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    // Fetch stats
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.doctors) setDoctors(data.doctors);
        if (data.appointments) setAllAppointments(data.appointments);
        if (data.patientCount !== undefined) setPatientCount(data.patientCount);
        if (data.stats) setStats(data.stats);
      })
      .catch(() => {});

    // Fetch platform settings
    fetch('/api/admin/platform-settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setPlatformSettings({
            gstPercent: Number(data.gstPercent) || 0,
            discountAmount: Number(data.discountAmount) || 0,
            defaultPlatformFeePercent: Number(data.defaultPlatformFeePercent) || 10,
            supportPhone: data.supportPhone || '+91 98765 43210',
            supportEmail: data.supportEmail || 'support@medinexworld.com',
            emergencyPhone: data.emergencyPhone || '112',
            contactAddress: data.contactAddress || '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpdateSettings = async () => {
    if (!currentUser?._id) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/platform-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser._id, ...platformSettings }),
      });
      if (res.ok) {
        showToast('Platform settings updated!', 'success');
        if (fetchSiteSettings) await fetchSiteSettings();
      } else {
        showToast('Failed to update settings', 'error');
      }
    } catch {
      showToast('Error updating settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Doctors',
      value: doctors.length,
      icon: Stethoscope,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-500',
      sub: 'Verified Platform Doctors',
      path: '/admin/doctors',
    },
    {
      label: 'Total Patients',
      value: patientCount,
      icon: Users,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-500',
      sub: 'Registered users',
      path: '/admin/users',
    },
    {
      label: 'Appointments',
      value: allAppointments.length,
      icon: Calendar,
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-500',
      sub: `${stats.confirmed} active`,
      path: '/admin/appointments',
    },
    {
      label: 'Revenue',
      value: formatRevenue(stats.revenue),
      icon: IndianRupee,
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-500',
      sub: `${stats.completed} completed`,
      path: '/admin/appointments',
    },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      Cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };
    return map[status] || 'bg-gray-100 text-gray-500';
  };

  const Avatar = ({ name, image, size = 'sm' }: { name: string; image?: string; size?: 'sm' | 'md' }) => {
    const dims = size === 'md' ? 'w-10 h-10 text-xs' : 'w-9 h-9 text-[10px]';
    const [imgSrc, setImgSrc] = useState<string | null>(isValidImg(image || '') ? (image || null) : null);
    const [hasError, setHasError] = useState(!isValidImg(image || ''));

    useEffect(() => {
      const valid = isValidImg(image || '');
      setImgSrc(valid ? (image || null) : null);
      setHasError(!valid);
    }, [image]);

    if (!hasError && imgSrc) {
      return (
        <img 
          src={imgSrc} 
          alt={name} 
          className={`${dims} rounded-xl object-cover border border-gray-100 dark:border-gray-700 shrink-0`} 
          onError={() => {
            setHasError(true);
            setImgSrc(null);
          }}
        />
      );
    }
    return (
      <div className={`${dims} rounded-xl ${getAvatarColor(name)} flex items-center justify-center text-white font-bold shrink-0`}>
        {getInitials(name)}
      </div>
    );
  };

  return (
    <div className="p-4 pb-28 md:pb-8 md:p-6 lg:p-8 w-full space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs md:text-sm">Overview of your healthcare platform</p>
      </div>

      {/* Stat Cards — Gradient style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((s) => (
          <div 
            key={s.label} 
            onClick={() => s.path && router.push(s.path)}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.gradient} text-white shadow-lg group hover:shadow-xl transition-all cursor-pointer active:scale-[0.98] select-none`}
            role="button"
            tabIndex={0}
            title={`Click to open ${s.label}`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
            <div className="absolute bottom-0 left-0 w-14 h-14 rounded-full bg-white/5 translate-y-4 -translate-x-4" />
            <div className="relative p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-105 transition-transform">
                  <s.icon size={18} className="text-white" />
                </div>
                <ArrowUpRight size={16} className="text-white/60 group-hover:text-white transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200" />
              </div>
              <p className="text-2xl md:text-3xl font-black tracking-tight">{s.value}</p>
              <p className="text-xs md:text-sm font-medium text-white/80 mt-0.5">{s.label}</p>
              <p className="text-[11px] text-white/60 font-semibold mt-1.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Enquiries & Follow-up Alert Banner */}
      <div 
        onClick={() => router.push('/admin/enquiries')}
        className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-teal-500/10 border border-red-200/80 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/20 group-hover:scale-105 transition-transform">
            <Siren size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-extrabold text-sm md:text-base text-gray-900 dark:text-white leading-tight">
                Customer Enquiries & Ambulance Requests
              </p>
              {stats.urgentAmbulances > 0 && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full animate-pulse">
                  {stats.urgentAmbulances} Urgent Dispatch
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats.pendingEnquiries} enquiries awaiting follow-up. Click to review, assign drivers, or provide quotes to users.
            </p>
          </div>
        </div>
        <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto shadow-2xs group-hover:bg-slate-800 transition-colors">
          Open Follow-up Desk →
        </button>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div 
          onClick={() => router.push('/admin/appointments')}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3.5 md:p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group"
          title="Click to view confirmed appointments"
        >
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-lg md:text-xl font-black text-gray-900 dark:text-white">{stats.confirmed}</p>
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">Confirmed</p>
          </div>
        </div>
        <div 
          onClick={() => router.push('/admin/appointments')}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3.5 md:p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group"
          title="Click to view completed appointments"
        >
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 shrink-0 group-hover:scale-105 transition-transform">
            <UserCheck size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-lg md:text-xl font-black text-gray-900 dark:text-white">{stats.completed}</p>
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">Completed</p>
          </div>
        </div>
        <div 
          onClick={() => router.push('/admin/appointments')}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3.5 md:p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group"
          title="Click to view cancelled appointments"
        >
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 shrink-0 group-hover:scale-105 transition-transform">
            <XCircle size={18} className="text-red-500 dark:text-red-400" />
          </div>
          <div>
            <p className="text-lg md:text-xl font-black text-gray-900 dark:text-white">{stats.cancelled}</p>
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">Cancelled</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5">

        {/* Global Platform Settings */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <Settings size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Website Contact & Platform Settings</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Change helpline phone numbers, support emails and platform fee rates across the entire site</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/settings"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span>Full Settings Page</span>
                <ExternalLink size={13} />
              </Link>
              <button
                onClick={handleUpdateSettings}
                disabled={savingSettings}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                {savingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </div>

          {/* Section 1: Contact Details */}
          <div className="mb-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-1.5">
              <Phone size={13} /> Website-wide Contact & Helpline Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 ml-1 flex items-center gap-1.5">
                  <Phone size={12} className="text-teal-600" /> Support Helpline Phone
                </label>
                <input
                  type="text"
                  value={platformSettings.supportPhone}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, supportPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-teal-500 rounded-xl text-xs md:text-sm font-bold text-gray-900 dark:text-white transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 ml-1 flex items-center gap-1.5">
                  <Mail size={12} className="text-blue-600" /> Support Email Address
                </label>
                <input
                  type="email"
                  value={platformSettings.supportEmail}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                  placeholder="support@medinexworld.com"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl text-xs md:text-sm font-bold text-gray-900 dark:text-white transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 ml-1 flex items-center gap-1.5">
                  <Siren size={12} className="text-red-500" /> 24/7 Emergency Helpline
                </label>
                <input
                  type="text"
                  value={platformSettings.emergencyPhone}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, emergencyPhone: e.target.value })}
                  placeholder="112"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-red-500 rounded-xl text-xs md:text-sm font-bold text-gray-900 dark:text-white transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Platform Rates & Discounts */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Percent size={13} /> Rates & Discounts
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 ml-1 flex items-center gap-1.5">
                  <Percent size={12} className="text-blue-500" /> GST Percentage
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={platformSettings.gstPercent}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, gstPercent: Number(e.target.value) })}
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl text-xs md:text-sm font-bold text-gray-900 dark:text-white transition-all outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 ml-1 flex items-center gap-1.5">
                  <Tag size={12} className="text-rose-500" /> Default Discount (Fixed)
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    min="0"
                    value={platformSettings.discountAmount}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, discountAmount: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-rose-500 rounded-xl text-xs md:text-sm font-bold text-gray-900 dark:text-white transition-all outline-none"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 ml-1 flex items-center gap-1.5">
                  <Activity size={12} className="text-emerald-500" /> Default Platform Fee
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={platformSettings.defaultPlatformFeePercent}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, defaultPlatformFeePercent: Number(e.target.value) })}
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 rounded-xl text-xs md:text-sm font-bold text-gray-900 dark:text-white transition-all outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctors Card */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
          <div 
            onClick={() => router.push('/admin/doctors')}
            className="px-4 md:px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors group select-none"
            role="button"
            tabIndex={0}
            title="Click to manage all doctors"
          >
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Doctors</h3>
              <ArrowUpRight size={14} className="text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold group-hover:underline">{doctors.length} verified →</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-[380px] overflow-y-auto">
            {doctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Users size={28} className="mb-2 opacity-50" />
                <p className="text-xs font-medium">No doctors found</p>
              </div>
            ) : doctors.map((doc) => (
              <div 
                key={doc._id} 
                onClick={() => router.push('/admin/doctors')}
                className="px-4 md:px-5 py-3 flex items-center gap-3 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-colors cursor-pointer active:scale-[0.99] group"
                role="button"
                tabIndex={0}
                title={`View ${doc.name} in Doctors`}
              >
                <Avatar name={doc.name} image={doc.image} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{doc.name}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{doc.specialty}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹{doc.fee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
          <div 
            onClick={() => router.push('/admin/appointments')}
            className="px-4 md:px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors group select-none"
            role="button"
            tabIndex={0}
            title="Click to view all appointments"
          >
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Recent Appointments</h3>
              <ArrowUpRight size={14} className="text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold group-hover:underline">{allAppointments.length} total →</span>
          </div>
          {allAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <Calendar size={32} className="mb-2 opacity-50" />
              <p className="text-xs font-medium">No appointments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-[380px] overflow-y-auto">
              {allAppointments.slice(0, 15).map((apt: any) => (
                <div 
                  key={apt._id} 
                  onClick={() => router.push('/admin/appointments')}
                  className="px-4 md:px-5 py-3 flex items-center gap-3 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-colors cursor-pointer active:scale-[0.99] group"
                  role="button"
                  tabIndex={0}
                  title="Click to view appointment details"
                >
                  <div className={`p-2 rounded-xl shrink-0 ${apt.type === 'video' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                    {apt.type === 'video' ? <Video size={16} /> : <MapPin size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{apt.doctorId?.name || 'Doctor'}</p>
                      <span className="text-[10px] text-gray-400 hidden sm:inline">for</span>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate hidden sm:block">{apt.patientId?.name || 'Patient'}</p>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="shrink-0" /> {apt.date} · {apt.slot}
                      <span className={`ml-1.5 text-[10px] font-medium ${apt.type === 'video' ? 'text-indigo-500' : 'text-emerald-500'}`}>
                        {apt.type === 'video' ? 'Video' : 'Clinic'}
                      </span>
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${statusBadge(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Specialty Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">Specialty Distribution</h3>
          <span className="text-[11px] text-gray-400 font-medium">Click to filter doctors</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {(() => {
            const specMap = new Map<string, number>();
            doctors.forEach(d => specMap.set(d.specialty, (specMap.get(d.specialty) || 0) + 1));
            const entries = [...specMap.entries()].sort((a, b) => b[1] - a[1]);

            return entries.length === 0 ? (
              <p className="col-span-full text-center text-sm text-gray-400 py-4">No doctors registered</p>
            ) : entries.map(([spec, count]) => {
              const pct = doctors.length ? Math.round((count / doctors.length) * 100) : 0;
              return (
                <div 
                  key={spec} 
                  onClick={() => router.push('/admin/doctors')}
                  className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3 md:p-4 text-center hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-200 dark:hover:border-emerald-800 border border-transparent transition-all relative overflow-hidden group cursor-pointer active:scale-95 select-none"
                  role="button"
                  tabIndex={0}
                  title={`View ${spec} doctors`}
                >
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-600">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{count}</p>
                  <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 leading-tight truncate">{spec}</p>
                  <p className="text-[9px] text-gray-400 font-medium mt-0.5">{pct}%</p>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};
