"use client";
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Stethoscope,
  Users,
  AlertTriangle,
  Loader2,
  Check,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

interface Specialty {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  doctorCount?: number;
}

export const AdminSpecialtiesScreen = () => {
  const { showToast } = useAppContext();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deletingSpecialty, setDeletingSpecialty] = useState<Specialty | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSpecialties = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/specialties', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSpecialties(data);
      } else {
        showToast(data.error || 'Failed to load specialties', 'error');
      }
    } catch {
      showToast('Error loading specialties', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const openAddModal = () => {
    setEditingSpecialty(null);
    setFormData({ name: '', description: '', isActive: true });
    setShowModal(true);
  };

  const openEditModal = (spec: Specialty) => {
    setEditingSpecialty(spec);
    setFormData({
      name: spec.name,
      description: spec.description || '',
      isActive: spec.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Specialty name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSpecialty) {
        // PATCH
        const res = await fetch(`/api/admin/specialties/${editingSpecialty.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim(),
            isActive: formData.isActive,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showToast(`Specialty "${data.name}" updated successfully!`, 'success');
          setShowModal(false);
          fetchSpecialties();
        } else {
          showToast(data.error || 'Failed to update specialty', 'error');
        }
      } else {
        // POST
        const res = await fetch('/api/admin/specialties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim(),
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showToast(`Specialty "${data.name}" added successfully!`, 'success');
          setShowModal(false);
          fetchSpecialties();
        } else {
          showToast(data.error || 'Failed to add specialty', 'error');
        }
      }
    } catch {
      showToast('Failed to save specialty', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (spec: Specialty) => {
    try {
      const res = await fetch(`/api/admin/specialties/${spec.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !spec.isActive }),
      });
      if (res.ok) {
        showToast(
          `Specialty "${spec.name}" marked as ${!spec.isActive ? 'Active' : 'Inactive'}!`,
          'success'
        );
        fetchSpecialties();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update status', 'error');
      }
    } catch {
      showToast('Network error updating status', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deletingSpecialty) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/specialties/${deletingSpecialty.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Specialty "${deletingSpecialty.name}" deleted.`, 'success');
        setDeletingSpecialty(null);
        fetchSpecialties();
      } else {
        showToast(data.error || 'Failed to delete specialty', 'error');
      }
    } catch {
      showToast('Failed to delete specialty', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredSpecialties = specialties.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (statusFilter === 'Active' && !s.isActive) return false;
    if (statusFilter === 'Inactive' && s.isActive) return false;
    return true;
  });

  const totalSpecialties = specialties.length;
  const activeSpecialtiesCount = specialties.filter((s) => s.isActive).length;
  const totalDoctorsCount = specialties.reduce((acc, s) => acc + (s.doctorCount || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sparkles size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                Medical Specialties
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Admin controls the list of specialties. Doctors can only select from these approved specialties.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSpecialties}
            className="p-2.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl transition-all"
            title="Refresh list"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus size={18} />
            <span>Add Specialty</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Specialties</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{totalSpecialties}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active in Dropdowns</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{activeSpecialtiesCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registered Doctors</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{totalDoctorsCount}</p>
          </div>
        </div>
      </div>

      {/* Info Notice Box */}
      <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-800 dark:text-blue-300">
        <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">How Specialty Control Works:</p>
          <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
            Only administrators can add, edit, or toggle specialties. When prospective doctors apply or when registered doctors edit their profile, they will choose from the active specialties listed below via a fixed dropdown selection.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search specialties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 self-start sm:self-auto shrink-0">
          {(['All', 'Active', 'Inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === filter
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin text-emerald-600" />
            <p className="text-xs text-gray-400">Loading specialties...</p>
          </div>
        ) : filteredSpecialties.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto text-gray-400">
              <Sparkles size={24} />
            </div>
            <p className="text-base font-bold text-gray-700 dark:text-gray-300">No specialties found</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {searchTerm ? `No specialty matching "${searchTerm}". Try adjusting your search.` : 'Click "Add Specialty" to create the first specialty.'}
            </p>
            {!searchTerm && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold mt-2"
              >
                <Plus size={16} /> Add Specialty
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">
                    Specialty Name
                  </th>
                  <th className="px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">
                    Doctors
                  </th>
                  <th className="px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredSpecialties.map((spec) => (
                  <tr key={spec.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-900/30 transition-colors">
                    {/* Name & Description */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                          {spec.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{spec.name}</p>
                          {spec.description ? (
                            <p className="text-xs text-gray-400 truncate max-w-md mt-0.5">{spec.description}</p>
                          ) : (
                            <p className="text-[11px] text-gray-400 italic">No description provided</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Doctors Count */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-gray-700/60 text-slate-700 dark:text-gray-300 text-xs font-bold">
                        <Stethoscope size={13} className="text-emerald-600" />
                        <span>{spec.doctorCount ?? 0} {spec.doctorCount === 1 ? 'Doctor' : 'Doctors'}</span>
                      </div>
                    </td>

                    {/* Status Toggle Badge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(spec)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                          spec.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {spec.isActive ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                            <span>Active in Dropdown</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} className="text-gray-400" />
                            <span>Inactive (Hidden)</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(spec)}
                          className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-all"
                          title="Edit specialty"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingSpecialty(spec)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all"
                          title="Delete specialty"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Specialty Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                  <Sparkles size={16} />
                </div>
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                  {editingSpecialty ? 'Edit Specialty' : 'Add New Specialty'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Specialty Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oncologist, Ophthalmologist, Radiologist"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Description / Department (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Short description of this medical branch..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                />
              </div>

              {editingSpecialty && (
                <div className="pt-1 flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Active in Dropdowns</p>
                    <p className="text-[11px] text-gray-400">Doctors can select this specialty when active</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      formData.isActive ? 'bg-emerald-600 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingSpecialty ? 'Update Specialty' : 'Add Specialty'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSpecialty && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                Delete &ldquo;{deletingSpecialty.name}&rdquo;?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                This will remove the specialty from available selection lists.
              </p>
              {(deletingSpecialty.doctorCount ?? 0) > 0 && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-semibold text-left">
                  ⚠️ Note: There are currently <strong>{deletingSpecialty.doctorCount}</strong> doctor(s) registered under this specialty.
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSpecialty(null)}
                className="px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md shadow-red-600/20 disabled:opacity-50 transition-all flex-1"
              >
                {deleteLoading && <Loader2 size={16} className="animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
