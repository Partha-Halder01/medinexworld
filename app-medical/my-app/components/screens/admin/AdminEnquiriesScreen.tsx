"use client";

import React, { useState, useEffect } from 'react';
import { 
  Siren, 
  FlaskConical, 
  Search, 
  Filter, 
  Phone, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  FileText, 
  IndianRupee, 
  Calendar, 
  ShieldAlert, 
  Trash2, 
  Edit3, 
  X, 
  Send, 
  ExternalLink, 
  Sparkles,
  RefreshCw,
  User,
  Check,
  ChevronRight,
  Navigation,
  Copy,
  Share2,
  Eye,
  CheckCircle,
  Truck,
  ClipboardList
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

export const AdminEnquiriesScreen = () => {
  const { currentUser, showToast } = useAppContext();

  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    ambulanceTotal: 0,
    urgentAmbulance: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'ambulance' | 'test_report'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  // "Urgent ambulances" card: emergency ambulance requests that are still pending.
  // Only counts while the type/status filters still match, so changing either filter turns it off.
  const [urgentOnly, setUrgentOnly] = useState(false);
  const urgentActive = urgentOnly && typeFilter === 'ambulance' && statusFilter === 'pending';
  const activeCard: 'total' | 'pending' | 'urgent' | 'ambulance' | null =
    urgentActive ? 'urgent'
    : typeFilter === 'all' && statusFilter === 'all' && !searchTerm ? 'total'
    : typeFilter === 'all' && statusFilter === 'pending' ? 'pending'
    : typeFilter === 'ambulance' && statusFilter === 'all' ? 'ambulance'
    : null;

  const applyCard = (card: 'total' | 'pending' | 'urgent' | 'ambulance') => {
    setSearchTerm('');
    setUrgentOnly(card === 'urgent');
    setTypeFilter(card === 'urgent' || card === 'ambulance' ? 'ambulance' : 'all');
    setStatusFilter(card === 'pending' || card === 'urgent' ? 'pending' : 'all');
    // The list sits right below the cards; bring it into view on small screens.
    requestAnimationFrame(() => document.getElementById('enquiry-list-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  // Follow-up modal state
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null);
  const [followUpStatus, setFollowUpStatus] = useState<string>('in_progress');
  const [followUpMessage, setFollowUpMessage] = useState<string>('');
  const [quoteAmount, setQuoteAmount] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [sendViaWhatsapp, setSendViaWhatsapp] = useState(true);
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    fetchEnquiries();
  }, [typeFilter, statusFilter]);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await fetch(`/api/admin/enquiries?${params.toString()}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data.enquiries || []);
        if (data.stats) setStats(data.stats);
      } else {
        showToast('Failed to fetch enquiries', 'error');
      }
    } catch {
      showToast('Server communication error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEnquiries();
  };

  const copyText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openFollowUpModal = (enquiry: any) => {
    setSelectedEnquiry(enquiry);
    setFollowUpStatus(enquiry.status || 'in_progress');
    setFollowUpMessage(enquiry.followUpMessage || '');
    setQuoteAmount(enquiry.quoteAmount !== null && enquiry.quoteAmount !== undefined ? String(enquiry.quoteAmount) : '');
    setAdminNotes(enquiry.adminNotes || '');
    setSendViaWhatsapp(true);
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry) return;

    setSavingFollowUp(true);
    try {
      const payload = {
        status: followUpStatus,
        followUpMessage: followUpMessage.trim() || null,
        quoteAmount: quoteAmount === '' ? null : Number(quoteAmount),
        adminNotes: adminNotes.trim() || null,
        followUpBy: currentUser?.name || 'Medinex Healthcare Administrator',
      };

      const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const updated = await res.json();
      if (!res.ok) {
        showToast(updated.error || 'Failed to save follow-up', 'error');
        return;
      }

      // Auto-dispatch via WhatsApp if checked
      const cleanPhone = (selectedEnquiry.patientPhone || '').replace(/[^0-9]/g, '');
      const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const isGuest = !selectedEnquiry.userId;

      if (sendViaWhatsapp && followUpMessage.trim() && formattedPhone) {
        const serviceTitle = selectedEnquiry.type === 'ambulance' ? 'Ambulance Service' : 'Diagnostic Test Inquiry';
        const quoteText = quoteAmount ? `\n*Estimated Quotation:* ₹${quoteAmount}` : '';
        const dispatchText = `Hello ${selectedEnquiry.patientName},\n\nUpdate regarding your Medinex ${serviceTitle} (#${selectedEnquiry.id}):\n*${followUpMessage.trim()}*${quoteText}\n*Status:* ${followUpStatus.replace('_', ' ').toUpperCase()}\n\nMedinex World Healthcare Support`;
        const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(dispatchText)}`;
        window.open(waUrl, '_blank');
      }

      if (isGuest) {
        showToast(
          sendViaWhatsapp && formattedPhone
            ? `Follow-up saved! WhatsApp chat opened to dispatch message to ${selectedEnquiry.patientName}.`
            : 'Follow-up saved! Guest patient can track update using their phone number.',
          'success'
        );
      } else {
        showToast(
          sendViaWhatsapp && formattedPhone
            ? 'Follow-up saved! Message reflected in user panel & WhatsApp opened.'
            : 'Follow-up updated successfully! User can now see this in their panel.',
          'success'
        );
      }

      setSelectedEnquiry(null);
      fetchEnquiries();
    } catch {
      showToast('Error saving follow-up', 'error');
    } finally {
      setSavingFollowUp(false);
    }
  };

  const handleDeleteEnquiry = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Enquiry deleted', 'success');
        fetchEnquiries();
      } else {
        showToast('Failed to delete enquiry', 'error');
      }
    } catch {
      showToast('Error deleting enquiry', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return { 
          bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800', 
          dot: 'bg-blue-500', 
          label: 'In Progress' 
        };
      case 'contacted':
        return { 
          bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800', 
          dot: 'bg-purple-500', 
          label: 'Contacted' 
        };
      case 'resolved':
        return { 
          bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', 
          dot: 'bg-emerald-500', 
          label: 'Resolved' 
        };
      case 'cancelled':
        return { 
          bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700', 
          dot: 'bg-slate-400', 
          label: 'Cancelled' 
        };
      case 'pending':
      default:
        return { 
          bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800', 
          dot: 'bg-amber-500 animate-pulse', 
          label: 'Pending Review' 
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 text-teal-800 dark:text-teal-300 text-xs font-bold tracking-wide uppercase mb-1.5">
            <ClipboardList size={13} className="text-teal-600 dark:text-teal-400" />
            Operations &amp; Dispatch Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Enquiries &amp; Follow-up Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-medium">
            Review live ambulance requests, diagnostic test bookings, and dispatch responses directly via WhatsApp, SMS, or live web tracker.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <a
            href="/profile/enquiries"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-teal-600 hover:border-teal-300 transition-all shadow-xs"
            title="Inspect live customer tracking portal"
          >
            <Eye size={14} />
            <span>Public Tracker View</span>
            <ExternalLink size={11} className="opacity-60" />
          </a>

          <button
            onClick={fetchEnquiries}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 active:scale-95 transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards Ribbon ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Enquiries */}
        <button type="button" onClick={() => applyCard('total')} aria-pressed={activeCard === 'total'}
          className={`text-left w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 active:scale-[0.99] bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 hover:shadow-md transition-all ${activeCard === 'total' ? 'ring-2 ring-slate-400' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Enquiries
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
              <ClipboardList size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 leading-none">
            {stats.total}
          </p>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1.5 truncate">
            Ambulance &amp; test submissions
          </p>
        </button>

        {/* Pending Review */}
        <button type="button" onClick={() => applyCard('pending')} aria-pressed={activeCard === 'pending'}
          className={`text-left w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 active:scale-[0.99] bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 shadow-xs hover:border-amber-300 hover:shadow-md transition-all relative overflow-hidden ${activeCard === 'pending' ? 'ring-2 ring-amber-400' : ''}`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Review
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2 leading-none">
            {stats.pending}
          </p>
          <p className="text-[11px] font-medium text-amber-700/80 dark:text-amber-400/80 mt-1.5 truncate">
            Requires immediate attention
          </p>
        </button>

        {/* Urgent Ambulances */}
        <button type="button" onClick={() => applyCard('urgent')} aria-pressed={activeCard === 'urgent'}
          className={`text-left w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 active:scale-[0.99] bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 shadow-xs hover:border-rose-300 hover:shadow-md transition-all relative overflow-hidden ${activeCard === 'urgent' ? 'ring-2 ring-rose-400' : ''}`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Urgent Ambulances
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <Siren size={16} className={stats.urgentAmbulance > 0 ? 'animate-pulse' : ''} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-2 leading-none">
            {stats.urgentAmbulance}
          </p>
          <p className="text-[11px] font-medium text-rose-700/80 dark:text-rose-400/80 mt-1.5 truncate">
            Emergency pending dispatch
          </p>
        </button>

        {/* Total Ambulance Requests */}
        <button type="button" onClick={() => applyCard('ambulance')} aria-pressed={activeCard === 'ambulance'}
          className={`text-left w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 active:scale-[0.99] bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-teal-200/80 dark:border-teal-900/50 shadow-xs hover:border-teal-300 hover:shadow-md transition-all ${activeCard === 'ambulance' ? 'ring-2 ring-teal-400' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Ambulance Calls
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Truck size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 mt-2 leading-none">
            {stats.ambulanceTotal}
          </p>
          <p className="text-[11px] font-medium text-teal-700/80 dark:text-teal-400/80 mt-1.5 truncate">
            Emergency &amp; transfer bookings
          </p>
        </button>
      </div>

      <div id="enquiry-list-top" className="scroll-mt-4" />
      {/* ── Search & Filter Command Bar ────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Integrated Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient name, mobile number, pickup city, or notes..."
              className="w-full pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); fetchEnquiries(); }}
                className="absolute right-16 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="Clear query"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              Search
            </button>
          </form>

          {/* Type Filter Segmented Tabs */}
          <div className="flex items-center p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0 overflow-x-auto">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>All Enquiries</span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 dark:bg-slate-700 text-[10px] font-black">
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setTypeFilter('ambulance')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                typeFilter === 'ambulance'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              <Siren size={13} />
              <span>Ambulance</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                typeFilter === 'ambulance' ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-slate-700'
              }`}>
                {stats.ambulanceTotal}
              </span>
            </button>

            <button
              onClick={() => setTypeFilter('test_report')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                typeFilter === 'test_report'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-teal-600'
              }`}
            >
              <FlaskConical size={13} />
              <span>Test Reports</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                typeFilter === 'test_report' ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-slate-700'
              }`}>
                {stats.total - stats.ambulanceTotal}
              </span>
            </button>
          </div>

          {/* Status Dropdown */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">Status:</span>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              >
                <option value="all">All Statuses</option>
                <option value="pending">🕒 Pending Review</option>
                <option value="in_progress">⏳ In Progress</option>
                <option value="contacted">📞 Contacted</option>
                <option value="resolved">✅ Resolved</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
              <ChevronRight size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Enquiry Cards Listing ───────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs sm:text-sm font-bold text-slate-500">Retrieving operational enquiries...</p>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Enquiries Match Your Criteria</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, status dropdown, or switch between Ambulance and Test Reports.
          </p>
          {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); setUrgentOnly(false); }}
              className="px-4 py-2 rounded-xl bg-teal-50 text-teal-700 font-bold text-xs hover:bg-teal-100 transition-colors"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.filter(e => !urgentActive || e.urgency === 'emergency').map((enquiry) => {
            const isAmbulance = enquiry.type === 'ambulance';
            const isUrgent = isAmbulance && enquiry.urgency === 'emergency';
            const status = getStatusBadge(enquiry.status);
            const isGuest = !enquiry.userId;

            // Clean phone for links
            const cleanPhone = (enquiry.patientPhone || '').replace(/[^0-9]/g, '');
            const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            const waText = enquiry.followUpMessage
              ? `Hello ${enquiry.patientName}, Medinex update regarding your ${isAmbulance ? 'Ambulance' : 'Diagnostic Test'} request (#${enquiry.id}): ${enquiry.followUpMessage}${enquiry.quoteAmount ? ` (Quotation: ₹${enquiry.quoteAmount})` : ''}`
              : `Hello ${enquiry.patientName}, regarding your Medinex ${isAmbulance ? 'Ambulance' : 'Diagnostic Test'} request (#${enquiry.id}).`;

            return (
              <div
                key={enquiry.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden ${
                  isUrgent && enquiry.status === 'pending'
                    ? 'border-l-4 border-l-rose-500 border-rose-200 dark:border-rose-900/60 ring-1 ring-rose-500/10'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* ── Top Bar: Icon, Title, ID, Badges & Actions ── */}
                <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Service Icon Squircle */}
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                        isAmbulance
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50'
                          : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-900/50'
                      }`}
                    >
                      {isAmbulance ? (
                        <Siren size={22} className={isUrgent ? 'animate-pulse' : ''} />
                      ) : (
                        <FlaskConical size={22} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight truncate">
                          {isAmbulance ? (enquiry.ambulanceType || 'Ambulance Service') : (enquiry.testName || 'Diagnostic Test Enquiry')}
                        </h3>
                        {isUrgent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-xs animate-pulse">
                            <ShieldAlert size={11} /> Urgent Emergency
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          #{enquiry.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(enquiry.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        {isGuest ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.2 rounded-md border border-amber-200/60 dark:border-amber-800/40">
                            Guest Patient
                          </span>
                        ) : (
                          <span className="text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/40 px-2 py-0.2 rounded-md border border-teal-200/60 dark:border-teal-800/40">
                            Registered User (UID #{enquiry.userId})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Pill */}
                  <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${status.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>

                    <button
                      onClick={() => openFollowUpModal(enquiry)}
                      className="px-3.5 py-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-teal-700 hover:to-emerald-700 text-white dark:from-teal-600 dark:to-emerald-600 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                    >
                      <Edit3 size={13} />
                      <span>Give Follow-up</span>
                    </button>

                    <button
                      onClick={() => handleDeleteEnquiry(enquiry.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                      title="Delete enquiry record"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* ── Main Details: 2 Balanced Structured Columns ── */}
                <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                  
                  {/* Left Column: Patient Profile & Direct Action Tools (4 cols) */}
                  <div className="lg:col-span-4 bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Patient Contact
                      </span>
                      <button
                        onClick={() => copyText(enquiry.patientPhone, `phone-${enquiry.id}`)}
                        className="text-slate-400 hover:text-teal-600 p-1"
                        title="Copy phone number"
                      >
                        {copiedId === `phone-${enquiry.id}` ? <Check size={12} className="text-teal-600" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                        {(enquiry.patientName || 'P')[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {enquiry.patientName}
                        </p>
                        <p className="font-semibold text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-teal-500 shrink-0" />
                          <span>{enquiry.patientPhone}</span>
                        </p>
                      </div>
                    </div>

                    {enquiry.city && (
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span>City: <strong className="text-slate-700 dark:text-slate-300">{enquiry.city}</strong></span>
                      </div>
                    )}

                    {/* Direct Dispatch Action Buttons */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs group"
                          title="Open WhatsApp chat with prefilled message"
                        >
                          <MessageSquare size={13} className="text-emerald-600 group-hover:text-white transition-colors" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${enquiry.patientPhone}`}
                          className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                        >
                          <Phone size={13} className="text-slate-500" />
                          <span>Call Patient</span>
                        </a>
                      </div>

                      {/* Guest Tracker Link */}
                      <a
                        href={`/profile/enquiries?phone=${encodeURIComponent(enquiry.patientPhone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-teal-600 rounded-lg text-center font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
                      >
                        <ExternalLink size={11} />
                        <span>View Patient's Tracking Screen</span>
                      </a>
                    </div>
                  </div>

                  {/* Right Column: Route / Diagnostics Details (8 cols) */}
                  <div className="lg:col-span-8 bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {isAmbulance ? 'Emergency Route & Condition' : 'Diagnostic Test Particulars'}
                        </span>
                        {enquiry.scheduledTime && (
                          <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/40">
                            🕒 {enquiry.scheduledTime}
                          </span>
                        )}
                      </div>

                      {isAmbulance ? (
                        <div className="space-y-2.5">
                          {/* Route Visualization */}
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700 space-y-2">
                            <div className="flex items-start gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1 shadow-xs ring-4 ring-emerald-100 dark:ring-emerald-950" />
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400">
                                  Pickup Location
                                </span>
                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                  {enquiry.pickupAddress || 'Address on record'}
                                </p>
                              </div>
                              {enquiry.pickupLat && enquiry.pickupLng && (
                                <a 
                                  href={`https://www.google.com/maps?q=${enquiry.pickupLat},${enquiry.pickupLng}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:underline bg-teal-50 dark:bg-teal-950/40 px-2 py-1 rounded-lg shrink-0"
                                >
                                  <Navigation size={11} />
                                  <span>Maps</span>
                                </a>
                              )}
                            </div>

                            {enquiry.dropAddress && (
                              <div className="flex items-start gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1 shadow-xs ring-4 ring-rose-100 dark:ring-rose-950" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] uppercase font-black text-rose-600 dark:text-rose-400">
                                    Destination Hospital
                                  </span>
                                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                    {enquiry.dropAddress}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {enquiry.patientCondition && (
                            <div className="bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                Clinical Notes &amp; Symptoms:
                              </span>
                              <p className="text-xs text-amber-900 dark:text-amber-200 font-medium mt-0.5">
                                {enquiry.patientCondition}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700 space-y-1.5">
                            <div>
                              <span className="text-[10px] font-black uppercase text-teal-600">Prescribed / Inquired Test</span>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{enquiry.testName}</p>
                            </div>

                            {enquiry.preferredDate && (
                              <div className="text-xs text-slate-600 dark:text-slate-300">
                                Preferred Date: <strong className="text-slate-800 dark:text-slate-100">{enquiry.preferredDate}</strong>
                              </div>
                            )}

                            {enquiry.reportText && (
                              <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                Patient Message: <span className="italic">{enquiry.reportText}</span>
                              </div>
                            )}
                          </div>

                          {enquiry.fileData && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ url: enquiry.fileData, title: enquiry.testName || 'Prescription Document' })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 rounded-xl font-bold text-xs hover:bg-teal-100 transition-colors shadow-2xs"
                            >
                              <FileText size={13} />
                              <span>View Uploaded Prescription / Report Document</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Follow-Up Response Status Bar ──────────────────────── */}
                <div className="bg-slate-50 dark:bg-slate-800/80 px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex-1">
                    {enquiry.followUpMessage ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
                            <CheckCircle2 size={13} /> Live Follow-up Dispatched:
                          </span>
                          {enquiry.followUpDate && (
                            <span className="text-[10px] text-slate-400">
                              ({new Date(enquiry.followUpDate).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })})
                            </span>
                          )}
                          {enquiry.quoteAmount !== null && enquiry.quoteAmount !== undefined && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700">
                              <IndianRupee size={11} /> {enquiry.quoteAmount}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium text-xs leading-relaxed">
                          {enquiry.followUpMessage}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Clock size={14} className="text-amber-500 shrink-0" />
                        <span>No follow-up response provided yet. Click <strong>Give Follow-up</strong> to update the patient.</span>
                      </div>
                    )}
                  </div>

                  {enquiry.adminNotes && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Staff Note:</span> {enquiry.adminNotes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Follow-up Modal Dialog ─────────────────────────────── */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div 
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-950 text-white flex items-center justify-between shrink-0 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Provide Follow-up Response</h3>
                  <p className="text-xs text-slate-300">
                    Enquiry #{selectedEnquiry.id} • {selectedEnquiry.patientName} ({selectedEnquiry.patientPhone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveFollowUp} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Patient Status Alert */}
              {!selectedEnquiry.userId ? (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-3.5 flex items-start gap-2.5">
                  <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-amber-900 dark:text-amber-200">
                      Guest Patient (Not Logged In) • Mobile: {selectedEnquiry.patientPhone}
                    </p>
                    <p className="text-amber-800 dark:text-amber-300 leading-relaxed text-[11px]">
                      This patient can track this follow-up live on the portal using their phone number, and you can dispatch directly via WhatsApp or SMS below.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl p-3 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-teal-900 dark:text-teal-200">
                      Registered Patient (Account ID #{selectedEnquiry.userId})
                    </p>
                    <p className="text-teal-700 dark:text-teal-300 text-[11px] mt-0.5">
                      This update will instantly show up on their authenticated dashboard and profile enquiries page.
                    </p>
                  </div>
                </div>
              )}

              {/* Status Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Enquiry Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="pending">🕒 Pending Review</option>
                  <option value="in_progress">⏳ In Progress / Dispatched</option>
                  <option value="contacted">📞 Patient Contacted</option>
                  <option value="resolved">✅ Resolved / Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>

              {/* Follow-up Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Follow-up Message for Patient
                </label>
                <textarea
                  rows={3}
                  value={followUpMessage}
                  onChange={(e) => setFollowUpMessage(e.target.value)}
                  placeholder="e.g. Ambulance BLS-02 dispatched. Driver Ramesh (+91 98765 43210), live ETA 8 mins."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none text-xs"
                />
              </div>

              {/* Quick Template Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quick Templates:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFollowUpMessage('Ambulance dispatched. Driver will call you within 2 minutes with live ETA.')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    🚑 Ambulance Dispatched
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowUpMessage('Our pathologist has reviewed your prescription. Home sample collection slot scheduled for tomorrow morning.')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    🧪 Home Collection Scheduled
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowUpMessage('Our healthcare coordinator called regarding your request. Please keep your phone reachable.')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    📞 Called User
                  </button>
                </div>
              </div>

              {/* Direct Multi-Channel Dispatch Bar */}
              {(() => {
                const cleanPhone = (selectedEnquiry.patientPhone || '').replace(/[^0-9]/g, '');
                const waNum = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                const serviceLabel = selectedEnquiry.type === 'ambulance' ? 'Ambulance Service' : 'Diagnostic Test Inquiry';
                const quoteText = quoteAmount ? `\n*Estimated Quotation:* ₹${quoteAmount}` : '';
                const waText = `Hello ${selectedEnquiry.patientName},\n\nUpdate regarding your Medinex ${serviceLabel} (#${selectedEnquiry.id}):\n*${followUpMessage.trim() || 'Your request is in progress.'}*${quoteText}\n*Status:* ${followUpStatus.replace('_', ' ').toUpperCase()}\n\nMedinex World Healthcare Support`;

                return (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare size={13} className="text-teal-600" /> Patient Dispatch Tools:
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {selectedEnquiry.patientPhone}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`https://wa.me/${waNum}?text=${encodeURIComponent(waText)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <MessageSquare size={13} />
                        Dispatch via WhatsApp
                      </a>
                      <a
                        href={`sms:${cleanPhone}?body=${encodeURIComponent(
                          `Hello ${selectedEnquiry.patientName}, Medinex update (#${selectedEnquiry.id}): ${followUpMessage || 'Request in progress'}${quoteAmount ? ` (Quote: ₹${quoteAmount})` : ''}`
                        )}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                      >
                        <Phone size={13} />
                        Send SMS
                      </a>
                      <a
                        href={`tel:${selectedEnquiry.patientPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                      >
                        <Phone size={13} />
                        Call
                      </a>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-slate-200/80 dark:border-slate-700">
                      <input
                        type="checkbox"
                        checked={sendViaWhatsapp}
                        onChange={(e) => setSendViaWhatsapp(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded accent-teal-600"
                      />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Automatically open WhatsApp with this message upon clicking "Send &amp; Save Follow-up"
                      </span>
                    </label>
                  </div>
                );
              })()}

              {/* Quotation & Internal Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Quotation Amount (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(e.target.value)}
                      placeholder="e.g. 1200"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Internal Staff Notes
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Staff eyes only..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFollowUp}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {savingFollowUp ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send &amp; Save Follow-up</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Document / Prescription Modal ────────────────────── */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-3xl p-4 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{previewDoc.title}</h4>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img src={previewDoc.url} alt="Prescription Document" className="max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
