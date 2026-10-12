"use client";
import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

export const Toast = () => {
  const { toast, setToast } = useAppContext();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  if (!toast) return null;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium animate-fade-in-down ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      {toast.message}
    </div>
  );
};
