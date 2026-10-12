"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Building2, Users, CalendarCheck, Settings, ChevronRight, Plus, LogOut, Search, Phone, Mail, MapPin, Activity, Stethoscope, Clock, CheckCircle2, X, ExternalLink, Save, Camera, Trash2, Edit3, FlaskConical, Wallet, IndianRupee, CreditCard, Loader2 } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useRouter } from 'next/navigation';
import { SafeImage } from '@/components/ui/SafeImage';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { compressImageFile, displayableImages } from '@/lib/imageUrl';
import { isChamberOpenOn, istNow } from '@/lib/chamber';
import { FACILITY_KIND_OPTIONS, facilityKindLabel } from '@/lib/facilityKind';
import { FacilityDoctorsTab, FacilityTodayBoard, useFacilityDoctors } from '@/components/screens/hospital/FacilityDoctors';

type Tab = 'dashboard' | 'hospital' | 'doctors' | 'bookings' | 'wallet' | 'settings';

// ─── Bookings Tab ────────────────────────────────────────────────────────────
function BookingsTab({ ownerId, bookings, setBookings, showToast, onBookingUpdate }: { ownerId: unknown; bookings: any[]; setBookings: any; showToast: any; onBookingUpdate?: () => void }) {
  const [completing, setCompleting] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<'All' | 'Confirmed' | 'Completed' | 'Cancelled'>('All');

  const handleComplete = async (bookingId: string) => {
    setCompleting(bookingId);
    try {
      const res = await fetch(`/api/hospital-admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', ownerId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Booking marked as completed', 'success');
        setBookings((prev: any[]) => prev.map((b: any) =>
          b._id === bookingId ? { ...b, status: 'Completed', paymentStatus: b.paymentMethod === 'cash' || b.paymentMethod === 'chamber' ? 'paid' : b.paymentStatus } : b
        ));
        onBookingUpdate?.();
      } else {
        showToast(data.error || 'Failed to complete booking', 'error');
      }
    } catch {
      showToast('Failed to complete booking', 'error');
    } finally {
      setCompleting(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    setCompleting(bookingId);
    try {
      const res = await fetch(`/api/hospital-admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', ownerId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Booking marked as cancelled', 'success');
        setBookings((prev: any[]) => prev.map((b: any) =>
          b._id === bookingId ? { ...b, status: 'Cancelled' } : b
        ));
        onBookingUpdate?.();
      } else {
        showToast(data.error || 'Failed to cancel booking', 'error');
      }
    } catch {
      showToast('Failed to cancel booking', 'error');
    } finally {
      setCompleting(null);
    }
  };

  const filtered = filter === 'All' ? bookings : bookings.filter(b => b.status === filter);

  const statusCounts = {
    All: bookings.length,
    Confirmed: bookings.filter(b => b.status === 'Confirmed').length,
    Completed: bookings.filter(b => b.status === 'Completed').length,
    Cancelled: bookings.filter(b => b.status === 'Cancelled').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">All Bookings</h2>
          <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mt-0.5 sm:mt-1">Monitor and manage all appointments</p>
        </div>
        {/* Status filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {(['All', 'Confirmed', 'Completed', 'Cancelled'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all ${
                filter === s
                  ? s === 'Confirmed' ? 'bg-emerald-600 text-white shadow-xs'
                    : s === 'Completed' ? 'bg-blue-600 text-white shadow-xs'
                    : s === 'Cancelled' ? 'bg-red-500 text-white shadow-xs'
                    : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}>
              {s}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${filter === s ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>
                {statusCounts[s]}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Quick Summary Cards - Side by Side on Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { label: 'Total Bookings', filterKey: 'All' as const, value: statusCounts.All, icon: CalendarCheck, color: 'text-gray-900 dark:text-white', bg: 'bg-gray-100 dark:bg-gray-700' },
          { label: 'Confirmed', filterKey: 'Confirmed' as const, value: statusCounts.Confirmed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Completed', filterKey: 'Completed' as const, value: statusCounts.Completed, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Cancelled', filterKey: 'Cancelled' as const, value: statusCounts.Cancelled, icon: Trash2, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/30' },
        ].map((c, i) => (
          <div 
            key={i} 
            onClick={() => setFilter(c.filterKey)}
            className={`bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer active:scale-95 hover:shadow-md select-none group ${
              filter === c.filterKey
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                : 'border-gray-100 dark:border-gray-700 hover:border-emerald-200'
            }`}
            role="button"
            tabIndex={0}
            title={`Filter by ${c.label}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-wider truncate">{c.label}</span>
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                <c.icon size={13} className={c.color} />
              </div>
            </div>
            <p className={`text-base sm:text-2xl font-black ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Mobile Card Layout - Side by Side on Mobile (md:hidden) */}
      <div className="grid grid-cols-2 md:hidden gap-2.5">
        {filtered.map((booking: any) => (
          <div key={booking._id} className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1">
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider truncate ${
                  booking.status === 'Completed' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                  booking.status === 'Cancelled' ? 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                }`}>
                  {booking.status}
                </span>
                <span className="text-[10px] font-black text-gray-900 dark:text-white">
                  ₹{booking.paymentMethod === 'chamber' ? (booking.basePrice || 0) : (booking.price || 0)}
                </span>
              </div>

              <div>
                <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                  {booking.patientId?.name || 'Patient'}
                </p>
                <p className="text-[9px] font-bold text-gray-400 truncate">
                  {booking.patientId?.phone || 'No phone'}
                </p>
              </div>

              <div className="pt-1.5 border-t border-gray-100 dark:border-gray-700">
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 truncate">
                  {booking.serviceType === 'lab' || booking.serviceType === 'surgery'
                    ? (booking.serviceName || (booking.serviceType === 'lab' ? 'Lab Test' : 'Surgery'))
                    : (booking.doctorId?.name ? `Dr. ${booking.doctorId.name}` : 'Doctor')}
                </p>
                <div className="flex items-center gap-1 text-[9px] font-semibold text-gray-400 mt-0.5">
                  <CalendarCheck size={10} className="text-blue-500 shrink-0" />
                  <span className="truncate">{booking.date}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-semibold text-gray-400">
                  <Clock size={10} className="text-gray-400 shrink-0" />
                  <span className="truncate">{booking.slot}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase mb-2">
                <span className="text-gray-400 truncate">{booking.paymentMethod || 'cash'}</span>
                <span className={booking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                  {booking.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                </span>
              </div>

              {booking.status === 'Confirmed' && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleComplete(booking._id)}
                    disabled={completing === booking._id}
                    className="w-full flex items-center justify-center gap-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-60"
                  >
                    {completing === booking._id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                    Complete
                  </button>
                  <button
                    onClick={() => handleCancel(booking._id)}
                    disabled={completing === booking._id}
                    className="w-full flex items-center justify-center gap-1 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-60"
                  >
                    <Trash2 size={10} /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 py-12 text-center text-xs text-gray-400 italic font-bold bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            No {filter === 'All' ? '' : filter.toLowerCase()} bookings found.
          </div>
        )}
      </div>

      {/* Desktop / Tablet Table Layout (hidden md:block) */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service / Doctor</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Schedule</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filtered.map((booking: any) => (
                <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all">
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-gray-900 dark:text-white">{booking.patientId?.name || 'Patient'}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">{booking.patientId?.phone || 'No phone'}</p>
                  </td>
                  <td className="px-6 py-5">
                    {booking.serviceType === 'lab' || booking.serviceType === 'surgery' ? (
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${booking.serviceType === 'lab' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
                          {booking.serviceType === 'lab' ? <FlaskConical size={14} /> : <Stethoscope size={14} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-700 dark:text-gray-200">{booking.serviceName || (booking.serviceType === 'lab' ? 'Lab Test' : 'Surgery')}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Hospital Service · ₹{booking.paymentMethod === 'chamber' ? (booking.basePrice || 0) : (booking.price || 0)}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-black text-gray-700 dark:text-gray-200">{booking.doctorId?.name || 'Doctor'}</p>
                        <p className="text-[10px] font-bold text-emerald-600 mt-0.5 uppercase">{booking.doctorId?.specialty} · ₹{booking.paymentMethod === 'chamber' ? (booking.basePrice || 0) : (booking.price || 0)}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-gray-700 dark:text-gray-200">
                        <CalendarCheck size={13} className="text-blue-500" /> {booking.date}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                        <Clock size={13} /> {booking.slot}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest block w-fit ${booking.paymentMethod === 'online' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                      {booking.paymentMethod || 'cash'}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 block ${booking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {booking.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {booking.status === 'Completed' ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          ✓ Completed
                        </span>
                        {booking.paymentMethod === 'cash' && (
                          <span className="text-[9px] font-bold text-emerald-600">Cash collected</span>
                        )}
                      </div>
                    ) : booking.status === 'Cancelled' ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400">Cancelled</span>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">Confirmed</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleComplete(booking._id)}
                            disabled={completing === booking._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                          >
                            {completing === booking._id ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={11} />
                            )}
                            Complete
                          </button>
                          <button
                            onClick={() => handleCancel(booking._id)}
                            disabled={completing === booking._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                          >
                            <Trash2 size={11} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic font-bold">
                    No {filter === 'All' ? '' : filter.toLowerCase()} bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Hospital Wallet Tab ─────────────────────────────────────────────────────
type WalletFilter = 'all' | 'online' | 'cash';

function HospitalWalletTab({ currentUser, showToast, refreshKey }: { currentUser: any; showToast: any; refreshKey?: number }) {
  const [loading, setLoading] = React.useState(true);
  const [walletData, setWalletData] = React.useState<any>({
    totalEarnings: 0, onlineEarnings: 0, cashEarnings: 0,
    totalPlatformCommission: 0, onlinePlatformCommission: 0, cashPlatformCommission: 0,
    totalPaidOut: 0, remainingBalance: 0, paymentLogs: [], appointments: [],
  });
  const [activeFilter, setActiveFilter] = React.useState<WalletFilter>('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  const fetchWallet = React.useCallback(async () => {
    if (!currentUser?._id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hospital-admin/wallet?ownerId=${currentUser._id}&t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) setWalletData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [currentUser?._id]);

  // Re-fetch whenever refreshKey changes (booking completed/cancelled) or on mount
  React.useEffect(() => { fetchWallet(); }, [fetchWallet, refreshKey]);

  // Only show transactions that are actually "earned":
  // - Online: paymentStatus === 'paid'
  // - Cash: status === 'Completed' (cash is only earned when service is delivered)
  const transactions = (walletData.appointments || []).filter((a: any) => {
    const method = (a.paymentMethod || 'cash').toLowerCase();
    if (method === 'online') return a.paymentStatus === 'paid';
    if (method === 'cash') return a.status === 'Completed';
    return false;
  });

  const filtered = transactions.filter((a: any) => {
    const method = (a.paymentMethod || 'cash').toLowerCase();
    if (activeFilter === 'online' && method !== 'online') return false;
    if (activeFilter === 'cash' && method !== 'cash') return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (a.patientId?.name || '').toLowerCase().includes(s) ||
        (a.doctorId?.name || '').toLowerCase().includes(s);
    }
    return true;
  });

  const tabs: { key: WalletFilter; label: string; count: number; active: string }[] = [
    { key: 'all', label: 'All', count: transactions.length, active: 'bg-gray-900 text-white' },
    { key: 'online', label: 'Online', count: transactions.filter((a: any) => (a.paymentMethod || '').toLowerCase() === 'online').length, active: 'bg-blue-600 text-white' },
    { key: 'cash', label: 'Cash', count: transactions.filter((a: any) => (a.paymentMethod || 'cash').toLowerCase() === 'cash' && a.status === 'Completed').length, active: 'bg-amber-500 text-white' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Activity size={32} className="animate-spin text-emerald-500" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white">Hospital / Nursing Home Earnings</h2>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Track your earnings and payouts</p>
      </header>

      {/* Top stat cards - Side by side on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-600 to-teal-700 p-4 sm:p-7 rounded-2xl sm:rounded-3xl text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center"><Activity size={16} /></div>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Total Earnings</p>
            </div>
            <h3 className="text-xl sm:text-3xl font-black flex items-center gap-1">
              <IndianRupee size={20} className="sm:w-6 sm:h-6" strokeWidth={3} />{walletData.totalEarnings.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] opacity-75 font-semibold mt-1 sm:mt-2">Online + cash bookings</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600">
              <CheckCircle2 size={16} />
            </div>
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Paid Out</p>
          </div>
          <p className="text-lg sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-0.5 truncate">
            <IndianRupee size={16} className="sm:w-5 sm:h-5 shrink-0" />{walletData.totalPaidOut.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-gray-400 font-semibold mt-1 sm:mt-2 truncate">Paid by admin</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
              <IndianRupee size={16} />
            </div>
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Remaining Balance</p>
          </div>
          <p className="text-lg sm:text-3xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-0.5 truncate">
            <IndianRupee size={16} className="sm:w-5 sm:h-5 shrink-0" />{walletData.remainingBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-gray-400 font-semibold mt-1 sm:mt-2 truncate">Pending payout</p>
        </div>
      </div>

      {/* Earnings breakdown - Side by side on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        <button onClick={() => setActiveFilter(activeFilter === 'online' ? 'all' : 'online')}
          className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-5 text-left transition-all ${activeFilter === 'online' ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400/30' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-200'}`}>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
            <CreditCard size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">Online Earnings</p>
            <p className="text-base sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-0.5 truncate">
              <IndianRupee size={15} className="sm:w-4 sm:h-4" />{walletData.onlineEarnings.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] sm:text-[10px] text-blue-500 font-bold mt-0.5 truncate">{activeFilter === 'online' ? 'Filtered' : 'Filter Online'}</p>
          </div>
        </button>

        <button onClick={() => setActiveFilter(activeFilter === 'cash' ? 'all' : 'cash')}
          className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-5 text-left transition-all ${activeFilter === 'cash' ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-400/30' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-amber-200'}`}>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
            <Wallet size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">Cash Earnings</p>
            <p className="text-base sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-0.5 truncate">
              <IndianRupee size={15} className="sm:w-4 sm:h-4" />{walletData.cashEarnings.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] sm:text-[10px] text-amber-500 font-bold mt-0.5 truncate">{activeFilter === 'cash' ? 'Filtered' : 'Filter Cash'}</p>
          </div>
        </button>

        <div className="col-span-2 lg:col-span-1 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-sm flex items-center gap-3 sm:gap-5 text-left bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 shrink-0">
            <IndianRupee size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">Platform Commission</p>
            <p className="text-base sm:text-2xl font-black text-violet-600 dark:text-violet-400 flex items-center gap-0.5 truncate">
              <IndianRupee size={15} className="sm:w-4 sm:h-4" />{walletData.totalPlatformCommission.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-gray-500 font-semibold mt-0.5 truncate">
              Online {walletData.onlinePlatformCommission.toLocaleString('en-IN')} · Cash {walletData.cashPlatformCommission.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Admin payout history */}
      {walletData.paymentLogs?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-gray-700">
            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
              <CheckCircle2 size={14} className="text-violet-500" /> Admin Payout History
            </h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {[...walletData.paymentLogs].reverse().map((log: any, i: number) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
                    <CheckCircle2 size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{log.note || 'Admin Payment'}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {log.date ? new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-black text-violet-600">- ₹{(log.amount || 0).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 dark:border-gray-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
              <Activity size={14} className="text-emerald-500" /> Transaction History
            </h3>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search patient / doctor..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-xs font-bold focus:outline-none focus:ring-2 ring-emerald-500/20 w-48" />
            </div>
          </div>
          {/* Filter tabs */}
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${activeFilter === tab.key ? tab.active : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'}`}>
                {tab.key === 'online' && <CreditCard size={11} />}
                {tab.key === 'cash' && <Wallet size={11} />}
                {tab.key === 'all' && <Activity size={11} />}
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeFilter === tab.key ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service / Patient</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Method</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Booking Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filtered.map((a: any) => (
                <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${(a.paymentMethod || 'cash').toLowerCase() === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        {(a.paymentMethod || 'cash').toLowerCase() === 'online' ? <CreditCard size={16} /> : <Wallet size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                          {a.serviceType === 'lab' ? 'Lab Service' : a.serviceType === 'surgery' ? 'Surgery' : 'Consultation'}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">{a.patientId?.name || 'Patient'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300">{a.date}</span>
                    <p className="text-[10px] text-gray-400">{a.slot}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${(a.paymentMethod || 'cash').toLowerCase() === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                      {((a.paymentMethod || 'cash') as string).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {(() => {
                      const bookingStatus = (a.status || 'Confirmed').toLowerCase();
                      const normalizedStatus =
                        bookingStatus === 'completed'
                          ? 'completed'
                          : bookingStatus === 'cancelled'
                            ? 'cancelled'
                            : 'confirmed';

                      const statusClass =
                        normalizedStatus === 'completed'
                          ? 'bg-emerald-50 text-emerald-600'
                          : normalizedStatus === 'cancelled'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-blue-50 text-blue-600';

                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusClass}`}>
                          {normalizedStatus === 'completed' && <CheckCircle2 size={11} />}
                          {normalizedStatus === 'confirmed' && <Clock size={11} />}
                          {normalizedStatus === 'cancelled' && <X size={11} />}
                          {normalizedStatus}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <p className="text-sm font-black text-emerald-600">+ ₹{a.netAmount ?? a.price ?? 0}</p>
                    <p className="text-[9px] font-bold text-violet-500">Commission: ₹{a.platformFeeAmount || 0}</p>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-16 text-center text-gray-400 font-bold text-sm">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

const kindLabel = (kind?: string) => facilityKindLabel(kind);

const field = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 placeholder-gray-400';
const fieldLabel = 'text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block';

export const HospitalAdminScreen = () => {
  const { currentUser, logout, showToast, isAuthReady } = useAppContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [hospital, setHospital] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [walletRefreshKey, setWalletRefreshKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: currentUser?.name || '', email: currentUser?.email || '' });
  const mainRef = useRef<HTMLElement>(null);

  const ownerId = currentUser?._id;
  const { items: doctorItems, loading: doctorsLoading, reload: reloadDoctors, busyId, setPresence } = useFacilityDoctors(ownerId, showToast);

  const goTo = useCallback((tab: Tab) => {
    setActiveTab(tab);
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, []);

  const loadFacility = useCallback(async () => {
    if (!ownerId) return;
    try {
      const [hRes, bRes] = await Promise.all([
        fetch(`/api/hospital-admin/details?ownerId=${ownerId}`, { cache: 'no-store' }),
        fetch(`/api/hospital-admin/bookings?ownerId=${ownerId}`, { cache: 'no-store' }),
      ]);
      if (hRes.ok) setHospital(await hRes.json());
      else showToast('Facility details not found.', 'error');
      if (bRes.ok) setBookings(await bRes.json());
    } catch {
      showToast('Failed to load data.', 'error');
    } finally {
      setLoading(false);
    }
    // showToast comes from context and is not memoized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!currentUser || currentUser.role !== 'hospital_owner') {
      router.replace('/hospital-admin/login');
      return;
    }
    loadFacility();
  }, [isAuthReady, currentUser, router, loadFacility]);

  const saveFacility = async (patch: Record<string, unknown>, successMsg = 'Facility details updated.') => {
    const res = await fetch('/api/hospital-admin/details', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, ...patch }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data?.error || 'Update failed.', 'error');
      return false;
    }
    setHospital(await res.json());
    showToast(successMsg);
    reloadDoctors(); // doctors' timetables mirror the facility name / address
    return true;
  };

  const captureGps = () => {
    if (!navigator.geolocation) {
      showToast('GPS is not available in this browser.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        await saveFacility({ location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }, 'Map location saved. Patients will see the distance to you.');
        setLocating(false);
      },
      err => {
        setLocating(false);
        showToast(err.code === 1 ? 'Location permission denied.' : 'Could not get GPS location.', 'error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?._id, ...settingsForm }),
      });
      if (res.ok) {
        showToast('Account details updated!');
        localStorage.setItem('aurahealth_user', JSON.stringify({ ...currentUser, ...settingsForm }));
      } else showToast('Failed to update account.', 'error');
    } catch {
      showToast('Failed to update account.', 'error');
    }
  };

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={36} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  const label = kindLabel(hospital?.facilityKind);
  const hasPin = hospital?.locationLat != null && hospital?.locationLng != null;
  const todayISO = istNow().dateISO;
  const verifiedDocs = doctorItems.filter(i => i.doctor.isVerified);
  const inNow = doctorItems.filter(i => i.chamber.isDoctorIn).length;
  const todaysVisits = doctorItems.reduce((n, i) => n + (i.chamber.todaysBookings || 0), 0);
  const upcomingVisits = doctorItems.reduce((n, i) => n + (i.chamber.upcomingBookings || 0), 0);
  const scheduledToday = verifiedDocs.filter(i => i.chamber.isActive && isChamberOpenOn(i.chamber, todayISO)).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const coverPhoto = displayableImages(hospital?.photos)[0];
  const setupSteps = [
    { done: hasPin, title: 'Set your map location', hint: 'Patients see distance and get directions.', action: 'Set GPS', onClick: captureGps },
    { done: doctorItems.length > 0, title: 'Add your doctors & timetable', hint: 'Patients can book once a doctor is verified.', action: 'Add doctor', onClick: () => goTo('doctors') },
    { done: Boolean(coverPhoto), title: 'Upload a facility photo', hint: 'A cover photo builds trust.', action: 'Add photo', onClick: () => { goTo('hospital'); setEditOpen(true); } },
    { done: Boolean(hospital?.about) && (hospital?.departments || []).length > 0, title: 'Describe your services', hint: 'About text and departments.', action: 'Edit profile', onClick: () => { goTo('hospital'); setEditOpen(true); } },
  ];
  const setupDone = setupSteps.filter(x => x.done).length;

  const NAV: { id: Tab; icon: React.ElementType; label: string; short: string }[] = [
    { id: 'dashboard', icon: Activity, label: 'Dashboard', short: 'Home' },
    { id: 'doctors', icon: Stethoscope, label: 'Doctors & Timetable', short: 'Doctors' },
    { id: 'bookings', icon: CalendarCheck, label: 'Bookings', short: 'Bookings' },
    { id: 'hospital', icon: Building2, label: `${label} Profile`, short: 'Profile' },
    { id: 'wallet', icon: Wallet, label: 'Earnings', short: 'Earnings' },
    { id: 'settings', icon: Settings, label: 'Account', short: 'Account' },
  ];

  const stats = [
    { label: 'Doctors', value: doctorItems.length, sub: `${verifiedDocs.length} verified`, icon: Users, tone: 'bg-blue-50 text-blue-600', tab: 'doctors' as Tab },
    { label: 'IN right now', value: inNow, sub: `${scheduledToday} scheduled today`, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600', tab: 'doctors' as Tab },
    { label: "Today's visits", value: todaysVisits, sub: 'Booked for today', icon: CalendarCheck, tone: 'bg-violet-50 text-violet-600', tab: 'bookings' as Tab },
    { label: 'Upcoming', value: upcomingVisits, sub: 'Confirmed visits', icon: Clock, tone: 'bg-amber-50 text-amber-600', tab: 'bookings' as Tab },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-72 bg-white border-r border-gray-100 flex-col h-screen sticky top-0 shrink-0">
        <div className="px-6 pt-6 pb-4">
          <BrandLogo width={150} height={58} showName={false} stacked subtitle={`${label} Partner`} subtitleClassName="text-[10px] uppercase tracking-widest font-bold text-emerald-600" />
        </div>
        <div className="mx-4 mb-4 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">{label}</p>
          <p className="text-sm font-black text-gray-900 truncate">{hospital?.name}</p>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {NAV.map(item => {
            const active = activeTab === item.id;
            return (
              <button key={item.id} type="button" onClick={() => goTo(item.id)}
                className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${active ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}>
                {active && <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-emerald-600" />}
                <item.icon size={20} className={active ? 'stroke-[2.5px]' : ''} />
                <span className="truncate">{item.label}</span>
                {item.id === 'doctors' && inNow > 0 && (
                  <span className="ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">{inNow} IN</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-500">{currentUser?.name?.[0] || 'A'}</div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{currentUser?.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button type="button" onClick={() => { logout(); router.push('/hospital-admin/login'); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">{label} Partner</p>
          <p className="text-sm font-black text-gray-900 truncate">{hospital?.name}</p>
        </div>
        {inNow > 0 && <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-600 text-white shrink-0">{inNow} doctor IN</span>}
      </header>

      <main ref={mainRef} className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-28 md:pb-10 space-y-6">
        {activeTab === 'dashboard' && (
          <>
            {/* Welcome */}
            <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-lg shadow-emerald-900/10">
              {coverPhoto && <SafeImage src={coverPhoto} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" fallback={<span />} />}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-800/95 via-teal-800/90 to-slate-900/95" />
              <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-100/90">{greeting} 👋 Welcome back</p>
                  <h1 className="text-2xl sm:text-4xl font-black mt-1 leading-tight">{hospital?.name}</h1>
                  <p className="text-sm text-white/75 mt-2 flex items-start gap-1.5 max-w-xl"><MapPin size={14} className="mt-0.5 shrink-0" /> <span className="line-clamp-2">{hospital?.address}</span></p>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] font-bold">
                      <Building2 size={12} /> {label}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${hasPin ? 'bg-emerald-400/25 text-emerald-50' : 'bg-amber-400/25 text-amber-50'}`}>
                      <MapPin size={12} /> {hasPin ? 'Location pinned' : 'Location not set'}
                    </span>
                    {inNow > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/25 text-emerald-50 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> {inNow} doctor{inNow > 1 ? 's' : ''} IN now
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button type="button" onClick={() => goTo('doctors')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-800 text-sm font-bold hover:bg-emerald-50 shadow-sm transition-colors">
                    <Plus size={16} /> Add Doctor
                  </button>
                  <button type="button" onClick={captureGps} disabled={locating}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-sm font-bold disabled:opacity-60 transition-colors">
                    {locating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />} {hasPin ? 'Update GPS' : 'Set GPS location'}
                  </button>
                </div>
              </div>
            </section>

            {/* Setup checklist (hidden once everything is done) */}
            {setupDone < setupSteps.length && (
              <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-black text-gray-900">Finish setting up your {label.toLowerCase()}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{setupDone} of {setupSteps.length} done — a complete profile gets more bookings.</p>
                  </div>
                  <div className="w-28 sm:w-40 h-2 rounded-full bg-gray-100 overflow-hidden shrink-0">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${(setupDone / setupSteps.length) * 100}%` }} />
                  </div>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {setupSteps.map(step => (
                    <li key={step.title} className={`flex items-center gap-3 rounded-2xl border p-3.5 ${step.done ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-gray-200'}`}>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-600 text-white' : 'border-2 border-gray-300 text-transparent'}`}>
                        <CheckCircle2 size={16} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${step.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{step.title}</p>
                        <p className="text-[11px] text-gray-500 truncate">{step.hint}</p>
                      </div>
                      {!step.done && (
                        <button type="button" onClick={step.onClick} disabled={locating}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 disabled:opacity-60">{step.action}</button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Stats */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {stats.map(s => (
                <button key={s.label} type="button" onClick={() => goTo(s.tab)}
                  className="group text-left bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-200 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50">
                  <div className="flex items-start justify-between">
                    <div className={`inline-flex p-2.5 rounded-xl ${s.tone}`}><s.icon size={20} /></div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-3xl font-black text-gray-900 mt-4 leading-none">{s.value}</p>
                  <p className="text-sm font-bold text-gray-700 mt-1.5">{s.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
                </button>
              ))}
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="xl:col-span-3">
                <FacilityTodayBoard items={doctorItems} busyId={busyId} onPresence={setPresence} onManage={() => goTo('doctors')} />
              </div>

              {/* Recent bookings */}
              <section className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="font-black text-gray-900 flex items-center gap-2"><CalendarCheck size={18} className="text-emerald-600" /> Recent Bookings</h3>
                  <button type="button" onClick={() => goTo('bookings')} className="text-xs font-bold text-emerald-700 hover:underline">View all →</button>
                </div>
                {bookings.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3"><CalendarCheck size={22} /></div>
                    <p className="text-sm font-bold text-gray-600">No bookings yet</p>
                    <p className="text-xs text-gray-400 mt-1">Bookings appear here as soon as patients book your doctors.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {bookings.slice(0, 6).map((b: any) => (
                      <li key={b._id} className="px-5 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-500 text-xs shrink-0">
                          {(b.patientId?.name || 'P')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{b.patientId?.name || 'Patient'}</p>
                          <p className="text-[11px] text-gray-500 truncate">{b.doctorId?.name || b.serviceName || 'Visit'} · {b.date} {b.slot}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          b.status === 'Completed' ? 'bg-blue-50 text-blue-700' : b.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                        }`}>{b.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}

        {activeTab === 'doctors' && ownerId && hospital && (
          <FacilityDoctorsTab
            ownerId={ownerId}
            facilityId={hospital.id}
            facilityLabel={label}
            items={doctorItems}
            loading={doctorsLoading}
            reload={reloadDoctors}
            busyId={busyId}
            onPresence={setPresence}
            showToast={showToast}
          />
        )}

        {activeTab === 'bookings' && (
          <BookingsTab ownerId={ownerId} bookings={bookings} setBookings={setBookings} showToast={showToast} onBookingUpdate={() => setWalletRefreshKey(k => k + 1)} />
        )}

        {activeTab === 'wallet' && (
          <HospitalWalletTab key={`wallet-${walletRefreshKey}`} currentUser={currentUser} showToast={showToast} refreshKey={walletRefreshKey} />
        )}

        {activeTab === 'hospital' && hospital && (
          <FacilityProfileView hospital={hospital} label={label} hasPin={hasPin} locating={locating} onCaptureGps={captureGps} onEdit={() => setEditOpen(true)} />
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-5">
            <header>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Account</h2>
              <p className="text-sm text-gray-500 mt-1">Your login details for this panel.</p>
            </header>
            <form onSubmit={handleAccountUpdate} className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-100 shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={fieldLabel}>Full name</label><input value={settingsForm.name} onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })} className={field} /></div>
                <div><label className={fieldLabel}>Email</label><input type="email" value={settingsForm.email} onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })} className={field} /></div>
              </div>
              <button type="submit" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold">Save account</button>
            </form>
            <button type="button" onClick={() => { logout(); router.push('/hospital-admin/login'); }}
              className="md:hidden w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 text-rose-600 text-sm font-bold">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-6 px-1 py-1.5">
          {NAV.map(item => {
            const active = activeTab === item.id;
            return (
              <button key={item.id} type="button" onClick={() => goTo(item.id)}
                className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl ${active ? 'text-emerald-600' : 'text-gray-400'}`}>
                <item.icon size={20} className={active ? 'stroke-[2.5px]' : ''} />
                <span className={`text-[9px] leading-tight ${active ? 'font-bold' : 'font-medium'}`}>{item.short}</span>
              </button>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {editOpen && hospital && (
        <FacilityProfileModal
          hospital={hospital}
          showToast={showToast}
          onClose={() => setEditOpen(false)}
          onSave={async patch => { if (await saveFacility(patch)) setEditOpen(false); }}
        />
      )}
    </div>
  );
};

// ─── Facility profile (view) ─────────────────────────────────────────────────

function FacilityProfileView({ hospital, label, hasPin, locating, onCaptureGps, onEdit }: {
  hospital: any; label: string; hasPin: boolean; locating: boolean; onCaptureGps: () => void; onEdit: () => void;
}) {
  const photos = displayableImages(hospital.photos);
  const chip = (text: string, tone: string) => <span key={text} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${tone}`}>{text}</span>;
  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{label} Profile</h2>
          <p className="text-sm text-gray-500 mt-1">This is what patients see on your public page.</p>
        </div>
        <div className="flex gap-2">
          <a href={`/hospital/${hospital.id}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">
            <ExternalLink size={15} /> Public page
          </a>
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold">
            <Edit3 size={15} /> Edit profile
          </button>
        </div>
      </header>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="relative h-44 sm:h-60">
          <SafeImage src={photos[0]} alt={hospital.name} className="w-full h-full object-cover"
            fallback={<div className="w-full h-full bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 flex items-center justify-center"><Building2 size={64} className="text-white/20" /></div>} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full">
              {label}{hospital.type ? ` · ${String(hospital.type).replace(/^./, (c: string) => c.toUpperCase())}` : ''}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 truncate">{hospital.name}</h1>
            {hospital.nameHi && <p className="text-sm text-white/80">{hospital.nameHi}</p>}
          </div>
        </div>

        <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-700 mb-2">About</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{hospital.about || 'No description yet — add one so patients know what you offer.'}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gray-50 p-4">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-blue-700 mb-2">Departments</h4>
                <div className="flex flex-wrap gap-2">
                  {(hospital.departments || []).length ? hospital.departments.map((d: string) => chip(d, 'bg-blue-50 text-blue-700')) : <p className="text-xs text-gray-400">None added</p>}
                </div>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-700 mb-2">Facilities</h4>
                <div className="flex flex-wrap gap-2">
                  {(hospital.facilities || []).length ? hospital.facilities.map((f: string) => chip(f, 'bg-amber-50 text-amber-700')) : <p className="text-xs text-gray-400">None added</p>}
                </div>
              </div>
            </div>
            {photos.length > 1 && (
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2">Photos</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((p, i) => <SafeImage key={i} src={p} alt={`${hospital.name} photo ${i + 1}`} className="w-full h-24 object-cover rounded-xl" />)}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-gray-50 p-4 space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-500">Contact</h4>
              <p className="text-sm font-bold text-gray-800 flex items-center gap-2"><Phone size={14} className="text-emerald-600" /> {hospital.phone || '—'}</p>
              <p className="text-sm font-bold text-gray-800 flex items-center gap-2 break-all"><Mail size={14} className="text-emerald-600 shrink-0" /> {hospital.email || '—'}</p>
              <p className="text-sm text-gray-600 flex items-start gap-2"><MapPin size={14} className="text-emerald-600 mt-0.5 shrink-0" /> {hospital.address}</p>
            </div>
            <div className={`rounded-2xl p-4 space-y-2 ${hasPin ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <h4 className={`text-[11px] font-black uppercase tracking-wider ${hasPin ? 'text-emerald-700' : 'text-amber-700'}`}>Map location</h4>
              {hasPin ? (
                <a href={`https://www.google.com/maps?q=${hospital.locationLat},${hospital.locationLng}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-bold text-emerald-800 hover:underline flex items-center gap-1.5"><CheckCircle2 size={14} /> GPS pinned — view on map</a>
              ) : (
                <p className="text-sm text-amber-800">Not set yet.</p>
              )}
              <button type="button" onClick={onCaptureGps} disabled={locating}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-xs font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-60">
                {locating ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />} Use my current location
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Facility profile (edit) ─────────────────────────────────────────────────

function FacilityProfileModal({ hospital, showToast, onClose, onSave }: {
  hospital: any;
  showToast: (m: string, t?: 'success' | 'error') => void;
  onClose: () => void;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    facilityKind: hospital.facilityKind || 'hospital',
    type: hospital.type || 'private',
    name: hospital.name || '',
    nameHi: hospital.nameHi || '',
    phone: hospital.phone || '',
    email: hospital.email || '',
    address: hospital.address || '',
    addressHi: hospital.addressHi || '',
    about: hospital.about || '',
    aboutHi: hospital.aboutHi || '',
    departments: (hospital.departments || []).join(', '),
    facilities: (hospital.facilities || []).join(', '),
    photos: displayableImages(hospital.photos),
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));
  const list = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

  const submit = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      showToast('Name and address are required.', 'error');
      return;
    }
    setSaving(true);
    await onSave({ ...form, departments: list(form.departments), facilities: list(form.facilities) });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-900">Edit Profile</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <span className={fieldLabel}>Facility type</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {FACILITY_KIND_OPTIONS.map(({ value, label: title, hint: sub }) => (
                <button key={value} type="button" onClick={() => set('facilityKind', value)}
                  className={`p-3 rounded-2xl border-2 text-left ${form.facilityKind === value ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className={`text-sm font-bold ${form.facilityKind === value ? 'text-emerald-700' : 'text-gray-700'}`}>{title}</p>
                  <p className="text-[11px] text-gray-500">{sub}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className={fieldLabel}>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} className={field} /></div>
            <div><label className={fieldLabel}>Name in Hindi (optional)</label><input value={form.nameHi} onChange={e => set('nameHi', e.target.value)} className={field} /></div>
            <div>
              <label className={fieldLabel}>Ownership</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className={field}>
                <option value="private">Private</option>
                <option value="government">Government</option>
              </select>
            </div>
            <div><label className={fieldLabel}>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className={field} /></div>
            <div><label className={fieldLabel}>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={field} /></div>
            <div className="sm:col-span-2"><label className={fieldLabel}>Address</label><textarea rows={2} value={form.address} onChange={e => set('address', e.target.value)} className={`${field} resize-none`} /></div>
            <div className="sm:col-span-2"><label className={fieldLabel}>About</label><textarea rows={3} value={form.about} onChange={e => set('about', e.target.value)} className={`${field} resize-none`} /></div>
            <div><label className={fieldLabel}>Departments (comma separated)</label><input value={form.departments} onChange={e => set('departments', e.target.value)} className={field} placeholder="Cardiology, Orthopedics" /></div>
            <div><label className={fieldLabel}>Facilities (comma separated)</label><input value={form.facilities} onChange={e => set('facilities', e.target.value)} className={field} placeholder="24/7 Emergency, ICU, Pharmacy" /></div>
          </div>
          <div>
            <span className={fieldLabel}>Photos ({form.photos.length}/10) — the first one is the cover</span>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {form.photos.map((p, i) => (
                <div key={i} className="relative h-20 rounded-xl overflow-hidden bg-gray-100 group">
                  <SafeImage src={p} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button" aria-label="Remove photo" onClick={() => set('photos', form.photos.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white sm:opacity-0 sm:group-hover:opacity-100"><X size={11} /></button>
                </div>
              ))}
              {form.photos.length < 10 && (
                <label className="h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-400 cursor-pointer">
                  <Camera size={18} /><span className="text-[10px] font-bold mt-0.5">Add</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={async e => {
                    const files = Array.from(e.target.files || []).slice(0, 10 - form.photos.length);
                    e.target.value = '';
                    try {
                      const added = await Promise.all(files.map(f => compressImageFile(f)));
                      setForm(f => ({ ...f, photos: [...f.photos, ...added].slice(0, 10) }));
                    } catch (err) {
                      showToast(err instanceof Error ? err.message : 'Could not add photo.', 'error');
                    }
                  }} />
                </label>
              )}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white/95 backdrop-blur px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
          <button type="button" onClick={submit} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
