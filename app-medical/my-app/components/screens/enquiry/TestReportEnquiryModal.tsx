"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  FlaskConical, 
  FileText, 
  Upload, 
  CheckCircle2, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useRouter } from 'next/navigation';

interface TestReportEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTestName?: string;
}

const COMMON_TESTS = [
  'Complete Blood Count (CBC)',
  'Full Body Health Checkup',
  'Lipid Profile & Cholesterol',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Thyroid Profile (T3, T4, TSH)',
  'Diabetes HbA1c & Fasting Glucose',
  'MRI / CT Scan / X-Ray',
  'Ultrasound / Sonography',
  'Pathology / Biopsy Consultation',
  'Other Diagnostic Test'
];

export const TestReportEnquiryModal: React.FC<TestReportEnquiryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTestName = '',
}) => {
  const { currentUser, showToast } = useAppContext();
  const router = useRouter();

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [city, setCity] = useState('');
  const [testName, setTestName] = useState(initialTestName);
  const [customTestName, setCustomTestName] = useState('');
  const [reportText, setReportText] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
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
    if (initialTestName) {
      setTestName(initialTestName);
    }
  }, [currentUser, initialTestName, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('File size must be under 8MB', 'error');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast('Please enter patient name', 'error');
      return;
    }
    if (!patientPhone.trim() || patientPhone.trim().length < 8) {
      showToast('Please enter a valid phone number', 'error');
      return;
    }

    const selectedTest = testName === 'Other Diagnostic Test' ? customTestName.trim() : testName.trim();
    if (!selectedTest && !reportText.trim() && !fileData) {
      showToast('Please specify a test name, add notes, or upload a prescription/report.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userId: currentUser?._id || null,
        type: 'test_report',
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail.trim() || null,
        city: city.trim() || null,
        testName: selectedTest || 'Medical Test Inquiry',
        reportText: reportText.trim() || null,
        fileData,
        fileType: fileType || null,
        preferredDate: preferredDate || null,
      };

      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to submit inquiry', 'error');
        return;
      }

      setIsSubmitted(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('guest_enquiry_phone', patientPhone.trim());
      }
      showToast('Your test report inquiry has been submitted! Our team will follow up shortly.', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setTestName('');
    setCustomTestName('');
    setReportText('');
    setFileData(null);
    setFileName('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={handleReset}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-auto max-h-[88dvh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <FlaskConical className="text-white" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Test & Lab Report Enquiry</h3>
                <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full tracking-wider">Diagnostic</span>
              </div>
              <p className="text-xs text-teal-100 font-medium">Get discount quotes & expert pathologist review</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 pb-8 sm:pb-6 overflow-y-auto space-y-4 flex-1">
          {isSubmitted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Inquiry Received Successfully!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Our diagnostic partner team is reviewing your requirements. We will contact you at <span className="font-semibold text-slate-800 dark:text-slate-200">{patientPhone}</span> with quotation & home collection slots.
                </p>
              </div>

              <div className="p-3.5 bg-teal-50/70 dark:bg-teal-950/30 rounded-2xl border border-teal-200 dark:border-teal-900/50 text-left">
                <p className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-teal-600 dark:text-teal-400" /> Track Live Follow-up & Quotes
                </p>
                <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5">
                  You can track real-time admin follow-up notes, quotes, and status directly on the portal.
                </p>
                <button
                  onClick={() => {
                    handleReset();
                    router.push(`/profile/enquiries?phone=${encodeURIComponent(patientPhone.trim())}`);
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline"
                >
                  Track Enquiry Live <ArrowRight size={13} />
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Patient contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Mobile Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  City / Location / Pincode
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Kolkata, Salt Lake or your local area"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Test selection */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Test / Package
                </label>
                <select
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="">-- Choose Test or Diagnostic Category --</option>
                  {COMMON_TESTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {testName === 'Other Diagnostic Test' && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Specify Test Name
                  </label>
                  <input
                    type="text"
                    value={customTestName}
                    onChange={(e) => setCustomTestName(e.target.value)}
                    placeholder="Enter test name (e.g. Vitamin D, Echocardiogram)"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Text Enquiry / Description */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Enquiry Details / Symptoms / Questions
                </label>
                <textarea
                  rows={3}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Mention any symptoms, doctor recommendation, home sample collection request, or specific queries..."
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Prescription / Report Upload */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Attach Doctor Prescription or Old Report <span className="text-slate-400 font-normal lowercase">(optional photo/PDF)</span>
                </label>

                {fileData ? (
                  <div className="flex items-center justify-between p-3.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      {fileType.startsWith('image') ? (
                        <img src={fileData} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-teal-300 dark:border-teal-800 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center shrink-0">
                          <FileText size={20} className="text-teal-600 dark:text-teal-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-teal-900 dark:text-teal-200 truncate">{fileName || 'Attached Report Document'}</p>
                        <p className="text-[11px] text-teal-600 dark:text-teal-400">File attached successfully</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Remove file"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-teal-500 dark:hover:border-teal-400 bg-slate-50/50 dark:bg-slate-800/40 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                      <Upload size={18} />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Click to upload prescription or report</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, or PDF up to 8MB</p>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Preferred Date */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Preferred Sample Collection Date <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2 pb-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-sm uppercase tracking-wider shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting Enquiry...
                    </>
                  ) : (
                    <>
                      <FlaskConical size={18} />
                      Submit Test Report Enquiry
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
