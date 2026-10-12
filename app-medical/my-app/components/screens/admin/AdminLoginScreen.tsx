"use client";
import React, { useState } from 'react';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { DevQuickLogin } from '@/components/ui/DevQuickLogin';

export const AdminLoginScreen = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { login, showToast, logout } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return showToast(t('adminLogin.errorEmptyFields'), 'error');
    
    setLoading(true);
    try {
      // login with role: 'admin' to use env-based authentication
      let res = await login(email, password, 'admin');
      
      if (res.success) {
        // Immediately check localStorage state to verify role
        const userData = localStorage.getItem('aurahealth_user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.role === 'admin') {
            showToast(t('adminLogin.welcomeMessage'), 'success');
            router.push('/admin/dashboard');
          } else {
            logout();
            showToast(t('adminLogin.accessDenied'), 'error');
            setLoading(false);
          }
        }
      } else {
        showToast(res.error || t('adminLogin.invalidCredentials'), 'error');
        setLoading(false);
      }
    } catch (error) {
      showToast(t('adminLogin.loginFailed'), 'error');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-br from-emerald-600 to-emerald-800 -skew-y-3 origin-top-left -z-10 shadow-xl opacity-90 dark:opacity-40"></div>
      
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 mx-auto transform transition-all duration-300 hover:shadow-3xl animate-fade-in-up">
        
        <div className="p-6 pb-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-750 text-center border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-center mb-3">
            <BrandLogo width={150} height={58} showName={false} priority />
          </div>
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/30">
            <Shield size={20} />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{t('adminLogin.title')}</h2>
          <p className="text-emerald-700 dark:text-emerald-400 font-medium text-xs mt-0.5 uppercase tracking-wider">{t('adminLogin.authorizedOnly')}</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">{t('adminLogin.emailLabel')}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium text-sm" 
                  placeholder="admin@medinex.in"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('adminLogin.passwordLabel')}</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium text-sm" 
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/20 text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all active:scale-[0.98] mt-2 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? t('adminLogin.authenticating') : t('adminLogin.signInButton')}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            </button>
          </form>

          <DevQuickLogin
            role="admin"
            disabled={loading}
            onFill={(e, p) => { setEmail(e); setPassword(p); }}
            className="mt-4"
          />
        </div>
      </div>
    </div>
  );
};
