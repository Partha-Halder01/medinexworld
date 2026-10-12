'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Wallet, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  Building2, 
  Calendar, 
  Clock, 
  User as UserIcon,
  ShieldCheck, 
  Zap, 
  IndianRupee, 
  XCircle, 
  MapPin, 
  Navigation,
  Stethoscope,
  Lock,
  Sparkles,
  Phone
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import Link from 'next/link';
import { directionsUrl } from '@/lib/chamber';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_SDK_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let razorpaySdkPromise: Promise<boolean> | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatDoctorName = (name?: string) => {
  if (!name) return '';
  const trimmed = name.trim();
  return /^dr\.?\s+/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
};

export default function CheckoutClient() {
  const params = useParams();
  const checkoutId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { currentUser, showToast, isAuthReady, fetchAppointments } = useAppContext();

  const [appointment, setAppointment] = useState<any>(null);
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  useEffect(() => {
    if (!isAuthReady) return;

    if (!currentUser?._id) {
      router.replace('/login?redirect=/checkout/' + checkoutId);
      return;
    }

    if (!checkoutId) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        let apt: any = null;
        for (let attempt = 1; attempt <= 6; attempt++) {
          if (cancelled) return;
          const aptRes = await fetch(
            `/api/appointments/${checkoutId}?patientId=${currentUser._id}&includePendingPayment=true`,
            { cache: 'no-store' }
          );
          if (aptRes.ok) {
            apt = await aptRes.json();
            break;
          }
          if (cancelled) return;
          await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
        }

        if (cancelled) return;

        if (!apt) {
          showToast('Unable to open checkout for this booking.', 'error');
          router.replace('/appointments');
          return;
        }

        setAppointment(apt);

        const settingsRes = await fetch('/api/admin/platform-settings', { cache: 'no-store' });
        if (cancelled) return;
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (!cancelled) setPlatformSettings(settingsData);
        } else {
          if (!cancelled) setPlatformSettings({ gstPercent: 0, defaultPlatformFeePercent: 0, discountAmount: 0 });
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to fetch checkout data:', err);
        showToast('Failed to load checkout details.', 'error');
        router.replace('/appointments');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [checkoutId, currentUser?._id, isAuthReady, router]);

  const injectRazorpayScript = (src: string, timeoutMs: number) => {
    return new Promise<boolean>((resolve) => {
      const existing = document.querySelector('script[data-razorpay-checkout="1"]');
      if (existing) {
        existing.remove();
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-razorpay-checkout', '1');

      let settled = false;
      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        script.remove();
        resolve(false);
      }, timeoutMs);

      script.onload = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        resolve(true);
      };
      script.onerror = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        script.remove();
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const loadRazorpayScript = async (forceRetry = false) => {
    if ((window as any).Razorpay) return true;

    if (!forceRetry && razorpaySdkPromise) {
      return razorpaySdkPromise;
    }

    razorpaySdkPromise = (async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return false;
      }

      for (let attempt = 1; attempt <= 3; attempt++) {
        const ok = await injectRazorpayScript(
          `${RAZORPAY_SDK_URL}?v=${Date.now()}-${attempt}`,
          8000 + attempt * 1000
        );
        if (ok && (window as any).Razorpay) {
          return true;
        }
        await sleep(500 * attempt);
      }
      return false;
    })();

    const loaded = await razorpaySdkPromise;
    if (!loaded) {
      razorpaySdkPromise = null;
    }
    return loaded;
  };

  // ── Pricing Breakdown Calculations ──
  const isChamberBooking = appointment?.paymentMethod === 'chamber';
  
  // Doctor consultation fee (payable at clinic / chamber)
  const consultationFee = Math.max(
    0,
    Number(appointment?.basePrice ?? appointment?.price ?? 0)
  );

  // Platform fee percentage
  const platformFeePercent = Number(
    appointment?.platformFeePercent ?? platformSettings?.defaultPlatformFeePercent ?? 0
  );

  // Platform fee amount
  const platformFeeAmount = isChamberBooking
    ? Math.max(0, Number(appointment?.bookingFee) || 0)
    : Math.round((consultationFee * platformFeePercent) / 100);

  // GST percentage & amount
  const gstPercent = isChamberBooking ? 0 : Number(platformSettings?.gstPercent || 0);
  const gstAmount = isChamberBooking
    ? 0
    : Math.round((consultationFee * gstPercent) / 100);

  // Discount
  const discountAmount = isChamberBooking ? 0 : Number(platformSettings?.discountAmount || 0);

  // ONLY Platform Fee (+ GST - Discount) is payable online.
  // Full consultation fee option is removed — consultation fee is paid at clinic on visit.
  const onlinePayableAmount = isChamberBooking
    ? (appointment?.bookingFeePaid ? 0 : platformFeeAmount)
    : Math.max(0, platformFeeAmount + gstAmount - discountAmount);

  const handleOnlinePayment = async () => {
    setProcessing(true);
    const scriptLoaded = await loadRazorpayScript(true);
    if (!scriptLoaded) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      showToast(
        isOffline
          ? 'Internet disconnected. Reconnect and try payment again.'
          : 'Unable to load payment gateway. Please check connection and try again.',
        'error'
      );
      setProcessing(false);
      return;
    }

    try {
      // Create Razorpay order on server for platform fee
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appointmentId: checkoutId,
          paymentMethod: 'cash', // Platform fee payment only; consultation settled at clinic
          patientId: currentUser?._id,
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        console.error('Order creation failed on server:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to create payment order');
      }
      const orderData = await orderRes.json();

      const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
      if (!publicKey) {
        throw new Error('Payment gateway key is not configured.');
      }

      const options = {
        key: publicKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'UpcharPath',
        image: '/newlogos.png',
        description: `Platform booking fee for ${appointment.serviceName || (appointment.doctorId?.name ? formatDoctorName(appointment.doctorId.name) : 'Doctor Consultation')}`,
        order_id: orderData.id,
        handler: async (response: any) => {
          // Verify payment on server
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointmentId: checkoutId,
              patientId: currentUser?._id,
            }),
          });

          if (verifyRes.ok) {
            setPaymentStatus('success');
            await fetchAppointments();
            setTimeout(() => {
              showToast('Platform fee paid! Booking confirmed.', 'success');
              router.push('/appointments');
            }, 2500);
          } else {
            const errData = await verifyRes.json();
            console.error('Verification failed:', errData);
            setPaymentStatus('failed');
            setTimeout(() => setPaymentStatus('idle'), 3000);
            showToast(errData.error || 'Payment verification failed.', 'error');
          }
        },
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || '',
          contact: currentUser?.phone || '',
        },
        theme: {
          color: '#0d9488', // Teal healthcare theme
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        setPaymentStatus('failed');
        setTimeout(() => setPaymentStatus('idle'), 3000);
        showToast(response.error.description || 'Payment failed', 'error');
      });
      paymentObject.open();
    } catch (err: any) {
      console.error('Payment error full details:', err);
      showToast(err.message || 'Payment failed. Please try again.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleFreeConfirmation = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/appointments/${checkoutId}/pay-cash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: currentUser?._id }),
      });
      if (res.ok) {
        setPaymentStatus('success');
        await fetchAppointments();
        setTimeout(() => {
          showToast('Booking confirmed! Pay at clinic.', 'success');
          router.push('/appointments');
        }, 2500);
      } else {
        setPaymentStatus('failed');
        setTimeout(() => setPaymentStatus('idle'), 3000);
        showToast('Failed to process booking confirmation.', 'error');
      }
    } catch (err) {
      showToast('Something went wrong.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (onlinePayableAmount > 0) {
      handleOnlinePayment();
    } else {
      handleFreeConfirmation();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-slate-50 dark:bg-slate-950">
        <Loader2 size={40} className="animate-spin text-teal-600" />
        <p className="text-sm font-bold text-slate-500">Preparing secure checkout...</p>
      </div>
    );
  }

  if (!appointment) return null;

  const doctorDisplayName = appointment.serviceName || formatDoctorName(appointment.doctorId?.name);
  const facilityOrSpecialty = appointment.hospitalId?.name 
    ? `${appointment.doctorId?.specialty ? `${appointment.doctorId.specialty} • ` : ''}${appointment.hospitalId.name}`
    : appointment.doctorId?.specialty || 'General Consultation';

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes successPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .animate-slide-up { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-100 { animation-delay: 100ms; opacity: 0; }
        .delay-200 { animation-delay: 200ms; opacity: 0; }
      `}</style>
      
      {/* ── Success / Failed Payment Modal ── */}
      {paymentStatus !== 'idle' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 transition-opacity duration-500">
          <div className="animate-scale-in bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col items-center justify-center w-full max-w-md p-8 md:p-10 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden text-center">
            {/* Glowing orb backdrop */}
            <div className={`absolute -top-20 -right-20 w-44 h-44 rounded-full blur-[60px] opacity-25 ${paymentStatus === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <div className={`absolute -bottom-20 -left-20 w-44 h-44 rounded-full blur-[60px] opacity-25 ${paymentStatus === 'success' ? 'bg-teal-500' : 'bg-rose-500'}`} />

            {paymentStatus === 'success' ? (
              <div className="flex flex-col items-center relative z-10 w-full">
                <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-950/60 rounded-full animate-[successPulse_2s_infinite]"></div>
                  <div className="absolute w-20 h-20 bg-emerald-50 dark:bg-emerald-900/40 rounded-full flex items-center justify-center border-4 border-emerald-500 z-10 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={44} className="text-emerald-500" strokeWidth={2.5} />
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                  Booking Confirmed!
                </h2>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider mb-4">
                  Slot Reserved &amp; Scheduled
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/80 w-full p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-left space-y-2">
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-semibold leading-relaxed">
                    {onlinePayableAmount > 0 ? (
                      <>
                        <span className="text-emerald-600 font-black">✓ Platform fee paid online (₹{onlinePayableAmount}).</span>
                        <br />
                        Please pay the consultation fee of <strong>₹{consultationFee}</strong> directly at the {isChamberBooking ? 'chamber' : 'clinic / hospital'} during your visit.
                      </>
                    ) : (
                      <>
                        <span className="text-emerald-600 font-black">✓ Free appointment confirmed.</span>
                        <br />
                        Please pay <strong>₹{consultationFee}</strong> consultation fee directly at the {isChamberBooking ? 'chamber' : 'clinic / hospital'} during your visit.
                      </>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium pt-1">
                    Redirecting to your appointments list...
                  </p>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full animate-[slideRight_2.5s_linear_forwards]" style={{ width: '100%', animation: 'slideRight 2.5s linear forwards', left: '-100%', position: 'relative' }}>
                    <style>{`@keyframes slideRight { to { left: 0 } }`}</style>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center relative z-10 w-full">
                <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 bg-rose-100 dark:bg-rose-950/60 rounded-full animate-ping opacity-30" style={{ animationDuration: '2s' }}></div>
                  <div className="absolute w-20 h-20 bg-rose-50 dark:bg-rose-900/40 rounded-full flex items-center justify-center border-4 border-rose-500 z-10 shadow-lg shadow-rose-500/20">
                    <XCircle size={44} className="text-rose-500" strokeWidth={2.5} />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Payment Incomplete</h2>
                <div className="bg-slate-50 dark:bg-slate-800/80 w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">We could not complete your booking payment. Your slot has not been locked. Please try again.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main Checkout Container ── */}
      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 py-6 md:py-10 pb-32 md:pb-16 antialiased">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-8 animate-slide-up">
            <div className="flex items-center gap-3.5">
              <Link 
                href="/appointments" 
                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-xs active:scale-95"
                title="Back to Appointments"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Checkout
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    256-Bit SSL Secure Checkout
                  </p>
                </div>
              </div>
            </div>

            {/* Stepper Status Pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-900/60 px-3.5 py-1.5 rounded-full shadow-xs">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>Step 2 of 2 • Review &amp; Confirm</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* ========================================================
                LEFT COLUMN: Booking Summary & Patient Details
                ======================================================== */}
            <div className="lg:col-span-7 space-y-5 animate-slide-up delay-100">
              
              {/* Main Booking Summary Card */}
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span> Booking Details
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-900/60">
                    In-Clinic Visit
                  </span>
                </div>

                {/* Doctor / Facility Profile */}
                <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-50 dark:from-slate-850 dark:via-slate-800 dark:to-slate-850 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-start gap-4 sm:gap-4.5 mb-5">
                  {appointment.doctorId?.image ? (
                    <img
                      src={appointment.doctorId.image}
                      alt={doctorDisplayName}
                      className="w-16 h-16 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200/60 dark:border-teal-900/60 shadow-xs">
                      <Stethoscope size={28} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      <CheckCircle2 size={13} className="shrink-0" />
                      <span>{appointment.serviceType === 'lab' ? 'Diagnostic Service' : appointment.serviceType === 'surgery' ? 'Surgical Care' : 'Doctor Consultation'}</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5 truncate">
                      {doctorDisplayName}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {facilityOrSpecialty}
                    </p>
                  </div>
                </div>

                {/* Schedule Grid */}
                <div className="grid grid-cols-2 gap-3.5 mb-4">
                  <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5">
                      <Calendar size={16} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date</p>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {appointment.date}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5">
                      <Clock size={16} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Time Slot</p>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {appointment.slot}
                    </p>
                  </div>
                </div>

                {/* Chamber / Clinic Venue Card (if available) */}
                {isChamberBooking && (appointment.chamber || appointment.chamberName) && (() => {
                  const chamberInfo = appointment.chamber || { name: appointment.chamberName, address: appointment.chamberAddress };
                  const mapUrl = directionsUrl(chamberInfo);
                  return (
                    <div className="p-4 mb-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <MapPin size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Visiting Chamber</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{chamberInfo.name}</p>
                        {chamberInfo.address && <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">{chamberInfo.address}</p>}
                        {mapUrl && (
                          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">
                            <Navigation size={12} /> View Map Directions
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Patient Information */}
                <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <UserIcon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Patient Name</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{currentUser?.name}</p>
                  </div>
                  {currentUser?.phone && (
                    <div className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {currentUser.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Trust & Safe Booking Guarantee Banner */}
              <div className="bg-gradient-to-r from-teal-50/80 via-emerald-50/60 to-cyan-50/60 dark:from-teal-950/30 dark:via-emerald-950/20 dark:to-cyan-950/20 rounded-3xl p-5 border border-teal-100 dark:border-teal-900/50 flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-800">
                  <ShieldCheck size={22} className="text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    100% Verified Healthcare Booking
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mt-0.5">
                    Your appointment slot is held instantly. Transparent fees with zero hidden charges.
                  </p>
                </div>
              </div>

            </div>

            {/* ========================================================
                RIGHT COLUMN: Transparent Fee & Payment Structure
                (Full Payment Option REMOVED — Only Platform Fee Exists)
                ======================================================== */}
            <div className="lg:col-span-5 space-y-5 animate-slide-up delay-200">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col h-full relative">
                
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Payment Schedule
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
                      Direct clinic pay model
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-900/60">
                    <ShieldCheck size={12} className="text-emerald-500" /> Verified
                  </span>
                </div>

                {/* Split Payment Visual Cards */}
                <div className="space-y-3 mb-5">
                  
                  {/* Card 1: Pay Online Now (Platform / Booking Fee) */}
                  <div className="relative p-4 rounded-2xl border-2 border-teal-500/80 bg-gradient-to-br from-teal-50/70 via-cyan-50/30 to-white dark:from-teal-950/30 dark:via-cyan-950/20 dark:to-slate-800/80 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Zap size={20} fill="currentColor" strokeWidth={1.5} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-black text-slate-900 dark:text-white">Pay Online Now</span>
                            <span className="text-[10px] font-extrabold text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/60 px-2 py-0.5 rounded-full">
                              {onlinePayableAmount > 0 ? 'Platform Fee' : 'Free Booking'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-snug">
                            {onlinePayableAmount > 0
                              ? 'Slot reservation & platform fee via UPI, Cards'
                              : 'No online payment required to book slot'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 flex items-center justify-end leading-none">
                          <IndianRupee size={18} strokeWidth={2.5} className="mr-0.5 opacity-80" />
                          {onlinePayableAmount}
                        </span>
                        <span className="text-[10px] font-bold text-teal-600/80 dark:text-teal-400/80 block mt-1">
                          {onlinePayableAmount > 0 ? 'Due Today' : 'Zero Fee'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Pay at Clinic on Visit (Consultation Fee) */}
                  <div className="relative p-4 rounded-2xl border border-emerald-200/90 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/60 via-teal-50/20 to-white dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-slate-800/80 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Wallet size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-black text-slate-900 dark:text-white">Pay at Clinic / Hospital</span>
                            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                              On Visit
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-snug">
                            Doctor consultation fee — pay directly at reception (Cash / UPI)
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-end leading-none">
                          <IndianRupee size={18} strokeWidth={2.5} className="mr-0.5 opacity-80" />
                          {consultationFee}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-400/80 block mt-1">
                          Consult Fee
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Itemized Price Breakdown */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-bold text-slate-500 dark:text-slate-400">Doctor Consultation Fee</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center">
                      <IndianRupee size={13} /> {consultationFee}
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 ml-1.5">(at clinic)</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-bold text-slate-500 dark:text-slate-400">
                      Platform Convenience Fee {platformFeePercent > 0 && `(${platformFeePercent}%)`}
                    </span>
                    <span className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center">
                      {platformFeeAmount > 0 ? (
                        <><IndianRupee size={13} /> {platformFeeAmount}</>
                      ) : (
                        <span className="text-emerald-600 font-extrabold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">FREE</span>
                      )}
                    </span>
                  </div>

                  {gstAmount > 0 && (
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="font-bold text-slate-500 dark:text-slate-400">GST ({gstPercent}%)</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center">
                        <IndianRupee size={13} /> {gstAmount}
                      </span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Special Discount</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center">
                        - <IndianRupee size={13} /> {discountAmount}
                      </span>
                    </div>
                  )}

                  {/* Highlighted Total Due Now Box */}
                  <div className="p-4 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white mt-4 flex items-center justify-between shadow-md">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">Total Payable Online</span>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {onlinePayableAmount > 0 ? 'Platform fee to hold your appointment' : 'Zero booking fee required'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-black text-white flex items-center justify-end leading-none">
                        <IndianRupee size={22} strokeWidth={2.5} className="mr-0.5 text-teal-400" />
                        {onlinePayableAmount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Supported Payment Channels (when online amount > 0) */}
                {onlinePayableAmount > 0 && (
                  <div className="pt-3.5 flex items-center justify-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      ⚡ UPI (GPay / PhonePe / Paytm)
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      💳 Cards &amp; NetBanking
                    </span>
                  </div>
                )}

                {/* Primary Action Button */}
                {appointment.bookingFeePaid ? (
                  <Link
                    href="/appointments"
                    className="mt-6 w-full py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white flex items-center justify-center gap-2 transition-transform shadow-lg shadow-emerald-600/30"
                  >
                    <CheckCircle2 size={18} /> Booking Confirmed — View Appointments
                  </Link>
                ) : (
                  <button
                    disabled={processing}
                    onClick={handleConfirm}
                    className={`mt-6 w-full py-4 px-4 rounded-2xl text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white shadow-xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform disabled:opacity-70 ${
                      onlinePayableAmount > 0
                        ? 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 shadow-teal-600/30 hover:from-teal-700 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 shadow-emerald-600/30 hover:from-emerald-700 hover:to-teal-700'
                    }`}
                  >
                    {processing ? (
                      <><Loader2 size={20} className="animate-spin" /> Processing...</>
                    ) : (
                      <>
                        <Zap size={20} fill="currentColor" strokeWidth={1.5} className="shrink-0" />
                        <span>
                          {onlinePayableAmount > 0
                            ? `Pay ₹${onlinePayableAmount} Platform Fee & Confirm`
                            : 'Confirm Booking (Free)'}
                        </span>
                      </>
                    )}
                  </button>
                )}

                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 font-medium pt-3">
                  🔒 256-Bit SSL Encrypted • Instant confirmation via SMS &amp; WhatsApp
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
