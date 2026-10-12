"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText, Plus, Trash2, Edit3, Loader2, X, Save, Eye, EyeOff, Wand2,
  Link2, Image as ImageIcon, ClipboardPen, RefreshCcw, Video, Upload,
  ExternalLink, Bold, Italic, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, Minus, Type, Quote, Heading1, Heading2,
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

const DEFAULT_CATEGORIES = ['health-tips', 'news', 'disease-info', 'wellness', 'nutrition'];

type BlogItem = {
  _id: string;
  slug: string;
  title: string;
  titleHi?: string;
  content: string;
  contentHi?: string;
  excerpt?: string;
  excerptHi?: string;
  coverImage?: string;
  author?: string;
  tags?: string[];
  category?: string;
  isPublished?: boolean;
  viewCount?: number;
};

type BlogForm = {
  title: string;
  titleHi: string;
  slug: string;
  content: string;
  contentHi: string;
  excerpt: string;
  excerptHi: string;
  coverImage: string;
  author: string;
  tags: string;
  category: string;
  isPublished: boolean;
};

const createSlug = (title: string) =>
  title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const estimateReadTime = (text: string) => Math.max(1, Math.ceil(countWords(text) / 200));
const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const toEmbedUrl = (url: string): string | null => {
  const yt1 = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  const yt2 = url.match(/youtu\.be\/([^?]+)/);
  const yt3 = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (yt1) return `https://www.youtube.com/embed/${yt1[1]}`;
  if (yt2) return `https://www.youtube.com/embed/${yt2[1]}`;
  if (yt3) return url;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
};

