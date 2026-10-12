"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TestReportEnquiryModal } from '@/components/screens/enquiry/TestReportEnquiryModal';

export default function TestReportPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline mb-4"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Diagnostic & Lab Test Enquiry</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload prescriptions or submit inquiry for lab testing quotes</p>
      </div>

      <TestReportEnquiryModal
        isOpen={isOpen}
        onClose={() => router.push('/')}
        onSuccess={() => {}}
      />
    </div>
  );
}
