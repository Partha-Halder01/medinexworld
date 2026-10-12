"use client";
import React from 'react';
import { LayoutDashboard, Calendar, UserCircle, ArrowLeft, Wallet, Building2 } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const DoctorSidebar = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { href: '/doctor-panel', icon: LayoutDashboard, label: t('doctorPanel.dashboard') },
    { href: '/doctor-panel/appointments', icon: Calendar, label: t('doctorPanel.appointments') },
    { href: '/doctor-panel/chambers', icon: Building2, label: 'Chambers' },
    { href: '/doctor-panel/wallet', icon: Wallet, label: 'Earnings' },
    { href: '/doctor-panel/profile', icon: UserCircle, label: t('doctorPanel.profile') },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 px-4 py-6 z-40 sticky top-0 shrink-0">
        <Link href="/doctor-panel" className="flex items-center gap-2 px-2 mb-10 hover:opacity-80 transition-opacity">
          <BrandLogo
            width={160}
            height={62}
            showName={false}
            stacked
            subtitle={t('doctorPanel.panelTitle')}
            subtitleClassName="text-[10px] uppercase tracking-widest font-bold text-teal-600 dark:text-teal-400"
          />
        </Link>

        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-all text-left ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 font-medium'
                }`}
              >
                <item.icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-gray-100 dark:border-gray-800 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 font-medium transition-all text-sm"
          >
            <ArrowLeft size={22} className="stroke-2" />
            {t('admin.backToApp')}
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around px-1 py-1.5">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl min-w-[52px] transition-all ${
                  isActive
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-gray-400 dark:text-gray-500 active:text-gray-600'
                }`}
              >
                <item.icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-teal-600 dark:bg-teal-400 mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
};
