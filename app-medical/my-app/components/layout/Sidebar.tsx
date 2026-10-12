"use client";
import React from 'react';
import { Home, Search, Calendar as CalendarIcon, User, Stethoscope, FileText, Sparkles, LogIn } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const Sidebar = () => {
  const { activeVideoCall, currentUser, isLoggedIn } = useAppContext();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Hide sidebar on login, register, doctor-login, admin, doctor-panel, doctor-apply pages, or during an active video call
  if (activeVideoCall || pathname === '/login' || pathname === '/register' || pathname === '/doctor-login' || pathname === '/doctor-apply' || pathname === '/hospital-login' || pathname.startsWith('/admin') || pathname.startsWith('/doctor-panel') || pathname.startsWith('/hospital-admin')) return null;

  const showDoctorApply = mounted && (!isLoggedIn || currentUser?.role !== 'doctor') && pathname !== '/doctor-apply';

  const NavItem = ({ icon, label, href, badge }: any) => {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
      <Link
        href={href}
        onClick={() => {
          const main = document.getElementById('main-content') || document.querySelector('main');
          if (main) {
            main.scrollTo({ top: 0, behavior: isActive ? 'smooth' : 'instant' });
          }
        }}
        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl w-full transition-all group ${
          isActive
            ? 'bg-gradient-to-r from-teal-50 to-blue-50/70 text-teal-700 dark:from-teal-950/50 dark:to-blue-950/40 dark:text-teal-300 font-bold shadow-xs border border-teal-100/80 dark:border-teal-800/40'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-200 font-medium'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1 rounded-lg transition-transform group-hover:scale-110 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {React.cloneElement(icon, { size: 20, className: isActive ? 'stroke-[2.5px]' : 'stroke-2' })}
          </div>
          <span className="text-sm tracking-tight">{label}</span>
        </div>
        {badge && (
          <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs ${
            badge === 'Soon'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
          }`}>
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-r border-gray-100 dark:border-gray-800/80 px-4 py-6 z-40 sticky top-0 shrink-0">
      {/* Brand */}
      <div className="mb-6 px-1">
        <Link 
          href="/" 
          onClick={() => {
            const main = document.getElementById('main-content') || document.querySelector('main');
            if (main) {
              main.scrollTo({ top: 0, behavior: pathname === '/' ? 'smooth' : 'instant' });
            }
          }}
          className="flex items-center justify-center w-full hover:opacity-85 transition-opacity"
        >
          <BrandLogo width={160} height={62} showName={false} priority />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
        <div className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3.5 mb-2">
          Clinical Services
        </div>
        <NavItem href="/" icon={<Home />} label={t('nav.home') || 'Home'} />
        <NavItem href="/search" icon={<Search />} label={t('nav.findDoctors') || 'Find Doctors'} />
        <NavItem href="/appointments" icon={<CalendarIcon />} label={t('nav.appointments') || 'Appointments'} />
        <NavItem href="/blog" icon={<FileText />} label={t('nav.blog') || 'Health Articles'} />
      </nav>

      {/* Footer Profile Nav */}
      <div className={`mt-auto border-t border-gray-100 dark:border-gray-800/80 pt-4 ${showDoctorApply ? 'space-y-3' : ''}`}>
        {mounted && isLoggedIn && currentUser ? (
          <Link
            href="/profile"
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-500 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
              {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-teal-600 dark:text-teal-400 font-medium truncate capitalize">{currentUser.role || 'Patient'}</p>
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-200 text-sm font-bold transition-colors"
          >
            <LogIn size={16} /> Sign In / Register
          </Link>
        )}
        
        {showDoctorApply && (
          <Link 
            href="/doctor-apply"
            className="flex flex-col gap-1.5 p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/70 dark:border-emerald-800/40 rounded-2xl text-emerald-800 dark:text-emerald-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-2 w-full">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs group-hover:scale-110 transition-transform">
                <Stethoscope size={16} />
              </div>
              <span className="text-sm font-extrabold">Are you a Doctor?</span>
            </div>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-medium leading-tight">
              Start your digital practice on Medinex World
            </p>
          </Link>
        )}
      </div>
    </aside>
  );
};
