"use client";

import React, { useState } from 'react';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, Stethoscope, User, Sparkles, MapPin, Phone } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { DevQuickLogin } from '@/components/ui/DevQuickLogin';
import { useLanguage } from '@/app/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/ui/BrandLogo';
import Link from 'next/link';

export const HospitalAdminLoginScreen = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { login } = useAppContext();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration form states
  const [regFacilityType, setRegFacilityType] = useState<'hospital' | 'clinic'>('hospital');
  const [regFacilityName, setRegFacilityName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFillDemo = () => {
    setEmail('hospital@medinex.in');
    setPassword('password123');
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regFacilityName || !regEmail || !regPassword) {
      setError('Please provide facility name, email, and password.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/hospital-admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regFacilityName,
          facilityType: regFacilityType,
          ownerName: regOwnerName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          address: regAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to register facility.');
        return;
      }

      setSuccessMsg(data.message || 'Facility registered successfully! Logging you in...');
      const loginRes = await login(regEmail, regPassword, 'hospital_owner', true);
      if (loginRes.success) {
        router.push('/hospital-admin/dashboard');
      } else {
        setAuthMode('login');
        setEmail(regEmail);
        setPassword(regPassword);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password, 'hospital_owner', rememberMe);

      if (res.success) {
        const storedUser = localStorage.getItem('aurahealth_user') || sessionStorage.getItem('aurahealth_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.role === 'hospital_owner' || parsed.role === 'hospital_admin' || parsed.role === 'admin') {
            router.push('/hospital-admin/dashboard');
            return;
          }
        }
        router.push('/hospital-admin/dashboard');
      } else {
        setError(res.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] lg:h-screen w-full bg-slate-50/70 dark:bg-gray-950 flex flex-col lg:flex-row relative overflow-x-hidden overflow-y-auto">
      {/* Left hero panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 bg-slate-950 text-white">
        {/* Background Image with dark gradient overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/modern_hospital_care.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-teal-950/75 to-slate-950/60" />

        {/* Top Brand */}
        <div className="relative z-10">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <BrandLogo width={170} height={62} showName={false} priority />
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md border border-white/20 text-emerald-300">
              <Building2 size={13} /> Verified Hospital / Nursing Home Portal
            </span>
          </div>
        </div>

        {/* Bottom Social Proof & Value Props */}
        <div className="relative z-10 max-w-lg space-y-5">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">
              Hospital / Nursing Home <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200">
                Management Operations.
              </span>
            </h1>
            <p className="text-slate-200/90 text-sm mt-2 leading-relaxed">
              Orchestrate doctors, manage OPD & diagnostic queues, track patient admissions, and track facility earnings and payouts effortlessly.
            </p>
          </div>

          {/* Quick Hospital Value Points */}
          <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-200">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>Multi-Doctor Rostering</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>Real-time OPD & Surgery Ops</span>
            </div>
          </div>

          {/* Superintendent Testimonial */}
          <div className="bg-slate-900/75 backdrop-blur-md rounded-2xl p-4.5 border border-white/20 text-left shadow-xl">
            <p className="text-white text-xs sm:text-sm font-medium italic mb-2.5">
              &quot;Switching to the Medinex Hospital &amp; Nursing Home Workspace streamlined our patient intake and doctor scheduling across all departments.&quot;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                C
              </div>
              <span className="text-slate-300 text-xs font-semibold">City General Hospital / Nursing Home • Board</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-between px-4 py-4 sm:px-8 lg:px-12 w-full max-w-lg mx-auto lg:max-w-none lg:overflow-y-auto">
        {/* Mobile Top Navigation Bar */}
        <header className="lg:hidden flex items-center justify-between pb-3 pt-1 border-b border-gray-200/60 dark:border-gray-800/80 mb-3">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-teal-600 transition-colors shadow-xs"
            aria-label="Back to Home"
          >
            <ArrowLeft size={14} />
            <span>Home</span>
          </Link>

          <Link href="/" className="inline-block">
            <BrandLogo width={100} height={36} showName={false} priority />
          </Link>
          <div className="w-8" />
        </header>

        <div className="w-full max-w-md mx-auto my-auto space-y-5">
          {/* Mobile Image Hero Card */}
          <div className="lg:hidden">
            <div className="relative rounded-2xl overflow-hidden h-36 w-full border border-slate-200 dark:border-slate-800 shadow-sm mb-3">
              <img 
                src="/images/modern_hospital_care.jpg" 
                alt="Hospital & Nursing Home Management Operations" 
                className="w-full h-full object-cover object-center" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-3.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-emerald-300 border border-white/25 w-max">
                  <Building2 size={12} /> Hospital / Nursing Home Portal
                </span>
                <p className="text-white text-xs font-semibold mt-1">
                  Manage facility bookings, doctors & OPD operations
                </p>
              </div>
            </div>
          </div>

          {/* Portal Header */}
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-2 border border-emerald-200 dark:border-emerald-800">
              <Building2 size={14} /> Hospital &amp; Clinic Partner Workspace
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {authMode === 'login' ? 'Hospital & Clinic Sign In' : 'Register Your Facility'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {authMode === 'login'
                ? 'Sign in to manage facility doctors, OPD appointments & operations'
                : 'Create your hospital or clinic partner account to start managing bookings & doctors'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                authMode === 'login'
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Partner Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                authMode === 'register'
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Register Facility
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium animate-shake">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium">
              {successMsg}
            </div>
          )}

          {authMode === 'login' ? (
            <>
              {/* Quick Demo Autofill Helper */}
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2">
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  <span className="font-bold flex items-center gap-1"><Sparkles size={13} /> Demo Facility:</span>
                  <span className="font-mono text-gray-600 dark:text-gray-400">hospital@medinex.in / password123</span>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider shrink-0 transition-all active:scale-95"
                >
                  Autofill
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="hospital-email" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Hospital / Clinic Email
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      id="hospital-email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="hospital@medinex.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="hospital-password" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      id="hospital-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="w-10 h-10 flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 dark:bg-gray-800 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Remember this terminal</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-[50px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 dark:shadow-emerald-900/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wider"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Enter Facility Dashboard</span>
                        <ArrowRight size={18} strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <DevQuickLogin
                role="hospital"
                disabled={isLoading}
                onFill={(e, p) => { setEmail(e); setPassword(p); }}
                className="mt-4"
              />
            </>
          ) : (
            /* ── Registration Form with Clinic vs Hospital Selection ── */
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Facility Category Selector: Clinic vs Hospital */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Select Facility Type *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRegFacilityType('hospital')}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      regFacilityType === 'hospital'
                        ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 text-blue-800 dark:text-blue-200 font-bold shadow-xs'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold">Hospital</div>
                      <div className="text-[10px] opacity-75">Multi-bed / Center</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegFacilityType('clinic')}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      regFacilityType === 'clinic'
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold">Clinic</div>
                      <div className="text-[10px] opacity-75">OPD &amp; Chamber</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Facility Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {regFacilityType === 'clinic' ? 'Clinic Name *' : 'Hospital Name *'}
                </label>
                <div className="relative">
                  {regFacilityType === 'clinic' ? (
                    <Stethoscope size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  ) : (
                    <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  )}
                  <input
                    type="text"
                    required
                    placeholder={regFacilityType === 'clinic' ? 'e.g. City Care Polyclinic' : 'e.g. City Care Hospital'}
                    value={regFacilityName}
                    onChange={(e) => setRegFacilityName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Administrator Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Admin Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. R. Sharma"
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Facility Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="contact@facility.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Facility Address</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Hill Cart Road, Siliguri"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[50px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 dark:shadow-emerald-900/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Register {regFacilityType === 'clinic' ? 'Clinic' : 'Hospital'} &amp; Enter Portal</span>
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Quick Portal Switchers */}
          <div className="pt-3 space-y-3">
            <div className="bg-slate-100 dark:bg-gray-900/60 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 text-center space-y-2.5">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Looking for another portal?</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button 
                  type="button" 
                  onClick={() => router.push('/login')} 
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:text-teal-600 transition-all shadow-xs active:scale-95"
                >
                  <User size={14} className="text-teal-600" />
                  <span>Patient Login</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => router.push('/doctor-login')} 
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:text-teal-600 transition-all shadow-xs active:scale-95"
                >
                  <Stethoscope size={14} className="text-teal-600" />
                  <span>Doctor Login</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile footer safe spacing */}
        <footer className="text-center py-3 text-xs text-gray-400 dark:text-gray-600 font-medium">
          Protected by Medinex Health Encryption • HIPAA & ABDM Compliant
        </footer>
      </div>
    </div>
  );
};
