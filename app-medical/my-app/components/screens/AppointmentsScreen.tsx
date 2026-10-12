"use client";
import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, Video, MapPin, Star, FlaskConical, Stethoscope, User, Phone, Building2, Navigation, Wallet } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { directionsUrl, formatDistance, haversineKm, isValidLatLng, istNow } from '@/lib/chamber';
import { ChamberStatusBadge } from '@/components/ui/DoctorChambers';
import { SafeImage } from '@/components/ui/SafeImage';
import { isDisplayableImage } from '@/lib/imageUrl';

const AVATAR_COLORS = ['bg-blue-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500'];
const getAvatarColor = (name: string) => {
  const h = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const getInitials = (name?: string) =>
  (name || 'Doctor')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
const isValidDoctorImage = (img?: string) => isDisplayableImage(img);
const getAddressText = (address: unknown): string => {
  if (!address) return '';
  if (typeof address === 'string') return address.trim();
  if (typeof address === 'object' && address !== null && 'text' in address) {
    const maybeText = (address as { text?: unknown }).text;
    return typeof maybeText === 'string' ? maybeText.trim() : '';
  }
  return '';
};
const buildGoogleMapsUrl = (entity: any): string | null => {
  const lat = Number(entity?.location?.lat);
  const lng = Number(entity?.location?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  const addressText = getAddressText(entity?.address);
  return addressText ? `https://www.google.com/maps/search/${encodeURIComponent(addressText)}` : null;
};

export const AppointmentsScreen = () => {
  const { appointments, startInstantCall, showToast, fetchAppointments, currentUser } = useAppContext();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchAppointments();
    // fetchAppointments is context-provided and not memoized; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onFocus = () => fetchAppointments();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the "doctor is in chamber" status fresh while a chamber visit is due today.
  const todayISO = istNow().dateISO;
  const hasChamberVisitToday = appointments.some((a: any) => a.status === 'Confirmed' && a.chamberId && a.visitDate === todayISO);
  useEffect(() => {
    if (!hasChamberVisitToday) return;
    const t = setInterval(() => fetchAppointments(), 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasChamberVisitToday]);

  const startReview = (appointmentId: string) => {
    setReviewingId(appointmentId);
    setRating(0);
    setReviewText('');
  };

  const submitReview = async (appointmentId: string) => {
    if (!rating) {
      showToast('Please select a rating first.', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          patientId: currentUser?._id,
          rating,
          review: reviewText,
        }),
      });
      if (res.ok) {
        showToast('Thanks for your review!');
        setReviewingId(null);
        setRating(0);
        setReviewText('');
        fetchAppointments();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data?.error || 'Failed to submit review.', 'error');
      }
    } catch {
      showToast('Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="p-5 md:p-8 min-h-full bg-gray-50 dark:bg-gray-900 max-w-[100rem] mx-auto w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 shrink-0">My Appointments</h1>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-500 bg-white dark:bg-gray-800 p-12 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
            <CalendarIcon size={40} className="text-blue-400 dark:text-blue-500" />
          </div>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-200">No appointments yet</p>
          <p className="text-sm text-center mt-2 max-w-xs dark:text-gray-400">Book an in-clinic or video consultation from the search or home screens to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.slice().reverse().map((apt: any) => {
            const doctor = apt.doctorId || null;
            const hospital = apt.hospitalId || null;
            const doctorHospital = doctor?.hospitalId && typeof doctor.hospitalId === 'object' ? doctor.hospitalId : null;
            const isHospitalService = apt.serviceType === 'lab' || apt.serviceType === 'surgery';
            
            // Logic for name and specialty
            const title = isHospitalService ? (apt.serviceName || (apt.serviceType === 'lab' ? 'Lab Test' : 'Surgery')) : (doctor?.name || 'Doctor');
            const subTitle = isHospitalService ? (hospital?.name || 'Hospital Service') : (doctor?.specialty || '');
            
            // Icon logic
            const ServiceIcon = apt.serviceType === 'lab' ? FlaskConical : apt.serviceType === 'surgery' ? Stethoscope : apt.type === 'video' ? Video : MapPin;
            const iconColor = apt.serviceType === 'lab' ? 'text-teal-500' : apt.serviceType === 'surgery' ? 'text-rose-500' : apt.type === 'video' ? 'text-indigo-500' : 'text-emerald-500';

            const isHospitalDoctor = !isHospitalService && !!doctorHospital;
            const locationTarget = isHospitalService
              ? (hospital || doctorHospital || doctor)
              : (isHospitalDoctor ? doctorHospital : (doctor || hospital));
            const chamber = apt.chamber || (apt.chamberName ? { name: apt.chamberName, address: apt.chamberAddress } : null);
            const isChamberVisit = !!chamber;
            const googleMapsUrl = (chamber && directionsUrl(chamber))
              || buildGoogleMapsUrl(locationTarget) || buildGoogleMapsUrl(hospital) || buildGoogleMapsUrl(doctor);
            const userLoc = currentUser?.location;
            const chamberKm = chamber && userLoc && isValidLatLng(chamber.locationLat, chamber.locationLng)
              ? haversineKm(userLoc.lat, userLoc.lng, chamber.locationLat, chamber.locationLng)
              : null;
            const doctorPhone = typeof doctor?.phone === 'string' ? doctor.phone.trim() : '';

            return (
              <div key={apt._id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4 transition-all hover:shadow-xl hover:shadow-blue-500/5 group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-700 overflow-hidden border border-gray-100 dark:border-gray-600 flex items-center justify-center shrink-0">
                      {isHospitalService ? (
                        <div className={`w-full h-full flex items-center justify-center ${apt.serviceType === 'lab' ? 'bg-teal-50 dark:bg-teal-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                          {apt.serviceType === 'lab' ? <FlaskConical size={28} className="text-teal-600" /> : <Stethoscope size={28} className="text-rose-600" />}
                        </div>
                      ) : isValidDoctorImage(doctor?.image) ? (
                        <SafeImage
                          src={doctor.image}
                          alt={doctor?.name || 'Doctor'}
                          className="w-full h-full object-cover"
                          fallback={
                            <div className={`w-full h-full flex items-center justify-center ${getAvatarColor(doctor?.name || 'Doctor')}`}>
                              <span className="text-white font-extrabold text-lg">{getInitials(doctor?.name)}</span>
                            </div>
                          }
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${getAvatarColor(doctor?.name || 'Doctor')}`}>
                          {doctor?.name ? (
                            <span className="text-white font-extrabold text-lg">{getInitials(doctor.name)}</span>
                          ) : (
                            <User size={28} className="text-white" />
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white text-lg sm:text-xl leading-tight group-hover:text-teal-600 transition-colors">{title}</h4>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-bold mt-0.5 uppercase tracking-wide">{subTitle}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`p-1 rounded-md ${apt.type === 'video' ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                          <ServiceIcon size={13} className={iconColor} />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-black tracking-wider">
                          {apt.type === 'video' ? 'Video Consult' : apt.type === 'hospital_visit' ? 'Hospital Visit' : 'Clinic Visit'}
                        </span>
                      </div>
                      {!isHospitalService && doctorPhone && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-semibold">
                          <Phone size={13} className="text-teal-600 dark:text-teal-400" />
                          <a href={`tel:${doctorPhone.replace(/[^\d+]/g, '')}`} className="hover:underline">
                            {doctorPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  {isChamberVisit ? (
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white">₹{apt.basePrice}</span>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">at chamber</p>
                    </div>
                  ) : apt.price > 0 && (
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white">₹{apt.price}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 mt-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-black uppercase tracking-tight">
                    <CalendarIcon size={16} className="text-teal-600 dark:text-teal-400" /> {apt.date}
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-black uppercase tracking-tight">
                    <Clock size={16} className="text-teal-600 dark:text-teal-400" /> {apt.slot}
                  </div>
                </div>

                {isChamberVisit && (
                  <div className="rounded-2xl border border-teal-100 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-900/10 p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <Building2 size={16} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 dark:text-white">{chamber.name}</p>
                        {chamber.address && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{chamber.address}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {apt.status === 'Confirmed' && apt.visitDate === todayISO && apt.chamber && (
                        apt.chamber.isDoctorIn
                          ? <ChamberStatusBadge chamber={apt.chamber} />
                          : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300">Doctor hasn&apos;t arrived yet</span>
                      )}
                      {chamberKm != null && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-teal-100 dark:border-teal-900">
                          <Navigation size={10} /> {formatDistance(chamberKm)} away
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-teal-100 dark:border-teal-900/50">
                      <span className="text-gray-500 dark:text-gray-400">
                        {apt.bookingFee > 0 ? `Booking fee ₹${apt.bookingFee} paid online` : 'Free booking'}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                        <Wallet size={12} /> {apt.paymentStatus === 'paid' ? 'Settled' : `Pay ₹${apt.basePrice} at chamber`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-2 space-y-2.5">
                  {apt.status === 'Confirmed' && apt.type === 'video' && (
                    <button onClick={() => startInstantCall(doctor)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/20 flex justify-center items-center gap-2 active:scale-95">
                      <Video size={16} /> Join Video Call
                    </button>
                  )}
                  {apt.status === 'Confirmed' && apt.type !== 'video' && (
                    <button 
                      onClick={() => { 
                        if (googleMapsUrl) { 
                          window.open(googleMapsUrl, '_blank', 'noopener,noreferrer'); 
                        } else { 
                          showToast('Location not available.', 'error'); 
                        } 
                      }} 
                      className="w-full bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex justify-center items-center gap-2 active:scale-95 shadow-sm"
                    >
                      <MapPin size={16} /> Get Directions
                    </button>
                  )}
                  {apt.status === 'Confirmed' && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/appointments', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ appointmentId: apt._id, status: 'Cancelled', patientId: currentUser?._id }),
                          });
                          if (res.ok) { showToast('Appointment cancelled'); fetchAppointments(); }
                          else { showToast('Failed to cancel', 'error'); }
                        } catch { showToast('Failed to cancel', 'error'); }
                      }}
                      className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex justify-center items-center gap-2 active:scale-95"
                    >
                      Cancel Appointment
                    </button>
                  )}
                  {apt.status === 'Cancelled' && (
                    <div className="w-full text-center text-red-500 dark:text-red-400 py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                      Cancelled
                    </div>
                  )}
                  {apt.status === 'Completed' && (
                    <div className="w-full text-center text-green-600 dark:text-green-400 py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                      Completed
                    </div>
                  )}

                  {apt.status === 'Completed' && !apt.reviewRating && reviewingId !== apt._id && (
                    <button
                      onClick={() => startReview(apt._id)}
                      className="w-full bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 py-3 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-2 active:scale-95"
                    >
                      <Star size={16} /> Rate & Review
                    </button>
                  )}

                  {apt.status === 'Completed' && apt.reviewRating && (
                    <div className="w-full text-center text-amber-700 dark:text-amber-400 py-3 rounded-xl text-sm font-bold bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center gap-1.5">
                      <Star size={15} className="fill-amber-500 text-amber-500" /> Your Rating: {apt.reviewRating}/5
                    </div>
                  )}

                  {apt.status === 'Completed' && reviewingId === apt._id && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/10 p-3 space-y-3">
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Rate your consultation</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            onClick={() => setRating(value)}
                            className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                            disabled={submittingReview}
                          >
                            <Star
                              size={18}
                              className={value <= rating ? 'fill-amber-500 text-amber-500' : 'text-amber-300 dark:text-amber-700'}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Write a short review (optional)"
                        maxLength={500}
                        className="w-full rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-800"
                        rows={3}
                        disabled={submittingReview}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitReview(apt._id)}
                          disabled={submittingReview}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-xs font-bold transition-colors"
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button
                          onClick={() => setReviewingId(null)}
                          disabled={submittingReview}
                          className="px-3 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
