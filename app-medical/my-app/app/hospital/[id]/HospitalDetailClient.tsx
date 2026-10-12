"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, MapPin, Phone, Mail, Star, CheckCircle, FlaskConical, Stethoscope, Pill, ArrowLeft, Loader2, Truck, Image as ImageIcon, Calendar, Clock, X } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useAppContext } from '@/app/context/AppContext';
import Link from 'next/link';
import { calculateTotalWithPlatformFee, normalizePlatformFeePercent } from '@/lib/platformFee';
import { SafeImage } from '@/components/ui/SafeImage';
import { buildDoctorProfilePath } from '@/lib/doctorProfileUrl';
import { scheduleSummary, to12h } from '@/lib/chamber';
import { facilityKindLabel } from '@/lib/facilityKind';

export const HospitalDetailClient = () => {
  const { id } = useParams();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { currentUser, showToast } = useAppContext();
  const [hospital, setHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'lab' | 'surgery' | 'doctors' | 'photos'>('overview');
  
  // Booking Modal State
  const [bookingModal, setBookingModal] = useState<{
    show: boolean;
    type: 'lab' | 'surgery' | null;
    service: any | null;
  }>({ show: false, type: null, service: null });
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSlot, setBookingSlot] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const res = await fetch(`/api/hospitals/${id}`);
        if (res.ok) {
          const data = await res.json();
          setHospital(data);
        }
      } catch (err) {
        console.error('Failed to fetch hospital:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchHospital();
  }, [id]);

  useEffect(() => {
    if (currentUser?.location?.lat && currentUser?.location?.lng) {
      setUserLocation(currentUser.location);
    } else if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aurahealth_guest_location');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.lat && parsed.lng) setUserLocation(parsed);
        } catch {}
      }
    }
  }, [currentUser?.location]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const handleServiceBooking = async () => {
    if (!currentUser?._id) {
      showToast('Please log in to book a service.', 'error');
      const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
      router.push('/login?redirect=' + encodeURIComponent(currentUrl));
      return;
    }

    if (!bookingDate || !bookingSlot) {
      showToast('Please select date and time slot.', 'error');
      return;
    }

    setIsBooking(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentUser._id,
          hospitalId: hospital._id,
          serviceType: bookingModal.type,
          serviceName: bookingModal.service.name,
          slot: bookingSlot,
          date: bookingDate,
          type: 'hospital_visit',
          price: bookingModal.type === 'lab' ? bookingModal.service.price : 0,
        }),
      });

      if (res.ok) {
        const newApt = await res.json();
        showToast('Processing your booking...');
        setBookingModal({ show: false, type: null, service: null });
        setBookingDate('');
        setBookingSlot('');
        setTimeout(() => {
          if (newApt?._id) {
            router.push(`/checkout/${newApt._id}`);
          } else {
            showToast('Booking created, but checkout redirection failed.', 'error');
          }
        }, 800);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to book service.', 'error');
      }
    } catch (err) {
      showToast('Something went wrong.', 'error');
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{t('common.noData')}</p>
      </div>
    );
  }

  const name = locale === 'hi' && hospital.nameHi ? hospital.nameHi : hospital.name;
  const about = locale === 'hi' && hospital.aboutHi ? hospital.aboutHi : hospital.about;
  const address = locale === 'hi' && hospital.addressHi ? hospital.addressHi : hospital.address;
  const hospitalPlatformFeePercent = normalizePlatformFeePercent(hospital.platformFeePercent);
  const getHospitalDisplayPrice = (baseAmount: unknown) =>
    calculateTotalWithPlatformFee(baseAmount, hospitalPlatformFeePercent);
  const formatCurrency = (amount: number) => `\u20B9${amount}`;

  const detailTabs = [
    { key: 'overview' as const, label: t('hospital.about') },
    { key: 'doctors' as const, label: t('hospital.doctors') },
    { key: 'photos' as const, label: t('hospital.photos') },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 space-y-6">
      {/* Back Button */}
      <Link href="/hospital" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <ArrowLeft size={16} /> {t('common.back')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Hospital Header */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800 shadow-sm">
                <Building2 size={40} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{name}</h1>
                  <span className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border ${
                    hospital.type === 'government'
                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400'
                  }`}>
                    {t(`hospital.${hospital.type}`)}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border bg-teal-50 text-teal-700 border-teal-200">
                    {facilityKindLabel(hospital.facilityKind)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mt-2.5">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    <MapPin size={15} className="text-blue-500 shrink-0" /> {address}
                    {userLocation && hospital.location?.lat && (
                      <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-black">
                        ({calculateDistance(userLocation.lat, userLocation.lng, hospital.location.lat, hospital.location.lng)} km away)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50">
                  {hospital.phone && (
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                        <Phone size={15} />
                      </div>
                      {hospital.phone}
                    </div>
                  )}
                  {hospital.email && (
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                        <Mail size={15} />
                      </div>
                      {hospital.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick badges */}
            <div className="flex flex-wrap gap-2 mt-6">
              {hospitalPlatformFeePercent > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 px-3 py-1.5 rounded-xl border border-violet-100 dark:border-violet-800">
                  Platform Fee: {hospitalPlatformFeePercent}%
                </span>
              )}
              {hospital.medicineShop && (
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 px-3 py-1.5 rounded-xl border border-teal-100 dark:border-teal-800">
                  <Pill size={13} /> {t('hospital.medicineShop')}
                </span>
              )}
              {hospital.medicineDelivery && (
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <Truck size={13} /> {t('hospital.delivery')}
                </span>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-1.5 border border-gray-100 dark:border-gray-700 shadow-sm flex gap-1.5 overflow-x-auto scrollbar-hide">
            {detailTabs.map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => setActiveTab(tabItem.key)}
                className={`flex-1 px-4 py-3 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all uppercase tracking-wider ${
                  activeTab === tabItem.key
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {tabItem.label}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {about && (
                  <div className="prose dark:prose-invert max-w-none">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-3">About Hospital</h3>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{about}</p>
                  </div>
                )}

                {hospital.facilities?.length > 0 && (
                  <div className="pt-6 border-t border-gray-50 dark:border-gray-700">
                    <h3 className="font-black text-sm text-gray-900 dark:text-white mb-4 uppercase tracking-widest">{t('hospital.facilities')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {hospital.facilities.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 group hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all">
                          <CheckCircle size={14} className="text-blue-500 shrink-0" />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hospital.departments?.length > 0 && (
                  <div className="pt-6 border-t border-gray-50 dark:border-gray-700">
                    <h3 className="font-black text-sm text-gray-900 dark:text-white mb-4 uppercase tracking-wider">{t('hospital.departments')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {hospital.departments.map((d: string, i: number) => (
                        <span key={i} className="text-xs sm:text-sm font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lab' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                      <FlaskConical size={20} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    {t('hospital.labServices')}
                  </h3>
                </div>
                {hospital.labServices?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hospital.labServices.map((service: any, i: number) => (
                      <div key={i} className="group bg-white dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/5 transition-all flex flex-col justify-between">
                        <div>
                          <p className="text-base font-black text-gray-900 dark:text-white group-hover:text-teal-600 transition-colors">{service.name}</p>
                          {service.description && <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium line-clamp-2">{service.description}</p>}
                        </div>
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50 dark:border-gray-700">
                          <div className="flex flex-col">
                            <span className="text-lg font-black text-teal-600 dark:text-teal-400">{formatCurrency(getHospitalDisplayPrice(service.price))}</span>
                            {hospitalPlatformFeePercent > 0 && (
                              <span className="text-xs font-bold text-violet-500">
                                Base {formatCurrency(Math.max(0, Number(service.price) || 0))} + {hospitalPlatformFeePercent}%
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => setBookingModal({ show: true, type: 'lab', service })}
                            className="text-xs sm:text-sm font-black uppercase tracking-wider bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-teal-500/20 active:scale-95"
                          >
                            Book Test
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <FlaskConical size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-2 opacity-50" />
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'surgery' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
                      <Stethoscope size={20} className="text-rose-600 dark:text-rose-400" />
                    </div>
                    {t('hospital.surgeryServices')}
                  </h3>
                </div>
                {hospital.surgeryServices?.length > 0 ? (
                  <div className="space-y-4">
                    {hospital.surgeryServices.map((service: any, i: number) => (
                      <div key={i} className="group bg-white dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-500/5 transition-all flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors">{service.name}</p>
                          {service.description && <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">{service.description}</p>}
                          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-black uppercase tracking-wider">
                            Est: {service.priceRange}
                          </div>
                        </div>
                        <button 
                          onClick={() => setBookingModal({ show: true, type: 'surgery', service })}
                          className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-rose-500/20 active:scale-95 shrink-0"
                        >
                          Book Query
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <Stethoscope size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-2 opacity-50" />
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'doctors' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="font-black text-lg text-gray-900 dark:text-white mb-1">Doctors &amp; Timings</h3>
                <p className="text-xs text-gray-500 mb-5">Book online for a small fee and pay the consultation fee here at the desk.</p>
                {hospital.doctors?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...hospital.doctors]
                      .sort((a: any, b: any) => Number(Boolean(b.chamber?.isDoctorIn)) - Number(Boolean(a.chamber?.isDoctorIn)))
                      .map((doc: any) => (
                      <Link
                        key={doc._id}
                        href={`${buildDoctorProfilePath(doc)}${doc.chamber ? `?chamber=${doc.chamber.id}` : ''}`}
                        className={`group block bg-white dark:bg-gray-800 rounded-2xl border p-4 hover:shadow-lg transition-all ${doc.chamber?.isDoctorIn ? 'border-emerald-300' : 'border-gray-100 dark:border-gray-700 hover:border-teal-300'}`}
                      >
                        <div className="flex items-start gap-3">
                          <SafeImage
                            src={doc.image}
                            alt={doc.name}
                            className="w-14 h-14 rounded-2xl object-cover shrink-0"
                            fallback={<div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 font-black flex items-center justify-center shrink-0">{(doc.name || 'Dr').replace(/^dr\.?\s*/i, '').slice(0, 2).toUpperCase()}</div>}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-black text-gray-900 dark:text-white truncate group-hover:text-teal-700">{doc.name}</p>
                              {doc.chamber?.isDoctorIn ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> IN now
                                </span>
                              ) : doc.chamber?.liveStatus === 'later_today' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">Today {to12h(doc.chamber.startTime)}</span>
                              ) : null}
                            </div>
                            <p className="text-sm font-bold text-teal-700">{doc.specialty}</p>
                            {doc.qual && <p className="text-xs text-gray-500 truncate">{doc.qual}{doc.exp ? ` · ${doc.exp}` : ''}</p>}
                          </div>
                          <span className="text-sm font-black text-gray-900 dark:text-white shrink-0">₹{doc.fee}</span>
                        </div>
                        {doc.chamber && (
                          <p className="mt-3 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 rounded-xl px-3 py-2 flex items-center gap-1.5">
                            <Clock size={12} className="text-teal-600 shrink-0" /> {scheduleSummary(doc.chamber)}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <Building2 size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-2 opacity-50" />
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="font-black text-lg text-gray-900 dark:text-white mb-6">{t('hospital.photos')}</h3>
                {hospital.photos?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {hospital.photos.map((photo: string, i: number) => (
                      <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                        <SafeImage src={photo} alt={`${hospital.name} ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageIcon size={24} className="text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <ImageIcon size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-2 opacity-50" />
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Area - Utilize desktop space */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Action Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20">
            <h3 className="text-lg font-black mb-2 flex items-center gap-2">
              <CheckCircle size={20} />
              Verified Hospital
            </h3>
            <p className="text-sm text-blue-50 font-medium mb-6 opacity-90">
              This facility is verified and adheres to platform healthcare standards.
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => {
                  if (hospital.phone) {
                    window.location.href = `tel:${hospital.phone}`;
                  } else {
                    showToast('Emergency contact not available.', 'error');
                  }
                }}
                className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm shadow-lg shadow-black/10 active:scale-95 transition-all"
              >
                Contact Emergency
              </button>
              <button 
                onClick={() => {
                  if (hospital.location?.lat && hospital.location?.lng) {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.location.lat},${hospital.location.lng}`, '_blank');
                  } else {
                    showToast('Hospital location coordinates not available.', 'error');
                  }
                }}
                className="w-full py-4 bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/30 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm active:scale-95 transition-all"
              >
                Get Directions
              </button>
            </div>
          </div>

          {/* Opening Hours or similar info */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="font-black text-sm text-gray-900 dark:text-white mb-4 uppercase tracking-wider">General Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700">
                <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase">Emergency</span>
                <span className="text-xs sm:text-sm font-black text-red-500 uppercase tracking-wider">24/7 Available</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700">
                <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase">OPD Timing</span>
                <span className="text-xs sm:text-sm font-black text-gray-700 dark:text-gray-300">09:00 AM - 05:00 PM</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase">Blood Bank</span>
                <span className="text-xs sm:text-sm font-black text-emerald-500 uppercase tracking-wider">Available</span>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-3xl p-6 border border-teal-100 dark:border-teal-800">
            <h4 className="text-sm font-black text-teal-900 dark:text-teal-400 uppercase tracking-wider mb-2">Need Assistance?</h4>
            <p className="text-xs sm:text-sm text-teal-700 dark:text-teal-400/80 font-medium leading-relaxed">
              For lab testing and surgery bookings, please select the service from the tabs and use the book button.
            </p>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBookingModal({ show: false, type: null, service: null })} />
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {bookingModal.type === 'lab' ? 'Book Lab Test' : 'Inquire Surgery'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-bold mt-0.5">{bookingModal.service?.name}</p>
              </div>
              <button onClick={() => setBookingModal({ show: false, type: null, service: null })} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={15} className="text-blue-500" /> Select Date
                </label>
                <input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm sm:text-base font-bold focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={15} className="text-blue-500" /> Select Time Slot
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(hospital?.serviceSlots || ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM', '07:00 PM']).map((slot: string) => (
                    <button
                      key={slot}
                      onClick={() => setBookingSlot(slot)}
                      className={`py-3 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                        bookingSlot === slot 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-95' 
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-200'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {bookingModal.type === 'lab' && (
                <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-800 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider">Total Payable</span>
                    {hospitalPlatformFeePercent > 0 && (
                      <span className="text-xs font-bold text-violet-500">
                        Base {formatCurrency(Math.max(0, Number(bookingModal.service?.price) || 0))} + {hospitalPlatformFeePercent}% platform fee
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-black text-teal-600 dark:text-teal-400">{formatCurrency(getHospitalDisplayPrice(bookingModal.service?.price))}</span>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
              <button
                disabled={isBooking}
                onClick={handleServiceBooking}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isBooking ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
