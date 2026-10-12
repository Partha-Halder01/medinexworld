"use client";
import React from 'react';
import Link from 'next/link';
import { Eye, Clock, FileText } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { SafeImage } from '@/components/ui/SafeImage';
import { isDisplayableImage } from '@/lib/imageUrl';

export const BlogCard = ({ blog, compact }: { blog: any; compact?: boolean }) => {
  const { locale, t } = useLanguage();
  const title = locale === 'hi' && blog.titleHi ? blog.titleHi : blog.title;
  const excerpt = locale === 'hi' && blog.excerptHi ? blog.excerptHi : blog.excerpt;
  const DEFAULT_COVER = '/images/health_wellness_card.jpg';
  const imageSrc = isDisplayableImage(blog.coverImage) ? blog.coverImage : DEFAULT_COVER;

  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-100 dark:border-gray-700/70 shadow-sm hover:shadow-xl hover:border-teal-200 dark:hover:border-teal-800/60 transition-all duration-300 overflow-hidden flex flex-col h-full card-hover-lift"
    >
      {!compact && (
        <div className="relative w-full h-40 overflow-hidden bg-gray-100 dark:bg-gray-900">
          <SafeImage
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            fallback={
              // eslint-disable-next-line @next/next/no-img-element
              <img src={DEFAULT_COVER} alt={title} className="w-full h-full object-cover" />
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
          <span className="absolute top-3 left-3 text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-200 bg-white/95 dark:bg-gray-900/90 backdrop-blur-md px-3 py-1 rounded-lg shadow-sm border border-white/20">
            {blog.category ? blog.category.replace('-', ' ') : 'Health & Care'}
          </span>
        </div>
      )}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {compact && (
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-0.5 rounded-md w-fit mb-2">
            {blog.category ? blog.category.replace('-', ' ') : 'Health'}
          </span>
        )}
        <h3 className="font-extrabold text-base md:text-lg text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
          {title}
        </h3>
        {excerpt && !compact && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
            {excerpt}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700/50 text-xs text-gray-500 dark:text-gray-400 font-semibold">
          {blog.publishedAt && (
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-teal-500" />
              {new Date(blog.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
          <span className="flex items-center gap-1.5 ml-auto">
            <Eye size={13} className="text-teal-500" /> {blog.viewCount || 0} {t('blog.views')}
          </span>
        </div>
      </div>
    </Link>
  );
};
