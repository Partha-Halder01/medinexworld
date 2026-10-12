"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Siren, 
  FlaskConical, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  FileText, 
  IndianRupee, 
  Calendar, 
  Phone, 
  ShieldAlert, 
  Plus, 
  Sparkles, 
  ExternalLink, 
  MessageSquare, 
  X,
  Search,
  User,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { TestReportEnquiryModal } from '@/components/screens/enquiry/TestReportEnquiryModal';
import { AmbulanceEnquiryModal } from '@/components/screens/enquiry/AmbulanceEnquiryModal';

export const UserEnquiriesScreen = () => {
  const router = useRouter();
  const { currentUser, isLoggedIn, isAuthReady, showToast } = useAppContext();

  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'ambulance' | 'test_report'>('all');

  // Guest tracking state
  const [trackingPhone, setTrackingPhone] = useState<string>('');
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Modals
  const [showTestModal, setShowTestModal] = useState(false);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  
  // Image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;

    if (currentUser?._id) {
      // Logged-in user: fetch their enquiries
      fetchUserEnquiries(currentUser._id);
    } else {
      // Guest user: check URL or localStorage for phone
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlPhone = urlParams.get('phone');
        const cachedPhone = localStorage.getItem('guest_enquiry_phone');
        const phoneToUse = urlPhone || cachedPhone;

        if (phoneToUse) {
          setTrackingPhone(phoneToUse);
          fetchGuestEnquiries(phoneToUse);
        } else {
          setLoading(false);
        }
      }
    }
  }, [currentUser?._id, isAuthReady]);

  const fetchUserEnquiries = async (userId: string | number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/enquiries?userId=${userId}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setEnquiries(Array.isArray(data) ? data : []);
      } else {
        showToast('Could not load your enquiries', 'error');
      }
    } catch {
      showToast('Failed to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestEnquiries = async (phone: string) => {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 5) {
      showToast('Please enter at least 5 digits of your phone number', 'error');
      return;
    }

    setLoading(true);
    setIsSearchingPhone(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/enquiries?phone=${encodeURIComponent(cleanPhone)}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const found = Array.isArray(data) ? data : [];
        setEnquiries(found);
        if (found.length === 0) {
          showToast('No enquiries found matching this phone number.', 'error');
        } else {
          localStorage.setItem('guest_enquiry_phone', cleanPhone);
        }
      } else {
        showToast('Could not find enquiries for this phone number', 'error');
      }
    } catch {
      showToast('Failed to connect to server', 'error');
    } finally {
      setLoading(false);
      setIsSearchingPhone(false);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingPhone.trim()) {
      fetchGuestEnquiries(trackingPhone.trim());
    }
  };

  const filtered = enquiries.filter((e) => {
    if (activeTab === 'all') return true;
    return e.type === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return {
          bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          label: 'In Progress / Dispatched',
        };
      case 'contacted':
        return {
          bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
          label: 'Team Contacted',
        };
      case 'resolved':
        return {
          bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          label: 'Resolved / Completed',
        };
      case 'cancelled':
        return {
          bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
          label: 'Cancelled',
        };
      case 'pending':
      default:
        return {
          bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          label: 'Pending Review',
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(currentUser ? '/profile' : '/')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={19} />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                {currentUser ? 'My Enquiries & Follow-ups' : 'Track Enquiry & Follow-up'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Track real-time ambulance dispatch & diagnostic test quotations
              </p>
            </div>
          </div>

          {/* Quick Submit Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAmbulanceModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all"
            >
              <Siren size={15} /> + Ambulance
            </button>
            <button
              onClick={() => setShowTestModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all"
            >
              <FlaskConical size={15} /> + New Enquiry
            </button>
          </div>
        </div>

        {/* Filter Tabs (when enquiries exist) */}
        {enquiries.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 flex gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-2.5 pb-2.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Enquiries ({enquiries.length})
            </button>
            <button
              onClick={() => setActiveTab('ambulance')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'ambulance'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30'
              }`}
            >
              <Siren size={14} /> Ambulance ({enquiries.filter((e) => e.type === 'ambulance').length})
            </button>
            <button
              onClick={() => setActiveTab('test_report')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'test_report'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50 dark:hover:bg-teal-950/30'
              }`}
            >
              <FlaskConical size={14} /> Test Reports ({enquiries.filter((e) => e.type === 'test_report').length})
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">

        {/* ── 📱 GUEST TRACKING SEARCH BAR (if not logged in) ──────────────── */}
        {!currentUser && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Search size={17} className="text-teal-600" /> Track Request as Guest Patient
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Enter the phone number used when submitting your Ambulance or Test inquiry to see live driver updates & quotes.
                </p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-600 hover:underline shrink-0"
              >
                Sign In to Save History <ArrowRight size={14} />
              </button>
            </div>

            <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter phone number (e.g. 9876543210)"
                  value={trackingPhone}
                  onChange={(e) => setTrackingPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-sm sm:text-base font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingPhone}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0 active:scale-[0.99]"
              >
                {isSearchingPhone ? 'Searching...' : 'Track Status'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs sm:text-sm font-bold text-slate-500">Loading your enquiries & live updates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 text-center border border-slate-200/80 dark:border-slate-700 space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
              <MessageSquare size={32} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {hasSearched ? 'No Enquiries Found for This Number' : 'No Active Enquiries'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                {hasSearched 
                  ? 'Please ensure you entered the exact phone number submitted with your request, or submit a new inquiry below.'
                  : 'You have not submitted any test report or emergency ambulance service requests yet.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowAmbulanceModal(true)}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                <Siren size={16} /> Book Ambulance
              </button>
              <button
                onClick={() => setShowTestModal(true)}
                className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                <FlaskConical size={16} /> Submit Test Report
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((enquiry) => {
              const isAmbulance = enquiry.type === 'ambulance';
              const status = getStatusBadge(enquiry.status);

              return (
                <div
                  key={enquiry.id}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4 transition-all"
                >
                  {/* Top Card Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          isAmbulance
                            ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                            : 'bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400'
                        }`}
                      >
                        {isAmbulance ? <Siren size={20} /> : <FlaskConical size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                            {isAmbulance ? `Ambulance: ${enquiry.ambulanceType || 'Rapid Transfer'}` : enquiry.testName}
                          </h3>
                          <span className="text-xs font-bold text-slate-400">#{enquiry.id}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                          <span>Patient: <strong className="text-slate-700 dark:text-slate-300 font-bold">{enquiry.patientName}</strong></span>
                          <span>•</span>
                          <span>{new Date(enquiry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${status.bg}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    {isAmbulance ? (
                      <>
                        <div className="space-y-1 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                          <p className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin size={13} className="text-red-600" /> Pickup Location
                          </p>
                          <p className="text-slate-800 dark:text-slate-200 font-medium">
                            {enquiry.pickupAddress}
                          </p>
                        </div>

                        {enquiry.dropAddress && (
                          <div className="space-y-1 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                            <p className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin size={13} className="text-teal-600" /> Drop Hospital / Destination
                            </p>
                            <p className="text-slate-800 dark:text-slate-200 font-medium">
                              {enquiry.dropAddress}
                            </p>
                          </div>
                        )}

                        {enquiry.patientCondition && (
                          <div className="sm:col-span-2 space-y-1 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                            <p className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                              Medical Condition / Notes
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                              {enquiry.patientCondition}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {enquiry.reportText && (
                          <div className="sm:col-span-2 space-y-1 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                            <p className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                              Your Enquiry Notes
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                              {enquiry.reportText}
                            </p>
                          </div>
                        )}

                        {enquiry.preferredDate && (
                          <div className="space-y-1 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                            <p className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                              <Calendar size={13} className="text-teal-600" /> Preferred Date
                            </p>
                            <p className="text-slate-800 dark:text-slate-200 font-medium">
                              {enquiry.preferredDate}
                            </p>
                          </div>
                        )}

                        {enquiry.fileData && (
                          <div className="space-y-1 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                            <p className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                              <FileText size={13} className="text-teal-600" /> Attached Prescription / Report
                            </p>
                            <button
                              type="button"
                              onClick={() => setPreviewImage(enquiry.fileData)}
                              className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold hover:underline"
                            >
                              <ExternalLink size={14} /> View Attached Document
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* ── 🌟 LIVE ADMIN FOLLOW-UP RESPONSE SECTION ── */}
                  <div className="pt-2">
                    {enquiry.followUpMessage ? (
                      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-800 p-4 sm:p-5 rounded-2xl border border-emerald-300 dark:border-emerald-800 space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                              <Sparkles size={14} />
                            </div>
                            <span className="font-extrabold text-xs sm:text-sm text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">
                              Live Dispatcher / Admin Response
                            </span>
                          </div>
                          {enquiry.followUpDate && (
                            <span className="text-xs text-emerald-700/80 dark:text-emerald-400 font-medium">
                              {new Date(enquiry.followUpDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold leading-relaxed bg-white/90 dark:bg-slate-900/80 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                          {enquiry.followUpMessage}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                          {enquiry.quoteAmount !== null && enquiry.quoteAmount !== undefined && (
                            <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                              Estimated Quotation: ₹{enquiry.quoteAmount}
                            </span>
                          )}
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            Dispatched by {enquiry.followUpBy || 'Medinex Healthcare Desk'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock size={16} className="text-amber-500 shrink-0" />
                        <span>
                          Our emergency dispatch / diagnostic support team is reviewing your inquiry. Follow-up notes, driver ETA or test package quotes will show here as soon as updated.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document / Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-3xl p-4 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Attached Document Preview</h4>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img src={previewImage} alt="Attachment" className="max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* Enquiry Modals */}
      <TestReportEnquiryModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        onSuccess={() => {
          if (currentUser?._id) fetchUserEnquiries(currentUser._id);
          else if (trackingPhone) fetchGuestEnquiries(trackingPhone);
        }}
      />
      <AmbulanceEnquiryModal
        isOpen={showAmbulanceModal}
        onClose={() => setShowAmbulanceModal(false)}
        onSuccess={() => {
          if (currentUser?._id) fetchUserEnquiries(currentUser._id);
          else if (trackingPhone) fetchGuestEnquiries(trackingPhone);
        }}
      />
    </div>
  );
};
