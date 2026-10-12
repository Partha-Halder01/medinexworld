"use client";
import React, { useState, useEffect } from 'react';
import { Building2, Plus, Trash2, Edit3, Loader2, X, Save, MapPin, Phone, Mail, Globe, CheckCircle2, ChevronRight, Search, Camera, Activity, FlaskConical, Stethoscope, IndianRupee, CreditCard, Wallet, TrendingUp, Banknote, RefreshCcw } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { SafeImage } from '@/components/ui/SafeImage';

const EMPTY_HOSPITAL = {
  name: '', nameHi: '', type: 'hospital' as any, phone: '', email: '', address: '', addressHi: '',
  facilities: [] as string[], departments: [] as string[], about: '', aboutHi: '',
  medicineShop: false, medicineDelivery: false,
  labServices: [] as { name: string; price: number; description: string }[],
  surgeryServices: [] as { name: string; priceRange: string; description: string }[],
  location: { lat: 0, lng: 0 },
  photos: [] as string[],
  ownerEmail: '',
  ownerPassword: '',
  platformFeePercent: 0,
};

export const AdminHospitalsScreen = () => {
  const { showToast } = useAppContext();
  const { t } = useLanguage();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'about' | 'services' | 'photos'>('basic');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_HOSPITAL);
  const [facilitiesInput, setFacilitiesInput] = useState('');
  const [departmentsInput, setDepartmentsInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<any>(null);

  // Hospital wallet state
  const [hospitalStats, setHospitalStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [apptFilter, setApptFilter] = useState<'All' | 'Confirmed' | 'Completed' | 'Cancelled'>('All');

  // Form helpers for nested arrays
  const addLabService = () => {
    setForm({
      ...form,
      labServices: [...form.labServices, { name: '', price: 0, description: '' }]
    });
  };

  const removeLabService = (index: number) => {
    setForm({
      ...form,
      labServices: form.labServices.filter((_, i) => i !== index)
    });
  };

  const updateLabService = (index: number, field: string, value: any) => {
    const updated = [...form.labServices];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, labServices: updated });
  };

  const addSurgeryService = () => {
    setForm({
      ...form,
      surgeryServices: [...form.surgeryServices, { name: '', priceRange: '', description: '' }]
    });
  };

  const removeSurgeryService = (index: number) => {
    setForm({
      ...form,
      surgeryServices: form.surgeryServices.filter((_, i) => i !== index)
    });
  };

  const updateSurgeryService = (index: number, field: string, value: any) => {
    const updated = [...form.surgeryServices];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, surgeryServices: updated });
  };

  useEffect(() => { 
    fetchHospitals(); 
  }, []);

  const fetchHospitals = async (preferredHospitalId?: string) => {
    try {
      const res = await fetch('/api/hospitals?all=true');
      if (res.ok) {
        const data = await res.json();
        setHospitals(data);
        if (data.length > 0) {
          const targetId = preferredHospitalId || selectedHospital?._id;
          const nextSelected = targetId
            ? data.find((h: any) => h._id === targetId) || data[0]
            : data[0];
          selectHospital(nextSelected);
        } else {
          setSelectedHospital(null);
        }
      }
    } catch {} finally { setLoading(false); }
  };

  const selectHospital = async (h: any) => {
    setSelectedHospital(h);
    setPayAmount('');
    setPayNote('');
    setApptFilter('All');
    setHospitalStats(null);
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${h._id}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setHospitalStats(data.stats);
      }
    } catch {} finally { setStatsLoading(false); }
  };

  const refreshStats = async () => {
    if (!selectedHospital?._id) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${selectedHospital._id}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setHospitalStats(data.stats);
      }
    } catch {} finally { setStatsLoading(false); }
  };

  const handlePayHospital = async () => {
    if (!selectedHospital?._id || !payAmount) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
    setPayLoading(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${selectedHospital._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay', amount, note: payNote || 'Admin payment' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`₹${amount} paid to ${selectedHospital.name}`, 'success');
        setPayAmount('');
        setPayNote('');
        // Re-fetch fresh data
        const refreshRes = await fetch(`/api/admin/hospitals/${selectedHospital._id}?t=${Date.now()}`, { cache: 'no-store' });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setHospitalStats(refreshData.stats);
        }
      } else {
        showToast(data.error || 'Payment failed', 'error');
      }
    } catch { showToast('Payment failed', 'error'); }
    finally { setPayLoading(false); }
  };

  const handleSave = async () => {
    if (!form.name || !form.address) {
      showToast('Name and address are required.', 'error');
      return;
    }

    // Deep copy to avoid mutating state
    const cleanForm = JSON.parse(JSON.stringify(form));

    const payload = {
      ...cleanForm,
      facilities: facilitiesInput.split(',').map(s => s.trim()).filter(Boolean),
      departments: departmentsInput.split(',').map(s => s.trim()).filter(Boolean),
      location: {
        lat: parseFloat(cleanForm.location.lat) || 0,
        lng: parseFloat(cleanForm.location.lng) || 0,
      }
    };

    try {
      const url = editingId ? `/api/hospitals/${editingId}` : '/api/hospitals';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showToast(editingId ? 'Hospital updated!' : 'Hospital created!', 'success');
        const savedHospitalId = data?._id || editingId || undefined;
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_HOSPITAL);
        setFacilitiesInput('');
        setDepartmentsInput('');
        fetchHospitals(savedHospitalId);
      } else {
        showToast(data.error || 'Failed to save hospital.', 'error');
      }
    } catch (err) {
      showToast('Failed to save hospital. Check your connection.', 'error');
    }
  };

  const handleEdit = (h: any) => {
    setForm({
      name: h.name, nameHi: h.nameHi || '', type: h.type, phone: h.phone || '', email: h.email || '',
      address: h.address, addressHi: h.addressHi || '', about: h.about || '', aboutHi: h.aboutHi || '',
      medicineShop: h.medicineShop || false, medicineDelivery: h.medicineDelivery || false,
      labServices: h.labServices || [], surgeryServices: h.surgeryServices || [],
      facilities: h.facilities || [], departments: h.departments || [],
      location: h.location || { lat: 0, lng: 0 },
      photos: h.photos || [],
      ownerEmail: h.ownerId?.email || '',
      ownerPassword: '',
      platformFeePercent: Number(h.platformFeePercent) || 0,
    });
    setFacilitiesInput((h.facilities || []).join(', '));
    setDepartmentsInput((h.departments || []).join(', '));
    setEditingId(h._id);
    setActiveFormTab('basic');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this hospital?')) return;
    try {
      const res = await fetch(`/api/hospitals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHospitals(prev => prev.filter(h => h._id !== id));
        if (selectedHospital?._id === id) setSelectedHospital(null);
        showToast('Hospital deleted.', 'success');
      }
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, photos: [...form.photos, reader.result as string] });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredHospitals = hospitals.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-full mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl shrink-0">
            <Building2 size={24} className="text-emerald-600 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">{t('admin.hospitals')}</h1>
            <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">{hospitals.length} Total Facilities</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_HOSPITAL); setFacilitiesInput(''); setDepartmentsInput(''); setActiveFormTab('basic'); }}
          className="w-full sm:w-auto flex justify-center items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Add New Hospital / Nursing Home
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Hospital List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search hospitals or nursing homes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 ring-emerald-500/20 outline-none transition-all shadow-sm"
            />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-emerald-500" /></div>
            ) : filteredHospitals.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                <Building2 size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-sm font-bold text-gray-400 italic">No hospitals found</p>
              </div>
            ) : (
              filteredHospitals.map(h => (
                <div 
                  key={h._id} 
                  onClick={() => selectHospital(h)}
                  className={`group relative bg-white dark:bg-gray-800 rounded-3xl p-5 border transition-all duration-300 cursor-pointer overflow-hidden ${
                    selectedHospital?._id === h._id 
                      ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/60 dark:bg-emerald-900/20' 
                      : 'border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {selectedHospital?._id === h._id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-r-full" />
                  )}
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 dark:border-gray-600">
                      {h.photos?.[0] ? (
                        <SafeImage src={h.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={24} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-sm text-gray-900 dark:text-white truncate">{h.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {String(h.type || '').toLowerCase() === 'clinic' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/60">
                            <Stethoscope size={10} /> Clinic
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60">
                            <Building2 size={10} /> Hospital
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{h.type}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-1 flex items-center gap-1">
                        <MapPin size={10} /> {h.address}
                      </p>
                    </div>
                    <ChevronRight size={16} className={`text-gray-300 group-hover:text-emerald-500 transition-all ${selectedHospital?._id === h._id ? 'translate-x-1 text-emerald-500' : ''}`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Hospital Details */}
        <div className="lg:col-span-8">
          {selectedHospital ? (
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden sticky top-6">
              {/* Cover/Photos */}
              <div className="relative h-48 bg-emerald-600">
                {selectedHospital.photos?.[0] ? (
                  <SafeImage src={selectedHospital.photos[0]} alt="" className="w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <Building2 size={80} className="text-white" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-2 inline-block">
                        {selectedHospital.type}
                      </span>
                      <h2 className="text-3xl font-black text-white">{selectedHospital.name}</h2>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(selectedHospital)} className="p-3 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-2xl hover:bg-white/30 transition-all active:scale-95 shadow-lg">
                        <Edit3 size={20} />
                      </button>
                      <button onClick={() => handleDelete(selectedHospital._id)} className="p-3 bg-red-500/80 backdrop-blur-md border border-red-400/30 text-white rounded-2xl hover:bg-red-500 transition-all active:scale-95 shadow-lg">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: MapPin, label: 'Address', value: selectedHospital.address },
                    { icon: Phone, label: 'Phone', value: selectedHospital.phone || 'N/A' },
                    { icon: Mail, label: 'Email', value: selectedHospital.email || 'N/A' },
                    { icon: Stethoscope, label: 'Depts', value: selectedHospital.departments?.length || 0 },
                    { icon: IndianRupee, label: 'Platform Fee', value: `${selectedHospital.platformFeePercent || 0}%` },
                  ].map((info, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <info.icon size={16} className="text-emerald-500 mb-2" />
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{info.label}</p>
                      <p className="text-xs font-black text-gray-700 dark:text-gray-200 truncate">{info.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={14} className="text-emerald-500" /> Facilities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedHospital.facilities?.map((f: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-[11px] font-bold border border-emerald-100 dark:border-emerald-800/50">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FlaskConical size={14} className="text-blue-500" /> Lab Services
                      </h4>
                      <div className="space-y-2">
                        {selectedHospital.labServices?.length > 0 ? selectedHospital.labServices.map((s: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-bold">{s.name}</span>
                            <span className="text-xs font-black text-emerald-600">₹{s.price}</span>
                          </div>
                        )) : <p className="text-xs text-gray-400 italic pl-1">No lab services listed</p>}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Stethoscope size={14} className="text-purple-500" /> Departments
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedHospital.departments?.map((d: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-xl text-[11px] font-bold border border-purple-100 dark:border-purple-800/50">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Store & Delivery</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Medicine Shop</span>
                          {selectedHospital.medicineShop ? <CheckCircle2 className="text-emerald-500" size={18} /> : <X className="text-gray-300" size={18} />}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Home Delivery</span>
                          {selectedHospital.medicineDelivery ? <CheckCircle2 className="text-emerald-500" size={18} /> : <X className="text-gray-300" size={18} />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Wallet & Earnings ── */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <IndianRupee size={13} className="text-emerald-600" /> Wallet & Earnings
                    </h4>
                    <div className="flex items-center gap-2">
                      {statsLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
                      <button onClick={refreshStats} disabled={statsLoading}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        title="Refresh earnings data">
                        <RefreshCcw size={13} />
                      </button>
                    </div>
                  </div>

                  {hospitalStats ? (
                    <>
                      {/* Online vs Cash */}
                      <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700">
                        <div className="p-4 space-y-1.5 bg-blue-50/50 dark:bg-blue-900/10">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-wider mb-2">
                            <CreditCard size={11} /> Online Earnings
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Collected</span>
                            <span className="font-black text-gray-900 dark:text-white">₹{(hospitalStats.onlineEarnings || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Platform Commission</span>
                            <span className="font-black text-violet-600">₹{(hospitalStats.onlinePlatformCommission ?? 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Paid Out</span>
                            <span className="font-black text-violet-600">₹{(hospitalStats.totalPaidOut || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-blue-100 dark:border-blue-800 mt-1">
                            <span className="font-bold text-gray-600 dark:text-gray-400">Remaining</span>
                            <span className="font-black text-teal-600">₹{(hospitalStats.remainingBalance || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <div className="p-4 space-y-1.5 bg-amber-50/50 dark:bg-amber-900/10">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-wider mb-2">
                            <Banknote size={11} /> Cash Earnings
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Collected</span>
                            <span className="font-black text-gray-900 dark:text-white">₹{(hospitalStats.cashEarnings || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Platform Commission</span>
                            <span className="font-black text-violet-600">₹{(hospitalStats.cashPlatformCommission ?? 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="mt-3 px-2 py-1.5 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold text-center">Collected at hospital · No payout needed</p>
                          </div>
                        </div>
                      </div>

                      {/* Pay form — online only */}
                      {(hospitalStats.remainingBalance || 0) > 0 && (
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CreditCard size={12} className="text-blue-500" />
                            <p className="text-xs font-black text-gray-700 dark:text-gray-300">Pay Online Earnings</p>
                            <span className="ml-auto text-[10px] font-bold text-gray-400">Max ₹{(hospitalStats.remainingBalance || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                              <input type="number" min="1" max={hospitalStats.remainingBalance || 0}
                                placeholder="Amount" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                            </div>
                            <input type="text" placeholder="Note (optional)" value={payNote} onChange={e => setPayNote(e.target.value)}
                              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                            <button onClick={handlePayHospital} disabled={payLoading || !payAmount}
                              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shrink-0">
                              {payLoading ? '...' : 'Pay'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Payment logs */}
                      {hospitalStats.paymentLogs?.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-700 max-h-32 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                          {[...hospitalStats.paymentLogs].reverse().map((log: any, i: number) => (
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

                      {/* Appointments with filter */}
                      <div className="border-t border-gray-100 dark:border-gray-700">
                        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Appointments</p>
                          <div className="flex gap-1 flex-wrap">
                            {(['All', 'Confirmed', 'Completed', 'Cancelled'] as const).map(f => {
                              const cnt = f === 'All'
                                ? (hospitalStats.appointments || []).length
                                : (hospitalStats.appointments || []).filter((a: any) => a.status === f).length;
                              return (
                              <button key={f} onClick={() => setApptFilter(f)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                                  apptFilter === f
                                    ? f === 'Confirmed' ? 'bg-emerald-600 text-white'
                                      : f === 'Completed' ? 'bg-blue-600 text-white'
                                      : f === 'Cancelled' ? 'bg-red-500 text-white'
                                      : 'bg-gray-800 dark:bg-white text-white dark:text-gray-900'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'
                                }`}>
                                {f}
                                <span className={`px-1 rounded text-[9px] font-black ${apptFilter === f ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600 text-gray-400'}`}>{cnt}</span>
                              </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                          {(hospitalStats.appointments || [])
                            .filter((a: any) => apptFilter === 'All' || a.status === apptFilter)
                            .slice(0, 20)
                            .map((a: any) => (
                              <div key={a._id} className="px-4 py-2.5 flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-bold text-gray-900 dark:text-white">{a.patientId?.name || 'Patient'}</p>
                                  <p className="text-[10px] text-gray-400">{a.date} · {a.slot}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${a.status === 'Completed' ? 'bg-blue-50 text-blue-600' : a.status === 'Cancelled' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {a.status || 'Confirmed'}
                                  </span>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${(a.paymentMethod || 'cash').toLowerCase() === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {(a.paymentMethod || 'cash').toLowerCase() === 'online' ? 'ONLINE' : 'CASH'}
                                  </span>
                                  {a.price > 0 && <span className="text-[10px] font-black text-emerald-600">₹{a.netAmount ?? a.price}</span>}
                                  {(a.platformFeeAmount || 0) > 0 && (
                                    <span className="text-[9px] font-bold text-violet-500">Fee ₹{a.platformFeeAmount}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          {(hospitalStats.appointments || []).filter((a: any) => apptFilter === 'All' || a.status === apptFilter).length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-6 italic">No {apptFilter === 'All' ? '' : apptFilter} appointments found.</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    !statsLoading && <p className="text-xs text-gray-400 text-center py-6 italic">Could not load earnings data.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-6">
                <Building2 size={40} className="text-gray-200" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Select a Hospital / Nursing Home</h3>
              <p className="text-sm text-gray-500 max-w-[240px]">Choose a facility from the list to view and manage full details</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  {editingId ? <Edit3 size={24} className="text-emerald-600" /> : <Plus size={24} className="text-emerald-600" />}
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{editingId ? 'Edit Hospital / Nursing Home' : 'Add New Hospital / Nursing Home'}</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Tab Navigation for Form */}
              <div className="flex gap-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                {[
                  { id: 'basic', label: 'Basic' },
                  { id: 'about', label: 'About' },
                  { id: 'services', label: 'Services' },
                  { id: 'photos', label: 'Photos' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveFormTab(t.id as any)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeFormTab === t.id 
                        ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="space-y-8 min-h-[400px]">
                {activeFormTab === 'basic' && (
                  <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">English Name *</label>
                        <input 
                          placeholder="e.g. City General Hospital" 
                          value={form.name} 
                          onChange={e => setForm({...form, name: e.target.value})} 
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Hindi Name</label>
                        <input 
                          placeholder="जैसे: सिटी जनरल अस्पताल" 
                          value={form.nameHi} 
                          onChange={e => setForm({...form, nameHi: e.target.value})} 
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                        Facility Classification (Clinic vs Hospital) *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, type: 'hospital' as any })}
                          className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                            form.type !== 'clinic'
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-800 dark:text-blue-200 font-bold shadow-2xs'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <Building2 size={20} className="text-blue-600 shrink-0" />
                          <div>
                            <div className="text-xs font-black">Hospital</div>
                            <div className="text-[10px] opacity-75">Multi-specialty / Inpatient</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, type: 'clinic' as any })}
                          className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                            form.type === 'clinic'
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold shadow-2xs'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <Stethoscope size={20} className="text-emerald-600 shrink-0" />
                          <div>
                            <div className="text-xs font-black">Clinic</div>
                            <div className="text-[10px] opacity-75">Outpatient / Chamber</div>
                          </div>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Facility Type Option</label>
                        <select 
                          value={form.type} 
                          onChange={e => setForm({...form, type: e.target.value as any})} 
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all appearance-none"
                        >
                          <option value="hospital">Hospital / Nursing Home</option>
                          <option value="clinic">Clinic / Polyclinic / Chamber Center</option>
                          <option value="private">Private Hospital / Nursing Home</option>
                          <option value="government">Government Hospital</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Owner Email *</label>
                        <input 
                          placeholder="owner@hospital.com" 
                          value={form.ownerEmail} 
                          onChange={e => setForm({...form, ownerEmail: e.target.value})} 
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Login Password *</label>
                        <input 
                          type="password"
                          placeholder={editingId ? "Leave blank to keep same" : "Set login password"} 
                          value={form.ownerPassword} 
                          onChange={e => setForm({...form, ownerPassword: e.target.value})} 
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <input 
                          placeholder="+91 ..." 
                          value={form.phone} 
                          onChange={e => setForm({...form, phone: e.target.value})} 
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input 
                          placeholder="contact@hospital.com" 
                          value={form.email} 
                          onChange={e => setForm({...form, email: e.target.value})} 
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Platform Fee (%)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            placeholder="e.g. 10" 
                            value={form.platformFeePercent || ''} 
                            onChange={e => setForm({...form, platformFeePercent: Math.min(100, Math.max(0, Number(e.target.value) || 0))})} 
                            className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {activeFormTab === 'about' && (
                  <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">English Address *</label>
                      <input 
                        placeholder="Full street address in English" 
                        value={form.address} 
                        onChange={e => setForm({...form, address: e.target.value})} 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Hindi Address</label>
                      <input 
                        placeholder="हिंदी में पूरा पता" 
                        value={form.addressHi} 
                        onChange={e => setForm({...form, addressHi: e.target.value})} 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
                      />
                    </div>
                    <div className="hidden">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Latitude</label>
                          <input 
                            type="number" 
                            placeholder="22.5726" 
                            value={form.location.lat || ''} 
                            onChange={e => setForm({...form, location: {...form.location, lat: parseFloat(e.target.value) || 0}})} 
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Longitude</label>
                          <input 
                            type="number" 
                            placeholder="88.3639" 
                            value={form.location.lng || ''} 
                            onChange={e => setForm({...form, location: {...form.location, lng: parseFloat(e.target.value) || 0}})} 
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">About (English)</label>
                      <textarea 
                        placeholder="About this hospital..." 
                        value={form.about} 
                        onChange={e => setForm({...form, about: e.target.value})} 
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all resize-none" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">About (Hindi)</label>
                      <textarea 
                        placeholder="अस्पताल के बारे में..." 
                        value={form.aboutHi} 
                        onChange={e => setForm({...form, aboutHi: e.target.value})} 
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all resize-none" 
                      />
                    </div>
                  </section>
                )}

                {activeFormTab === 'services' && (
                  <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Facilities (comma separated)</label>
                        <input 
                          placeholder="ICU, Emergency, Parking, Pharmacy..." 
                          value={facilitiesInput} 
                          onChange={e => setFacilitiesInput(e.target.value)} 
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Departments (comma separated)</label>
                        <input 
                          placeholder="Cardiology, Orthopedics, Pediatrics..." 
                          value={departmentsInput} 
                          onChange={e => setDepartmentsInput(e.target.value)} 
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lab Services</h4>
                        <button type="button" onClick={addLabService} className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition-all">
                          <Plus size={14} /> Add Service
                        </button>
                      </div>
                      <div className="space-y-3">
                        {form.labServices.map((service, idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl space-y-3 relative group">
                            <button type="button" onClick={() => removeLabService(idx)} className="absolute top-3 right-3 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={14} />
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                              <input 
                                placeholder="Service Name (e.g. Blood Test)" 
                                value={service.name} 
                                onChange={e => updateLabService(idx, 'name', e.target.value)}
                                className="bg-white dark:bg-gray-700 px-3 py-2 rounded-xl text-xs font-bold outline-none border-none"
                              />
                              <input 
                                type="number"
                                placeholder="Price (₹)" 
                                value={service.price || ''} 
                                onChange={e => updateLabService(idx, 'price', parseFloat(e.target.value) || 0)}
                                className="bg-white dark:bg-gray-700 px-3 py-2 rounded-xl text-xs font-bold outline-none border-none"
                              />
                            </div>
                            <input 
                              placeholder="Description (optional)" 
                              value={service.description} 
                              onChange={e => updateLabService(idx, 'description', e.target.value)}
                              className="w-full bg-white dark:bg-gray-700 px-3 py-2 rounded-xl text-xs font-bold outline-none border-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Surgery Services</h4>
                        <button type="button" onClick={addSurgeryService} className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition-all">
                          <Plus size={14} /> Add Surgery
                        </button>
                      </div>
                      <div className="space-y-3">
                        {form.surgeryServices.map((service, idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl space-y-3 relative group">
                            <button type="button" onClick={() => removeSurgeryService(idx)} className="absolute top-3 right-3 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={14} />
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                              <input 
                                placeholder="Surgery Name" 
                                value={service.name} 
                                onChange={e => updateSurgeryService(idx, 'name', e.target.value)}
                                className="bg-white dark:bg-gray-700 px-3 py-2 rounded-xl text-xs font-bold outline-none border-none"
                              />
                              <input 
                                placeholder="Price Range (e.g. ₹20k - ₹40k)" 
                                value={service.priceRange} 
                                onChange={e => updateSurgeryService(idx, 'priceRange', e.target.value)}
                                className="bg-white dark:bg-gray-700 px-3 py-2 rounded-xl text-xs font-bold outline-none border-none"
                              />
                            </div>
                            <input 
                              placeholder="Description (optional)" 
                              value={service.description} 
                              onChange={e => updateSurgeryService(idx, 'description', e.target.value)}
                              className="w-full bg-white dark:bg-gray-700 px-3 py-2 rounded-xl text-xs font-bold outline-none border-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl cursor-pointer hover:bg-emerald-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-gray-700 rounded-xl shadow-sm group-hover:text-emerald-500 transition-colors">
                            <Activity size={18} />
                          </div>
                          <span className="text-sm font-bold">Medicine Shop</span>
                        </div>
                        <input type="checkbox" checked={form.medicineShop} onChange={e => setForm({...form, medicineShop: e.target.checked})} className="w-5 h-5 rounded-lg border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl cursor-pointer hover:bg-emerald-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-gray-700 rounded-xl shadow-sm group-hover:text-emerald-500 transition-colors">
                            <MapPin size={18} />
                          </div>
                          <span className="text-sm font-bold">Home Delivery</span>
                        </div>
                        <input type="checkbox" checked={form.medicineDelivery} onChange={e => setForm({...form, medicineDelivery: e.target.checked})} className="w-5 h-5 rounded-lg border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      </label>
                    </div>
                  </section>
                )}

                {activeFormTab === 'photos' && (
                  <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em]">Facility Photos</h3>
                    <div className="flex flex-wrap gap-4">
                      {form.photos.map((p, i) => (
                        <div key={i} className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm group">
                          <SafeImage src={p} alt="" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setForm({...form, photos: form.photos.filter((_, idx) => idx !== i)})}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <label className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
                        <Camera size={28} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-[10px] font-black text-gray-400 mt-2 uppercase">Add Photo</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                  </section>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                  {activeFormTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['basic', 'about', 'services', 'photos'];
                        const idx = tabs.indexOf(activeFormTab);
                        setActiveFormTab(tabs[idx - 1] as any);
                      }}
                      className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                      Previous Step
                    </button>
                  )}
                  
                  {activeFormTab !== 'photos' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['basic', 'about', 'services', 'photos'];
                        const idx = tabs.indexOf(activeFormTab);
                        setActiveFormTab(tabs[idx + 1] as any);
                      }}
                      className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button 
                      onClick={handleSave} 
                      className="flex-[2] flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                    >
                      <Save size={18} strokeWidth={2.5} /> {editingId ? 'Update Hospital Record' : 'Publish Hospital / Nursing Home'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
