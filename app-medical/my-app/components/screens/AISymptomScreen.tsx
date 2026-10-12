"use client";
import React, { useState, useEffect } from 'react';
import { Bot, Mic, Send, AlertTriangle, Stethoscope, Sparkles } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { DoctorCard } from '../ui/DoctorCard';

export const AISymptomScreen = () => {
  const router = useRouter();
  const { aiPreFillSymptoms, handleCategoryClick } = useAppContext();
  const { t, locale } = useLanguage();
  const [symptoms, setSymptoms] = useState(aiPreFillSymptoms || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [matchedDoctors, setMatchedDoctors] = useState<any[]>([]);

  const handleVoiceInput = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setError(locale === 'hi' ? "इस ब्राउज़र में वॉइस इनपुट समर्थित नहीं है। कृपया टाइप करें।" : "Voice input not supported in this browser. Please type.");
      return;
    }
    const recognition = new SpeechRec();
    recognition.lang = locale === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = (e: any) => { setError("Voice input failed: " + e.error); setIsListening(false); };
    recognition.onresult = (e: any) => {
      setSymptoms(prev => prev + " " + e.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.start();
  };

  // Fetch matching doctors when result comes in
  useEffect(() => {
    if (result?.specialist) {
      fetch(`/api/doctors?specialty=${encodeURIComponent(result.specialist)}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setMatchedDoctors(data.sort((a: any, b: any) => a.distance - b.distance)); })
        .catch(err => console.error('Failed to fetch doctors:', err));
    }
  }, [result?.specialist]);

  const analyze = async () => {
    if (!symptoms.trim()) { setError(locale === 'hi' ? "कृपया पहले अपने लक्षण बताएं।" : "Please describe your symptoms first."); return; }
    setLoading(true); setError(''); setResult(null); setMatchedDoctors([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: symptoms }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI analysis");
      }
      
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while connecting to Medinex AI.");
    } finally { setLoading(false); }
  };

  const QUICK_SYMPTOMS = [
    'Severe Headache & Dizziness',
    'High Fever & Body Chills',
    'Persistent Dry Cough',
    'Chest Pain & Shortness of Breath',
    'Stomach Cramps & Nausea',
    'Skin Rash & Itching',
    'Lower Back Pain',
  ];

  return (
    <div className="flex flex-col min-h-full bg-slate-50/60 dark:bg-gray-900 md:pb-12">
      {/* ── Top Clinical Header Banner ── */}
      <div className="bg-gradient-to-r from-teal-50/80 via-white to-sky-50/80 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 border-b border-slate-200/80 dark:border-slate-700 px-6 py-8 md:py-10">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-teal-100/70 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 px-3 py-1 rounded-full text-xs font-bold">
            <Bot size={14} className="text-teal-700 dark:text-teal-400" />
            <span>Medinex Clinical AI • 24/7 Symptom Triage</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AI Symptom Analyzer & Care Match
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
            Describe your health issues in your own words. Medinex AI assesses potential conditions, calculates urgency, and suggests the right doctor specialty.
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* ── Coming Soon Banner ── */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Bot size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-amber-900 dark:text-amber-200">
                  AI Chatbot & Symptom Checker is Coming Soon
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                  Under Upgrade
                </span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 max-w-xl">
                We are currently upgrading our AI clinical diagnostic system. In the meantime, you can search and book confirmed in-clinic appointments with verified specialists.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/search')}
            className="shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-xs transition-colors"
          >
            Find Doctors Near You →
          </button>
        </div>

        {/* ── Input Card ── */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 md:p-7 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Describe Symptoms Or Select Below
            </label>
            <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold">
              English or हिन्दी supported
            </span>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_SYMPTOMS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSymptoms(prev => prev ? `${prev}, ${chip}` : chip)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/60 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700 transition-all active:scale-95"
              >
                + {chip}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={t('ai.placeholder') || "e.g. I have had a severe throbbing headache for 2 days, mild fever of 100°F, and nausea when looking at bright screens..."}
              className="w-full h-36 p-4 border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/60 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none text-gray-800 dark:text-white text-base leading-relaxed transition-all"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={handleVoiceInput}
              title="Voice Input"
              className={`p-3.5 rounded-2xl flex items-center gap-2 transition-all ${
                isListening
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400 animate-pulse ring-2 ring-rose-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-600'
              }`}
            >
              <Mic size={20} />
              <span className="text-xs font-bold hidden sm:inline">
                {isListening ? 'Listening...' : 'Voice Input'}
              </span>
            </button>

            <button
              onClick={analyze}
              disabled={loading || !symptoms.trim()}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-7 py-3 rounded-2xl font-black shadow-lg shadow-teal-600/25 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2.5 transition-all text-sm md:text-base active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Analyze Symptoms</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="text-rose-500 text-xs md:text-sm font-semibold mt-2 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50">
              {error}
            </p>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 border-4 border-teal-200 dark:border-teal-900/50 border-t-teal-600 dark:border-t-teal-400 rounded-full animate-spin" />
            <p className="text-gray-700 dark:text-gray-200 font-bold text-base">Processing clinical triage...</p>
            <p className="text-xs text-gray-400">Comparing symptoms with clinical guidelines</p>
          </div>
        )}

        {/* Result Showcase */}
        {result && (
          <div className="space-y-6">
            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-4 rounded-2xl text-amber-900 dark:text-amber-300 flex items-start gap-3 shadow-xs">
              <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600" />
              <p className="font-medium text-xs md:text-sm leading-relaxed">{result.disclaimer}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Causes */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 mb-4 text-base flex items-center justify-between">
                  <span>{t('ai.possibleCauses')}</span>
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">Differential</span>
                </h3>
                <ul className="space-y-2.5">
                  {result.causes.map((c: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Remedies */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 mb-4 text-base flex items-center justify-between">
                  <span>{t('ai.homeRemedies')}</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">Care Steps</span>
                </h3>
                <ul className="space-y-2.5">
                  {result.remedies.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Specialist Match */}
            <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 dark:from-teal-950/40 dark:via-cyan-950/30 dark:to-blue-950/40 p-6 md:p-8 rounded-3xl border border-teal-200/80 dark:border-teal-800/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-white/80 dark:bg-gray-800/80 px-2.5 py-1 rounded-md">
                  Recommended Medical Specialty
                </span>
                <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center justify-center md:justify-start gap-3 pt-2">
                  <Stethoscope size={28} className="text-teal-600 dark:text-teal-400" />
                  {result.specialist}
                </p>
              </div>
              <button
                onClick={() => { handleCategoryClick(result.specialist); router.push('/search'); }}
                className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-teal-600/30 text-sm transition-all active:scale-95"
              >
                Find & Book {result.specialist} Doctors →
              </button>
            </div>

            {/* Recommended Doctors Section */}
            {matchedDoctors.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                    Matching Specialists Available For Consultation
                  </h3>
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
                    {matchedDoctors.length} Doctors
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchedDoctors.slice(0, 4).map(doc => (
                    <DoctorCard key={doc._id} doctor={doc} showDistance />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
