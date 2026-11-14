"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Pill, 
  FileText, 
  Upload, 
  CheckCircle2, 
  User, 
  Phone, 
  MapPin, 
  LocateFixed, 
  Sparkles, 
  ArrowRight,
  Clock,
  Truck,
  ShieldCheck,
  AlertCircle,
  Trash2,
  PackageCheck
} from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/app/context/AppContext';
import { useRouter } from 'next/navigation';

interface MedicineDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MedicineDeliveryModal: React.FC<MedicineDeliveryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, showToast } = useAppContext();
  const router = useRouter();

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [medicineNotes, setMedicineNotes] = useState('');
  const [deliverySpeed, setDeliverySpeed] = useState<'express' | 'standard'>('standard');
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('Prescription file size must be under 8MB', 'error');
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
        setDeliveryCoords({ lat, lng });
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
            setDeliveryAddress(full);
            showToast('GPS Delivery location detected!', 'success');
          } else {
            setDeliveryAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
          }
        } catch {
          setDeliveryAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        showToast('Unable to retrieve GPS location. Please type your delivery address.', 'error');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast('Please enter patient or customer name', 'error');
      return;
    }
    if (!patientPhone.trim() || patientPhone.trim().length < 8) {
      showToast('Please enter a valid phone number for delivery updates', 'error');
      return;
    }
    if (!deliveryAddress.trim()) {
      showToast('Please provide delivery address', 'error');
      return;
    }
    if (!fileData && !medicineNotes.trim()) {
      showToast('Please upload doctor prescription or describe required medicines', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userId: currentUser?._id || null,
        type: 'medicine',
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail.trim() || null,
        pickupAddress: deliveryAddress.trim(),
        pickupLat: deliveryCoords?.lat || null,
        pickupLng: deliveryCoords?.lng || null,
        reportText: medicineNotes.trim() || 'Prescription attached for medicine delivery',
        fileData: fileData || null,
        fileType: fileType || null,
        urgency: deliverySpeed === 'express' ? 'emergency' : 'scheduled',
        scheduledTime: deliverySpeed === 'express' ? 'Express Delivery (2-4 Hours)' : 'Standard Same-Day Delivery',
      };

      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to submit medicine order request', 'error');
        return;
      }

      setIsSubmitted(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('guest_enquiry_phone', patientPhone.trim());
      }
      showToast('Medicine order submitted! Our pharmacist will review and call you shortly.', 'success');
      if (onSuccess) onSuccess();
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setMedicineNotes('');
    setDeliveryAddress('');
    removeFile();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={handleReset}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-blue-200/80 dark:border-blue-900/60 overflow-hidden my-auto max-h-[88dvh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Medinex World Branding */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs">
              <Pill className="text-white" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Medicine Door Delivery</h3>
                <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full tracking-wider">
                  Genuine Care
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">Upload prescription & get doorstep delivery with discount</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden min-[420px]:flex items-center bg-white/15 px-2 py-1 rounded-xl backdrop-blur-xs">
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

        {/* Form Body */}
        <div className="p-4 sm:p-5 pb-8 sm:pb-6 overflow-y-auto space-y-4 flex-1">
          {isSubmitted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Medicine Delivery Request Received!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Our licensed pharmacist is reviewing your prescription/medicine list for doorstep delivery to <span className="font-semibold text-slate-800 dark:text-slate-200">{deliveryAddress}</span>. We will call you at <span className="font-semibold text-slate-800 dark:text-slate-200">{patientPhone}</span> with quotation & delivery ETA.
                </p>
              </div>

              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/50 text-left">
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600 dark:text-blue-400" /> Medinex Pharmacy Guarantee
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                  100% genuine sealed medicines from verified pharmacies with maximum savings and invoice.
                </p>
                <button
                  onClick={() => {
                    handleReset();
                    router.push(`/profile/enquiries?phone=${encodeURIComponent(patientPhone.trim())}`);
                  }}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline"
                >
                  View My Order Status in Profile <ArrowRight size={13} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Delivery Speed Selector */}
              <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setDeliverySpeed('standard')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    deliverySpeed === 'standard'
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs ring-1 ring-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Truck size={14} />
                  <span>Standard Delivery (Today)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliverySpeed('express')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    deliverySpeed === 'express'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Clock size={14} />
                  <span>Express (2-4 Hours)</span>
                </button>
              </div>

              {/* Patient Name & Phone Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Patient / Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Ramesh Chandra"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address with GPS Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchCurrentLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {isLocating ? (
                      <>
                        <div className="w-3.5 h-3.5 border border-blue-500 border-t-transparent rounded-full animate-spin" />
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
                  <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <textarea
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter house/flat number, building name, street, landmark, area and pin code..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 📸 Prescription Upload Section 📸 */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Upload Doctor's Prescription <span className="text-slate-400 font-normal">(Photo / PDF)</span>
                </label>
                
                {fileData ? (
                  <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {fileType.includes('image') ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-blue-200 shrink-0">
                          <img src={fileData} alt="Prescription preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText size={22} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {fileName}
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Prescription attached
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="Remove prescription"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-200 dark:border-blue-900/60 hover:border-blue-500 rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 cursor-pointer transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Upload size={20} />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
                      Click to upload prescription or take photo
                    </p>
                    <p className="text-[11px] text-slate-400 text-center mt-0.5">
                      JPG, PNG, WebP, or PDF (Max 8MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Medicine Description / Text Box */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Medicine Description / Requirements <span className="text-slate-400 font-normal">(Optional if prescription attached)</span>
                </label>
                <textarea
                  rows={3}
                  value={medicineNotes}
                  onChange={(e) => setMedicineNotes(e.target.value)}
                  placeholder="e.g. Paracetamol 650mg (1 strip), Pantoprazole 40mg (1 strip), or any substitute preference..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Security & Authenticity Trust Badge */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <ShieldCheck size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>All medicines are verified by registered pharmacists and delivered in tamper-proof sealed packaging.</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Medicine Order...</span>
                  </>
                ) : (
                  <>
                    <PackageCheck size={18} />
                    <span>Confirm & Request Medicine Delivery</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
