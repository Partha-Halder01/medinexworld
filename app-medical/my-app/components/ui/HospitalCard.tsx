"use client";
import React from 'react';
import Link from 'next/link';
import { MapPin, Navigation, Building2 } from 'lucide-react';
import { facilityKindLabel } from '@/lib/facilityKind';
import { useLanguage } from '@/app/context/LanguageContext';
import { calculateTotalWithPlatformFee, normalizePlatformFeePercent } from '@/lib/platformFee';

const TYPE_COLORS = {
  government: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  private: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
};

export const HospitalCard = ({ hospital }: { hospital: any }) => {
  const { t, locale } = useLanguage();
  const name = locale === 'hi' && hospital.nameHi ? hospital.nameHi : hospital.name;
  const distanceKm = typeof hospital.distance === 'number' && hospital.distance < 9999 ? hospital.distance : null;
  const platformFeePercent = normalizePlatformFeePercent(hospital.platformFeePercent);
  const labPrices = (hospital.labServices || [])
    .map((service: any) => Math.max(0, Number(service?.price) || 0))
    .filter((price: number) => price > 0);
  const minLabPrice = labPrices.length > 0 ? Math.min(...labPrices) : 0;
  const minDisplayPrice = calculateTotalWithPlatformFee(minLabPrice, platformFeePercent);

  // Calculate dynamic rating based on doctors and services
  const getCalculatedRating = () => {
    const doctorRatings = (hospital.doctors || []).map((d: any) => d.rating || 0).filter((r: number) => r > 0);
    const labRatings = (hospital.labServices || []).map((s: any) => s.rating || 0).filter((r: number) => r > 0);
    const surgeryRatings = (hospital.surgeryServices || []).map((s: any) => s.rating || 0).filter((r: number) => r > 0);
    
    const allRatings = [...doctorRatings, ...labRatings, ...surgeryRatings];
    
    if (allRatings.length > 0) {
      const sum = allRatings.reduce((a, b) => a + b, 0);
      return {
        score: (sum / allRatings.length).toFixed(1),
        count: allRatings.length
      };
    }
    return { score: hospital.rating || 0, count: hospital.reviewCount || 0 };
  };

  return (
    <Link
      href={`/hospital/${hospital._id}`}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] block"
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
          <Building2 size={28} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-extrabold text-gray-900 dark:text-gray-100 text-base leading-tight truncate">{name}</h4>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border shrink-0 ${TYPE_COLORS[hospital.type as keyof typeof TYPE_COLORS]}`}>
              {t(`hospital.${hospital.type}`)}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
              {facilityKindLabel(hospital.facilityKind)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
            {distanceKm !== null ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 px-3 py-1.5 rounded-xl w-fit">
                <Navigation size={13} className="shrink-0" />
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm} km`}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-bold bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-xl w-fit">
                <MapPin size={13} className="shrink-0" /> {(hospital.address || '').split(',')[0]}
              </div>
            )}
            {minDisplayPrice > 0 && (
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 rounded-xl border border-violet-200 dark:border-violet-800">
                Starting {`\u20B9${minDisplayPrice}`}
              </span>
            )}
            <span className="text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors text-center shadow-md shadow-blue-500/20">
              {t('hospital.viewDetails')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
