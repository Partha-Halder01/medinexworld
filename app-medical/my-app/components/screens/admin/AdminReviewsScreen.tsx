"use client";
import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  MessageSquare, 
  User as UserIcon, 
  Building2, 
  Stethoscope, 
  CheckCircle2, 
  X, 
  Loader2,
  Filter,
  MoreVertical
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

export const AdminReviewsScreen = () => {
  const { currentUser, isAuthReady, showToast } = useAppContext();
  const [reviews, setReviews] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'doctor'>('all');

  const [formData, setFormData] = useState({
    targetId: '',
    targetType: 'doctor' as const,
    patientName: '',
    rating: 5,
    text: ''
  });

  useEffect(() => {
    if (isAuthReady && currentUser?._id) {
      fetchData();
    } else if (isAuthReady && !currentUser?._id) {
      setLoading(false);
    }
  }, [currentUser, isAuthReady]);

  const fetchData = async () => {
    if (!currentUser?._id) return;
    setLoading(true);

    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/admin/reviews?userId=${currentUser._id}`);
        if (res.ok) {
          setReviews(await res.json());
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to fetch reviews', 'error');
        }
      } catch (err) {
        showToast('Failed to load reviews', 'error');
      }
    };

    const fetchDoctors = async () => {
      try {
        const res = await fetch('/api/doctors');
        if (res.ok) setDoctors(await res.json());
      } catch {}
    };

    await Promise.all([fetchReviews(), fetchDoctors()]);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingReview(null);
    setFormData({
      targetId: '',
      targetType: 'doctor',
      patientName: '',
      rating: 5,
      text: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (rev: any) => {
    setEditingReview(rev);
    setFormData({
      targetId: rev.doctorId?._id || '',
      targetType: 'doctor',
      patientName: rev.patientName,
      rating: rev.rating,
      text: rev.text
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}?userId=${currentUser._id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Review deleted', 'success');
        setReviews(reviews.filter(r => r._id !== id));
      }
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    try {
      const payload = {
        userId: currentUser._id,
        patientName: formData.patientName,
        rating: formData.rating,
        text: formData.text,
        doctorId: formData.targetId
      };

      let res;
      if (editingReview) {
        res = await fetch(`/api/admin/reviews/${editingReview._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showToast(editingReview ? 'Review updated' : 'Dummy review added', 'success');
        setShowModal(false);
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save', 'error');
      }
    } catch (err) {
      showToast('Error saving review', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(rev => {
    const matchesSearch = 
      rev.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rev.doctorId?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' || 
      (filterType === 'doctor' && rev.doctorId);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Manage Reviews</h2>
          <p className="text-[10px] sm:text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
            Total: {reviews.length} &bull; {filteredReviews.length} filtered
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus size={16} /> Give Dummy Review
        </button>
      </header>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-[2rem] p-3 sm:p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-gray-50 dark:bg-gray-900/50 border-none rounded-xl sm:rounded-2xl text-sm font-bold focus:ring-2 ring-blue-500/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          {(['all', 'doctor'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 md:flex-none px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterType === type 
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg' 
                  : 'bg-gray-50 dark:bg-gray-900/50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Grid */}
      {!isAuthReady || (loading && reviews.length === 0) ? (
        <div className="flex justify-center py-20">
          <Loader2 size={40} className="animate-spin text-blue-500" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-white dark:bg-gray-800 rounded-2xl sm:rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-700">
          <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-bold px-4 text-sm sm:text-base">No reviews found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredReviews.map((rev) => (
            <div key={rev._id} className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <UserIcon size={20} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white leading-tight truncate">{rev.patientName}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEdit(rev)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(rev._id)} className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'} />
                ))}
                {rev.verified && (
                  <span className="ml-2 flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md uppercase tracking-widest">
                    <CheckCircle2 size={10} /> Verified
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic mb-5 line-clamp-3">
                "{rev.text}"
              </p>

              <div className="pt-4 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg shrink-0 bg-blue-50 text-blue-600 dark:bg-opacity-10">
                    <Stethoscope size={12} />
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate">
                    {rev.doctorId?.name || 'Unknown Doctor'}
                  </span>
                </div>
                {!rev.verified && (
                  <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md shrink-0 ml-2">DUMMY</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-[1.5rem] sm:rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-white/10 relative my-auto animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={20} className="text-gray-400" />
            </button>

            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-6 pr-8">
              {editingReview ? 'Edit Review' : 'Create Dummy Review'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Doctor</label>
                  <select 
                    required
                    value={formData.targetId}
                    onChange={e => setFormData({...formData, targetId: e.target.value})}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900/50 border-none rounded-xl sm:rounded-2xl text-sm font-bold focus:ring-2 ring-blue-500/20 outline-none transition-all appearance-none"
                  >
                    <option value="">Select a doctor...</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Patient Name</label>
                  <input 
                    required
                    type="text"
                    value={formData.patientName}
                    onChange={e => setFormData({...formData, patientName: e.target.value})}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900/50 border-none rounded-xl sm:rounded-2xl text-sm font-bold focus:ring-2 ring-blue-500/20 outline-none transition-all"
                    placeholder="e.g. John Smith"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 text-center block">Rating</label>
                  <div className="flex gap-2 sm:gap-3 justify-center py-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, rating: star})}
                        className="transform transition-transform active:scale-90"
                      >
                        <Star size={28} className={star <= formData.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Review Content</label>
                  <textarea 
                    required
                    value={formData.text}
                    onChange={e => setFormData({...formData, text: e.target.value})}
                    rows={3}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900/50 border-none rounded-xl sm:rounded-2xl text-sm font-bold focus:ring-2 ring-blue-500/20 outline-none transition-all resize-none"
                    placeholder="Describe the experience..."
                  />
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4 pt-2 sm:pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editingReview ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
