"use client";
import React, { useState, useEffect } from 'react';
import {
  User, UserPlus, LogIn,
  Stethoscope, Shield, Star, Navigation, LocateFixed, MapPin, CheckCircle2,
  AlertTriangle, Pencil, X, Check, Lock, Eye, EyeOff, Phone, Mail,
  ChevronRight, LogOut, CalendarCheck, Clock, FileText, FlaskConical, ClipboardList,
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  );
  if (!res.ok) throw new Error('Geocode failed');
  const data = await res.json();
  const { road, neighbourhood, suburb, city, town, village, state, country } = data.address || {};
  const parts = [road || neighbourhood, suburb, city || town || village, state, country].filter(Boolean);
  return parts.slice(0, 4).join(', ') || data.display_name || 'Unknown location';
}

const AVATAR_COLORS = ['bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500', 'bg-cyan-500'];
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

export const UserProfileScreen = () => {
  const { showToast, logout, currentUser, isLoggedIn } = useAppContext();
  const { t } = useLanguage();
  const router = useRouter();

  // ── Edit profile state ────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Password change state ─────────────────────────────────────────────────
  const [showPwSection, setShowPwSection] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // ── Location state ─────────────────────────────────────────────────────────
  const [locStatus, setLocStatus] = useState<'idle' | 'locating' | 'done' | 'error'>('idle');
  const [locAddress, setLocAddress] = useState('');
  const [locCoords, setLocCoords] = useState<{ lat: number; lng: number } | null>(null);

  // ── Appointment stats ──────────────────────────────────────────────────────
  const [apptStats, setApptStats] = useState({ total: 0, completed: 0, upcoming: 0 });

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditPhone((currentUser as any).phone || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?._id) return;
    fetch(`/api/appointments?patientId=${currentUser._id}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        setApptStats({
          total: data.length,
          completed: data.filter((a: any) => a.status === 'Completed').length,
          upcoming: data.filter((a: any) => a.status === 'Confirmed').length,
        });
      }).catch(() => {});
  }, [currentUser?._id]);

  const saveProfile = async () => {
    if (!currentUser?._id || !editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${currentUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), phone: editPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to save.', 'error'); return; }
      // Update localStorage/sessionStorage
      const key = 'aurahealth_user';
      const stored = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = { ...parsed, name: data.name, phone: data.phone };
        if (localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(updated));
        else sessionStorage.setItem(key, JSON.stringify(updated));
      }
      showToast('Profile updated successfully!', 'success');
      setEditMode(false);
      // Force reload to reflect new name everywhere
      window.location.reload();
    } finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (!currentUser?._id) return;
    if (newPw !== confirmPw) { showToast('Passwords do not match.', 'error'); return; }
    if (newPw.length < 6) { showToast('Password must be at least 6 characters.', 'error'); return; }
    setPwSaving(true);
    try {
      const res = await fetch(`/api/users/${currentUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to change password.', 'error'); return; }
      showToast('Password changed successfully!', 'success');
      setShowPwSection(false);
      setNewPw(''); setConfirmPw('');
    } finally { setPwSaving(false); }
  };

  const fetchLocation = async () => {
    if (!navigator.geolocation) { showToast('Geolocation not supported.', 'error'); return; }
    setLocStatus('locating'); setLocAddress(''); setLocCoords(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocCoords({ lat, lng });
        try {
          const addr = await reverseGeocode(lat, lng);
          setLocAddress(addr);
          setLocStatus('done');
          await fetch('/api/location', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentUser?._id, role: 'patient', lat, lng }),
          });
          showToast('Location saved!', 'success');
        } catch {
          setLocStatus('done');
          setLocAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      },
      (err) => {
        setLocStatus('error');
        showToast(err.code === 1 ? 'Location permission denied.' : 'Could not get location.', 'error');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // ── GUEST VIEW ─────────────────────────────────────────────────────────────
  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto w-full">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-sm mx-auto w-full space-y-4">
          <div className="w-28 h-28 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-teal-500/30">
            <User size={52} className="text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Welcome to Medinex World</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
              Sign in to manage your health profile, book appointments, and access all features.
            </p>
          </div>
          <div className="w-full space-y-3">
            <button onClick={() => router.push('/register')}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-all">
              <UserPlus size={20} /> Create Account
            </button>
            <button onClick={() => router.push('/login')}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-teal-700 dark:text-teal-400 font-bold text-base border-2 border-teal-200 dark:border-teal-800 active:scale-[0.98] transition-all">
              <LogIn size={20} /> Sign In
            </button>
          </div>
          <div className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-3.5">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Why create an account?</p>
            {[
              { icon: Stethoscope, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20', text: 'Book appointments with top doctors' },
              { icon: Shield,      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',  text: 'Secure health records & history' },
              { icon: Star,        color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', text: 'AI symptom checker & health tips' },
            ].map(({ icon: Icon, color, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}><Icon size={16} /></div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const avatarColor = getAvatarColor(currentUser.name || '');
  const initials = getInitials(currentUser.name || '');

  // ── LOGGED-IN VIEW ────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-[100rem] mx-auto w-full md:px-4 xl:px-6">

        {/* ── Hero Header ─────────────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-blue-600 overflow-hidden md:rounded-b-3xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

          {/* Top bar */}
          <div className="relative flex items-center justify-between px-4 pt-4 pb-2">
            <h1 className="text-xl font-black text-white">My Profile</h1>
          </div>

          {/* Avatar + name */}
          <div className="relative px-4 pb-5 flex items-center gap-4 mt-1">
            <div className="relative shrink-0">
              <div className={`w-20 h-20 rounded-2xl ${avatarColor} flex items-center justify-center border-4 border-white/30 shadow-xl`}>
                <span className="text-white font-black text-2xl select-none">{initials}</span>
              </div>
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-white leading-tight truncate">{currentUser.name}</h2>
              <p className="text-teal-100 text-xs sm:text-sm mt-0.5 truncate font-medium">{currentUser.email}</p>
              {(currentUser as any).phone && (
                <p className="text-teal-200 text-xs sm:text-sm mt-0.5 font-medium">{(currentUser as any).phone}</p>
              )}
            </div>
            <button onClick={() => setEditMode(true)}
              className="shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-colors border border-white/20">
              <Pencil size={13} /> Edit
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 bg-white/10 border-t border-white/10 divide-x divide-white/10">
            {[
              { icon: <CalendarCheck size={16} className="text-teal-200" />, val: apptStats.total, label: 'Total Visits' },
              { icon: <CheckCircle2 size={16} className="text-green-300" />, val: apptStats.completed, label: 'Completed' },
              { icon: <Clock size={16} className="text-amber-300" />, val: apptStats.upcoming, label: 'Upcoming' },
            ].map(({ icon, val, label }) => (
              <div key={label} className="py-3 text-center text-white">
                <div className="flex items-center justify-center gap-1.5">{icon}<span className="font-black text-lg">{val}</span></div>
                <p className="text-[10px] sm:text-xs text-teal-100 uppercase tracking-wider mt-0.5 font-bold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 md:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
            
            {/* ── Left Column ───────────────────────────────────────────── */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4 lg:space-y-6">

          {/* ── Edit Profile Modal/Card ──────────────────────────────────── */}
          {editMode && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-teal-200 dark:border-teal-800 shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-teal-50 dark:bg-teal-900/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-teal-100 dark:bg-teal-900/50 rounded-lg flex items-center justify-center">
                    <Pencil size={14} className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Edit Profile</h3>
                </div>
                <button onClick={() => { setEditMode(false); setEditName(currentUser.name || ''); setEditPhone((currentUser as any).phone || ''); }}
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={editName} onChange={e => setEditName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                {/* Phone */}
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={editPhone} onChange={e => setEditPhone(e.target.value)}
                      placeholder="Your phone number"
                      type="tel"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                {/* Email (read-only) */}
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Email Address <span className="text-gray-400 font-normal normal-case">(cannot be changed)</span></label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                    <input value={currentUser.email} disabled
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>
                {/* Save / Cancel */}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setEditMode(false); setEditName(currentUser.name || ''); setEditPhone((currentUser as any).phone || ''); }}
                    className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    Cancel
                  </button>
                  <button onClick={saveProfile} disabled={saving || !editName.trim()}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      !saving && editName.trim() ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                    {saving
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><Check size={15} /> Save Changes</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Profile Info Card (view mode) ────────────────────────────── */}
          {!editMode && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <User size={14} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Personal Information</h3>
                </div>
                <button onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors">
                  <Pencil size={12} /> Edit
                </button>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {[
                  { icon: <User size={15} className="text-gray-400" />, label: 'Full Name', value: currentUser.name },
                  { icon: <Mail size={15} className="text-gray-400" />, label: 'Email', value: currentUser.email },
                  { icon: <Phone size={15} className="text-gray-400" />, label: 'Phone', value: (currentUser as any).phone || '—' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5 truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Digital Prescriptions Card ─────────────────────────────────── */}
          <Link href="/profile/prescriptions" className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                  <FileText size={15} className="text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{t('profile.digitalPrescriptions')}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{t('profile.prescriptions')} & {t('profile.labReports')}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </Link>

          {/* ── My Enquiries & Follow-ups Card ────────────────────────────── */}
          <Link href="/profile/enquiries" className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <ClipboardList size={15} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">My Enquiries & Follow-ups</p>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      Ambulance & Tests
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Track ambulance dispatch, test quotes & admin responses</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </Link>
            </div>

            {/* ── Right Column ──────────────────────────────────────────── */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:space-y-6">

          {/* ── Change Password Card ─────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <button onClick={() => setShowPwSection(!showPwSection)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Lock size={15} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Change Password</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Update your account password</p>
                </div>
              </div>
              <ChevronRight size={18} className={`text-gray-400 transition-transform ${showPwSection ? 'rotate-90' : ''}`} />
            </button>

            {showPwSection && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700 space-y-3">
                {/* New password */}
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">New Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showNewPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all" />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPw && newPw.length < 6 && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={11} /> Must be at least 6 characters</p>
                  )}
                </div>
                {/* Confirm password */}
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all" />
                  </div>
                  {confirmPw && newPw !== confirmPw && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={11} /> Passwords do not match</p>
                  )}
                  {confirmPw && newPw === confirmPw && newPw.length >= 6 && (
                    <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><CheckCircle2 size={11} /> Passwords match</p>
                  )}
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setShowPwSection(false); setNewPw(''); setConfirmPw(''); }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    Cancel
                  </button>
                  <button onClick={savePassword}
                    disabled={pwSaving || newPw.length < 6 || newPw !== confirmPw}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      !pwSaving && newPw.length >= 6 && newPw === confirmPw
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                    {pwSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Update Password'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Location Card ────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Navigation size={14} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">My Location</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Sorts nearby doctors by distance</p>
                </div>
              </div>
              {currentUser?.location?.lat && locStatus === 'idle' && (
                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">Saved ✓</span>
              )}
            </div>

            <div className="p-3 space-y-3">
              {/* Saved location display */}
              {locStatus === 'idle' && currentUser?.location?.lat && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl">
                  <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Last Saved</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                      {currentUser.location.lat.toFixed(6)}°N · {currentUser.location.lng.toFixed(6)}°E
                    </p>
                  </div>
                </div>
              )}

              {/* Fetch button */}
              <button type="button" onClick={fetchLocation} disabled={locStatus === 'locating'}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                  locStatus === 'locating' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 cursor-not-allowed border border-blue-200 dark:border-blue-800'
                    : locStatus === 'done' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : locStatus === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-[0.98]'}`}>
                {locStatus === 'locating' ? (
                  <><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> Fetching…</>
                ) : locStatus === 'done' ? (
                  <><CheckCircle2 size={15} /> Location Saved · Fetch Again</>
                ) : locStatus === 'error' ? (
                  <><AlertTriangle size={15} /> Retry — Allow Location Access</>
                ) : (
                  <><LocateFixed size={15} /> Fetch My Current Location</>
                )}
              </button>

              {locStatus === 'done' && locAddress && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={14} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 leading-relaxed">{locAddress}</p>
                  </div>
                  {locCoords && (
                    <p className="text-[11px] text-emerald-600/70 dark:text-emerald-500/70 font-mono mt-1 pl-6">
                      {locCoords.lat.toFixed(6)}°N · {locCoords.lng.toFixed(6)}°E
                    </p>
                  )}
                </div>
              )}

              {locStatus === 'error' && (
                <div className="p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                    Permission denied. Go to browser settings → Site permissions → Location and allow this site.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Logout ───────────────────────────────────────────────────── */}
          <button
            onClick={() => { logout(); showToast('Logged out successfully.', 'success'); router.push('/login'); }}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold text-base hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm">
            <LogOut size={19} /> Log Out
          </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
