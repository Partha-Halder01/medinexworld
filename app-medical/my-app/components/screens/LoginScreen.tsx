"use client";

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, KeyRound, Stethoscope, Building2 } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/ui/BrandLogo';
import Link from 'next/link';
import { DevQuickLogin } from '@/components/ui/DevQuickLogin';

export const LoginScreen = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { login, loginWithOtp } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email) {
      setError('Please enter your email.');
      return;
    }

    setIsLoading(true);
    let result: { success: boolean; error?: string };

    if (authMode === 'password') {
      if (!password) {
        setIsLoading(false);
        setError('Please enter your password.');
        return;
      }
      result = await login(email, password, 'patient', rememberMe);
    } else {
      if (!otpSent) {
        setIsLoading(false);
        setError('Please send OTP first.');
        return;
      }
      if (!otp) {
        setIsLoading(false);
        setError('Please enter OTP.');
        return;
      }
      result = await loginWithOtp(email, otp, 'patient', rememberMe);
    }

    setIsLoading(false);

    if (result.success) {
      let target = '/';
      if (typeof window !== 'undefined') {
        const r = new URLSearchParams(window.location.search).get('redirect');
        if (r && r.startsWith('/') && !r.startsWith('//')) {
          target = r;
        }
      }
      router.push(target);
    } else {
      setError(result.error || 'Login failed.');
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('Please enter your email first.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'patient' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP.');
      } else {
        setOtpSent(true);
        setInfo(data.message || 'OTP sent to your email.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <div className="min-h-[100dvh] lg:h-screen w-full bg-slate-50/70 dark:bg-gray-950 flex flex-col lg:flex-row relative overflow-x-hidden overflow-y-auto">
      {/* Left hero panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 bg-slate-950 text-white">
        {/* Background Image with dark gradient overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/auth_patient_login.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-900/50" />

        {/* Top Brand */}
        <div className="relative z-10">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <BrandLogo width={170} height={62} showName={false} priority />
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md border border-white/20 text-teal-300">
              <ShieldCheck size={13} /> Verified Patient Portal
            </span>
          </div>
        </div>

        {/* Bottom Social Proof & Value Props */}
        <div className="relative z-10 max-w-lg space-y-5">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">
              Connecting you to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-200 to-blue-200">
                trusted medical care.
              </span>
            </h1>
            <p className="text-slate-200/90 text-sm mt-2 leading-relaxed">
              Book verified clinic appointments, connect with specialists over HD video, and manage your health records in one secure place.
            </p>
          </div>

          {/* Testimonial / Social proof */}
          <div className="bg-slate-900/75 backdrop-blur-md rounded-2xl p-4.5 border border-white/20 text-left shadow-xl">
            <div className="flex text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-white text-xs sm:text-sm font-medium italic mb-2.5">
              &quot;Medinex World has completely transformed how I manage my family&apos;s health appointments.&quot;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-xs">
                A
              </div>
              <span className="text-slate-300 text-xs font-semibold">Arun K. • Verified Patient</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel (Mobile + Desktop) */}
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
            <div className="relative rounded-2xl overflow-hidden h-36 w-full border border-slate-200 dark:border-slate-800 shadow-sm">
              <img 
                src="/images/auth_patient_login.jpg" 
                alt="Medinex Patient Care" 
                className="w-full h-full object-cover object-center" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-3.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-teal-300 border border-white/25 w-max">
                  <ShieldCheck size={12} /> Verified Patient Portal
                </span>
                <p className="text-white text-xs font-semibold mt-1">
                  Book verified doctors & track OPD queue in real time
                </p>
              </div>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('auth.welcomeBack')}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {t('auth.signInToContinue')}
            </p>

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
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium animate-shake">
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
              <label htmlFor="login-email" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all shadow-xs"
                />
              </div>
            </div>

            {authMode === 'password' ? (
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
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
                <label htmlFor="login-otp" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('auth.enterOtp')}
                </label>
                <div className="flex gap-2">
                  <input
                    id="login-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="6-digit OTP"
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
                  onChange={() => setRememberMe(!rememberMe)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-teal-600 focus:ring-teal-500 dark:bg-gray-800 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {t('auth.rememberMe')}
                </span>
              </label>
              {authMode === 'password' && (
                <button 
                  type="button" 
                  className="text-xs sm:text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors py-1"
                >
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
            role="patient"
            disabled={isLoading}
            onFill={(e, p) => { setAuthMode('password'); setEmail(e); setPassword(p); }}
            className="mt-4"
          />

          {/* Social Proof / Switch Options */}
          <div className="pt-3 space-y-3">
            {/* Create Account Card */}
            <div className="bg-teal-50/70 dark:bg-teal-950/30 p-3.5 sm:p-4 rounded-2xl border border-teal-100 dark:border-teal-900/40 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('auth.noAccount')}
              </p>
              <button 
                type="button" 
                onClick={() => {
                  let target = '/register';
                  if (typeof window !== 'undefined') {
                    const r = new URLSearchParams(window.location.search).get('redirect');
                    if (r) target += `?redirect=${encodeURIComponent(r)}`;
                  }
                  router.push(target);
                }} 
                className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 text-white font-bold rounded-xl shadow-xs hover:bg-teal-700 active:scale-95 transition-all text-xs sm:text-sm uppercase tracking-wider"
              >
                {t('auth.createOne')}
              </button>
            </div>

            {/* Doctor & Hospital Login Switches */}
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <button 
                type="button" 
                onClick={() => router.push('/doctor-login')} 
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all shadow-xs active:scale-95"
              >
                <Stethoscope size={15} className="text-teal-600 dark:text-teal-400" />
                <span>{t('auth.doctorLogin')}</span>
              </button>
              <button 
                type="button" 
                onClick={() => router.push('/hospital-admin/login')} 
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-xs active:scale-95"
              >
                <Building2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span>Hospital / Nursing Home</span>
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
