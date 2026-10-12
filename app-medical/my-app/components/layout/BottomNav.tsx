"use client";
import React from 'react';
import { Home, Search, Calendar as CalendarIcon, FileText, User } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const BottomNav = () => {
  const { activeVideoCall } = useAppContext();
  const { t } = useLanguage();
  const pathname = usePathname();

  // Hide nav on auth/admin/doctor-private screens or while call is active
  if (
    activeVideoCall ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/doctor-login' ||
    pathname === '/doctor-apply' ||
    pathname === '/hospital-login' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/doctor-panel') ||
    pathname.startsWith('/doctor/') ||
    pathname.startsWith('/hospital-admin')
  ) {
    return null;
  }

  const navItems = [
    { href: '/', icon: Home, label: t('bottomNav.home') || t('nav.home') || 'Home' },
    { href: '/search', icon: Search, label: t('bottomNav.search') || 'Doctors' },
    { href: '/appointments', icon: CalendarIcon, label: t('bottomNav.appointments') || 'Bookings' },
    { href: '/blog', icon: FileText, label: t('bottomNav.blog') || t('nav.blog') || 'Blog' },
    { href: '/profile', icon: User, label: t('bottomNav.profile') || 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none">
      <div className="pointer-events-auto px-2 min-[380px]:px-3 pt-1 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] max-w-lg mx-auto">
        <div className="relative overflow-hidden rounded-[1.4rem] border border-slate-200/90 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_-8px_25px_rgba(15,23,42,0.12)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent dark:via-blue-500/50" />
          <div className="flex items-center justify-between px-1 py-1 sm:px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    const main = document.getElementById('main-content') || document.querySelector('main');
                    if (main) {
                      main.scrollTo({ top: 0, behavior: isActive ? 'smooth' : 'instant' });
                    }
                  }}
                  className={`relative flex flex-1 flex-col items-center justify-center min-w-0 rounded-2xl py-1 text-center transition-all duration-200 ${isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                  <div
                    className={`flex h-[28px] px-3 items-center justify-center rounded-full transition-all duration-200 ${isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'bg-transparent'
                      }`}
                  >
                    <Icon size={19} className={isActive ? 'stroke-[2.4px]' : 'stroke-[2px]'} />
                  </div>
                  <span className={`text-[12px] min-[380px]:text-[12.5px] tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full text-center block mt-0.5 ${isActive ? 'font-black' : 'font-bold opacity-90'}`}>
                    {item.label}
                  </span>
                  {isActive && <span className="absolute bottom-0 h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400 shadow-xs" />}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
