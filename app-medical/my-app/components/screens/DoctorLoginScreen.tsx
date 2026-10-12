"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Stethoscope, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, KeyRound, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { DevQuickLogin } from '@/components/ui/DevQuickLogin';
import { useLanguage } from '@/app/context/LanguageContext';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const DoctorLoginScreen = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { loginDoctor, loginWithOtp, theme } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email) {
      setError(t('auth.errorEmailRequired'));
      return;
    }

    setIsLoading(true);
    let result: { success: boolean; error?: string };

    if (authMode === 'password') {
      if (!password) {
        setIsLoading(false);
        setError(t('auth.errorPasswordRequired'));
        return;
      }
      result = await loginDoctor(email, password, rememberMe);
    } else {
      if (!otpSent) {
        setIsLoading(false);
        setError(t('auth.errorSendOtpFirst'));
        return;
      }
      if (!otp) {
        setIsLoading(false);
        setError(t('auth.errorOtpRequired'));
        return;
      }
      result = await loginWithOtp(email, otp, 'doctor', rememberMe);
    }

    setIsLoading(false);

    if (result.success) {
      router.push('/doctor-panel');
    } else {
      setError(result.error || t('auth.errorInvalidCredentials'));
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError(t('auth.errorEmailRequiredForOtp'));
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'doctor' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP.');
      } else {
        setOtpSent(true);
        setInfo(data.message || t('auth.otpSentMessage'));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <div className="min-h-[100dvh] lg:h-screen w-full bg-slate-50/70 dark:bg-gray-950 flex flex-col lg:flex-row relative overflow-x-hidden overflow-y-auto">
      {/* Left hero panel with authentic doctor image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 bg-slate-950 text-white">
        {/* Background Image with dark healthcare gradient overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/auth_doctor_login.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-900/50" />

        {/* Top Brand */}
        <div className="relative z-10">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <BrandLogo width={170} height={62} showName={false} priority />
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md border border-white/20 text-emerald-300">
              <Stethoscope size={13} /> Verified Clinician Workspace
            </span>
          </div>
        </div>

        {/* Bottom Social Proof & Value Props */}
        <div className="relative z-10 max-w-lg space-y-5">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">
              Empowering clinicians <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200">
                with intelligent care tools.
              </span>
            </h1>
            <p className="text-slate-200/90 text-sm mt-2 leading-relaxed">
              Manage your OPD queues, conduct HD teleconsultations, generate secure e-prescriptions, and review patient histories seamlessly.
            </p>
          </div>

          {/* Quick Doctor Value Points */}
          <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-200">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Smart Live OPD Queue</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Instant Digital Rx & Vitals</span>
            </div>
          </div>

          {/* Clinician Testimonial */}
          <div className="bg-slate-900/75 backdrop-blur-md rounded-2xl p-4.5 border border-white/20 text-left shadow-xl">
            <div className="flex text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-white text-xs sm:text-sm font-medium italic mb-2.5">
              &quot;The queue management and instant prescription tools reduced our patient waiting times by over 45%.&quot;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                R
              </div>
              <span className="text-slate-300 text-xs font-semibold">Dr. Rajesh Sharma • MD, Senior Consultant</span>
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
          {/* Mobile brand image header */}
          <div className="lg:hidden">
            <div className="relative rounded-2xl overflow-hidden h-36 w-full border border-slate-200 dark:border-slate-800 shadow-sm mb-3">
              <img src="/images/auth_doctor_login.jpg" alt="Medinex Doctor Workspace" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-3.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-emerald-300 border border-white/25 w-max">
                  <Stethoscope size={12} /> Doctor Partner Workspace
                </span>
                <p className="text-white text-xs font-semibold mt-1">
                  Access patient records, prescriptions & live OPD queue
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-2 border border-emerald-200 dark:border-emerald-800">
              <Stethoscope size={14} /> Doctor Partner Workspace
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('auth.welcomeDoctor')}</h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('auth.signInDoctorSubtitle')}</p>
            
            {/* Mobile-friendly Full-Width Segmented Tab Switcher */}
            <div className="mt-4 grid grid-cols-2 p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 w-full gap-1.5">
              <button
                type="button"
                onClick={() => { setAuthMode('password'); setOtp(''); setOtpSent(false); setError(''); setInfo(''); }}
                className={`py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  authMode === 'password' 
                    ? 'bg-teal-600 text-white shadow-xs' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Lock size={15} />
                <span>{t('auth.passwordLogin')}</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('otp'); setPassword(''); setError(''); setInfo(''); }}
                className={`py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  authMode === 'otp' 
                    ? 'bg-teal-600 text-white shadow-xs' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <KeyRound size={15} />
                <span>{t('auth.otpLogin')}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="doctor-email" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  id="doctor-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all shadow-xs"
                />
              </div>
            </div>

            {authMode === 'password' ? (
              <div className="space-y-1.5">
                <label htmlFor="doctor-password" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{t('auth.password')}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    id="doctor-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all shadow-xs"
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
            ) : (
              <div className="space-y-1.5">
                <label htmlFor="doctor-otp" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{t('auth.enterOtp')}</label>
                <div className="flex gap-2">
                  <input
                    id="doctor-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder={t('auth.otpPlaceholder')}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-sm sm:text-base text-center font-mono tracking-[0.25em] shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="px-4 py-3 min-w-[100px] rounded-xl border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 font-bold text-xs sm:text-sm hover:bg-teal-50 dark:hover:bg-teal-900/20 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {isSendingOtp ? 'Sending...' : otpSent ? t('auth.resendOtp') : t('auth.sendOtp')}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe((prev) => !prev)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-teal-600 focus:ring-teal-500 dark:bg-gray-800 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">{t('auth.rememberMe')}</span>
              </label>
              {authMode === 'password' && (
                <button type="button" className="text-xs sm:text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors py-1">
                  {t('auth.forgotPassword')}
                </button>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[50px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-teal-600/25 dark:shadow-teal-900/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{authMode === 'password' ? t('auth.signIn') : t('auth.verifyAndSignIn')}</span>
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </div>
          </form>

          <DevQuickLogin
            role="doctor"
            disabled={isLoading}
            onFill={(e, p) => { setAuthMode('password'); setEmail(e); setPassword(p); }}
            className="mt-4"
          />

          {/* Social Proof / Switch Options */}
          <div className="pt-3 space-y-3">
            <div className="bg-teal-50/70 dark:bg-teal-950/30 p-3.5 sm:p-4 rounded-2xl border border-teal-100 dark:border-teal-900/50 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('auth.notADoctor')}
              </p>
              <button 
                type="button" 
                onClick={() => router.push('/login')} 
                className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 text-white font-bold rounded-xl shadow-xs hover:bg-teal-700 active:scale-95 transition-all text-xs sm:text-sm uppercase tracking-wider"
              >
                {t('auth.patientLogin')}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button 
                type="button" 
                onClick={() => router.push('/doctor-apply')} 
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all shadow-xs active:scale-95"
              >
                <Stethoscope size={15} className="text-teal-600 dark:text-teal-400" />
                <span>{t('auth.applyAsDoctor')}</span>
              </button>
              <button 
                type="button" 
                onClick={() => router.push('/hospital-admin/login')} 
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/50 transition-all shadow-xs active:scale-95"
              >
                <Building2 size={15} className="text-blue-600 dark:text-blue-400" />
                <span>Hospital / Nursing Home Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile footer safe spacing */}
        <footer className="text-center py-3 text-[11px] text-gray-400 dark:text-gray-600">
          Protected by Medinex Health Encryption • HIPAA & ABDM Compliant
        </footer>
      </div>
    </div>
  );
};
