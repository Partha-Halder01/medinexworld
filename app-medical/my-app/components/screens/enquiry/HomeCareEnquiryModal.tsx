"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  HeartHandshake, 
  Activity, 
  UserCheck, 
  Users, 
  Stethoscope, 
  Bandage, 
  Upload, 
  CheckCircle2, 
  User, 
  Phone, 
  MapPin, 
  LocateFixed, 
  Sparkles, 
  ArrowRight,
  Clock,
  Calendar,
  AlertCircle,
  Trash2,
  FileText,
  ShieldCheck,
  MessageCircle
} from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/app/context/AppContext';
import { useRouter } from 'next/navigation';

interface HomeCareEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultService?: string;
}

export const HOME_CARE_SERVICES = [
  {
    id: 'physiotherapy',
    title: 'Physiotherapy',
    desc: 'Post-surgery rehab, paralysis stroke recovery, joint mobility & pain management',
    icon: Activity,
    color: 'from-emerald-500 to-teal-600',
    badge: 'Certified Physio',
  },
  {
    id: 'patient_attendant',
    title: 'Patient Attendent Care',
    desc: 'Trained male/female bedside attendant for 12h/24h hygiene, feeding & vitals monitoring',
    icon: UserCheck,
    color: 'from-blue-500 to-indigo-600',
    badge: '12h / 24h Shift',
  },
  {
    id: 'old_age_care',
    title: 'Old age People Care',
    desc: 'Compassionate geriatric companionship, mobility assistance, medication & emotional care',
    icon: Users,
    color: 'from-amber-500 to-orange-600',
    badge: 'Elderly Support',
  },
  {
    id: 'emergency_doctor',
    title: "Needy person's Care (Emergency Dr. Check-up)",
    desc: 'Urgent general physician home visit, bedside clinical assessment & fresh prescription',
    icon: Stethoscope,
    color: 'from-rose-500 to-red-600',
    badge: 'Doctor Doorstep',
  },
  {
    id: 'dressing',
    title: 'Dressing',
    desc: 'Aseptic wound dressing, surgical suture removal, bed sore care & sterile bandaging',
    icon: Bandage,
    color: 'from-purple-500 to-violet-600',
    badge: 'Sterile Nursing',
  },
];

