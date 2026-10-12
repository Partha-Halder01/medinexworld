"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit2, Trash2, X, Star, Eye, Calendar, CheckCircle, XCircle, Mail, Phone, MapPin, Clock, Video, Copy, Filter, ChevronDown, IndianRupee, TrendingUp, Banknote, CheckCircle2, CreditCard, Sparkles } from 'lucide-react';
import { SPECIALTIES } from '@/lib/data';
import { useAppContext } from '@/app/context/AppContext';
import { isDisplayableImage } from '@/lib/imageUrl';

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AVATAR_COLORS = ['bg-blue-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500'];
const getColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const isValidImg = (img: string) => isDisplayableImage(img);

const formatRevenue = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

export const AdminDoctorsScreen = () => {
  const { showToast } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Detail modal state
  const [detailDoctor, setDetailDoctor] = useState<any>(null);
  const [detailAppts, setDetailAppts] = useState<any[]>([]);
  const [detailStats, setDetailStats] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailStatusFilter, setDetailStatusFilter] = useState<'all' | 'Completed' | 'Cancelled' | 'Revenue'>('all');

  // Payment state
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [adminApptFilter, setAdminApptFilter] = useState<'all' | 'online' | 'cash'>('all');

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', specialty: 'General Physician', fee: '', platformFeePercent: '0', qual: '', exp: '',
    patientsTreated: '', avgWaitTime: '', rating: '', reviews: ''
  });

  // Advanced filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterFeeMin, setFilterFeeMin] = useState('');
  const [filterFeeMax, setFilterFeeMax] = useState('');
  const [filterRating, setFilterRating] = useState('All');
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);

  const fetchDoctors = () => {
    fetch('/api/admin/doctors', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDoctors(d); })
      .catch(console.error);

    fetch('/api/specialties')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.specialties)) setAvailableSpecialties(d.specialties); })
      .catch(console.error);
  };

  useEffect(() => { fetchDoctors(); }, []);

  const openAddModal = () => {
    setEditingDoctor(null);
    setFormData({ name: '', email: '', phone: '', password: '', specialty: 'General Physician', fee: '', platformFeePercent: '0', qual: '', exp: '', patientsTreated: '', avgWaitTime: '', rating: '', reviews: '' });
    setShowModal(true);
  };

  const openEditModal = (doc: any) => {
    setEditingDoctor(doc);
    setFormData({ 
      name: doc.name || '', 
      email: doc.email || '', 
      phone: doc.phone || '', 
      password: '', 
      specialty: doc.specialty || 'General Physician', 
      fee: doc.fee?.toString() || '', 
      platformFeePercent: (doc.platformFeePercent ?? 0).toString(),
      qual: doc.qual || '',
      exp: doc.exp || '',
      patientsTreated: doc.patientsTreated || '',
      avgWaitTime: doc.avgWaitTime || '',
      rating: doc.rating != null ? String(doc.rating) : '',
      reviews: doc.reviews != null ? String(doc.reviews) : ''
    });
    setShowModal(true);
  };

  const clearFilters = () => {
    setFilterFeeMin('');
    setFilterFeeMax('');
    setFilterRating('All');
  };
  const hasActiveFilters = Boolean(filterFeeMin || filterFeeMax || filterRating !== 'All');

  const openDetailModal = async (docId: string) => {
    setDetailLoading(true);
    setShowDetail(true);
    setPayAmount('');
    setPayNote('');
    setAdminApptFilter('all');
    setDetailStatusFilter('all');
    try {
      const res = await fetch(`/api/admin/doctors/${docId}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setDetailDoctor(data.doctor);
        setDetailAppts(data.appointments || []);
        setDetailStats(data.stats || {});
      } else {
        showToast(data.error || 'Failed to load doctor details', 'error');
        setShowDetail(false);
      }
    } catch {
      showToast('Failed to load doctor details', 'error');
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePayDoctor = async () => {
    if (!detailDoctor?._id || !payAmount) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
    setPayLoading(true);
    try {
      const res = await fetch(`/api/admin/doctors/${detailDoctor._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay', amount, note: payNote || 'Admin payment' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`₹${amount} paid to ${detailDoctor.name}`, 'success');
        setPayAmount('');
        setPayNote('');
        // Re-fetch fresh data from DB — cache: no-store forces a live read
        const refreshRes = await fetch(`/api/admin/doctors/${detailDoctor._id}?t=${Date.now()}`, { cache: 'no-store' });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setDetailStats(refreshData.stats);
          setDetailAppts(refreshData.appointments || []);
        }
      } else {
        showToast(data.error || 'Payment failed', 'error');
      }
    } catch {
      showToast('Payment failed', 'error');
    } finally {
      setPayLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingDoctor) {
        const res = await fetch(`/api/doctors/${editingDoctor._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: formData.name, 
            email: formData.email, 
            phone: formData.phone, 
            specialty: formData.specialty, 
            fee: Number(formData.fee) || 500, 
            platformFeePercent: Number(formData.platformFeePercent) || 0,
            qual: formData.qual,
            exp: formData.exp,
            patientsTreated: formData.patientsTreated,
            avgWaitTime: formData.avgWaitTime,
            ...(formData.rating !== '' ? { rating: Number(formData.rating) } : {}),
            ...(formData.reviews !== '' ? { reviews: Number(formData.reviews) } : {})
          })
        });
        const data = await res.json();
        if (res.ok) { showToast('Doctor updated!', 'success'); fetchDoctors(); setShowModal(false); }
        else showToast(data.error || 'Failed to update', 'error');
      } else {
        if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.fee) {
          showToast('All fields are required including phone.', 'error'); setLoading(false); return;
        }
        const res = await fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: formData.name, 
            email: formData.email, 
            phone: formData.phone, 
            password: formData.password, 
            specialty: formData.specialty, 
            fee: Number(formData.fee), 
            platformFeePercent: Number(formData.platformFeePercent) || 0,
            qual: formData.qual,
            exp: formData.exp
          })
        });
        const data = await res.json();
        if (res.ok) { showToast('Doctor created!', 'success'); fetchDoctors(); setShowModal(false); }
        else showToast(data.error || 'Failed to create', 'error');
      }
    } catch { showToast('An error occurred.', 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete Dr. ${name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Doctor deleted.', 'success'); fetchDoctors(); }
      else { const err = await res.json(); showToast(err.error || 'Failed to delete', 'error'); }
    } catch { showToast('Error deleting doctor.', 'error'); }
  };

  const uniqueSpecialties = Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean)));
  const baseSpecialties = availableSpecialties.length > 0 ? availableSpecialties : SPECIALTIES;
  const allSpecialtiesList = Array.from(new Set([...baseSpecialties, ...uniqueSpecialties]));
  const specialties = ['All', ...allSpecialtiesList];
  const filteredDoctors = doctors.filter(d => {
    // Only show verified doctors in the management section
    if (!d.isVerified) return false;

    const s = searchTerm.toLowerCase();
    const ms = !searchTerm || d.name.toLowerCase().includes(s) || d.specialty.toLowerCase().includes(s) || d.email?.toLowerCase().includes(s) || d.phone?.toLowerCase().includes(s);
    if (!ms) return false;
    if (filterSpecialty !== 'All' && d.specialty !== filterSpecialty) return false;
    if (filterFeeMin && d.fee < Number(filterFeeMin)) return false;
    if (filterFeeMax && d.fee > Number(filterFeeMax)) return false;
    if (filterRating !== 'All' && d.rating < Number(filterRating)) return false;
    return true;
  });

  const Avatar = ({ doc, size = 'md' }: { doc: any; size?: 'sm' | 'md' | 'lg' }) => {
    const dims = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-10 h-10 text-xs' : 'w-9 h-9 text-[10px]';
    const rounded = size === 'lg' ? 'rounded-2xl' : 'rounded-xl';
    
    const [imgSrc, setImgSrc] = useState<string | null>(isValidImg(doc.image) ? doc.image : null);
    const [hasError, setHasError] = useState(!isValidImg(doc.image));

    useEffect(() => {
      const valid = isValidImg(doc.image);
      setImgSrc(valid ? doc.image : null);
      setHasError(!valid);
    }, [doc.image]);

    if (!hasError && imgSrc) {
      return (
        <img 
          src={imgSrc} 
          alt={doc.name} 
          className={`${dims} ${rounded} object-cover border border-gray-100 dark:border-gray-700 shrink-0`} 
          onError={() => {
            setHasError(true);
            setImgSrc(null);
          }}
        />
      );
    }
    return (
      <div className={`${dims} ${rounded} ${getColor(doc.name)} flex items-center justify-center text-white font-bold shrink-0`}>
        {getInitials(doc.name)}
      </div>
    );
  };

  const statusBadge = (status: string) => {
    const m: Record<string, string> = {
      Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      Cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };
    return m[status] || 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="p-4 pb-28 md:pb-8 md:p-6 lg:p-8 w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">Manage Doctors</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs md:text-sm">{filteredDoctors.length} verified doctors</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin/specialties"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-200 font-bold text-sm transition-all"
          >
            <Sparkles size={16} className="text-emerald-600" /> Manage Specialties
          </Link>
          <button onClick={openAddModal} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg active:scale-[0.98]">
            <Plus size={18} /> Add Doctor
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name, specialty, email or phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16} /></button>}
        </div>
        <div className="relative shrink-0">
          <select value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)} className="appearance-none pl-4 pr-9 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-w-[160px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all border shrink-0 ${showFilters || hasActiveFilters ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Min Rating */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Min Rating</label>
              <div className="relative">
                <select value={filterRating} onChange={e => setFilterRating(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                  <option value="All">Any Rating</option>
                  <option value="4">4.0+</option>
                  <option value="4.5">4.5+</option>
                  <option value="4.8">4.8+</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {/* Fee Range */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fee Range (₹)</label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                  <input type="number" placeholder="Min" value={filterFeeMin} onChange={e => setFilterFeeMin(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                </div>
                <span className="text-gray-400 text-xs shrink-0">to</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                  <input type="number" placeholder="Max" value={filterFeeMax} onChange={e => setFilterFeeMax(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                </div>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing <span className="font-bold text-gray-900 dark:text-white">{filteredDoctors.length}</span> of {doctors.length} doctors
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Doctor</th>
                <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Specialty</th>
                <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Fee</th>
                <th className="text-left px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Rating</th>
                <th className="text-right px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {filteredDoctors.map(doc => (
                <tr 
                  key={doc._id} 
                  onClick={() => openDetailModal(doc._id)}
                  className="hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-colors cursor-pointer group select-none"
                  title="Click to view details"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar doc={doc} />
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{doc.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{doc.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 font-medium text-sm">{doc.specialty}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">₹{doc.fee}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      <span className="font-bold text-sm">{doc.rating}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openDetailModal(doc._id)} className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openEditModal(doc)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(doc._id, doc.name)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-700/50">
          {filteredDoctors.map(doc => (
            <div 
              key={doc._id} 
              onClick={() => openDetailModal(doc._id)}
              className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors select-none"
              title="Click to view details"
            >
              <Avatar doc={doc} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{doc.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{doc.specialty} · ₹{doc.fee}</p>
              </div>
              <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => openDetailModal(doc._id)} className="p-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <Eye size={14} />
                </button>
                <button onClick={() => openEditModal(doc)} className="p-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(doc._id, doc.name)} className="p-1.5 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Search size={36} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">No doctors found</p>
          </div>
        )}
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start md:items-center justify-center p-2 md:p-4 overflow-y-auto" onClick={() => setShowDetail(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl border border-gray-100 dark:border-gray-700 my-4" onClick={e => e.stopPropagation()}>

            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              </div>
            ) : detailDoctor && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Doctor Details</h3>
                  <button onClick={() => setShowDetail(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>

                <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
                  {/* Profile Row */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <Avatar doc={detailDoctor} size="lg" />
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">{detailDoctor.name}</h2>
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">{detailDoctor.specialty}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{detailDoctor.qual} · {detailDoctor.exp}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 justify-center sm:justify-start">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{detailDoctor.rating}</span>
                        <span className="text-xs text-gray-400">({detailDoctor.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid - Clickable filters */}
                  {detailStats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <button 
                        type="button"
                        onClick={() => setDetailStatusFilter('all')}
                        className={`rounded-xl p-3 text-center transition-all cursor-pointer active:scale-95 hover:shadow-md select-none border ${
                          detailStatusFilter === 'all'
                            ? 'bg-violet-100/80 dark:bg-violet-900/40 border-violet-400 ring-2 ring-violet-500/40 shadow-xs'
                            : 'bg-violet-50 dark:bg-violet-900/20 border-transparent hover:border-violet-300'
                        }`}
                        title="Click to view all bookings"
                      >
                        <Calendar size={16} className="mx-auto text-violet-600 dark:text-violet-400 mb-1" />
                        <p className="text-lg font-black text-gray-900 dark:text-white">{detailStats.totalAppointments}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Total Bookings</p>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setDetailStatusFilter(detailStatusFilter === 'Completed' ? 'all' : 'Completed')}
                        className={`rounded-xl p-3 text-center transition-all cursor-pointer active:scale-95 hover:shadow-md select-none border ${
                          detailStatusFilter === 'Completed'
                            ? 'bg-emerald-100/80 dark:bg-emerald-900/40 border-emerald-400 ring-2 ring-emerald-500/40 shadow-xs'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 border-transparent hover:border-emerald-300'
                        }`}
                        title="Click to filter completed bookings"
                      >
                        <CheckCircle size={16} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
                        <p className="text-lg font-black text-gray-900 dark:text-white">{detailStats.completed}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Completed</p>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setDetailStatusFilter(detailStatusFilter === 'Cancelled' ? 'all' : 'Cancelled')}
                        className={`rounded-xl p-3 text-center transition-all cursor-pointer active:scale-95 hover:shadow-md select-none border ${
                          detailStatusFilter === 'Cancelled'
                            ? 'bg-red-100/80 dark:bg-red-900/40 border-red-400 ring-2 ring-red-500/40 shadow-xs'
                            : 'bg-red-50 dark:bg-red-900/20 border-transparent hover:border-red-300'
                        }`}
                        title="Click to filter cancelled bookings"
                      >
                        <XCircle size={16} className="mx-auto text-red-500 dark:text-red-400 mb-1" />
                        <p className="text-lg font-black text-gray-900 dark:text-white">{detailStats.cancelled}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Cancelled</p>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setDetailStatusFilter(detailStatusFilter === 'Revenue' ? 'all' : 'Revenue')}
                        className={`rounded-xl p-3 text-center transition-all cursor-pointer active:scale-95 hover:shadow-md select-none border ${
                          detailStatusFilter === 'Revenue'
                            ? 'bg-amber-100/80 dark:bg-amber-900/40 border-amber-400 ring-2 ring-amber-500/40 shadow-xs'
                            : 'bg-amber-50 dark:bg-amber-900/20 border-transparent hover:border-amber-300'
                        }`}
                        title="Click to filter revenue bookings"
                      >
                        <IndianRupee size={16} className="mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                        <p className="text-lg font-black text-gray-900 dark:text-white">{formatRevenue(detailStats.revenue)}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Revenue</p>
                      </button>
                    </div>
                  )}

                  {/* Earnings & Pay Section */}
                  {detailStats && (
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                      <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
                        <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <IndianRupee size={13} className="text-teal-600" /> Wallet & Earnings
                        </h4>
                      </div>

                      {/* Online vs Cash split */}
                      <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700">
                        {/* Online Earnings */}
                        <div className="p-4 space-y-1 bg-blue-50/50 dark:bg-blue-900/10">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-wider mb-2">
                            <CreditCard size={11} /> Online Earnings
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Collected</span>
                            <span className="font-black text-gray-900 dark:text-white">₹{(detailStats.onlineEarnings || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Platform Commission</span>
                            <span className="font-black text-violet-600">₹{(detailStats.onlinePlatformCommission ?? detailStats.platformCommission ?? 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Paid Out</span>
                            <span className="font-black text-violet-600">₹{(detailStats.totalPaidOut || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-blue-100 dark:border-blue-800 mt-1">
                            <span className="font-bold text-gray-600 dark:text-gray-400">Remaining</span>
                            <span className="font-black text-teal-600">₹{(detailStats.remainingBalance || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        {/* Cash Earnings (info only) */}
                        <div className="p-4 space-y-1 bg-amber-50/50 dark:bg-amber-900/10">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-wider mb-2">
                            <Banknote size={11} /> Cash Earnings
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Collected</span>
                            <span className="font-black text-gray-900 dark:text-white">₹{(detailStats.cashEarnings || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Platform Commission</span>
                            <span className="font-black text-violet-600">₹{(detailStats.cashPlatformCommission || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="mt-3 px-2 py-1.5 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold text-center">Collected at clinic · No payout needed</p>
                          </div>
                        </div>
                      </div>

                      {/* Pay Doctor Form — online only */}
                      {(detailStats.remainingBalance || 0) > 0 && (
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CreditCard size={12} className="text-blue-500" />
                            <p className="text-xs font-black text-gray-700 dark:text-gray-300">Pay Online Earnings</p>
                            <span className="ml-auto text-[10px] font-bold text-gray-400">Max ₹{(detailStats.remainingBalance || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                              <input
                                type="number"
                                min="1"
                                max={detailStats.remainingBalance || 0}
                                placeholder="Amount"
                                value={payAmount}
                                onChange={e => setPayAmount(e.target.value)}
                                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Note (optional)"
                              value={payNote}
                              onChange={e => setPayNote(e.target.value)}
                              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            />
                            <button
                              onClick={handlePayDoctor}
                              disabled={payLoading || !payAmount}
                              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shrink-0"
                            >
                              {payLoading ? '...' : 'Pay'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Payment Logs */}
                      {detailStats.paymentLogs && detailStats.paymentLogs.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-700 max-h-32 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                          {[...detailStats.paymentLogs].reverse().map((log: any, i: number) => (
                            <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={13} className="text-violet-500 shrink-0" />
                                <div>
                                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{log.note || 'Admin payment'}</p>
                                  <p className="text-[10px] text-gray-400">{log.date ? new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                                </div>
                              </div>
                              <p className="text-xs font-black text-violet-600 shrink-0">- ₹{(log.amount || 0).toLocaleString('en-IN')}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contact & Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3.5 space-y-2.5">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact & Info</h4>
                      <div className="flex items-center gap-2.5 text-sm">
                        <Mail size={14} className="text-gray-400 shrink-0" />
                        <span className="text-gray-900 dark:text-white font-medium truncate">{detailDoctor.email}</span>
                        <button onClick={() => copyToClipboard(detailDoctor.email)} className="p-1 text-gray-400 hover:text-gray-600 shrink-0"><Copy size={12} /></button>
                      </div>
                      {detailDoctor.phone && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <Phone size={14} className="text-gray-400 shrink-0" />
                          <span className="text-gray-900 dark:text-white font-medium">{detailDoctor.phone}</span>
                          <button onClick={() => copyToClipboard(detailDoctor.phone)} className="p-1 text-gray-400 hover:text-gray-600 shrink-0"><Copy size={12} /></button>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 text-sm">
                        <MapPin size={14} className="text-gray-400 shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 truncate">{detailDoctor.address || 'Not set'}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3.5 space-y-2.5">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fees & Settings</h4>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Clinic Fee</span>
                        <span className="font-bold text-gray-900 dark:text-white">₹{detailDoctor.fee}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Video Fee</span>
                        <span className="font-bold text-gray-900 dark:text-white">₹{detailDoctor.videoFee}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Platform Fee</span>
                        <span className="font-bold text-gray-900 dark:text-white">{detailDoctor.platformFeePercent ?? 0}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Video Mode</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{detailDoctor.videoAvailability || 'always'}</span>
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  {detailDoctor.about && (
                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3.5">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">About</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{detailDoctor.about}</p>
                    </div>
                  )}

                  {/* Recent Appointments */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Appointments ({
                            detailAppts.filter((apt: any) => {
                              if (detailStatusFilter === 'Completed') return apt.status === 'Completed';
                              if (detailStatusFilter === 'Cancelled') return apt.status === 'Cancelled';
                              if (detailStatusFilter === 'Revenue') return apt.status === 'Completed';
                              return true;
                            }).filter((apt: any) => {
                              if (adminApptFilter === 'online') return apt.paymentMethod === 'online';
                              if (adminApptFilter === 'cash') return apt.paymentMethod === 'cash';
                              return true;
                            }).length
                          })
                        </h4>
                        {detailStatusFilter !== 'all' && (
                          <button
                            onClick={() => setDetailStatusFilter('all')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-200 transition-colors"
                          >
                            <span>Filter: {detailStatusFilter}</span>
                            <X size={10} />
                          </button>
                        )}
                      </div>
                      {/* Filter tabs */}
                      <div className="flex gap-1">
                        {(['all', 'online', 'cash'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setAdminApptFilter(f)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                              adminApptFilter === f
                                ? f === 'online' ? 'bg-blue-600 text-white'
                                  : f === 'cash' ? 'bg-amber-500 text-white'
                                  : 'bg-gray-800 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {f === 'all' ? 'All' : f === 'online' ? 'Online' : 'Cash'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {detailAppts.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Calendar size={24} className="mx-auto mb-1.5 opacity-50" />
                        <p className="text-xs">No appointments yet</p>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl divide-y divide-gray-50 dark:divide-gray-700/50 max-h-60 overflow-y-auto">
                        {detailAppts.filter((apt: any) => {
                          if (detailStatusFilter === 'Completed') return apt.status === 'Completed';
                          if (detailStatusFilter === 'Cancelled') return apt.status === 'Cancelled';
                          if (detailStatusFilter === 'Revenue') return apt.status === 'Completed';
                          return true;
                        }).filter((apt: any) => {
                          if (adminApptFilter === 'online') return apt.paymentMethod === 'online';
                          if (adminApptFilter === 'cash') return apt.paymentMethod === 'cash';
                          return true;
                        }).slice(0, 20).map((apt: any) => (
                          <div key={apt._id} className="px-3.5 py-2.5 flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg shrink-0 ${apt.type === 'video' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                              {apt.type === 'video' ? <Video size={14} /> : <MapPin size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {apt.patientId?.name || 'Patient'}
                              </p>
                              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Clock size={9} /> {apt.date} · {apt.slot}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${apt.paymentMethod === 'online' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                                {apt.paymentMethod === 'online' ? 'ONLINE' : 'CASH'}
                              </span>
                              {apt.price > 0 && <span className="text-[10px] font-black text-emerald-600">₹{apt.netAmount ?? apt.price}</span>}
                              {(apt.platformFeeAmount || 0) > 0 && (
                                <span className="text-[9px] font-bold text-violet-500">Fee ₹{apt.platformFeeAmount}</span>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(apt.status)}`}>
                                {apt.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== ADD/EDIT MODAL ===== */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden" 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh] overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {editingDoctor ? 'Update doctor credentials, fee, and profile details' : 'Register and verify a new doctor on the platform'}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="Dr. John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email <span className="text-red-500">*</span></label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="doctor@medinex.in" />
                  </div>
                  <div className={`space-y-1.5 ${editingDoctor ? 'col-span-1 sm:col-span-2' : 'col-span-1'}`}>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone Number <span className="text-red-500">*</span></label>
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="+91 98765 43210" />
                  </div>
                  {!editingDoctor && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Initial Password <span className="text-red-500">*</span></label>
                      <input required minLength={6} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="Min 6 characters" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specialty <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        required
                        value={formData.specialty}
                        onChange={e => setFormData({...formData, specialty: e.target.value})}
                        className="w-full px-4 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 appearance-none cursor-pointer"
                      >
                        {formData.specialty && !allSpecialtiesList.includes(formData.specialty) && (
                          <option value={formData.specialty}>{formData.specialty}</option>
                        )}
                        {allSpecialtiesList.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Base Fee (₹) <span className="text-red-500">*</span></label>
                    <input required type="number" min="0" value={formData.fee} onChange={e => setFormData({...formData, fee: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Platform Fee (%)</label>
                    <input type="number" min="0" max="100" value={formData.platformFeePercent} onChange={e => setFormData({...formData, platformFeePercent: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qualification</label>
                    <input value={formData.qual} onChange={e => setFormData({...formData, qual: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="MBBS, MD" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Experience</label>
                    <input value={formData.exp} onChange={e => setFormData({...formData, exp: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="5 years" />
                  </div>
                  {editingDoctor && (
                    <>
                      <div className="col-span-1 sm:col-span-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Profile Highlights</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Shown on the doctor&apos;s public profile. Leave Patients Treated / Avg Wait blank to hide them.</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating (0–5)</label>
                        <input type="number" min="0" max="5" step="0.1" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="4.8" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Review Count</label>
                        <input type="number" min="0" step="1" value={formData.reviews} onChange={e => setFormData({...formData, reviews: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="142" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patients Treated</label>
                        <input value={formData.patientsTreated} maxLength={40} onChange={e => setFormData({...formData, patientsTreated: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="3,500+" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Chamber Wait</label>
                        <input value={formData.avgWaitTime} maxLength={40} onChange={e => setFormData({...formData, avgWaitTime: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="~15 mins" />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 bg-gray-50/80 dark:bg-gray-800/50">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-white dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-70 transition-colors"
                >
                  {loading ? 'Processing...' : (editingDoctor ? 'Save Changes' : 'Add Doctor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
