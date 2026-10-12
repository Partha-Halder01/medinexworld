"use client";
import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { VideoCallScreen } from '@/components/screens/VideoCallScreen';
import { Toast } from '@/components/ui/Toast';
import { HelpPopup } from '@/components/ui/HelpPopup';
import { ShieldAlert, PhoneCall, Navigation } from 'lucide-react';
import { usePathname } from 'next/navigation';

export const GlobalComponents = () => {
  const { activeVideoCall, showToast, currentUser } = useAppContext();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [locationName, setLocationName] = useState('');
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Hide global theme toggle and emergency bar on panels that have their own controls
  const isDoctorPanel = pathname.startsWith('/doctor-panel');
  const isAdminPanel = pathname.startsWith('/admin');
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/doctor-login';
  const isDoctorApply = pathname === '/doctor-apply';
  const isCheckout = pathname.startsWith('/checkout');
  const isUserPanelPage = pathname.startsWith('/hospital') || pathname.startsWith('/search') || pathname.startsWith('/appointments') || pathname.startsWith('/profile');
  const isSpecialPanel = isDoctorPanel || isAdminPanel || isAuthPage || isDoctorApply || isCheckout || isUserPanelPage;

  const coords = useMemo(() => {
    const userLat = currentUser?.location?.lat;
    const userLng = currentUser?.location?.lng;
    if (typeof userLat === 'number' && Number.isFinite(userLat) && typeof userLng === 'number' && Number.isFinite(userLng)) {
      return { lat: userLat, lng: userLng };
    }
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('aurahealth_guest_location');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { lat?: number; lng?: number };
      if (typeof parsed.lat === 'number' && Number.isFinite(parsed.lat) && typeof parsed.lng === 'number' && Number.isFinite(parsed.lng)) {
        return { lat: parsed.lat, lng: parsed.lng };
      }
    } catch {
      return null;
    }
    return null;
  }, [currentUser?.location?.lat, currentUser?.location?.lng]);

  const coordsLabel = coords ? `${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}` : '';

  useEffect(() => {
    let cancelled = false;

    const loadLocationName = async () => {
      if (!coords) {
        if (!cancelled) setLocationName('');
        return;
      }

      const cacheKey = `aurahealth_geo_name_${coords.lat.toFixed(3)}_${coords.lng.toFixed(3)}`;
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          if (!cancelled) setLocationName(cached);
          return;
        }
      }

      try {
        const res = await fetch(`/api/location/reverse?lat=${coords.lat}&lng=${coords.lng}`);
        const data = await res.json();
        const shortName = typeof data?.shortName === 'string' ? data.shortName.trim() : '';
        if (!cancelled) {
          setLocationName(shortName);
        }
        if (shortName && typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, shortName);
        }
      } catch {
        if (!cancelled) setLocationName('');
      }
    };

    void loadLocationName();
    return () => {
      cancelled = true;
    };
  }, [coords]);

  const locationLabel = locationName || coordsLabel;

  return (
    <>
      <Toast />
      {activeVideoCall && <VideoCallScreen />}

      {/* Location Badge — hidden on doctor/admin panels */}
      {!activeVideoCall && !isSpecialPanel && isHydrated && Boolean(locationLabel) && (
        <div className="hidden md:flex fixed top-6 right-8 z-50 gap-2 items-center">
          <div
            className="flex items-center gap-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold px-3.5 py-2 rounded-full shadow-md border border-gray-100 dark:border-gray-700 text-xs max-w-[190px]"
            title={locationLabel}
          >
            <Navigation size={14} className="text-teal-600 dark:text-teal-400" />
            <span className="truncate">{locationLabel}</span>
          </div>
        </div>
      )}

      {/* Help Popup — on patient-facing pages */}
      {!activeVideoCall && !isSpecialPanel && <HelpPopup />}

      {/* Emergency Header Bar — only on patient-facing mobile pages (HIDDEN per user request) */}
      {/* 
      {!activeVideoCall && !isSpecialPanel && (
        <div className="md:hidden bg-red-50 dark:bg-red-900/30 px-4 py-2.5 flex justify-between items-center border-b border-red-100 dark:border-red-900/50 shrink-0 z-10 w-full transition-colors">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wide">
            <ShieldAlert size={16} /> {t('common.emergencyHelp')}
          </div>
          <button onClick={() => showToast("Dialing Emergency Services 112... (Demo)", "success")} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
            <PhoneCall size={14} /> {t('common.call112')}
          </button>
        </div>
      )}
      */}
    </>
  );
};
