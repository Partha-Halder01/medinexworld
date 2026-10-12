"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const RegisterScreen = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { login, theme } = useAppContext();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!name || !email || !phone || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP.');
      } else {
        setOtpStep(true);
        setMessage(data.message || 'OTP sent to your email. Enter it below to verify your account.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setMessage('');
    if (!otp.trim()) {
      setError('Please enter OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const verifyRes = await fetch('/api/auth/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(verifyData.error || 'OTP verification failed.');
        return;
      }

      const loginResult = await login(email, password, 'patient', true);
      let target = '/';
      if (typeof window !== 'undefined') {
        const r = new URLSearchParams(window.location.search).get('redirect');
        if (r && r.startsWith('/') && !r.startsWith('//')) {
          target = r;
        }
      }
      if (loginResult.success) {
        router.push(target);
      } else {
        router.push(target !== '/' ? `/login?redirect=${encodeURIComponent(target)}` : '/login');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    setIsResendingOtp(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resend OTP.');
      } else {
        setMessage(data.message || 'A new OTP has been sent to your email.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  return (
    <div className="min-h-[100dvh] lg:h-screen w-full bg-slate-50/70 dark:bg-gray-950 flex flex-col lg:flex-row relative overflow-x-hidden overflow-y-auto">
      {/* Left hero panel with authentic healthcare image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 bg-slate-950 text-white">
        {/* Background Image with dark healthcare gradient overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/auth_patient_register.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-900/50" />

        {/* Top Brand */}
        <div className="relative z-10">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <BrandLogo width={170} height={62} showName={false} priority />
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md border border-white/20 text-teal-300">
              <ShieldCheck size={13} /> Trusted Family Healthcare
            </span>
          </div>
        </div>

        {/* Bottom Social Proof & Value Props */}
        <div className="relative z-10 max-w-lg space-y-5">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">
              Begin your family&apos;s <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-200 to-blue-200">
                wellness journey today.
              </span>
            </h1>
            <p className="text-slate-200/90 text-sm mt-2 leading-relaxed">
              Create a free account to instantly book top verified doctors, store digital health records, and skip long clinic queues.
            </p>
          </div>

          {/* Quick Value Points */}
          <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-200">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10">
              <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
              <span>4,500+ Verified Doctors</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10">
              <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
              <span>Live Queue Tracking</span>
            </div>
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
              &quot;Booking a pediatric consultation for my child was seamless. We got seen on time without any waiting room stress!&quot;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-xs">
                P
              </div>
              <span className="text-slate-300 text-xs font-semibold">Priya M. • Mother of two</span>
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

        <div className="w-full max-w-md mx-auto my-auto space-y-4">
          {/* Mobile brand image header */}
          <div className="lg:hidden">
            <div className="relative rounded-2xl overflow-hidden h-36 w-full border border-slate-200 dark:border-slate-800 shadow-sm mb-3">
              <img src="/images/auth_patient_register.jpg" alt="Medinex Family Care" className="w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-3.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-teal-300 border border-white/25 w-max">
                  <ShieldCheck size={12} /> Trusted Family Healthcare
                </span>
                <p className="text-white text-xs font-semibold mt-1">
                  Join 250,000+ happy families accessing top medical specialists
                </p>
              </div>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('auth.createAccount')}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t('auth.startManagingHealth')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl text-xs font-medium animate-shake">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleSendOtp} className="space-y-3.5">
            {/* Full Name */}
            {!otpStep && (
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('auth.fullName')}
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-sm sm:text-base shadow-xs"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-sm sm:text-base shadow-xs"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              {!otpStep && (
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('auth.mobileNumber')}
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-sm sm:text-base shadow-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Password */}
            {!otpStep && (
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('auth.createStrongPassword')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-sm sm:text-base shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="w-10 h-10 flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {otpStep && (
              <div className="space-y-1.5">
                <label htmlFor="otp" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('auth.enterOtp')}
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-sm sm:text-base shadow-xs tracking-[0.25em] text-center font-mono"
                />
              </div>
            )}

            {/* Terms */}
            {!otpStep && (
              <div className="flex items-start gap-2.5 pt-1">
                <input type="checkbox" id="terms" required className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-800 cursor-pointer" />
                <label htmlFor="terms" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none leading-relaxed">
                  {t('auth.agreeToTerms')}
                </label>
              </div>
            )}

            {/* Submit Button */}
            {!otpStep && (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[50px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-teal-600/25 dark:shadow-teal-900/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2 uppercase tracking-wider"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t('auth.sendOtp')}</span>
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </>
                )}
              </button>
            )}

            {otpStep && (
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp}
                  className="flex-1 min-h-[50px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-teal-600/25 dark:shadow-teal-900/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {isVerifyingOtp ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>{t('auth.verifyOtp')}</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResendingOtp}
                  className="px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all disabled:opacity-60"
                >
                  {isResendingOtp ? '...' : t('auth.resendOtp')}
                </button>
              </div>
            )}
          </form>

          {/* Login prompt */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-center space-y-3">
            <div className="bg-teal-50/70 dark:bg-teal-950/30 p-3.5 sm:p-4 rounded-2xl border border-teal-100 dark:border-teal-900/50 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('auth.hasAccount')}
              </p>
              <button 
                type="button" 
                onClick={() => {
                  let target = '/login';
                  if (typeof window !== 'undefined') {
                    const r = new URLSearchParams(window.location.search).get('redirect');
                    if (r) target += `?redirect=${encodeURIComponent(r)}`;
                  }
                  router.push(target);
                }} 
                className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 text-white font-bold rounded-xl shadow-xs hover:bg-teal-700 active:scale-95 transition-all text-xs sm:text-sm uppercase tracking-wider"
              >
                {t('auth.login')}
              </button>
            </div>

            <div className="flex justify-center pt-1">
              <button 
                type="button" 
                onClick={() => router.push('/doctor-login')} 
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all shadow-xs active:scale-95"
              >
                {t('auth.doctorLogin')}
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
