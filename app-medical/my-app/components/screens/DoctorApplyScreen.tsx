"use client";
import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Phone, Briefcase, ArrowRight, Eye, EyeOff, Camera, FileText, CheckCircle2, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/context/LanguageContext';
import { useAppContext } from '@/app/context/AppContext';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const DoctorApplyScreen = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useAppContext();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('General Physician');
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  const [fee, setFee] = useState('');
  const [image, setImage] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    fetch('/api/specialties')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.specialties) && data.specialties.length > 0) {
          setAvailableSpecialties(data.specialties);
          if (!data.specialties.includes(specialty)) {
            setSpecialty(data.specialties[0]);
          }
        }
      })
      .catch(err => console.error('Failed to load specialties for apply screen:', err));
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (success && countdown === 0) {
      router.push('/doctor-login');
    }
    return () => clearTimeout(timer);
  }, [success, countdown, router]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) { // 1.5MB limit
        setError(t('doctorApply.fileTooLarge'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name || !email || !password || !specialty || !fee || !image || !certificateUrl) {
      setError(t('doctorApply.errorAllFields'));
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('doctorApply.errorPasswordLength'));
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          specialty,
          fee: Number(fee),
          image,
          certificateUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('doctorApply.errorSubmission'));
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || t('doctorApply.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 overflow-hidden">
        <div className="max-w-md w-full text-center bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-700">
          <div className="flex flex-col items-center">
            {/* Success Icon Animation Container */}
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              {/* Pulsing Outer Glow */}
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-40" />
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full scale-150 blur-2xl opacity-50" />
              
              {/* Main Icon Circle */}
              <div className="relative z-10 w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce-short">
                <CheckCircle2 size={40} strokeWidth={2.5} className="drop-shadow-sm" />
              </div>

              {/* Decorative Spinning Ring */}
              <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500/10 border-t-emerald-500 animate-spin duration-[2500ms]" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {t('doctorApply.successTitle')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[9px]">
                {t('doctorApply.successSubtitle')}
              </p>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 py-3 px-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                <p className="text-emerald-700 dark:text-emerald-400 font-medium text-xs leading-relaxed">
                  {t('doctorApply.successMessage')}
                </p>
              </div>
            </div>

            <div className="w-full mt-8 space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-1000 ease-linear shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                    style={{ width: `${(countdown / 5) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                  {t('doctorApply.redirectingIn')} <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">{countdown}s</span>
                </p>
              </div>

              <button
                onClick={() => router.push('/doctor-login')}
                className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-[1.25rem] transition-all shadow-xl shadow-emerald-500/30 dark:shadow-none active:scale-[0.97] group flex items-center justify-center gap-2"
              >
                <span>{t('doctorApply.loginNow')}</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950 items-center justify-center py-6 px-4 sm:px-6 relative overflow-hidden">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row h-full max-h-[640px]">
        
        {/* Authentic Doctor Side Panel (Desktop) */}
        <div className="hidden md:flex md:w-[36%] relative overflow-hidden flex-col justify-between p-7 text-white">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/auth_doctor_login.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-teal-950/80 to-slate-950/60" />
          
          <div className="relative z-10">
            <BrandLogo width={120} height={50} showName={false} priority />
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-md border border-white/20 text-emerald-300">
              <CheckCircle2 size={13} /> Doctor Partner Registration
            </div>
          </div>
          
          <div className="relative z-10 space-y-3">
            <h3 className="text-xl font-black leading-tight text-white">
              Expand your reach with India&apos;s leading healthcare platform.
            </h3>
            <p className="text-slate-200/90 text-xs leading-relaxed">
              Join 4,500+ verified medical specialists providing digital prescriptions and OPD consultations.
            </p>
            <div className="space-y-1.5 text-[11px] text-emerald-200">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Zero setup fee & instant digital clinic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Smart EHR & verified patient records</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-[9px] text-slate-300/80 font-bold uppercase tracking-widest pt-2 border-t border-white/15">
            Medinex Verified Healthcare Provider
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Mobile brand image header */}
          <div className="md:hidden mb-4">
            <div className="relative rounded-2xl overflow-hidden h-28 w-full border border-slate-200 dark:border-slate-700 shadow-xs">
              <img src="/images/auth_doctor_login.jpg" alt="Doctor Partner Registration" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex items-end p-3">
                <BrandLogo width={100} height={40} showName={false} />
              </div>
            </div>
          </div>

          <div className="mb-5 text-center md:text-left">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
              {t('doctorApply.title')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {t('doctorApply.subtitle')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl text-xs font-bold mb-4 animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">{t('doctorApply.fullName')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                    placeholder="Dr. John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">{t('doctorApply.email')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                    placeholder="doctor@medinex.in"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">{t('doctorApply.phone')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Specialty */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">{t('doctorApply.specialty')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                    <Briefcase size={18} />
                  </div>
                  <div className="relative">
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="block w-full pl-11 pr-10 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm sm:text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer shadow-xs"
                      required
                    >
                      {availableSpecialties.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">{t('doctorApply.fee')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-bold group-focus-within:text-emerald-500 transition-colors">
                    <span className="text-base">₹</span>
                  </div>
                  <input
                    type="number"
                    required
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                    placeholder="500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">{t('doctorApply.password')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-11 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Profile Picture Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">{t('doctorApply.profilePicture')}</label>
                <div 
                  className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer group ${image ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-emerald-400 hover:bg-emerald-50/30'}`}
                  onClick={() => document.getElementById('profile-upload')?.click()}
                >
                  <input 
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setImage)}
                  />
                  {image ? (
                    <img src={image} alt="Profile" className="w-12 h-12 rounded-full object-cover mb-1.5 ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900" />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-400 mb-1.5 group-hover:text-emerald-500 transition-colors" />
                  )}
                  <span className="text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{image ? t('doctorApply.changePhoto') : t('doctorApply.uploadPhoto')}</span>
                </div>
              </div>

              {/* Certificate Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1">{t('doctorApply.medicalCertificate')}</label>
                <div 
                  className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer group ${certificateUrl ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-emerald-400 hover:bg-emerald-50/30'}`}
                  onClick={() => document.getElementById('cert-upload')?.click()}
                >
                  <input 
                    id="cert-upload"
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setCertificateUrl)}
                  />
                  {certificateUrl ? (
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-1.5 text-emerald-600 ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 overflow-hidden">
                      {certificateUrl.startsWith('data:image/') ? (
                        <img src={certificateUrl} alt="Certificate" className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-6 h-6" />
                      )}
                    </div>
                  ) : (
                    <FileText className="w-8 h-8 text-gray-400 mb-1.5 group-hover:text-emerald-500 transition-colors" />
                  )}
                  <span className="text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{certificateUrl ? t('doctorApply.changeFile') : t('doctorApply.uploadFile')}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[50px] flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-teal-600/25 dark:shadow-teal-900/40 mt-4 group active:scale-95"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('doctorApply.applyNow')}
                  <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-6 font-medium">
            {t('doctorApply.alreadyHaveAccount')}{' '}
            <button
              onClick={() => router.push('/doctor-login')}
              className="font-black text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              {t('doctorApply.logInHere')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
