"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Siren, 
  MapPin, 
  LocateFixed, 
  Clock, 
  CheckCircle2, 
  User, 
  Phone, 
  AlertTriangle, 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  Plane,
  HeartPulse
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useRouter } from 'next/navigation';

interface AmbulanceEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AMBULANCE_TYPES = [
  { 
    id: 'Normal Ambulance', 
    letter: 'a',
    label: 'Normal Ambulance', 
    desc: 'Oxygen cylinder, stretcher & paramedic for standard emergency and patient transfers',
    tag: 'Standard Life Support',
    icon: Siren,
  },
  { 
    id: 'ICU Ambulance', 
    letter: 'b',
    label: 'ICU Ambulance', 
    desc: 'Ventilator, cardiac monitor, infusion pump & critical care doctor/nurse team',
    tag: 'Advanced Life Support (ALS)',
    icon: HeartPulse,
  },
  { 
    id: 'Air Ambulance', 
    letter: 'c',
    label: 'Air Ambulance', 
    desc: 'Emergency aeromedical flights & helicopter evacuation for long-distance rapid medical transfers',
    tag: 'Aero-Medical Evacuation',
    icon: Plane,
  },
];

export const AmbulanceEnquiryModal: React.FC<AmbulanceEnquiryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, showToast } = useAppContext();
  const router = useRouter();

  const [urgency, setUrgency] = useState<'emergency' | 'scheduled'>('emergency');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [ambulanceType, setAmbulanceType] = useState('Normal Ambulance');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropAddress, setDropAddress] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [patientCondition, setPatientCondition] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Lock background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Autofill user details
  useEffect(() => {
    if (currentUser) {
      if (!patientName) setPatientName(currentUser.name || '');
      if (!patientPhone && (currentUser as any).phone) setPatientPhone((currentUser as any).phone);
      if (!patientEmail && currentUser.email) setPatientEmail(currentUser.email);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleFetchCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPickupCoords({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
            headers: { 'Accept-Language': 'en' },
          });
          const data = await res.json();
          const road = data.address?.road || '';
          const suburb = data.address?.suburb || data.address?.neighbourhood || '';
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          const resolved = [road, suburb, city].filter(Boolean).join(', ') || data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setPickupAddress(resolved);
          showToast('Pickup location set from GPS!', 'success');
        } catch {
          setPickupAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        showToast(err.code === 1 ? 'Location permission denied' : 'Could not fetch GPS location', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast('Please enter patient or caller name', 'error');
      return;
    }
    if (!patientPhone.trim() || patientPhone.trim().length < 8) {
      showToast('Please enter a valid phone number for driver contact', 'error');
      return;
    }
    if (!pickupAddress.trim()) {
      showToast('Please enter pickup location address', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userId: currentUser?._id || null,
        type: 'ambulance',
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail.trim() || null,
        ambulanceType,
        pickupAddress: pickupAddress.trim(),
        pickupLat: pickupCoords?.lat || null,
        pickupLng: pickupCoords?.lng || null,
        dropAddress: dropAddress.trim() || null,
        urgency,
        scheduledTime: urgency === 'scheduled' ? scheduledTime : null,
        patientCondition: patientCondition.trim() || null,
      };

      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to submit ambulance request', 'error');
        return;
      }

      setIsSubmitted(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('guest_enquiry_phone', patientPhone.trim());
      }
      showToast('Ambulance enquiry submitted! Our dispatch coordinator will call you right away.', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setPickupAddress('');
    setDropAddress('');
    setPatientCondition('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={handleReset}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-red-200/80 dark:border-red-900/60 overflow-hidden my-auto max-h-[88dvh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Emergency Red gradient */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center animate-pulse">
              <Siren className="text-white" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Ambulance Service & Booking</h3>
                <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full tracking-wider">24/7 Rapid</span>
              </div>
              <p className="text-xs text-rose-100 font-medium">GPS-tracked emergency & scheduled transfers</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 pb-8 sm:pb-6 overflow-y-auto space-y-4 flex-1">
          {isSubmitted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Ambulance Request Logged!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Our emergency dispatch officer is prioritizing your pickup at <span className="font-semibold text-slate-800 dark:text-slate-200">{pickupAddress}</span>. We will call you immediately at <span className="font-semibold text-slate-800 dark:text-slate-200">{patientPhone}</span> with driver ETA.
                </p>
              </div>

              <div className="p-3.5 bg-red-50/70 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/50 text-left space-y-2">
                <div>
                  <p className="text-xs font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-red-600 dark:text-red-400" /> Immediate Emergency Assistance
                  </p>
                  <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">
                    Need urgent dispatch or want to speak to the control room directly?
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="tel:8145522359"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-xs hover:bg-red-700"
                  >
                    <Phone size={12} /> Call 8145522359
                  </a>
                  <a
                    href="https://wa.me/918145522359?text=URGENT%3A%20Ambulance%20Dispatch%20for%20pickup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700"
                  >
                    WhatsApp Support
                  </a>
                </div>
                <button
                  onClick={() => {
                    handleReset();
                    router.push(`/profile/enquiries?phone=${encodeURIComponent(patientPhone.trim())}`);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300 hover:underline"
                >
                  Track Follow-up Live <ArrowRight size={13} />
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                >
                  Close & Await Call
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Urgency selector tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setUrgency('emergency')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    urgency === 'emergency'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ShieldAlert size={14} /> Immediate Emergency
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency('scheduled')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    urgency === 'scheduled'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Clock size={14} /> Planned Transfer
                </button>
              </div>

              {/* Patient / Caller info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Patient / Caller Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Ramesh Chandra"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="+91 81455 22359"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Ambulance Category Selection - 3 Core Ambulance Services */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Select Ambulance Service <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">3 Available Services</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {AMBULANCE_TYPES.map((type) => {
                    const isSelected = ambulanceType === type.id;
                    const IconComp = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setAmbulanceType(type.id)}
                        className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-red-500 bg-red-50/80 dark:bg-red-950/40 text-red-900 dark:text-red-200 ring-2 ring-red-500 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black uppercase ${
                              isSelected ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {type.letter}
                            </span>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                              <IconComp size={15} />
                            </div>
                          </div>
                          <p className="text-sm font-extrabold leading-tight text-slate-900 dark:text-white">
                            {type.label}
                          </p>
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 ${
                            isSelected ? 'bg-red-200/80 dark:bg-red-900/60 text-red-900 dark:text-red-200' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}>
                            {type.tag}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                            {type.desc}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="mt-2.5 pt-2 border-t border-red-200/60 dark:border-red-900/40 flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                            <CheckCircle2 size={13} />
                            <span>Selected</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pickup Address + GPS Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Pickup Location / Address <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchCurrentLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
                  >
                    {isLocating ? (
                      <>
                        <div className="w-3.5 h-3.5 border border-red-500 border-t-transparent rounded-full animate-spin" />
                        Locating GPS...
                      </>
                    ) : (
                      <>
                        <LocateFixed size={14} />
                        Use My GPS Location
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3.5 text-red-500 shrink-0" />
                  <textarea
                    rows={2}
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Enter house/building, street, landmark, and area..."
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden resize-none"
                  />
                </div>
              </div>

              {/* Destination Hospital Address */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Drop Location / Target Hospital <span className="text-slate-400 font-normal lowercase">(or nearest hospital)</span>
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={dropAddress}
                    onChange={(e) => setDropAddress(e.target.value)}
                    placeholder="e.g. City General Hospital or nearest multi-specialty"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Scheduled Time if applicable */}
              {urgency === 'scheduled' && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Scheduled Date & Time
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="datetime-local"
                      required={urgency === 'scheduled'}
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Patient Condition / Needs */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Patient Condition & Medical Requirements
                </label>
                <textarea
                  rows={2}
                  value={patientCondition}
                  onChange={(e) => setPatientCondition(e.target.value)}
                  placeholder="e.g. Chest pain, difficulty breathing, requires oxygen cylinder, stretcher needed, accident case..."
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Submit button */}
              <div className="pt-2 pb-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Dispatching Request...
                    </>
                  ) : (
                    <>
                      <Siren size={18} />
                      Request Ambulance Now
                    </>
                  )}
                </button>

                {/* Direct Emergency Call / WhatsApp */}
                <div className="pt-1 flex items-center justify-center gap-3 text-xs font-bold">
                  <a
                    href="tel:8145522359"
                    className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 hover:underline bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900/50"
                  >
                    <Phone size={12} />
                    <span>Call +91 81455 22359</span>
                  </a>
                  <a
                    href="https://wa.me/918145522359?text=URGENT%3A%20Ambulance%20Required"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-900/50"
                  >
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.155.57 4.18 1.572 5.928l-1.672 6.104 6.27-1.644c1.704.939 3.655 1.472 5.83 1.472 6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
