"use client";
import React, { useState } from 'react';
import { HelpCircle, X, Siren, Bot, Search, ChevronDown, ChevronUp, Mail, PhoneCall, MapPin } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useAppContext } from '@/app/context/AppContext';
import Link from 'next/link';

export const HelpPopup = () => {
  const { t } = useLanguage();
  const { siteSettings } = useAppContext();
  const [open, setOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { q: t('help.faqQ1'), a: t('help.faqA1') },
    { q: t('help.faqQ2'), a: t('help.faqA2') },
    { q: t('help.faqQ3'), a: t('help.faqA3') },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 sm:bottom-28 md:bottom-6 right-3.5 sm:right-5 z-40 w-11 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg shadow-blue-500/25 flex items-center justify-center transition-all hover:scale-105 active:scale-90 border-2 border-white dark:border-slate-800"
        title={t('help.title')}
      >
        <HelpCircle size={20} />
      </button>

      {/* Popup Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[70] flex items-end md:items-center justify-center p-3 pb-[86px] md:p-4 md:pb-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full max-w-md md:w-96 rounded-2xl max-h-[72vh] md:max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700 transition-all"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md z-10">
              <h2 className="font-black text-lg text-gray-900 dark:text-white">{t('help.title')}</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Link href="/enquiry/ambulance" onClick={() => setOpen(false)} className="flex flex-col items-center gap-1.5 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition-colors">
                  <Siren size={20} className="text-red-600" />
                  <span className="text-[10px] font-bold text-red-700 dark:text-red-400 text-center">Ambulance</span>
                </Link>
                <Link href="/ai" onClick={() => setOpen(false)} className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 transition-colors">
                  <Bot size={20} className="text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 text-center">{t('help.useAi')}</span>
                </Link>
                <Link href="/search" onClick={() => setOpen(false)} className="flex flex-col items-center gap-1.5 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl hover:bg-teal-100 transition-colors">
                  <Search size={20} className="text-teal-600" />
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 text-center">{t('help.findDoctor')}</span>
                </Link>
              </div>

              {/* FAQ */}
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">{t('help.faq')}</h3>
                <div className="space-y-2">
                  {faqs.map((faq, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                        className="w-full flex justify-between items-center p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200"
                      >
                        {faq.q}
                        {expandedFaq === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {expandedFaq === i && (
                        <div className="px-3 pb-3 text-xs text-gray-500 dark:text-gray-400">{faq.a}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-2">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{t('help.contact')}</h3>

                {siteSettings.supportPhone && (
                  <a
                    href={`tel:${siteSettings.supportPhone.replace(/[^\d+]/g, '')}`}
                    className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    <PhoneCall size={13} className="shrink-0" />
                    <span>Helpline: {siteSettings.supportPhone}</span>
                  </a>
                )}

                {siteSettings.supportEmail && (
                  <a
                    href={`mailto:${siteSettings.supportEmail}`}
                    className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Mail size={13} className="shrink-0" />
                    <span>{siteSettings.supportEmail}</span>
                  </a>
                )}

                {siteSettings.emergencyPhone && (
                  <a
                    href={`tel:${siteSettings.emergencyPhone.replace(/[^\d+]/g, '')}`}
                    className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline pt-1 border-t border-gray-200/60 dark:border-gray-600/60"
                  >
                    <Siren size={13} className="shrink-0 text-rose-600 animate-pulse" />
                    <span>Emergency: {siteSettings.emergencyPhone} (24/7)</span>
                  </a>
                )}

                {siteSettings.contactAddress && (
                  <div className="flex items-start gap-2 text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                    <MapPin size={13} className="shrink-0 text-gray-400 mt-0.5" />
                    <span>{siteSettings.contactAddress}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
