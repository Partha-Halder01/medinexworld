
"use client";
import React from 'react';
import { LayoutDashboard, Users, Calendar, ArrowLeft, Stethoscope, ShieldCheck, FileText, MessageSquare, ClipboardList, Settings, Sparkles } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const AdminSidebar = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: t('admin.dashboard') },
    { href: '/admin/appointments', icon: Calendar, label: t('admin.appointments') },
    { href: '/admin/enquiries', icon: ClipboardList, label: 'Enquiries & Follow-up' },
    { href: '/admin/doctors', icon: Stethoscope, label: t('admin.doctors') },
    { href: '/admin/specialties', icon: Sparkles, label: 'Specialties' },
    { href: '/admin/verification', icon: ShieldCheck, label: t('admin.verification') },
    { href: '/admin/users', icon: Users, label: t('admin.users') },
    { href: '/admin/blogs', icon: FileText, label: t('admin.blogs') },
    { href: '/admin/reviews', icon: MessageSquare, label: t('admin.reviews') },
    { href: '/admin/settings', icon: Settings, label: 'Website Settings' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 px-4 py-6 z-40 sticky top-0 shrink-0">
        <Link href="/admin/dashboard" className="flex items-center gap-2 px-2 mb-6 shrink-0 hover:opacity-80 transition-opacity">
          <BrandLogo
            width={160}
            height={62}
            showName={false}
            stacked
            priority={true}
            subtitle={t('admin.panelTitle')}
            subtitleClassName="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400"
          />
        </Link>

        <nav className="flex-1 min-h-0 space-y-1.5 overflow-y-auto overscroll-contain custom-scrollbar -mr-2 pr-2">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 font-medium'
                }`}
              >
                <item.icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-2 shrink-0 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
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
        <div className="overflow-x-auto px-2 py-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex gap-1 min-w-max pb-[2px]">
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[72px] shrink-0 transition-all ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'text-gray-400 dark:text-gray-500 active:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                  <span className={`text-[9px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5 shadow-sm" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
};
