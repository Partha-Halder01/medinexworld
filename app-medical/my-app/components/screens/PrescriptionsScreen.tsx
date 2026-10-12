"use client";
import React, { useState, useEffect, useRef } from 'react';
import { FileText, FlaskConical, Plus, Trash2, Eye, ArrowLeft, Loader2, X, Upload } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import Link from 'next/link';

type Tab = 'prescription' | 'lab_report';

export const PrescriptionsScreen = () => {
  const { currentUser, showToast } = useAppContext();
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('prescription');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [viewItem, setViewItem] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: '', doctorName: '', hospitalName: '', date: '', notes: '' });
  const [fileData, setFileData] = useState<{ data: string; type: string } | null>(null);

  const fetchItems = async () => {
    if (!currentUser?._id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prescriptions?userId=${currentUser._id}&type=${tab}`);
      if (res.ok) setItems(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [tab, currentUser?._id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('File must be under 5MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => setFileData({ data: reader.result as string, type: file.type });
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!form.title || !form.date || !fileData) { showToast('Title, date, and file are required.', 'error'); return; }
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: currentUser?._id, type: tab, fileData: fileData.data, fileType: fileData.type }),
      });
      if (res.ok) {
        showToast(tab === 'prescription' ? 'Prescription uploaded!' : 'Lab report uploaded!', 'success');
        setShowUpload(false);
        setForm({ title: '', doctorName: '', hospitalName: '', date: '', notes: '' });
        setFileData(null);
        fetchItems();
      } else { showToast('Upload failed.', 'error'); }
    } catch { showToast('Upload failed.', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    try {
      const res = await fetch(`/api/prescriptions/${id}`, { method: 'DELETE' });
      if (res.ok) { setItems(prev => prev.filter(i => i._id !== id)); showToast('Deleted.', 'success'); }
    } catch { showToast('Failed to delete.', 'error'); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-4">
        <ArrowLeft size={16} /> {t('common.back')}
      </Link>

      <h1 className="text-xl font-black text-gray-900 dark:text-white mb-4">{t('profile.digitalPrescriptions')}</h1>

      {/* Tabs */}
      <div className="flex gap-2.5 mb-5">
        <button onClick={() => setTab('prescription')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${tab === 'prescription' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}>
          <FileText size={16} /> {t('profile.prescriptions')}
        </button>
        <button onClick={() => setTab('lab_report')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${tab === 'lab_report' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}>
          <FlaskConical size={16} /> {t('profile.labReports')}
        </button>
      </div>

      {/* Upload Button */}
      <button onClick={() => setShowUpload(true)} className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3.5 rounded-xl font-bold text-sm sm:text-base mb-5 hover:bg-teal-700 active:scale-[0.99] transition shadow-sm">
        <Plus size={18} /> {tab === 'prescription' ? t('profile.uploadPrescription') : t('profile.uploadLabReport')}
      </button>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowUpload(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">{tab === 'prescription' ? t('profile.uploadPrescription') : t('profile.uploadLabReport')}</h2>
              <button onClick={() => setShowUpload(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
            </div>
            <div className="space-y-3.5">
              <input placeholder={`${t('profile.title') || 'Title'}*`} value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3.5 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm sm:text-base dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input placeholder={t('profile.doctorName')} value={form.doctorName} onChange={e => setForm({...form, doctorName: e.target.value})} className="w-full px-3.5 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm sm:text-base dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input placeholder={t('profile.hospitalName')} value={form.hospitalName} onChange={e => setForm({...form, hospitalName: e.target.value})} className="w-full px-3.5 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm sm:text-base dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3.5 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm sm:text-base dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <textarea placeholder={t('profile.notes')} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm sm:text-base dark:bg-gray-700 text-gray-900 dark:text-white h-20 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <div>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:border-teal-500 hover:text-teal-600 transition">
                  <Upload size={18} /> {fileData ? 'File selected' : 'Choose file (max 5MB)'}
                </button>
              </div>
              <button onClick={handleUpload} className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-bold text-sm sm:text-base hover:bg-teal-700 active:scale-[0.99] transition shadow-sm">
                {t('common.upload')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setViewItem(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 max-w-lg w-full max-h-[85vh] overflow-auto shadow-2xl border border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">{viewItem.title}</h3>
              <button onClick={() => setViewItem(null)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
            </div>
            {viewItem.fileType?.startsWith('image/') ? (
              <img src={viewItem.fileData} alt={viewItem.title} className="w-full rounded-xl" />
            ) : (
              <iframe src={viewItem.fileData} className="w-full h-96 rounded-xl" />
            )}
            <div className="mt-3.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1.5 font-medium">
              {viewItem.doctorName && <p><span className="font-bold text-gray-800 dark:text-gray-200">Doctor:</span> {viewItem.doctorName}</p>}
              {viewItem.hospitalName && <p><span className="font-bold text-gray-800 dark:text-gray-200">Hospital:</span> {viewItem.hospitalName}</p>}
              {viewItem.date && <p><span className="font-bold text-gray-800 dark:text-gray-200">Date:</span> {viewItem.date}</p>}
              {viewItem.notes && <p><span className="font-bold text-gray-800 dark:text-gray-200">Notes:</span> {viewItem.notes}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8">
          <FileText size={44} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-medium">{tab === 'prescription' ? t('profile.noPrescriptions') : t('profile.noLabReports')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item._id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between gap-3 hover:border-gray-200 transition">
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate">{item.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{item.doctorName && `Dr. ${item.doctorName} | `}{item.date}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setViewItem(item)} className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition" title="View"><Eye size={17} /></button>
                <button onClick={() => handleDelete(item._id)} className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition" title="Delete"><Trash2 size={17} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
