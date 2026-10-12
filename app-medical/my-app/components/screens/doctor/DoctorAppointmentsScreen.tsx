"use client";
import React, { useEffect, useState } from 'react';
import { Calendar, Video, MapPin, Clock, Search, User, CheckCircle, XCircle, X, Phone, CreditCard, Wallet, IndianRupee, Building2 } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

export const DoctorAppointmentsScreen = () => {
  const { appointments, showToast, currentUser, startInstantCall, fetchAppointments } = useAppContext();
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [chamberFilter, setChamberFilter] = useState<string>('all');

  useEffect(() => {
    fetchAppointments();
    // fetchAppointments is context-provided and not memoized; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAppointments();
    // Refresh data when changing tab/filter section.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    const onFocus = () => fetchAppointments();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myAppointments = appointments.filter((apt: any) => {
    const doctorId = apt.doctorId?._id || apt.doctorId;
    return String(doctorId) === String(currentUser?._id);
  });

  const chamberOptions = Array.from(
    new Map(
      myAppointments
        .filter((a: any) => a.chamberName)
        .map((a: any) => [String(a.chamberId ?? a.chamberName), a.chamberName as string])
    ).entries()
  );

  const tabs = [
    { key: 'All', label: 'All', count: myAppointments.length },
    { key: 'Upcoming', label: 'Upcoming', count: myAppointments.filter((a: any) => a.status === 'Confirmed').length },
    { key: 'Completed', label: 'Completed', count: myAppointments.filter((a: any) => a.status === 'Completed').length },
    { key: 'Cancelled', label: 'Cancelled', count: myAppointments.filter((a: any) => a.status === 'Cancelled').length },
  ];

  const filtered = myAppointments.filter((apt: any) => {
    const matchTab = activeTab === 'All' ||
      (activeTab === 'Upcoming' && apt.status === 'Confirmed') ||
      (activeTab === 'Completed' && apt.status === 'Completed') ||
      (activeTab === 'Cancelled' && apt.status === 'Cancelled');
    const patientName = apt.patientId?.name || 'Patient';
    const patientEmail = apt.patientId?.email || '';
    const patientPhone = apt.patientId?.phone || '';
    const matchSearch = searchTerm === '' ||
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientPhone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchChamber = chamberFilter === 'all' || String(apt.chamberId ?? apt.chamberName) === chamberFilter;
    return matchTab && matchSearch && matchChamber;
  });

  const updateStatus = async (appointmentId: string, status: string) => {
    if (!appointmentId || updatingId) return;
    setUpdatingId(appointmentId);
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, status, doctorId: currentUser?._id }),
      });
      if (res.ok) {
        showToast(status === 'Completed' ? 'Appointment marked as completed' : 'Appointment cancelled');
        fetchAppointments();
      } else {
        showToast('Failed to update appointment', 'error');
      }
    } catch {
      showToast('Failed to update appointment', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Confirmed: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      Cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };
    return styles[status] || 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
  };

  const paymentMethodOf = (apt: any) => (apt.paymentMethod || 'cash').toLowerCase();
  const paymentLabel = (apt: any) => {
    const m = paymentMethodOf(apt);
    if (m === 'chamber') return apt.paymentStatus === 'paid' ? 'Collected' : 'At Chamber';
    return m === 'online' ? 'Online' : 'Cash';
  };
  // For chamber bookings the doctor collects only the consultation fee; the booking fee goes to the platform.
  const amountFor = (apt: any) => Number((paymentMethodOf(apt) === 'chamber' ? apt.basePrice : apt.price) || 0);

  const getDialHref = (phone: string) => `tel:${String(phone).replace(/[^\d+]/g, '')}`;

  return (
    <div className="p-3 sm:p-4 pb-28 md:pb-8 md:px-6 lg:px-8 xl:px-10 2xl:px-12 md:py-8 space-y-5 w-full">
      <div>
        <h1 className="text-xl md:text-3xl font-extrabold text-gray-900 dark:text-white">My Appointments</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">{myAppointments.length} total appointments</p>
      </div>

      {chamberOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <Building2 size={15} className="text-teal-600 shrink-0" />
          <select
            value={chamberFilter}
            onChange={e => setChamberFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            <option value="all">All chambers</option>
            {chamberOptions.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
          </select>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
              activeTab === tab.key
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === tab.key
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by patient name, email or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center py-16 md:py-20 text-gray-400 dark:text-gray-500">
          <Calendar size={44} className="mb-3 opacity-50" />
          <p className="font-bold text-base text-gray-600 dark:text-gray-400">No appointments found</p>
          <p className="text-sm mt-1 text-center px-4">
            {myAppointments.length === 0 ? 'Patient bookings will appear here.' : 'Try adjusting your filter or search term.'}
          </p>
          {(activeTab !== 'All' || searchTerm) && (
            <button
              onClick={() => { setActiveTab('All'); setSearchTerm(''); }}
              className="mt-4 text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                  <th className="text-left px-6 py-4 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Patient</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Date & Time</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Type</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Payment</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Price</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filtered.slice().reverse().map((apt: any) => (
                  <tr key={apt._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                          <User size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white truncate">{apt.patientId?.name || 'Patient'}</p>
                          <p className="text-xs text-gray-400 truncate">{apt.patientId?.email || ''}</p>
                          {apt.patientId?.phone && (
                            <div className="mt-0.5 flex items-center gap-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{apt.patientId.phone}</p>
                              <a
                                href={getDialHref(apt.patientId.phone)}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-400 text-[10px] font-bold transition-colors"
                              >
                                <Phone size={11} /> Call
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Clock size={14} className="text-gray-400 shrink-0" />
                        <span className="whitespace-nowrap">{apt.date} - {apt.slot}</span>
                      </div>
                      {apt.chamberName && (
                        <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-teal-700 dark:text-teal-400">
                          <Building2 size={12} className="shrink-0" /> <span className="truncate max-w-[220px]">{apt.chamberName}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${apt.type === 'video' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'}`}>
                        {apt.type === 'video' ? <Video size={12} /> : <MapPin size={12} />}
                        {apt.type === 'video' ? 'Video' : 'Clinic'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${paymentMethodOf(apt) === 'online' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {paymentMethodOf(apt) === 'online' ? <CreditCard size={12} /> : <Wallet size={12} />}
                        {paymentLabel(apt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        <IndianRupee size={14} />
                        {amountFor(apt).toLocaleString('en-IN')}
                      </span>
                      {paymentMethodOf(apt) === 'chamber' && apt.paymentStatus !== 'paid' && (
                        <p className="text-[10px] text-gray-400 mt-0.5">collect at chamber</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {apt.type === 'video' && apt.status === 'Confirmed' && (
                          <button onClick={() => startInstantCall(apt.doctorId)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors">
                            <Video size={14} /> Join
                          </button>
                        )}
                        {apt.status === 'Confirmed' && (
                          <button
                            onClick={() => updateStatus(apt._id, 'Completed')}
                            disabled={updatingId === apt._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-400 font-bold text-xs transition-colors"
                          >
                            <CheckCircle size={14} /> {updatingId === apt._id ? 'Updating...' : 'Complete'}
                          </button>
                        )}
                        {apt.status === 'Confirmed' && (
                          <button
                            onClick={() => updateStatus(apt._id, 'Cancelled')}
                            disabled={updatingId === apt._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold text-xs transition-colors"
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
            {filtered.slice().reverse().map((apt: any) => (
              <div key={apt._id} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                    <User size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{apt.patientId?.name || 'Patient'}</p>
                    {apt.patientId?.phone && (
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{apt.patientId.phone}</p>
                        <a
                          href={getDialHref(apt.patientId.phone)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-400 text-[10px] font-bold transition-colors"
                        >
                          <Phone size={11} /> Call
                        </a>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock size={11} className="shrink-0" /> {apt.date} - {apt.slot}
                    </p>
                    {apt.chamberName && (
                      <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1 mt-0.5">
                        <Building2 size={11} className="shrink-0" /> <span className="truncate">{apt.chamberName}</span>
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${statusBadge(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                      apt.type === 'video'
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                        : 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400'
                    }`}>
                      {apt.type === 'video' ? <Video size={11} /> : <MapPin size={11} />}
                      {apt.type === 'video' ? 'Video' : 'Clinic'}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                      paymentMethodOf(apt) === 'online'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                    }`}>
                      {paymentMethodOf(apt) === 'online' ? <CreditCard size={11} /> : <Wallet size={11} />}
                      {paymentLabel(apt)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                      <IndianRupee size={11} />
                      {amountFor(apt).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {apt.type === 'video' && apt.status === 'Confirmed' && (
                      <button onClick={() => startInstantCall(apt.doctorId)} className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-[11px] flex items-center gap-1 shrink-0">
                        <Video size={11} /> Join
                      </button>
                    )}
                    {apt.status === 'Confirmed' && (
                      <button
                        onClick={() => updateStatus(apt._id, 'Completed')}
                        disabled={updatingId === apt._id}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold text-[11px] flex items-center gap-1 shrink-0"
                      >
                        <CheckCircle size={11} /> {updatingId === apt._id ? '...' : 'Done'}
                      </button>
                    )}
                    {apt.status === 'Confirmed' && (
                      <button
                        onClick={() => updateStatus(apt._id, 'Cancelled')}
                        disabled={updatingId === apt._id}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center gap-1 shrink-0"
                      >
                        <XCircle size={11} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
