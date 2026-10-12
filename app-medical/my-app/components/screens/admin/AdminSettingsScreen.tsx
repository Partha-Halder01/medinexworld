"use client";
import React, { useState, useEffect } from 'react';
import {
  Phone, Mail, Siren, MapPin, Save, Loader2,
  Percent, Tag, Activity, CheckCircle2, ShieldCheck, Sparkles,
  Settings, ArrowLeft, RefreshCw
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import Link from 'next/link';

export const AdminSettingsScreen = () => {
  const { currentUser, showToast, fetchSiteSettings } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    supportPhone: '+91 98765 43210',
    supportEmail: 'support@medinexworld.com',
    emergencyPhone: '112',
    contactAddress: '',
    gstPercent: 0,
    discountAmount: 0,
    defaultPlatformFeePercent: 10,
    chamberBookingFee: 50,
  });

  const loadSettings = () => {
    setLoading(true);
    fetch('/api/admin/platform-settings')
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setFormData({
            supportPhone: data.supportPhone || '+91 98765 43210',
            supportEmail: data.supportEmail || 'support@medinexworld.com',
            emergencyPhone: data.emergencyPhone || '112',
            contactAddress: data.contactAddress || '',
            gstPercent: Number(data.gstPercent) || 0,
            discountAmount: Number(data.discountAmount) || 0,
            defaultPlatformFeePercent: Number(data.defaultPlatformFeePercent) || 10,
            chamberBookingFee: data.chamberBookingFee != null ? Number(data.chamberBookingFee) : 50,
          });
        }
      })
      .catch(() => showToast('Failed to load settings', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?._id) {
      showToast('Please log in as admin', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/platform-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser._id,
          ...formData,
        }),
      });

      if (res.ok) {
        showToast('Website contact details and platform settings updated!', 'success');
        if (fetchSiteSettings) await fetchSiteSettings();
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch {
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <Settings className="text-emerald-600 dark:text-emerald-400" size={24} />
              Website & Contact Settings
            </h1>
          </div>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 ml-8">
            Manage the phone numbers, support email, 24/7 emergency helpline, and pricing shown across the website.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={loadSettings}
            disabled={saving}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95"
            title="Reload settings"
          >
            <RefreshCw size={14} className={saving ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Official Website Contact Details */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5 md:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Phone size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Website Contact & Helpline Details
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                These contact details are shown on the patient footer, customer care popup, and direct calling links.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Support Phone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Phone size={13} className="text-teal-600" />
                Support / Helpline Phone Number
              </label>
              <input
                type="text"
                value={formData.supportPhone}
                onChange={e => setFormData({ ...formData, supportPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-2xl text-sm font-semibold text-gray-900 dark:text-white transition-all outline-none"
              />
              <p className="text-[11px] text-gray-400">
                Displayed in the site footer, help popup, and as click-to-call helpline.
              </p>
            </div>

            {/* Support Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Mail size={13} className="text-blue-600" />
                Official Support Email Address
              </label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={e => setFormData({ ...formData, supportEmail: e.target.value })}
                placeholder="support@medinexworld.com"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl text-sm font-semibold text-gray-900 dark:text-white transition-all outline-none"
              />
              <p className="text-[11px] text-gray-400">
                Receives patient enquiries, support mailto links, and official communications.
              </p>
            </div>

            {/* Emergency Phone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Siren size={13} className="text-rose-600 animate-pulse" />
                24/7 Emergency & Ambulance Helpline
              </label>
              <input
                type="text"
                value={formData.emergencyPhone}
                onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                placeholder="112 or +91 99999 11223"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 transition-all outline-none"
              />
              <p className="text-[11px] text-gray-400">
                Dialed directly from the emergency bar, ambulance notices, and urgent care buttons.
              </p>
            </div>

            {/* Contact Address */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <MapPin size={13} className="text-amber-500" />
                Headquarters / Clinic Office Address (Optional)
              </label>
              <input
                type="text"
                value={formData.contactAddress}
                onChange={e => setFormData({ ...formData, contactAddress: e.target.value })}
                placeholder="Naihati, North 24 Parganas, West Bengal 743165"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-2xl text-sm font-semibold text-gray-900 dark:text-white transition-all outline-none"
              />
              <p className="text-[11px] text-gray-400">
                Displayed in the footer and help popup as official service location.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Live Website Preview */}
        <div className="bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-teal-200/60 dark:border-slate-700 p-5 md:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Live Website Preview (How Patients See It)
            </h3>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Phone size={13} className="text-teal-600" />
                Helpline: <strong className="text-teal-700 dark:text-teal-400">{formData.supportPhone || '+91 98765 43210'}</strong>
              </span>
              <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Mail size={13} className="text-blue-500" />
                {formData.supportEmail || 'support@medinexworld.com'}
              </span>
              <span className="font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <Siren size={13} className="text-rose-500 animate-pulse" />
                24/7 Emergency: {formData.emergencyPhone || '112'}
              </span>
            </div>
            {formData.contactAddress && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin size={12} className="text-slate-400 shrink-0" />
                {formData.contactAddress}
              </p>
            )}
          </div>
        </div>

        {/* Card 3: Financial & Commission Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5 md:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Platform Pricing, Tax & Commission
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Global GST, promotional discount rates, and platform transaction fees.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Percent size={13} className="text-blue-500" />
                GST Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.gstPercent}
                  onChange={e => setFormData({ ...formData, gstPercent: Number(e.target.value) })}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-2xl text-sm font-black text-gray-900 dark:text-white outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Tag size={13} className="text-rose-500" />
                Default Patient Discount
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.discountAmount}
                  onChange={e => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-rose-500 rounded-2xl text-sm font-black text-gray-900 dark:text-white outline-none"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-500" />
                Platform Fee Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.defaultPlatformFeePercent}
                  onChange={e => setFormData({ ...formData, defaultPlatformFeePercent: Number(e.target.value) })}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 rounded-2xl text-sm font-black text-gray-900 dark:text-white outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Tag size={13} className="text-teal-500" />
                Chamber Booking Fee
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={formData.chamberBookingFee}
                  onChange={e => setFormData({ ...formData, chamberBookingFee: Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-teal-500 rounded-2xl text-sm font-black text-gray-900 dark:text-white outline-none"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Flat fee patients pay online to book a doctor&apos;s chamber. The consultation fee is paid at the chamber. Set 0 to make booking free.
              </p>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>Save All Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