// ── WYSIWYG Rich Text Editor Component ──────────────────────────────────────
interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichEditor = ({ value, onChange, placeholder }: RichEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImgDialog, setShowImgDialog] = useState(false);
  const [showVidDialog, setShowVidDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkText, setLinkText] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [imgAlt, setImgAlt] = useState('');
  const [vidUrl, setVidUrl] = useState('');
  const imgFileRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);

  // Initialize editor content
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When external value changes (e.g. edit mode loads existing content)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value && value !== undefined) {
      el.innerHTML = value;
    }
  }, [value]);

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreRange = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    notifyChange();
  };

  const notifyChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertHTML = (html: string) => {
    editorRef.current?.focus();
    restoreRange();
    document.execCommand('insertHTML', false, html);
    notifyChange();
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    const text = linkText.trim() || linkUrl;
    insertHTML(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color:#0d9488;text-decoration:underline;">${text}</a>`);
    setShowLinkDialog(false);
    setLinkUrl('https://');
    setLinkText('');
  };

  const insertImage = (src: string, alt: string) => {
    insertHTML(`<img src="${src}" alt="${alt || 'image'}" style="max-width:100%;border-radius:8px;margin:12px 0;display:block;" />`);
    setShowImgDialog(false);
    setImgUrl('');
    setImgAlt('');
  };

  const handleImgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      insertImage(reader.result as string, file.name);
    };
    reader.readAsDataURL(file);
  };

  const insertVideo = () => {
    const embed = toEmbedUrl(vidUrl.trim());
    if (!embed) return;
    insertHTML(`<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:16px 0;"><iframe src="${embed}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen loading="lazy"></iframe></div>`);
    setShowVidDialog(false);
    setVidUrl('');
  };

  const toolbarGroups = [
    // Text style
    [
      { icon: <Heading1 size={14} />, label: 'Heading 1', action: () => exec('formatBlock', 'H1') },
      { icon: <Heading2 size={14} />, label: 'Heading 2', action: () => exec('formatBlock', 'H2') },
      { icon: <Type size={14} />, label: 'Paragraph', action: () => exec('formatBlock', 'P') },
    ],
    // Formatting
    [
      { icon: <Bold size={14} />, label: 'Bold', action: () => exec('bold') },
      { icon: <Italic size={14} />, label: 'Italic', action: () => exec('italic') },
      { icon: <Strikethrough size={14} />, label: 'Strikethrough', action: () => exec('strikeThrough') },
      { icon: <span className="text-xs font-black underline">U</span>, label: 'Underline', action: () => exec('underline') },
    ],
    // Alignment
    [
      { icon: <AlignLeft size={14} />, label: 'Align Left', action: () => exec('justifyLeft') },
      { icon: <AlignCenter size={14} />, label: 'Align Center', action: () => exec('justifyCenter') },
      { icon: <AlignRight size={14} />, label: 'Align Right', action: () => exec('justifyRight') },
    ],
    // Lists
    [
      { icon: <List size={14} />, label: 'Bullet List', action: () => exec('insertUnorderedList') },
      { icon: <ListOrdered size={14} />, label: 'Numbered List', action: () => exec('insertOrderedList') },
      { icon: <Quote size={14} />, label: 'Block Quote', action: () => exec('formatBlock', 'BLOCKQUOTE') },
      { icon: <Minus size={14} />, label: 'Divider', action: () => insertHTML('<hr style="border:none;border-top:2px solid #e5e7eb;margin:16px 0;" /><p><br></p>') },
    ],
    // Insert
    [
      {
        icon: <Link2 size={14} />, label: 'Insert Link', action: () => {
          saveRange();
          const sel = window.getSelection();
          if (sel && sel.toString()) setLinkText(sel.toString());
          setShowLinkDialog(v => !v);
          setShowImgDialog(false);
          setShowVidDialog(false);
        }
      },
      {
        icon: <ImageIcon size={14} />, label: 'Insert Image', action: () => {
          saveRange();
          setShowImgDialog(v => !v);
          setShowLinkDialog(false);
          setShowVidDialog(false);
        }
      },
      {
        icon: <Video size={14} />, label: 'Embed Video', action: () => {
          saveRange();
          setShowVidDialog(v => !v);
          setShowLinkDialog(false);
          setShowImgDialog(false);
        }
      },
    ],
    // Medical template
    [
      {
        icon: <Wand2 size={14} />, label: 'Medical Template', action: () => {
          insertHTML(`
            <h2>Symptoms</h2>
            <ul><li>Symptom 1</li><li>Symptom 2</li></ul>
            <h2>When to See a Doctor</h2>
            <ul><li>Point 1</li><li>Point 2</li></ul>
            <h2>Home Care</h2>
            <ul><li>Tip 1</li><li>Tip 2</li></ul>
          `);
        }
      },
    ],
  ];

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-visible bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 flex flex-wrap gap-1 items-center rounded-t-2xl">
        {toolbarGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />}
            {group.map((btn, bi) => (
              <button
                key={bi}
                type="button"
                title={btn.label}
                onMouseDown={e => { e.preventDefault(); btn.action(); }}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors inline-flex items-center justify-center min-w-[28px]"
              >
                {btn.icon}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Popover dialogs */}
      <div className="relative">
        {showLinkDialog && (
          <div className="absolute top-0 left-4 z-30 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-4 w-72 space-y-3 mt-1">
            <p className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Insert Link</p>
            <input placeholder="Link URL (https://...)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 ring-emerald-400/30" />
            <input placeholder="Link text (optional)" value={linkText} onChange={e => setLinkText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 ring-emerald-400/30" />
            <div className="flex gap-2">
              <button type="button" onClick={insertLink}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700">
                <Link2 size={11} /> Insert
              </button>
              <button type="button" onClick={() => setShowLinkDialog(false)}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold">Cancel</button>
            </div>
          </div>
        )}

        {showImgDialog && (
          <div className="absolute top-0 left-4 z-30 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-4 w-72 space-y-3 mt-1">
            <p className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Insert Image</p>
            <input placeholder="Image URL" value={imgUrl} onChange={e => setImgUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 ring-emerald-400/30" />
            <input placeholder="Alt text (optional)" value={imgAlt} onChange={e => setImgAlt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 ring-emerald-400/30" />
            <div className="flex gap-2">
              <button type="button" onClick={() => insertImage(imgUrl.trim(), imgAlt.trim())}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700">
                <ExternalLink size={11} /> Insert URL
              </button>
              <button type="button" onClick={() => imgFileRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">
                <Upload size={11} /> Upload
              </button>
            </div>
            <input ref={imgFileRef} type="file" accept="image/*" className="hidden" onChange={handleImgFileUpload} />
            <button type="button" onClick={() => setShowImgDialog(false)} className="w-full text-xs text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        )}

        {showVidDialog && (
          <div className="absolute top-0 left-4 z-30 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-4 w-72 space-y-3 mt-1">
            <p className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Embed Video</p>
            <input placeholder="YouTube or Vimeo URL" value={vidUrl} onChange={e => setVidUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 ring-blue-400/30" />
            <p className="text-[10px] text-gray-400">Supports youtube.com/watch?v=..., youtu.be/..., vimeo.com/...</p>
            <div className="flex gap-2">
              <button type="button" onClick={insertVideo}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">
                <Video size={11} /> Embed
              </button>
              <button type="button" onClick={() => setShowVidDialog(false)}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={notifyChange}
        onBlur={notifyChange}
        data-placeholder={placeholder}
        className="min-h-[360px] px-6 py-5 text-base leading-loose text-gray-800 dark:text-gray-100 focus:outline-none prose prose-sm dark:prose-invert max-w-none"
        style={{
          fontFamily: 'inherit',
          lineHeight: '1.8',
        }}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 1.75rem; font-weight: 900; margin: 1rem 0 0.5rem; }
        [contenteditable] h2 { font-size: 1.4rem; font-weight: 800; margin: 1rem 0 0.5rem; }
        [contenteditable] h3 { font-size: 1.15rem; font-weight: 700; margin: 0.75rem 0 0.4rem; }
        [contenteditable] ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        [contenteditable] ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        [contenteditable] blockquote { border-left: 4px solid #0d9488; padding-left: 1rem; color: #6b7280; font-style: italic; margin: 0.75rem 0; }
        [contenteditable] a { color: #0d9488; text-decoration: underline; }
        [contenteditable] img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
        [contenteditable] p { margin: 0.4rem 0; }
      `}</style>
    </div>
  );
};

// ── Main Screen ──────────────────────────────────────────────────────────────
export const AdminBlogsScreen = () => {
  const { showToast } = useAppContext();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeEditor, setActiveEditor] = useState<'en' | 'hi'>('en');
  const [preview, setPreview] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const categoriesLoaded = useRef(false);

  // Initialize categories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin_blog_categories');
    let initial = [];
    if (saved) {
      try { initial = JSON.parse(saved); } catch (e) {}
    }
    if (!initial || initial.length === 0) {
      initial = [...DEFAULT_CATEGORIES];
    }
    setCategories(initial);
    categoriesLoaded.current = true;
    fetchBlogs(initial);
  }, []);

  const fetchBlogs = async (currentCategoriesParam?: string[]) => {
    try {
      const res = await fetch(`/api/blogs?all=true&t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const blogItems = data.blogs || [];
        setBlogs(blogItems);
        
        // Make sure blogs' assigned categories exist in the list
        const fromBlogs = blogItems
          .map((b: BlogItem) => b.category)
          .filter((c: string | undefined): c is string => Boolean(c));

        setCategories(prev => {
          const base = currentCategoriesParam || prev;
          const mergedArray = Array.from(new Set([...base, ...fromBlogs]));
          if (categoriesLoaded.current) {
            localStorage.setItem('admin_blog_categories', JSON.stringify(mergedArray));
          }
          return mergedArray;
        });
      }
    } catch {} finally { setLoading(false); }
  };

  const updateForm = <K extends keyof BlogForm>(key: K, value: BlogForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const applySmartExcerpt = () => {
    if (!form.excerpt.trim() && form.content.trim()) {
      updateForm('excerpt', stripHtml(form.content).slice(0, 160));
    }
    if (!form.excerptHi.trim() && form.contentHi.trim()) {
      updateForm('excerptHi', stripHtml(form.contentHi).slice(0, 160));
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateForm('coverImage', reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) { showToast('Title and content required.', 'error'); return; }
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug.trim() || undefined,
      tags: form.tags.split(',').map((s: string) => s.trim()).filter(Boolean),
    };
    try {
      const url = editingSlug ? `/api/blogs/${editingSlug}` : '/api/blogs';
      const method = editingSlug ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        showToast(editingSlug ? 'Blog updated!' : 'Blog created!', 'success');
        setShowForm(false);
        setEditingSlug(null);
        resetForm();
        fetchBlogs();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to save blog.', 'error');
      }
    } catch { showToast('Failed to save blog.', 'error'); }
    finally { setSaving(false); }
  };

  const handleAddCategory = () => {
    const normalized = newCategory.trim().toLowerCase().replace(/\s+/g, '-');
    if (!normalized) { showToast('Please enter a category name.', 'error'); return; }
    if (categories.includes(normalized)) { showToast('Category already exists.', 'error'); return; }
    const next = [...categories, normalized];
    setCategories(next);
    localStorage.setItem('admin_blog_categories', JSON.stringify(next));
    if (!form.category) updateForm('category', normalized);
    setNewCategory('');
    setShowCategoryInput(false);
    showToast('Category added.', 'success');
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    const fallbackCategory = categories.find(c => c !== categoryToDelete) || 'news';
    const usedBy = blogs.filter(b => (b.category || '') === categoryToDelete);
    const confirmText = usedBy.length > 0
      ? `Delete "${categoryToDelete}" and move ${usedBy.length} post(s) to "${fallbackCategory}"?`
      : `Delete "${categoryToDelete}" category?`;
    if (!confirm(confirmText)) return;

    try {
      if (usedBy.length > 0) {
        const results = await Promise.all(
          usedBy.map(b => fetch(`/api/blogs/${b.slug}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: fallbackCategory }),
          }))
        );
        if (results.some(r => !r.ok)) {
          showToast('Failed to reassign some posts. Category not deleted.', 'error');
          return;
        }
      }
      
      const newArray = categories.filter(c => c !== categoryToDelete);
      setCategories(newArray);
      localStorage.setItem('admin_blog_categories', JSON.stringify(newArray));

      if (form.category === categoryToDelete) {
        updateForm('category', newArray.length > 0 ? newArray[0] : '');
      }
      // Re-fetch but without dropping the newly filtered list
      await fetchBlogs(newArray);
      showToast('Category deleted.', 'success');
    } catch {
      showToast('Failed to delete category.', 'error');
    }
  };

  const coverFileRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<BlogForm>({
    title: '', titleHi: '', slug: '', content: '', contentHi: '', excerpt: '', excerptHi: '',
    coverImage: '', author: 'Medinex World', tags: '', category: categories[0] || 'news', isPublished: true,
  });

  const resetForm = () => {
    setForm({ title: '', titleHi: '', slug: '', content: '', contentHi: '', excerpt: '', excerptHi: '', coverImage: '', author: 'Medinex World', tags: '', category: categories[0] || 'news', isPublished: true });
  };

  const handleEdit = (b: BlogItem) => {
    setForm({
      title: b.title, titleHi: b.titleHi || '', slug: b.slug || '', content: b.content, contentHi: b.contentHi || '',
      excerpt: b.excerpt || '', excerptHi: b.excerptHi || '', coverImage: b.coverImage || '',
      author: b.author || 'Medinex World', tags: (b.tags || []).join(', '), category: b.category || categories[0] || 'news',
      isPublished: Boolean(b.isPublished),
    });
    setEditingSlug(b.slug);
    setShowForm(true);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Delete this blog post?')) return;
    try {
      const res = await fetch(`/api/blogs/${slug}`, { method: 'DELETE' });
      if (res.ok) { setBlogs(prev => prev.filter(b => b.slug !== slug)); showToast('Blog deleted.', 'success'); }
    } catch { showToast('Failed to delete.', 'error'); }
  };

  const togglePublish = async (b: BlogItem) => {
    try {
      const res = await fetch(`/api/blogs/${b.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !b.isPublished, publishedAt: !b.isPublished ? new Date() : b.isPublished }),
      });
      if (res.ok) { fetchBlogs(); showToast(b.isPublished ? 'Unpublished.' : 'Published!', 'success'); }
    } catch {}
  };

  return (
    <div className="w-full max-w-none px-4 md:px-8 xl:px-10 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-emerald-600 shrink-0" />
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Blog Management</h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={() => setShowCategoryInput(v => !v)}
            className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700">
            <Plus size={14} /> New Category
          </button>
          <button onClick={() => { setShowForm(true); setEditingSlug(null); resetForm(); setActiveEditor('en'); setPreview(false); }}
            className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700">
            <Plus size={14} /> New Post
          </button>
        </div>
      </div>

      {/* Category input */}
      {showCategoryInput && (
        <div className="mb-4 p-3 rounded-2xl border border-blue-100 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-900/20 flex items-center gap-2">
          <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
            placeholder="Category name (e.g. heart-care)"
            className="flex-1 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-sm outline-none" />
          <button onClick={handleAddCategory} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">Add</button>
          <button onClick={() => { setShowCategoryInput(false); setNewCategory(''); }} className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-xs font-bold">Cancel</button>
        </div>
      )}

      {/* Categories */}
      <div className="mb-5 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Available Categories</p>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => {
            return (
              <span key={c} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {c.replace(/-/g, ' ')}
                <button type="button" onClick={() => handleDeleteCategory(c)}
                  className="p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                  title={`Delete ${c}`}>
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-2 md:p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl my-2 shadow-2xl border border-gray-100 dark:border-gray-800"
            onClick={e => e.stopPropagation()}>

            {/* Sticky modal header */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-6 md:px-8 py-5 border-b border-gray-100 dark:border-gray-800 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-black text-xl text-gray-900 dark:text-white flex items-center gap-2">
                    <ClipboardPen size={20} className="text-emerald-600" />
                    {editingSlug ? 'Edit Post' : 'Create New Post'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Write naturally — formatting is applied instantly as you type.</p>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Title fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Title (English)*" value={form.title} onChange={e => {
                  const v = e.target.value;
                  updateForm('title', v);
                  if (!editingSlug && !form.slug) updateForm('slug', createSlug(v));
                }} className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500/30 outline-none" />
                <input placeholder="Title (Hindi)" value={form.titleHi} onChange={e => updateForm('titleHi', e.target.value)}
                  className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500/30 outline-none" />
              </div>

              {/* Slug + author */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Slug (auto-generated)" value={form.slug} onChange={e => updateForm('slug', createSlug(e.target.value))}
                  className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500/30 outline-none" />
                <input placeholder="Author" value={form.author} onChange={e => updateForm('author', e.target.value)}
                  className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500/30 outline-none" />
              </div>

              {/* Stats bar */}
              <div className="flex flex-wrap gap-4 items-center px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                <span className="text-xs text-gray-600 dark:text-gray-300">EN Words: <strong>{countWords(stripHtml(form.content))}</strong></span>
                <span className="text-xs text-gray-600 dark:text-gray-300">HI Words: <strong>{countWords(stripHtml(form.contentHi))}</strong></span>
                <span className="text-xs text-gray-600 dark:text-gray-300">Read Time: <strong>{estimateReadTime(stripHtml(form.content))} min</strong></span>
                <button type="button" onClick={applySmartExcerpt}
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                  <Wand2 size={12} /> Auto-generate excerpts
                </button>
              </div>

              {/* Editor tabs */}
              <div>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setActiveEditor('en')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${activeEditor === 'en' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'}`}>
                    English
                  </button>
                  <button type="button" onClick={() => setActiveEditor('hi')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${activeEditor === 'hi' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'}`}>
                    Hindi
                  </button>
                  <button type="button" onClick={() => setPreview(p => !p)}
                    className="ml-auto text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                    {preview ? <EyeOff size={12} /> : <Eye size={12} />} {preview ? 'Hide Preview' : 'Live Preview'}
                  </button>
                </div>

                {/* English editor */}
                <div className={activeEditor === 'en' ? 'block' : 'hidden'}>
                  <RichEditor
                    value={form.content}
                    onChange={html => updateForm('content', html)}
                    placeholder="Start writing your blog post in English... Select text and use the toolbar above to format it."
                  />
                </div>

                {/* Hindi editor */}
                <div className={activeEditor === 'hi' ? 'block' : 'hidden'}>
                  <RichEditor
                    value={form.contentHi}
                    onChange={html => updateForm('contentHi', html)}
                    placeholder="हिंदी में ब्लॉग सामग्री यहाँ लिखें..."
                  />
                </div>

                {/* Live preview */}
                {preview && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 max-h-72 overflow-y-auto">
                      <p className="text-[10px] uppercase tracking-wider font-black text-gray-400 mb-3">English Preview</p>
                      {form.content
                        ? <div className="text-sm text-gray-700 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: form.content }} />
                        : <p className="text-xs text-gray-400 italic">No content yet.</p>}
                    </div>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 max-h-72 overflow-y-auto">
                      <p className="text-[10px] uppercase tracking-wider font-black text-gray-400 mb-3">Hindi Preview</p>
                      {form.contentHi
                        ? <div className="text-sm text-gray-700 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: form.contentHi }} />
                        : <p className="text-xs text-gray-400 italic">No content yet.</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Excerpts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <textarea placeholder="Excerpt (English) — auto-generated if blank" value={form.excerpt} onChange={e => updateForm('excerpt', e.target.value)} rows={2}
                  className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500/30 outline-none resize-none" />
                <textarea placeholder="Excerpt (Hindi)" value={form.excerptHi} onChange={e => updateForm('excerptHi', e.target.value)} rows={2}
                  className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500/30 outline-none resize-none" />
              </div>

              {/* Cover image */}
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-emerald-600" /> Cover Image
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                  <div className="md:col-span-2 space-y-2">
                    <input placeholder="Cover Image URL" value={form.coverImage} onChange={e => updateForm('coverImage', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500/30 outline-none" />
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-gray-400 font-semibold">Or upload from device:</p>
                      <button type="button" onClick={() => coverFileRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-bold hover:bg-emerald-100 transition-colors">
                        <Upload size={11} /> Choose File
                      </button>
                      <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </div>
                  </div>
                  <div>
                    <select value={form.category} onChange={e => updateForm('category', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500/30 outline-none">
                      {categories.map(c => <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>)}
                    </select>
                  </div>
                </div>
                {form.coverImage && (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    <img src={form.coverImage} alt="Cover Preview" className="w-full h-52 object-cover" />
                    <button type="button" onClick={() => updateForm('coverImage', '')}
                      className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors">
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 text-white rounded-lg text-[10px] font-bold">Cover Preview</div>
                  </div>
                )}
              </div>

              {/* Tags + Publish */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input placeholder="Tags (comma separated)" value={form.tags} onChange={e => updateForm('tags', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500/30 outline-none" />
                  <p className="text-[10px] text-gray-400 mt-1 pl-1">e.g. diabetes, prevention, heart-health</p>
                </div>
                <label className="flex items-center gap-3 text-sm font-semibold px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <input type="checkbox" checked={form.isPublished} onChange={e => updateForm('isPublished', e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                  <span className="dark:text-white">Publish immediately</span>
                </label>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={() => { if (form.title.trim()) updateForm('slug', createSlug(form.title)); }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 inline-flex items-center gap-1.5 transition-colors">
                  <RefreshCcw size={12} /> Regenerate Slug
                </button>
              </div>

              {/* Save */}
              <button onClick={handleSave} disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors active:scale-[0.99] shadow-lg shadow-emerald-500/20">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingSlug ? 'Update Post' : 'Publish Post'}
              </button>
              <p className="text-[11px] text-center text-gray-400">
                Tip: Keep title under 65 chars and excerpt under 160 chars for better SEO.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Blog List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-emerald-500" /></div>
      ) : (
        <div className="space-y-3">
          {blogs.map(b => (
            <div key={b._id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
              {b.coverImage && (
                <img src={b.coverImage} alt="" className="w-16 h-12 object-cover rounded-xl shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">{b.title}</h3>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${b.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{b.category?.replace(/-/g, ' ')}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{b.viewCount || 0} views</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => togglePublish(b)} className={`p-2 rounded-lg ${b.isPublished ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} transition-colors`}>
                  {b.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => handleEdit(b)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(b.slug)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {blogs.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
              <FileText size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-sm font-bold text-gray-400">No blog posts yet. Create your first post!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
