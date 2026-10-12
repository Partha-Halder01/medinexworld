"use client";
import React, { useEffect, useState } from 'react';
import {
  Search,
  Eye,
  Trash2,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Video,
  Stethoscope,
  CheckCircle,
  XCircle,
  IndianRupee,
  Shield,
  Copy,
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-emerald-500',
];

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < (name || '').length; i += 1) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const formatCurrency = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateOnly = (value?: string | Date | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };
  return map[status] || 'bg-gray-100 text-gray-500';
};

export const AdminUsersScreen = () => {
  const { showToast } = useAppContext();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailUser, setDetailUser] = useState<any>(null);
  const [detailAppointments, setDetailAppointments] = useState<any[]>([]);
  const [detailStats, setDetailStats] = useState<any>(null);
  const [bookingFilter, setBookingFilter] = useState<'all' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Reviewed' | 'Spent'>('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to fetch users.', 'error');
      } else {
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch {
      showToast('Failed to fetch users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openDetailModal = async (userId: string) => {
    setShowDetail(true);
    setDetailLoading(true);
    setBookingFilter('all');
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to fetch user details.', 'error');
        setShowDetail(false);
      } else {
        setDetailUser(data.user || null);
        setDetailAppointments(Array.isArray(data.appointments) ? data.appointments : []);
        setDetailStats(data.stats || null);
      }
    } catch {
      showToast('Failed to fetch user details.', 'error');
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard.', 'success');
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Delete ${user.name}? This will also delete all of this user's bookings.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to delete user.', 'error');
        return;
      }

      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      if (detailUser?._id === user._id) {
        setShowDetail(false);
      }
      showToast(`User deleted. ${data.deletedAppointments || 0} booking(s) removed.`, 'success');
    } catch {
      showToast('Failed to delete user.', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q);
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 md:pb-8 md:p-6 lg:p-8 w-full space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">Users</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs md:text-sm">
          {users.length} registered users
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">User</th>
                <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Contact</th>
                <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Bookings</th>
                <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Spent</th>
                <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Joined</th>
                <th className="text-right px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${getAvatarColor(u.name)} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}>
                        {getInitials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{u.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">ID: {u._id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-gray-900 dark:text-white font-medium text-sm">{u.email}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{u.phone || 'N/A'}</p>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">{u?.stats?.totalBookings || 0}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                    {formatCurrency(Number(u?.stats?.totalSpent || 0))}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 font-medium text-sm">
                    {formatDateOnly(u.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openDetailModal(u._id)}
                        className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-700/50">
          {filteredUsers.map((u) => (
            <div key={u._id} className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${getAvatarColor(u.name)} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}>
                {getInitials(u.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{u.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {u.email} | {u?.stats?.totalBookings || 0} bookings
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openDetailModal(u._id)}
                  className="p-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => handleDeleteUser(u)}
                  className="p-1.5 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Search size={36} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">No users found</p>
          </div>
        )}
      </div>

      {showDetail && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start md:items-center justify-center p-2 md:p-4 overflow-y-auto"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl border border-gray-100 dark:border-gray-700 my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              </div>
            ) : detailUser ? (
              <>
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">User Details</h3>
                  <button
                    onClick={() => setShowDetail(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>

                <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className={`w-16 h-16 rounded-2xl ${getAvatarColor(detailUser.name)} flex items-center justify-center text-white font-bold text-xl shrink-0`}>
                      {getInitials(detailUser.name)}
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">{detailUser.name}</h2>
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">Patient Account</p>
                      <p className="text-xs text-gray-400 mt-0.5">Joined: {formatDateTime(detailUser.createdAt)}</p>
                    </div>
                  </div>

                  {detailStats && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <button 
                        type="button"
                        onClick={() => setBookingFilter('all')}
                        className={`bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 text-center transition-all cursor-pointer active:scale-95 hover:shadow-md ${
                          bookingFilter === 'all' 
                            ? 'ring-2 ring-violet-500 bg-violet-100 dark:bg-violet-900/40 shadow-xs' 
                            : 'hover:bg-violet-100/70 dark:hover:bg-violet-900/30'
                        }`}
                        title="Click to view all bookings"
                      >
                        <Calendar size={16} className="mx-auto text-violet-600 dark:text-violet-400 mb-1" />
                        <p className="text-lg font-black text-gray-900 dark:text-white">{detailStats.total}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Bookings</p>
                      </button>

                      <button 
                        type="button"
                        onClick={() => setBookingFilter(bookingFilter === 'Completed' ? 'all' : 'Completed')}
                        className={`bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center transition-all cursor-pointer active:scale-95 hover:shadow-md ${
                          bookingFilter === 'Completed' 
                            ? 'ring-2 ring-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 shadow-xs' 
                            : 'hover:bg-emerald-100/70 dark:hover:bg-emerald-900/30'
                        }`}
                        title="Click to filter completed bookings"
                      >
                        <CheckCircle size={16} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
                        <p className="text-lg font-black text-gray-900 dark:text-white">{detailStats.completed}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Completed</p>
                      </button>

                      <button 
                        type="button"
                        onClick={() => setBookingFilter(bookingFilter === 'Cancelled' ? 'all' : 'Cancelled')}
                        className={`bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center transition-all cursor-pointer active:scale-95 hover:shadow-md ${
                          bookingFilter === 'Cancelled' 
                            ? 'ring-2 ring-red-500 bg-red-100 dark:bg-red-900/40 shadow-xs' 
                            : 'hover:bg-red-100/70 dark:hover:bg-red-900/30'
                        }`}
                        title="Click to filter cancelled bookings"
                      >
                        <XCircle size={16} className="mx-auto text-red-500 dark:text-red-400 mb-1" />
                        <p className="text-lg font-black text-gray-900 dark:text-white">{detailStats.cancelled}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Cancelled</p>
                      </button>

                      <button 
                        type="button"
                        onClick={() => setBookingFilter(bookingFilter === 'Reviewed' ? 'all' : 'Reviewed')}
                        className={`bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center transition-all cursor-pointer active:scale-95 hover:shadow-md ${
                          bookingFilter === 'Reviewed' 
                            ? 'ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900/40 shadow-xs' 
                            : 'hover:bg-blue-100/70 dark:hover:bg-blue-900/30'
                        }`}
                        title="Click to filter reviewed bookings"
                      >
                        <Shield size={16} className="mx-auto text-blue-600 dark:text-blue-400 mb-1" />
                        <p className="text-lg font-black text-gray-900 dark:text-white">{detailStats.reviewedCount}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Reviewed</p>
                      </button>

                      <button 
                        type="button"
                        onClick={() => setBookingFilter(bookingFilter === 'Spent' ? 'all' : 'Spent')}
                        className={`bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center transition-all cursor-pointer active:scale-95 hover:shadow-md ${
                          bookingFilter === 'Spent' 
                            ? 'ring-2 ring-amber-500 bg-amber-100 dark:bg-amber-900/40 shadow-xs' 
                            : 'hover:bg-amber-100/70 dark:hover:bg-amber-900/30'
                        }`}
                        title="Click to filter paid bookings"
                      >
                        <IndianRupee size={16} className="mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                        <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(detailStats.revenue)}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Spent</p>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3.5 space-y-2.5">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</h4>
                      <div className="flex items-center gap-2.5 text-sm">
                        <Mail size={14} className="text-gray-400 shrink-0" />
                        <span className="text-gray-900 dark:text-white font-medium truncate">{detailUser.email}</span>
                        <button onClick={() => copyToClipboard(detailUser.email)} className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
                          <Copy size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <Phone size={14} className="text-gray-400 shrink-0" />
                        <span className="text-gray-900 dark:text-white font-medium">{detailUser.phone || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3.5 space-y-2.5">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</h4>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Role</span>
                        <span className="font-medium text-gray-900 dark:text-white">{detailUser.role}</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-sm">
                        <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {typeof detailUser?.location?.lat === 'number' && typeof detailUser?.location?.lng === 'number'
                            ? `${detailUser.location.lat}, ${detailUser.location.lng}`
                            : 'Location not available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {(() => {
                      const displayedAppointments = detailAppointments.filter(apt => {
                        if (bookingFilter === 'all') return true;
                        if (bookingFilter === 'Completed' || bookingFilter === 'Spent') return apt.status === 'Completed';
                        if (bookingFilter === 'Cancelled') return apt.status === 'Cancelled';
                        if (bookingFilter === 'Reviewed') return Boolean(apt.reviewRating);
                        return true;
                      });

                      return (
                        <>
                          <div className="flex items-center justify-between mb-2.5">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                              <span>Booking Details ({displayedAppointments.length}{bookingFilter !== 'all' ? ` of ${detailAppointments.length}` : ''})</span>
                              {bookingFilter !== 'all' && (
                                <span className="text-[10px] normal-case font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                  Filtered: {bookingFilter}
                                </span>
                              )}
                            </h4>
                            {bookingFilter !== 'all' && (
                              <button
                                type="button"
                                onClick={() => setBookingFilter('all')}
                                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                              >
                                Show All
                              </button>
                            )}
                          </div>

                          {displayedAppointments.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                              <Calendar size={24} className="mx-auto mb-1.5 opacity-50" />
                              <p className="text-xs font-medium">No {bookingFilter !== 'all' ? bookingFilter.toLowerCase() : ''} bookings found</p>
                            </div>
                          ) : (
                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl divide-y divide-gray-50 dark:divide-gray-700/50 max-h-72 overflow-y-auto">
                              {displayedAppointments.map((apt: any) => (
                                <div key={apt._id} className="px-3.5 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                  <div
                                    className={`p-1.5 rounded-lg shrink-0 ${
                                      apt.type === 'video'
                                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                    }`}
                                  >
                                    {apt.type === 'video' ? <Video size={14} /> : <Stethoscope size={14} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                      {apt?.doctorId?.name || 'Doctor'}
                                      <span className="ml-1 text-gray-400 font-medium">
                                        ({apt?.doctorId?.specialty || 'Specialty'})
                                      </span>
                                    </p>
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                      <Clock size={9} /> {apt.date} | {apt.slot}
                                    </p>
                                    {apt.reviewRating ? (
                                      <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                                        Review: {apt.reviewRating}/5
                                      </p>
                                    ) : null}
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusBadge(apt.status)}`}>
                                    {apt.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
