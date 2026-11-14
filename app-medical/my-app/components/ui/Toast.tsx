"use client";
import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

export const Toast = () => {
  const { toast, setToast } = useAppContext();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  if (!toast) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto max-w-[92vw] sm:max-w-md w-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-white text-xs sm:text-sm font-bold backdrop-blur-md ${
        toast.type === 'success' 
          ? 'bg-emerald-600/95 border-emerald-400/50 shadow-emerald-950/40 ring-2 ring-emerald-400/30' 
          : 'bg-rose-600/95 border-rose-400/50 shadow-rose-950/50 ring-2 ring-rose-400/30'
      }`}>
        {toast.type === 'success' ? (
          <CheckCircle size={20} className="shrink-0 text-white" />
        ) : (
          <AlertTriangle size={20} className="shrink-0 text-white animate-pulse" />
        )}
        <span className="leading-snug break-words">{toast.message}</span>
        <button
          type="button"
          onClick={() => setToast(null)}
          className="ml-2 -mr-1 p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors shrink-0"
          title="Dismiss notification"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
