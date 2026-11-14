"use client";
import Link from 'next/link';
import { Building2, Stethoscope } from 'lucide-react';

/** "Doctors | Clinics" switch shown at the top of /search and /clinics. */
export function BrowseModeToggle({ active }: { active: 'doctors' | 'clinics' }) {
  const items = [
    { key: 'doctors', href: '/search', label: 'Doctors', icon: Stethoscope },
    { key: 'clinics', href: '/clinics', label: 'Clinics & Hospitals', icon: Building2 },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-white dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700 shadow-xs w-full sm:w-auto sm:inline-grid">
      {items.map(({ key, href, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <Link
            key={key}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              isActive
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700/60'
            }`}
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
