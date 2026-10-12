"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Images } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';

export type GalleryPhoto = { src: string; caption?: string };

/** Thumbnail grid with a full-screen viewer (arrow keys / Esc supported). */
export function PhotoGallery({
  photos,
  limit,
  compact = false,
  onViewAll,
}: {
  photos: GalleryPhoto[];
  /** Show at most this many thumbnails; the last one becomes a "+N more" tile. */
  limit?: number;
  compact?: boolean;
  onViewAll?: () => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const total = photos.length;

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => setOpenIndex(i => (i === null ? i : (i + delta + total) % total)),
    [total]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, close, step]);

  if (total === 0) return null;

  const shown = limit && total > limit ? photos.slice(0, limit) : photos;
  const hidden = total - shown.length;
  const thumbCls = compact ? 'h-20 sm:h-24' : 'h-32 sm:h-40';

  return (
    <>
      <div className={`grid gap-2 ${compact ? 'grid-cols-4 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {shown.map((photo, idx) => {
          const isMoreTile = hidden > 0 && idx === shown.length - 1;
          return (
            <button
              key={`${idx}-${photo.src.slice(-24)}`}
              type="button"
              onClick={() => (isMoreTile && onViewAll ? onViewAll() : setOpenIndex(idx))}
              className={`group relative ${thumbCls} rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-teal-500`}
              aria-label={photo.caption ? `View photo: ${photo.caption}` : `View photo ${idx + 1}`}
            >
              <SafeImage
                src={photo.src}
                alt={photo.caption || `Photo ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {photo.caption && !compact && (
                <span className="absolute bottom-0 inset-x-0 px-2.5 py-1.5 text-[11px] font-bold text-white bg-gradient-to-t from-black/70 to-transparent text-left truncate">
                  {photo.caption}
                </span>
              )}
              {isMoreTile && (
                <span className="absolute inset-0 bg-black/55 flex items-center justify-center gap-1.5 text-white font-black text-sm">
                  <Images size={16} /> +{hidden + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          <button type="button" onClick={close} aria-label="Close" className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <X size={22} />
          </button>
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); step(-1); }}
                aria-label="Previous photo"
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); step(1); }}
                aria-label="Next photo"
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
          <div onClick={e => e.stopPropagation()} className="max-w-5xl w-full flex flex-col items-center">
            <SafeImage
              src={photos[openIndex].src}
              alt={photos[openIndex].caption || `Photo ${openIndex + 1}`}
              className="max-h-[78vh] w-auto max-w-full object-contain rounded-2xl"
              loading="eager"
            />
            <p className="mt-3 text-sm text-white/80 font-semibold text-center">
              {photos[openIndex].caption ? `${photos[openIndex].caption} · ` : ''}
              {openIndex + 1} / {total}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