export const HomeCareEnquiryModal: React.FC<HomeCareEnquiryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultService,
}) => {
  const { currentUser, showToast } = useAppContext();
  const router = useRouter();

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  
  // Multi-select for the 5 services
  const [selectedServices, setSelectedServices] = useState<string[]>(['physiotherapy']);
  
  // Frequency / duration
  const [frequency, setFrequency] = useState<'one_time' | 'daily' | 'weekly' | 'monthly'>('daily');
  
  // Location
  const [serviceAddress, setServiceAddress] = useState('');
  const [serviceCoords, setServiceCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // Notes & file
  const [careRequirements, setCareRequirements] = useState('');
  const [urgency, setUrgency] = useState<'emergency' | 'scheduled'>('emergency');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('Morning (9 AM - 1 PM)');
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');

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

  // Handle default service selection
  useEffect(() => {
    if (defaultService) {
      const match = HOME_CARE_SERVICES.find(s => s.id === defaultService || s.title.toLowerCase().includes(defaultService.toLowerCase()));
      if (match) {
        setSelectedServices([match.id]);
      }
    }
  }, [defaultService]);

  if (!isOpen) return null;

  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      if (selectedServices.length === 1) {
        showToast('Please select at least one home care service', 'error');
        return;
      }
      setSelectedServices(selectedServices.filter(s => s !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('Document file size must be under 8MB', 'error');
      return;
    }

    setFileName(file.name);
    setFileType(file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setFileData(null);
    setFileName('');
    setFileType('');
  };

  const handleFetchCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setServiceCoords({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
            headers: { 'Accept-Language': 'en' },
          });
          const data = await res.json();
          const road = data.address?.road || '';
          const suburb = data.address?.suburb || data.address?.neighbourhood || '';
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          const postcode = data.address?.postcode || '';
          const full = [road, suburb, city, postcode].filter(Boolean).join(', ');
          if (full) {
            setServiceAddress(full);
            showToast('GPS Home location detected!', 'success');
          } else {
            setServiceAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
          }
        } catch {
          setServiceAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        showToast('Unable to retrieve GPS location. Please type your home address.', 'error');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast('Please enter patient name', 'error');
      return;
    }
    if (!patientPhone.trim() || patientPhone.trim().length < 8) {
      showToast('Please enter a valid phone number for confirmation', 'error');
      return;
    }
    if (selectedServices.length === 0) {
      showToast('Please select at least one home care service', 'error');
      return;
    }
    if (!serviceAddress.trim()) {
      showToast('Please provide patient home address for doorstep care', 'error');
      return;
    }

    const selectedTitles = HOME_CARE_SERVICES
      .filter(s => selectedServices.includes(s.id))
      .map(s => s.title)
      .join(', ');

    const frequencyLabel = 
      frequency === 'one_time' ? 'One-Time Visit' :
      frequency === 'daily' ? 'Daily Care Service' :
      frequency === 'weekly' ? 'Weekly Package' : 'Monthly Long-term Care';

    const fullConditionInfo = [
      patientAge ? `Age: ${patientAge}` : '',
      patientGender ? `Gender: ${patientGender}` : '',
      `Package: ${frequencyLabel}`,
      preferredTimeSlot ? `Slot: ${preferredTimeSlot}` : '',
      careRequirements.trim() ? `Notes: ${careRequirements.trim()}` : ''
    ].filter(Boolean).join(' | ');

    setLoading(true);
    try {
      const payload = {
        userId: currentUser?._id || null,
        type: 'home_care',
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail.trim() || null,
        testName: selectedTitles, // Store selected services
        pickupAddress: serviceAddress.trim(),
        pickupLat: serviceCoords?.lat || null,
        pickupLng: serviceCoords?.lng || null,
        patientCondition: fullConditionInfo,
        reportText: careRequirements.trim() || `Requested Home Care: ${selectedTitles} (${frequencyLabel})`,
        fileData: fileData || null,
        fileType: fileType || null,
        urgency: urgency,
        preferredDate: preferredDate || new Date().toISOString().split('T')[0],
        scheduledTime: preferredTimeSlot,
      };

      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to submit home care request', 'error');
        return;
      }

      setIsSubmitted(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('guest_enquiry_phone', patientPhone.trim());
      }
      showToast('Home Care Request submitted! Our healthcare coordinator will call you shortly.', 'success');
      if (onSuccess) onSuccess();
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setCareRequirements('');
    setServiceAddress('');
    removeFile();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={handleReset}
    >
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-purple-200/80 dark:border-purple-900/60 overflow-hidden my-auto max-h-[90dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Medinex World Branding */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-700 via-indigo-600 to-teal-600 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs">
              <HeartHandshake className="text-white" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Home Care Service</h3>
                <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full tracking-wider">
                  Doorstep Care
                </span>
              </div>
              <p className="text-xs text-purple-100 font-medium">Physiotherapy, Attendants, Elderly & Doctor Check-up at Home</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden min-[440px]:flex items-center bg-white/15 px-2.5 py-1 rounded-xl backdrop-blur-xs">
              <Image src="/newlogos.png" alt="Medinex" width={70} height={24} className="h-4.5 w-auto object-contain brightness-0 invert" priority />
            </div>
            <button
              onClick={handleReset}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 pb-8 overflow-y-auto space-y-4 flex-1">
          {isSubmitted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Home Care Request Booked!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Our clinical care coordinator is assigning verified healthcare professionals for <span className="font-semibold text-slate-800 dark:text-slate-200">{patientName}</span> at <span className="font-semibold text-slate-800 dark:text-slate-200">{serviceAddress}</span>. We will call you at <span className="font-semibold text-slate-800 dark:text-slate-200">{patientPhone}</span> with timing & care plan.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/50 text-left space-y-2">
                <p className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-purple-600 dark:text-purple-400" /> Medinex Home Care Quality Guarantee
                </p>
                <p className="text-[11px] text-purple-700 dark:text-purple-300">
                  All physiotherapists, nurses, attendants & doctors are verified, background-checked, and adhere to strict clinical hygiene protocols.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-purple-900 dark:text-purple-200">
                  <span className="bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800">
                    Services: {HOME_CARE_SERVICES.filter(s => selectedServices.includes(s.id)).map(s => s.title).join(', ')}
                  </span>
                  <span className="bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800">
                    Slot: {preferredTimeSlot}
                  </span>
                </div>
              </div>

              {/* Direct WhatsApp & Call Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <a
                  href={`https://wa.me/918145522359?text=${encodeURIComponent(`Hello Medinex World, I have submitted a Home Care request for ${patientName} (${patientPhone}). Please assist with confirmation.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <MessageCircle size={15} />
                  <span>Chat on WhatsApp (8145522359)</span>
                </a>
                <a
                  href="tel:8145522359"
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Phone size={15} />
                  <span>Call Care Desk (8145522359)</span>
                </a>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    router.push(`/profile/enquiries?phone=${encodeURIComponent(patientPhone.trim())}`);
                  }}
                  className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  View My Requests <ArrowRight size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2.5 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Urgency Pill Toggle */}
              <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setUrgency('emergency')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    urgency === 'emergency'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Clock size={14} />
                  <span>Urgent Care / Today Visit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency('scheduled')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    urgency === 'scheduled'
                      ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs ring-1 ring-purple-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Calendar size={14} />
                  <span>Plan Scheduled Care</span>
                </button>
              </div>

              {/* 5 Services Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Select Home Care Services</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                    {selectedServices.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {HOME_CARE_SERVICES.map((srv) => {
                    const isSelected = selectedServices.includes(srv.id);
                    const SrvIcon = srv.icon;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => toggleService(srv.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 relative select-none ${
                          isSelected
                            ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-500 dark:border-purple-500 shadow-xs ring-1 ring-purple-500/30'
                            : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected 
                            ? 'bg-purple-600 text-white shadow-xs' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          <SrvIcon size={16} />
                        </div>
                        <div className="min-w-0 flex-1 pr-5">
                          <p className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                            {srv.title}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mt-0.5">
                            {srv.desc}
                          </p>
                        </div>
                        <div className="absolute top-3 right-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected 
                              ? 'bg-purple-600 border-purple-600 text-white' 
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <CheckCircle2 size={12} className="stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Service Frequency / Duration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Care Duration / Frequency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'one_time', label: 'One-Time Visit' },
                    { id: 'daily', label: 'Daily Care' },
                    { id: 'weekly', label: 'Weekly Plan' },
                    { id: 'monthly', label: 'Monthly 24/7' },
                  ].map((freq) => (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() => setFrequency(freq.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                        frequency === freq.id
                          ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient Name & Contact Phone Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Ramesh Chandra"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="e.g. 8145522359"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Patient Age & Gender & Slot */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 68"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Time Slot
                  </label>
                  <select
                    value={preferredTimeSlot}
                    onChange={(e) => setPreferredTimeSlot(e.target.value)}
                    className="w-full px-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="Morning (8 AM - 12 PM)">Morning (8 AM - 12 PM)</option>
                    <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                    <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                    <option value="Night / 24 Hours">Night / 24 Hours</option>
                    <option value="Immediate Emergency">Immediate Emergency</option>
                  </select>
                </div>
              </div>

              {/* Service / Home Address with GPS */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Patient Home Address <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchCurrentLocation}
                    disabled={isLocating}
                    className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <LocateFixed size={13} className={isLocating ? 'animate-spin' : ''} />
                    <span>{isLocating ? 'Detecting GPS...' : 'Use My GPS Location'}</span>
                  </button>
                </div>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <textarea
                    required
                    rows={2}
                    value={serviceAddress}
                    onChange={(e) => setServiceAddress(e.target.value)}
                    placeholder="Enter flat/house no., apartment/building, street, landmark, area & pincode..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium resize-none"
                  />
                </div>
              </div>

              {/* Patient Care Requirements / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Patient Health Condition & Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={careRequirements}
                  onChange={(e) => setCareRequirements(e.target.value)}
                  placeholder="e.g. Bedridden after knee surgery, requires daily physiotherapy and gentle dressing. Doctor advice: avoid weight bearing..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium resize-none"
                />
              </div>

              {/* Upload Doctor Prescription / Discharge Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Upload Doctor's Prescription or Discharge Summary (Optional)
                </label>
                {fileData ? (
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{fileName}</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={11} /> Document attached
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-slate-800/50 hover:bg-purple-50/30 transition-all">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Upload size={16} className="text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold">Upload Photo / PDF (max 8MB)</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Quality & Safety Assurance Note */}
              <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  Verified caregivers & certified clinical staff with hospital-grade sanitization.
                </p>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-700 via-indigo-600 to-teal-600 hover:from-purple-800 hover:to-teal-700 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-purple-600/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Home Care Request...</span>
                  </>
                ) : (
                  <>
                    <HeartHandshake size={18} />
                    <span>Confirm & Book Home Care Service</span>
                  </>
                )}
              </button>

              {/* Emergency Helpline Row */}
              <div className="pt-1 flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>Need immediate guidance?</span>
                <a
                  href="tel:8145522359"
                  className="font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Phone size={12} /> Call 8145522359
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
