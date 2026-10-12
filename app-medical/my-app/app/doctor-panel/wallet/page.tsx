'use client';

import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  ArrowUpRight,
  Search,
  Activity,
  CreditCard,
  Wallet,
  TrendingUp,
  CheckCircle2,
  Clock,
  BadgeIndianRupee,
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

type PaymentFilter = 'all' | 'online' | 'cash';

export default function DoctorWalletPage() {
  const { currentUser } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    onlineEarnings: 0,
    cashEarnings: 0,
    totalPlatformCommission: 0,
    onlinePlatformCommission: 0,
    cashPlatformCommission: 0,
    totalPaidOut: 0,
    remainingBalance: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<PaymentFilter>('all');

  useEffect(() => {
    if (!currentUser?._id) return;
    let isMounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/doctors/${currentUser._id}/wallet?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok || !isMounted) return;

        const data = await res.json();
        if (!isMounted) return;

        setAppointments(data.appointments || []);
        setPaymentLogs(data.paymentLogs || []);
        setStats({
          totalEarnings: data.totalEarnings || 0,
          onlineEarnings: data.onlineEarnings || 0,
          cashEarnings: data.cashEarnings || 0,
          totalPlatformCommission: data.totalPlatformCommission || 0,
          onlinePlatformCommission: data.onlinePlatformCommission || 0,
          cashPlatformCommission: data.cashPlatformCommission || 0,
          totalPaidOut: data.totalPaidOut || 0,
          remainingBalance: data.remainingBalance || 0,
        });
      } catch (err) {
        console.error('Failed to fetch wallet data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const handleFocus = () => {
      fetchData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchData();
    };

    fetchData();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?._id]);

  const methodOf = (a: any) => (a.paymentMethod || 'cash').toLowerCase();
  const isEarnedTransaction = (a: any) => {
    const method = methodOf(a);
    if (method === 'online') return a.paymentStatus === 'paid';
    return method === 'cash' && a.status === 'Completed';
  };

  const baseTransactions = appointments.filter((a: any) => a.paymentStatus === 'paid' || methodOf(a) === 'cash');

  const filteredTransactions = baseTransactions.filter((a: any) => {
    if (activeFilter === 'online' && methodOf(a) !== 'online') return false;
    if (activeFilter === 'cash' && methodOf(a) !== 'cash') return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (a.patientId?.name || '').toLowerCase().includes(s) || (a.paymentMethod || '').toLowerCase().includes(s);
    }
    return true;
  });

  const onlineCount = baseTransactions.filter((a: any) => methodOf(a) === 'online').length;
  const cashCount = baseTransactions.filter((a: any) => methodOf(a) === 'cash').length;

  const filterTabs: { key: PaymentFilter; label: string; count: number; color: string; activeClass: string }[] = [
    { key: 'all', label: 'All Payments', count: baseTransactions.length, color: 'text-gray-600', activeClass: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' },
    { key: 'online', label: 'Online', count: onlineCount, color: 'text-blue-600', activeClass: 'bg-blue-600 text-white' },
    { key: 'cash', label: 'Cash', count: cashCount, color: 'text-amber-600', activeClass: 'bg-amber-500 text-white' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Activity size={40} className="animate-spin text-teal-500" />
        <p className="text-sm font-bold text-gray-400">Loading earnings...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 pb-20 md:pb-8 md:px-6 lg:px-8 xl:px-10 2xl:px-12 md:py-8 space-y-8 animate-in fade-in duration-500 w-full">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">My Earnings</h1>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Track your professional income</p>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Earnings */}
        <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-7 rounded-3xl text-white shadow-xl shadow-teal-500/20 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Total Earnings</p>
            </div>
            <h3 className="text-3xl font-black flex items-center gap-1">
              <IndianRupee size={24} strokeWidth={3} />
              {stats.totalEarnings.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] opacity-70 font-semibold mt-2">Online + cash from all appointments</p>
          </div>
        </div>

        {/* Total Paid Out */}
        <div className="bg-white dark:bg-gray-900 p-7 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <CheckCircle2 size={18} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paid Out</p>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-1">
            <IndianRupee size={22} />
            {stats.totalPaidOut.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-gray-400 font-semibold mt-2">Online earnings paid by admin</p>
        </div>

        {/* Remaining Balance */}
        <div className="bg-white dark:bg-gray-900 p-7 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BadgeIndianRupee size={18} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remaining Balance</p>
          </div>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <IndianRupee size={22} />
            {stats.remainingBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-gray-400 font-semibold mt-2">Online earnings pending payout</p>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <button
          onClick={() => setActiveFilter(activeFilter === 'online' ? 'all' : 'online')}
          className={`p-6 rounded-3xl border shadow-sm flex items-center gap-5 text-left transition-all ${activeFilter === 'online' ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 ring-2 ring-blue-400/30' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-200'}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
            <CreditCard size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Online Consultations</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-1">
              <IndianRupee size={18} />{stats.onlineEarnings.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 mt-1">
              <ArrowUpRight size={12} /> {activeFilter === 'online' ? 'Showing online only' : 'Click to filter online'}
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveFilter(activeFilter === 'cash' ? 'all' : 'cash')}
          className={`p-6 rounded-3xl border shadow-sm flex items-center gap-5 text-left transition-all ${activeFilter === 'cash' ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 ring-2 ring-amber-400/30' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-amber-200'}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
            <Wallet size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Clinic Cash Earnings</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-1">
              <IndianRupee size={18} />{stats.cashEarnings.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 mt-1">
              <Activity size={12} /> {activeFilter === 'cash' ? 'Showing cash only' : 'Click to filter cash'}
            </div>
          </div>
        </button>

        <div className="p-6 rounded-3xl border shadow-sm flex items-center gap-5 text-left bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 shrink-0">
            <BadgeIndianRupee size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Platform Commission</p>
            <p className="text-2xl font-black text-violet-600 dark:text-violet-400 flex items-center gap-1">
              <IndianRupee size={18} />{stats.totalPlatformCommission.toLocaleString('en-IN')}
            </p>
            <div className="text-[10px] font-bold text-gray-500 mt-1">
              Online {stats.onlinePlatformCommission.toLocaleString('en-IN')} - Cash {stats.cashPlatformCommission.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Payment History */}
      {paymentLogs.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-gray-800">
            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="text-violet-500" /> Payment History (Admin Payouts)
            </h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {[...paymentLogs].reverse().map((log: any, i: number) => (
              <div key={i} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{log.note || 'Admin Payment'}</p>
                    <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {log.date ? new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-black text-violet-600 flex items-center gap-1 self-end sm:self-auto">
                  - <IndianRupee size={13} /> {(log.amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointment Transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Table Header with Filter Tabs + Search */}
        <div className="p-6 border-b border-gray-50 dark:border-gray-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
              <Activity size={15} className="text-teal-500" /> Appointment Transactions
            </h3>
            <div className="relative w-full sm:w-auto">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search patient..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-xs font-bold focus:outline-none focus:ring-2 ring-teal-500/20 w-full sm:w-44"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeFilter === tab.key
                    ? tab.activeClass
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab.key === 'online' && <CreditCard size={12} />}
                {tab.key === 'cash' && <Wallet size={12} />}
                {tab.key === 'all' && <Activity size={12} />}
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeFilter === tab.key ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Method</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredTransactions.map((apt: any) => (
                <tr key={apt._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${methodOf(apt) === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        {methodOf(apt) === 'online' ? <CreditCard size={16} /> : <Wallet size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white">{apt.patientId?.name || 'Patient'}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">{apt.type === 'video' ? 'Video Consult' : 'Clinic Visit'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-black text-gray-700 dark:text-gray-300">{apt.date}</span>
                      <span className="text-[10px] font-bold text-gray-400">{apt.slot}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      methodOf(apt) === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {methodOf(apt)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <p className={`text-sm font-black flex items-center justify-end gap-1 ${isEarnedTransaction(apt) ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isEarnedTransaction(apt) ? '+' : ''} <IndianRupee size={13} /> {apt.netAmount ?? apt.price ?? 0}
                      </p>
                      <span className="text-[9px] font-bold text-violet-500">
                        Commission: ₹{apt.platformFeeAmount || 0}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        apt.status === 'Completed'
                          ? 'bg-blue-50 text-blue-600'
                          : apt.status === 'Cancelled'
                            ? 'bg-red-50 text-red-500'
                            : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {apt.status || 'Confirmed'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      {activeFilter === 'online' ? <CreditCard size={28} className="opacity-30" /> : activeFilter === 'cash' ? <Wallet size={28} className="opacity-30" /> : <Activity size={28} className="opacity-30" />}
                      <p className="font-bold text-sm">No {activeFilter === 'all' ? '' : activeFilter} transactions found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {filteredTransactions.map((apt: any) => (
            <div key={apt._id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${methodOf(apt) === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                    {methodOf(apt) === 'online' ? <CreditCard size={15} /> : <Wallet size={15} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 dark:text-white truncate">{apt.patientId?.name || 'Patient'}</p>
                    <p className="text-[10px] font-bold text-gray-400">{apt.type === 'video' ? 'Video Consult' : 'Clinic Visit'}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ${
                  methodOf(apt) === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {methodOf(apt)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="text-gray-500 dark:text-gray-400">
                  <p className="font-bold text-gray-700 dark:text-gray-300">{apt.date}</p>
                  <p className="text-[10px] font-bold">{apt.slot}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black flex items-center justify-end gap-1 ${isEarnedTransaction(apt) ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isEarnedTransaction(apt) ? '+' : ''} <IndianRupee size={13} /> {apt.netAmount ?? apt.price ?? 0}
                  </p>
                  <p className="text-[9px] font-bold text-violet-500">Commission: ₹{apt.platformFeeAmount || 0}</p>
                  <span className={`inline-flex text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    apt.status === 'Completed'
                      ? 'bg-blue-50 text-blue-600'
                      : apt.status === 'Cancelled'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {apt.status || 'Confirmed'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                {activeFilter === 'online' ? <CreditCard size={24} className="opacity-30" /> : activeFilter === 'cash' ? <Wallet size={24} className="opacity-30" /> : <Activity size={24} className="opacity-30" />}
                <p className="font-bold text-sm">No {activeFilter === 'all' ? '' : activeFilter} transactions found.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




