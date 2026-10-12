"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type Doctor = any;
type Appointment = any;
type ToastMessage = { message: string; type: "success" | "error" } | null;
type AuthRole = 'patient' | 'doctor';

type UserInfo = { _id: string; name: string; email: string; phone?: string; role: string; specialty?: string; location?: { lat: number; lng: number } | null } | null;

export interface SiteSettings {
  supportEmail: string;
  supportPhone: string;
  emergencyPhone: string;
  contactAddress?: string;
  gstPercent?: number;
  discountAmount?: number;
  defaultPlatformFeePercent?: number;
  chamberBookingFee?: number;
}

interface AppContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isAuthReady: boolean;
  isLoggedIn: boolean;
  currentUser: UserInfo;
  login: (email: string, password: string, role?: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginDoctor: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginWithOtp: (email: string, otp: string, role: AuthRole, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  activeVideoCall: Doctor | null;
  setActiveVideoCall: (doctor: Doctor | null) => void;
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
  fetchAppointments: () => Promise<void>;
  toast: ToastMessage;
  setToast: (toast: ToastMessage) => void;
  showToast: (message: string, type?: "success" | "error") => void;
  aiPreFillSymptoms: string;
  setAiPreFillSymptoms: (symptoms: string) => void;
  searchFilter: string;
  setSearchFilter: (filter: string) => void;
  handleCategoryClick: (category: string) => void;
  handleBookAppointment: (doctor: Doctor, slot: string, date: string, type: 'clinic'|'video', chamber?: ChamberBooking) => Promise<void>;
  startInstantCall: (doctor: Doctor) => void;
  endVideoCall: () => void;
  siteSettings: SiteSettings;
  fetchSiteSettings: () => Promise<void>;
}

export type ChamberBooking = { chamberId: number; visitDate: string };

const AppContext = createContext<AppContextType | undefined>(undefined);
// Accepts numeric MySQL ids (number or numeric string) as well as legacy 24-char Mongo ids.
const isValidEntityId = (value: unknown): boolean =>
  (typeof value === 'number' && Number.isInteger(value) && value > 0) ||
  (typeof value === 'string' && (/^[1-9]\d*$/.test(value) || /^[a-f\d]{24}$/i.test(value)));

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo>(null);
  const [activeVideoCall, setActiveVideoCall] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [toast, setToast] = useState<ToastMessage>(null);
  const [aiPreFillSymptoms, setAiPreFillSymptoms] = useState('');
  const [searchFilter, setSearchFilter] = useState('All');
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    supportEmail: 'support@medinexworld.com',
    supportPhone: '+91 98765 43210',
    emergencyPhone: '112',
    contactAddress: '',
  });

  const writeAuthUser = (user: UserInfo, storageType: 'local' | 'session') => {
    if (!user) return;
    const value = JSON.stringify(user);
    if (storageType === 'local') {
      localStorage.setItem('aurahealth_user', value);
      sessionStorage.removeItem('aurahealth_user');
    } else {
      sessionStorage.setItem('aurahealth_user', value);
      localStorage.removeItem('aurahealth_user');
    }
  };

  const clearAuthUser = () => {
    localStorage.removeItem('aurahealth_user');
    sessionStorage.removeItem('aurahealth_user');
  };

  // Hydrate auth state from storage on mount & enforce light mode
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.removeItem('theme');
      } catch {}
    }
    try {
      const localStored = localStorage.getItem('aurahealth_user');
      const sessionStored = sessionStorage.getItem('aurahealth_user');
      const storageType: 'local' | 'session' = localStored ? 'local' : 'session';
      const stored = localStored || sessionStored;
      if (stored) {
        const parsed = JSON.parse(stored) as UserInfo;
        setIsLoggedIn(true);
        setCurrentUser(parsed);
      }
    } catch {
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  // Fetch appointments when user logs in
  useEffect(() => {
    if (isLoggedIn && currentUser?._id) {
      fetchAppointments();
    }
  }, [isLoggedIn, currentUser?._id]);

  // Capture GPS and save to DB + localStorage (silent — no error thrown to user)
  const captureAndSaveLocation = async (userId: string, role: string) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          await fetch('/api/location', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, role, lat, lng }),
          });
          // Update stored user with location
          setCurrentUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, location: { lat, lng } };
            const storageType: 'local' | 'session' =
              sessionStorage.getItem('aurahealth_user') ? 'session' : 'local';
            writeAuthUser(updated, storageType);
            return updated;
          });
        } catch {}
      },
      () => {}, // user denied — silently ignore
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const register = async (name: string, email: string, phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const login = async (email: string, password: string, role: string = 'patient', rememberMe: boolean = true): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed.' };
      }

      setIsLoggedIn(true);
      setCurrentUser(data);
      writeAuthUser(data, rememberMe ? 'local' : 'session');
      if (data._id !== 'admin_id_from_env') {
        captureAndSaveLocation(data._id, role);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const loginDoctor = async (email: string, password: string, rememberMe: boolean = true): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'doctor' }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed.' };
      }

      setIsLoggedIn(true);
      setCurrentUser(data);
      writeAuthUser(data, rememberMe ? 'local' : 'session');
      captureAndSaveLocation(data._id, 'doctor');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const loginWithOtp = async (
    email: string,
    otp: string,
    role: AuthRole,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'OTP login failed.' };
      }

      setIsLoggedIn(true);
      setCurrentUser(data);
      writeAuthUser(data, rememberMe ? 'local' : 'session');
      captureAndSaveLocation(data._id, role);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'OTP login failed.' };
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setAppointments([]);
    clearAuthUser();
  };

  // Handle Theme Toggle (Dark Mode permanently disabled)
  const setTheme = () => {
    setThemeState('light');
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => setToast({ message, type });

  const getConsultPriceWithPlatform = (doctor: Doctor, consultType: 'clinic'|'video') => {
    const rawBase = consultType === 'video'
      ? (doctor?.videoFee ?? doctor?.fee ?? 0)
      : (doctor?.fee ?? 0);
    const base = Number(rawBase) || 0;
    const platformFeePercent = Math.min(100, Math.max(0, Number(doctor?.platformFeePercent) || 0));
    return Math.round(base * (1 + platformFeePercent / 100));
  };

  const fetchAppointments = async () => {
    if (!currentUser?._id) return;
    if (currentUser.role !== 'patient' && currentUser.role !== 'doctor') return;
    if (!isValidEntityId(currentUser._id)) return;
    try {
      const param = currentUser.role === 'doctor' ? `doctorId=${currentUser._id}` : `patientId=${currentUser._id}`;
      const res = await fetch(`/api/appointments?${param}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    }
  };

  const handleBookAppointment = async (doctor: Doctor, slot: string, date: string, consultType: 'clinic'|'video', chamber?: ChamberBooking) => {
    if (!currentUser?._id) {
      showToast('Please log in to book an appointment.', 'error');
      const redirectPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }
    if (currentUser.role !== 'patient') {
      showToast('Please log in with a patient account to book an appointment.', 'error');
      return;
    }
    if (!isValidEntityId(currentUser._id)) {
      showToast('Invalid patient account ID. Please log out and log in again.', 'error');
      return;
    }
    if (!isValidEntityId(doctor?._id)) {
      showToast('Doctor profile is invalid. Please refresh and try again.', 'error');
      return;
    }

    try {
      const price = getConsultPriceWithPlatform(doctor, consultType);
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentUser._id,
          doctorId: doctor._id,
          slot,
          date,
          type: consultType,
          price: price || 0,
          ...(chamber ? { chamberId: chamber.chamberId, visitDate: chamber.visitDate } : {}),
        }),
      });

      if (res.ok) {
        const newApt = await res.json();
        showToast('Redirecting to checkout...');
        router.push(`/checkout/${newApt._id}`);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to book appointment.', 'error');
      }
    } catch {
      showToast('Failed to book appointment.', 'error');
    }
  };

  const handleCategoryClick = (category: string) => {
    setSearchFilter(category);
  };

  const startInstantCall = (doctor: Doctor) => {
    setActiveVideoCall(doctor);
  };

  const endVideoCall = () => {
    setActiveVideoCall(null);
    showToast("Video consultation ended.", "success");
  };

  const fetchSiteSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSiteSettings({
          supportEmail: data.supportEmail || 'support@medinexworld.com',
          supportPhone: data.supportPhone || '+91 98765 43210',
          emergencyPhone: data.emergencyPhone || '112',
          contactAddress: data.contactAddress || '',
          gstPercent: data.gstPercent,
          discountAmount: data.discountAmount,
          defaultPlatformFeePercent: data.defaultPlatformFeePercent,
          chamberBookingFee: data.chamberBookingFee,
        });
      }
    } catch { }
  };

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  return (
    <AppContext.Provider value={{
      theme, setTheme,
      isAuthReady,
      isLoggedIn, currentUser, login, loginDoctor, loginWithOtp, register, logout,
      activeVideoCall, setActiveVideoCall,
      appointments, setAppointments, fetchAppointments,
      toast, setToast, showToast,
      aiPreFillSymptoms, setAiPreFillSymptoms,
      searchFilter, setSearchFilter,
      handleCategoryClick, handleBookAppointment,
      startInstantCall, endVideoCall,
      siteSettings, fetchSiteSettings
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
