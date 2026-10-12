"use client";
import React, { useState, useEffect } from 'react';
import { FileText, Loader2, TrendingUp, Eye, BookOpen, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { BlogCard } from '@/components/ui/BlogCard';
import Link from 'next/link';

const CATEGORIES = [
  { key: '', label: 'All Articles', color: 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' },
  { key: 'health-tips', label: 'Health Tips', color: 'bg-emerald-600 text-white' },
  { key: 'news', label: 'News', color: 'bg-blue-600 text-white' },
  { key: 'disease-info', label: 'Disease Info', color: 'bg-red-600 text-white' },
  { key: 'wellness', label: 'Wellness', color: 'bg-violet-600 text-white' },
  { key: 'nutrition', label: 'Nutrition', color: 'bg-amber-500 text-white' },
];

type BlogListItem = {
  _id: string; slug: string; title: string; titleHi?: string;
  excerpt?: string; excerptHi?: string; coverImage?: string;
  category?: string; publishedAt?: string; viewCount?: number; tags?: string[];
};

export const BlogListScreen = () => {
  const { locale } = useLanguage();
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [popularPosts, setPopularPosts] = useState<BlogListItem[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Fetch blog list
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '8', page: String(currentPage), t: Date.now().toString() });
    if (category) params.set('category', category);
    fetch(`/api/blogs?${params}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { blogs: [], total: 0, pages: 1 })
      .then(data => {
        setBlogs(data.blogs || []);
        setTotalPages(Math.max(1, data.pages || 1));
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, currentPage]);

  // Fetch popular posts + tags once
  useEffect(() => {
    fetch(`/api/blogs?limit=10&t=${Date.now()}`)
      .then(r => r.ok ? r.json() : { blogs: [] })
      .then(data => {
        const posts: BlogListItem[] = data.blogs || [];
        setPopularPosts([...posts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 4));
        const tagSet = new Set<string>();
        posts.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
        setAllTags(Array.from(tagSet).slice(0, 12));
      })
      .catch(() => {});
  }, []);

  const handleCategoryChange = (key: string) => {
    setCategory(key);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-[100rem] mx-auto px-4 py-6 pb-32 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
          <FileText size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Health & Wellness Guides</h1>
          <p className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expert medical insights for your everyday wellbeing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* ── Left Sidebar ── */}
        <aside className="hidden lg:block space-y-6">
          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <BookOpen size={14} /> Categories
              </h3>
            </div>
            <div className="p-3 space-y-1">
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => handleCategoryChange(c.key)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-left transition-all ${
                    category === c.key
                      ? c.color + ' shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}>
                  <span>{c.label}</span>
                  {category === c.key && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Popular Posts */}
          {popularPosts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-teal-500" /> Popular Posts
                </h3>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {popularPosts.map((p, i) => (
                  <Link key={p._id} href={`/blog/${p.slug}`}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <span className="text-2xl font-black text-gray-200 dark:text-gray-700 shrink-0 w-6 text-center leading-none mt-0.5">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {locale === 'hi' && p.titleHi ? p.titleHi : p.title}
                      </p>
                      <span className="text-xs text-gray-400 flex items-center gap-1 mt-1 font-medium">
                        <Eye size={12} /> {p.viewCount || 0} views
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900/20 dark:hover:text-teal-400 transition-colors cursor-default">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Main Content ── */}
        <div className="min-w-0">
          {/* Mobile: horizontal category scroll */}
          <div className="lg:hidden flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => handleCategoryChange(c.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  category === c.key ? c.color : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                {c.label}
              </button>
            ))}
          </div>

          {!loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-4 uppercase tracking-wider">
              {total > 0
                ? `${total} article${total !== 1 ? 's' : ''}${category ? ` in "${CATEGORIES.find(c => c.key === category)?.label}"` : ''}`
                : 'No articles'}
            </p>
          )}

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={36} className="animate-spin text-teal-500" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
              <FileText size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-sm font-bold text-gray-400">No articles found in this category.</p>
              <button onClick={() => handleCategoryChange('')} className="mt-3 text-teal-600 text-xs font-bold hover:underline">View all articles</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {blogs.map(blog => <BlogCard key={blog._id} blog={blog} />)}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    ← Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const p = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                      if (p < 1 || p > totalPages) return null;
                      return (
                        <button key={p} onClick={() => setCurrentPage(p)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${p === currentPage ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'}`}>
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
