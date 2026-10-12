"use client";
import React from 'react';
import { flushSync } from 'react-dom';
import { Zap } from 'lucide-react';

export type DevLoginRole = 'patient' | 'doctor' | 'hospital' | 'admin';

type DummyAccount = { label: string; email: string; password: string };

// Seeded test accounts (see CREDENTIALS.md / scripts/seed.ts).
// The condition is evaluated at build time, so none of this ships in a production bundle.
const ACCOUNTS: Record<DevLoginRole, DummyAccount[]> =
  process.env.NODE_ENV === 'production'
    ? { patient: [], doctor: [], hospital: [], admin: [] }
    : {
        patient: [{ label: 'Dummy Patient', email: 'demo@nbms.in', password: 'password123' }],
        doctor: [
          { label: 'Dr. Sarah Jenkins', email: 'doctor1@nbms.in', password: 'password123' },
          { label: 'Dr. Rajesh Kumar', email: 'doctor2@nbms.in', password: 'password123' },
        ],
        hospital: [{ label: 'Dummy Hospital', email: 'hospital@medinex.in', password: 'password123' }],
        admin: [{ label: 'Dummy Admin', email: 'admin@medinexworld.com', password: 'password123' }],
      };

/**
 * Testing-only shortcut: fills the page's login form with a seeded account and submits it,
 * so the page's own login + redirect logic runs exactly as for a real sign-in.
 * Renders nothing in production builds.
 */
export function DevQuickLogin({
  role,
  onFill,
  disabled,
  className = '',
}: {
  role: DevLoginRole;
  onFill: (email: string, password: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const accounts = ACCOUNTS[role];
  if (process.env.NODE_ENV === 'production' || accounts.length === 0) return null;

  const run = (account: DummyAccount, button: HTMLButtonElement) => {
    // Locate the form before the state update re-renders the page.
    const form = (button.closest('form') ?? document.querySelector('form')) as HTMLFormElement | null;
    flushSync(() => onFill(account.email, account.password));
    form?.requestSubmit();
  };

  return (
    <div className={`rounded-2xl border-2 border-dashed border-amber-400/70 bg-amber-50/70 dark:bg-amber-900/10 p-3 ${className}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
        <Zap size={12} /> Testing only — one-click dummy login
      </p>
      <div className="flex flex-wrap gap-2">
        {accounts.map(account => (
          <button
            key={account.email}
            type="button"
            disabled={disabled}
            onClick={e => run(account, e.currentTarget)}
            className="flex-1 min-w-[140px] px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-extrabold transition-colors active:scale-[0.98]"
          >
            {account.label}
            <span className="block text-[10px] font-semibold opacity-90 truncate">{account.email}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
