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

                {/* WhatsApp Chat */}
                <a
                  href="https://wa.me/918145522359?text=Hello%20Medinex%20World%2C%20I%20need%20assistance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-emerald-500 shrink-0" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.155.57 4.18 1.572 5.928l-1.672 6.104 6.27-1.644c1.704.939 3.655 1.472 5.83 1.472 6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
                  </svg>
                  <span>WhatsApp: +91 81455 22359</span>
                </a>

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
