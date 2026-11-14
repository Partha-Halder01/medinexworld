"use client";
import React from 'react';
import { PhoneCall } from 'lucide-react';

export const WhatsAppButton = () => {
  return (
    <aside aria-label="Support and WhatsApp contact" className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-40 flex items-center gap-2">
      <a
        href="https://wa.me/918145522359?text=Hello%20Medinex%20World%2C%20I%20need%20assistance"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full shadow-lg shadow-emerald-600/30 transition-all border-2 border-white dark:border-slate-800"
        title="Chat on WhatsApp: +91 81455 22359"
      >
        <svg className="w-5 h-5 sm:w-5 sm:h-5 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.155.57 4.18 1.572 5.928l-1.672 6.104 6.27-1.644c1.704.939 3.655 1.472 5.83 1.472 6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
        </svg>
        <span className="text-xs sm:text-sm font-extrabold tracking-tight">
          WhatsApp <span className="hidden sm:inline font-semibold opacity-95">· 8145522359</span>
        </span>
      </a>

      <a
        href="tel:8145522359"
        className="hidden md:inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold px-3 py-2.5 rounded-full shadow-md border border-slate-200 dark:border-slate-700 text-xs transition-all"
        title="Call Helpline: 8145522359"
      >
        <PhoneCall size={14} className="text-teal-600 dark:text-teal-400" />
        <span>8145522359</span>
      </a>
    </aside>
  );
};
