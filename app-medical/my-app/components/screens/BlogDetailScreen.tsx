"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Eye, User, Loader2, FileText, ChevronRight, Home, BookOpen, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import Link from 'next/link';

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'health-tips', label: 'Health Tips' },
  { key: 'news', label: 'News' },
  { key: 'disease-info', label: 'Disease Info' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'nutrition', label: 'Nutrition' },
];

const categoryColor: Record<string, string> = {
  'health-tips': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'news': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'disease-info': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'wellness': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'nutrition': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export const BlogDetailScreen = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { locale } = useLanguage();

  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarBlogs, setSidebarBlogs] = useState<any[]>([]);
  const [sidebarCat, setSidebarCat] = useState('');
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([]);

  // Fetch current blog
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/blogs/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setBlog(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  // Fetch sidebar blog list
  useEffect(() => {
    setSidebarLoading(true);
    const params = new URLSearchParams({ limit: '15', t: Date.now().toString() });
    if (sidebarCat) params.set('category', sidebarCat);
    fetch(`/api/blogs?${params}`)
      .then(r => r.ok ? r.json() : { blogs: [] })
      .then(data => { setSidebarBlogs(data.blogs || []); setSidebarLoading(false); })
      .catch(() => setSidebarLoading(false));
  }, [sidebarCat]);

  // Fetch related blogs when blog loads
  useEffect(() => {
    if (!blog) return;
    const params = new URLSearchParams({ limit: '4', t: Date.now().toString() });
    if (blog.category) params.set('category', blog.category);
    fetch(`/api/blogs?${params}`)
      .then(r => r.ok ? r.json() : { blogs: [] })
      .then(data => {
        const filtered = (data.blogs || []).filter((b: any) => b.slug !== slug);
        setRelatedBlogs(filtered.slice(0, 3));
      })
      .catch(() => {});
  }, [blog, slug]);

  const title = locale === 'hi' && blog?.titleHi ? blog.titleHi : blog?.title;
  const content = locale === 'hi' && blog?.contentHi ? blog.contentHi : blog?.content;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-32 md:pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 flex-wrap font-medium">
        <Link href="/" className="hover:text-teal-600 flex items-center gap-1 transition-colors"><Home size={14} /> Home</Link>
        <ChevronRight size={14} />
        <Link href="/blog" className="hover:text-teal-600 transition-colors">Blog</Link>
        {blog && (
          <>
            <ChevronRight size={14} />
            <span className="text-gray-700 dark:text-gray-200 truncate max-w-[200px] sm:max-w-[350px] font-semibold">{title}</span>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* ── Left Sidebar ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">Browse Articles</h3>
            </div>

            {/* Category filter */}
            <div className="flex flex-col gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => setSidebarCat(c.key)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-left transition-all ${
                    sidebarCat === c.key
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${sidebarCat === c.key ? 'bg-white' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  {c.label}
                </button>
              ))}
            </div>

            {/* Blog list */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-xs">
              {sidebarLoading ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-teal-500" /></div>
              ) : sidebarBlogs.length === 0 ? (
                <p className="text-xs sm:text-sm text-gray-400 text-center py-8 italic">No articles found.</p>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-[60vh] overflow-y-auto">
                  {sidebarBlogs.map((b: any) => (
                    <Link key={b._id} href={`/blog/${b.slug}`}
                      className={`block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${b.slug === slug ? 'bg-teal-50 dark:bg-teal-900/20 border-l-3 border-teal-500' : ''}`}>
                      <p className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug ${b.slug === slug ? 'text-teal-700 dark:text-teal-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {locale === 'hi' && b.titleHi ? b.titleHi : b.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md ${categoryColor[b.category || ''] || 'bg-gray-100 text-gray-500'}`}>
                          {(b.category || '').replace(/-/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={12} /> {b.viewCount || 0}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* View all link */}
            <Link href="/blog" className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-700 dark:text-gray-300 hover:text-teal-600 rounded-xl text-xs sm:text-sm font-bold transition-all">
              <FileText size={15} /> View All Articles
            </Link>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={36} className="animate-spin text-teal-500" />
            </div>
          ) : !blog ? (
            <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
              <FileText size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500 font-bold">Blog post not found.</p>
              <Link href="/blog" className="text-teal-600 text-sm mt-3 inline-block font-bold hover:underline">← Back to Blog</Link>
            </div>
          ) : (
            <>
              <article className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                {/* Cover image */}
                {blog.coverImage && (
                  <div className="relative h-56 sm:h-72 md:h-96 overflow-hidden">
                    <img src={blog.coverImage} alt={title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}

                <div className="p-6 md:p-10">
                  {/* Category + tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full ${categoryColor[blog.category || ''] || 'bg-gray-100 text-gray-600'}`}>
                      {(blog.category || '').replace(/-/g, ' ')}
                    </span>
                    {blog.tags?.map((tag: string, i: number) => (
                      <span key={i} className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">#{tag}</span>
                    ))}
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-4">{title}</h1>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 pb-6 border-b border-gray-100 dark:border-gray-700">
                    <span className="flex items-center gap-1.5"><User size={15} className="text-teal-500" /> {blog.author || 'Medinex World Editorial'}</span>
                    {blog.publishedAt && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={15} className="text-teal-500" />
                        {new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5"><Eye size={15} className="text-teal-500" /> {blog.viewCount || 0} views</span>
                  </div>

                  {/* Content rendered as HTML */}
                  <div className="mt-6 blog-content text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed font-normal"
                    dangerouslySetInnerHTML={{ __html: content || '' }}
                  />
                </div>
              </article>

              {/* ── Related Posts ── */}
              {relatedBlogs.length > 0 && (
                <section className="mt-10">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp size={20} className="text-teal-600" />
                    <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">You May Also Like</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {relatedBlogs.map((b: any) => (
                      <Link key={b._id} href={`/blog/${b.slug}`}
                        className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md transition-all">
                        {b.coverImage ? (
                          <div className="h-40 overflow-hidden">
                            <img src={b.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        ) : (
                          <div className="h-40 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 flex items-center justify-center">
                            <BookOpen size={36} className="text-teal-200" />
                          </div>
                        )}
                        <div className="p-4 sm:p-5">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${categoryColor[b.category || ''] || 'bg-gray-100 text-gray-500'}`}>
                            {(b.category || '').replace(/-/g, ' ')}
                          </span>
                          <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white mt-2.5 line-clamp-2 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {locale === 'hi' && b.titleHi ? b.titleHi : b.title}
                          </h3>
                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5 font-medium"><Eye size={12} /> {b.viewCount || 0} views</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Mobile: sidebar shown below article */}
              <section className="lg:hidden mt-10">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={18} className="text-teal-600" />
                  <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">More Articles</h2>
                </div>
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1.5 scrollbar-hide">
                  {CATEGORIES.map(c => (
                    <button key={c.key} onClick={() => setSidebarCat(c.key)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        sidebarCat === c.key ? 'bg-teal-600 text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>{c.label}</button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sidebarBlogs.filter(b => b.slug !== slug).slice(0, 4).map((b: any) => (
                    <Link key={b._id} href={`/blog/${b.slug}`}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 hover:border-teal-300 transition-colors">
                      <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-2">
                        {locale === 'hi' && b.titleHi ? b.titleHi : b.title}
                      </p>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full mt-2.5 inline-block ${categoryColor[b.category || ''] || 'bg-gray-100 text-gray-500'}`}>
                        {(b.category || '').replace(/-/g, ' ')}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
