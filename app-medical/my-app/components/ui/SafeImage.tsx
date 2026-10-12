"use client";
import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { isDisplayableImage } from '@/lib/imageUrl';

type SafeImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  /** Shown when the URL is unusable or fails to load. Defaults to a neutral placeholder box. */
  fallback?: React.ReactNode;
};

/** <img> that never shows the browser's broken-image icon. */
export function SafeImage({ src, fallback, className = '', alt = '', onError, ...rest }: SafeImageProps) {
  // Remember which URL failed, so a new src gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = isDisplayableImage(src) && failedSrc !== src;

  if (!usable) {
    return (
      <>
        {fallback ?? (
          <div className={`${className} flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600`} aria-label={alt || undefined} role={alt ? 'img' : undefined}>
            <ImageOff size={18} />
          </div>
        )}
      </>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={(src as string).trim()}
      alt={alt}
      className={className}
      loading={rest.loading ?? 'lazy'}
      decoding="async"
      onError={e => {
        setFailedSrc(src as string);
        onError?.(e);
      }}
    />
  );
}
