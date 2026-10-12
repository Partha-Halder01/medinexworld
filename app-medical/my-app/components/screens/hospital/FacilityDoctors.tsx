"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, X, Save, Loader2, LogIn, LogOut, Clock, CalendarDays, Users, Pencil, Trash2, Pause, Play,
  Stethoscope, UserPlus, Search, IndianRupee, ShieldAlert, Camera, CheckCircle2,
} from 'lucide-react';
import {
  WEEKDAY_SHORT, checkInWindow, isChamberOpenOn, istNow, scheduleSummary, to12h,
} from '@/lib/chamber';
import { compressImageFile } from '@/lib/imageUrl';
import { SafeImage } from '@/components/ui/SafeImage';

/* ----------------------------- types & data ----------------------------- */

export type FacilityChamber = {
  id: number;
  fee: number;
  scheduleType: 'weekly' | 'monthly';
  weekDays: number[];
  monthDays: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  liveStatus: 'in' | 'later_today' | 'finished_today' | 'not_today';
  isDoctorIn: boolean;
  todaysBookings: number;
  upcomingBookings: number;
};

export type FacilityDoctor = {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  qual: string;
  exp: string;
  image: string | null;
  about: string | null;
  isVerified: boolean;
  hospitalId: number | null;
};

export type FacilityDoctorItem = { chamber: FacilityChamber; doctor: FacilityDoctor };

type ShowToast = (msg: string, type?: 'success' | 'error') => void;

/** Loads the facility's doctors and handles the front desk's In / Out actions. */
export function useFacilityDoctors(ownerId: string | number | undefined, showToast: ShowToast) {
  const [items, setItems] = useState<FacilityDoctorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    if (!ownerId) return;
    try {
      const res = await fetch(`/api/hospital-admin/doctors?ownerId=${ownerId}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setItems(data);
    } catch {
      /* keep the last list */
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    reload();
    // Live status changes as sessions open and close.
    const t = setInterval(reload, 60_000);
    return () => clearInterval(t);
  }, [reload]);

  const setPresence = async (item: FacilityDoctorItem, action: 'in' | 'out') => {
    setBusyId(item.chamber.id);
    try {
      const res = await fetch('/api/hospital-admin/doctors/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, chamberId: item.chamber.id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data?.error || 'Could not update status.', 'error');
        return;
      }
      showToast(action === 'in' ? `${item.doctor.name} marked IN — patients can see it now.` : `${item.doctor.name} marked OUT.`);
      await reload();
    } finally {
      setBusyId(null);
    }
  };

  return { items, loading, reload, busyId, setPresence };
}

/* ------------------------------ small pieces ----------------------------- */

const initials = (name: string) =>
  (name || 'Dr').replace(/^dr\.?\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'DR';

export function DoctorAvatar({ doctor, size = 'md' }: { doctor: FacilityDoctor; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'w-16 h-16 text-lg' : size === 'sm' ? 'w-10 h-10 text-xs' : 'w-12 h-12 text-sm';
  const fallback = (
    <div className={`${dims} rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black flex items-center justify-center shrink-0`}>
      {initials(doctor.name)}
    </div>
  );
  return <SafeImage src={doctor.image} alt={doctor.name} className={`${dims} rounded-2xl object-cover shrink-0 bg-gray-100`} fallback={fallback} />;
}

export function LiveStatusBadge({ chamber, verified = true }: { chamber: FacilityChamber; verified?: boolean }) {
  if (!verified) {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><ShieldAlert size={10} /> Pending verification</span>;
  }
  if (!chamber.isActive) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Bookings paused</span>;
  if (chamber.isDoctorIn) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> IN now
      </span>
    );
  }
  if (chamber.liveStatus === 'later_today') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">Today {to12h(chamber.startTime)}</span>;
  if (chamber.liveStatus === 'finished_today') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Done for today</span>;
  return null;
}

export function PresenceButton({ item, busy, onPresence, compact }: {
  item: FacilityDoctorItem;
  busy: boolean;
  onPresence: (item: FacilityDoctorItem, action: 'in' | 'out') => void;
  compact?: boolean;
}) {
  const size = compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  if (item.chamber.isDoctorIn) {
    return (
      <button type="button" disabled={busy} onClick={() => onPresence(item, 'out')}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 disabled:opacity-60 ${size}`}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />} Mark Out
      </button>
    );
  }
  const win = checkInWindow(item.chamber);
  return (
    <button type="button" disabled={busy || !win.allowed} onClick={() => onPresence(item, 'in')} title={win.allowed ? 'Doctor has arrived' : win.reason}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold disabled:cursor-not-allowed ${size} ${
        win.allowed ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 disabled:opacity-60' : 'bg-gray-100 text-gray-400'
      }`}>
      {busy ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />} Mark In
    </button>
  );
}

/* ------------------------------ today board ------------------------------ */

export function FacilityTodayBoard({ items, busyId, onPresence, onManage }: {
  items: FacilityDoctorItem[];
  busyId: number | null;
  onPresence: (item: FacilityDoctorItem, action: 'in' | 'out') => void;
  onManage: () => void;
}) {
  const today = istNow().dateISO;
  const todays = items
    .filter(i => i.doctor.isVerified && i.chamber.isActive && isChamberOpenOn(i.chamber, today))
    .sort((a, b) => (a.chamber.isDoctorIn === b.chamber.isDoctorIn ? a.chamber.startTime.localeCompare(b.chamber.startTime) : a.chamber.isDoctorIn ? -1 : 1));

  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="font-black text-gray-900 flex items-center gap-2"><CalendarDays size={18} className="text-emerald-600" /> Today&apos;s Doctors</h3>
          <p className="text-xs text-gray-500 mt-0.5">Mark doctors IN when they arrive — patients see it live.</p>
        </div>
        <button type="button" onClick={onManage} className="text-xs font-bold text-emerald-700 hover:underline shrink-0">Manage doctors →</button>
      </div>
      {todays.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3"><Stethoscope size={22} /></div>
          <p className="text-sm font-bold text-gray-700">{items.length === 0 ? 'No doctors added yet' : 'No doctor is scheduled here today'}</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">{items.length === 0 ? 'Add the doctors who see patients here and set their timetable.' : 'Doctors with a timetable for today will appear here with In / Out buttons.'}</p>
          <button type="button" onClick={onManage} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">
            <Plus size={14} /> {items.length === 0 ? 'Add a doctor & timetable' : 'Manage doctors'}
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {todays.map(item => (
            <li key={item.chamber.id} className={`flex items-center gap-3 px-5 sm:px-6 py-3.5 ${item.chamber.isDoctorIn ? 'bg-emerald-50/40' : ''}`}>
              <DoctorAvatar doctor={item.doctor} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-gray-900 truncate">{item.doctor.name}</p>
                  <LiveStatusBadge chamber={item.chamber} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-x-3 gap-y-0.5 flex-wrap">
                  <span>{item.doctor.specialty}</span>
                  <span className="inline-flex items-center gap-1"><Clock size={11} /> {to12h(item.chamber.startTime)} – {to12h(item.chamber.endTime)}</span>
                  <span className="inline-flex items-center gap-1"><Users size={11} /> {item.chamber.todaysBookings} booked</span>
                </p>
              </div>
              <PresenceButton item={item} busy={busyId === item.chamber.id} onPresence={onPresence} compact />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------ doctors tab ------------------------------ */

export function FacilityDoctorsTab({ ownerId, facilityId, facilityLabel, items, loading, reload, busyId, onPresence, showToast }: {
  ownerId: string | number;
  facilityId: number;
  facilityLabel: string;
  items: FacilityDoctorItem[];
  loading: boolean;
  reload: () => Promise<void>;
  busyId: number | null;
  onPresence: (item: FacilityDoctorItem, action: 'in' | 'out') => void;
  showToast: ShowToast;
}) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<FacilityDoctorItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rowBusy, setRowBusy] = useState<number | null>(null);
  const today = istNow().dateISO;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => `${i.doctor.name} ${i.doctor.specialty} ${i.doctor.email}`.toLowerCase().includes(q));
  }, [items, query]);

  const togglePaused = async (item: FacilityDoctorItem) => {
    setRowBusy(item.chamber.id);
    try {
      const res = await fetch('/api/hospital-admin/doctors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, chamberId: item.chamber.id, schedule: { isActive: !item.chamber.isActive } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) showToast(data?.error || 'Could not update.', 'error');
      else {
        showToast(item.chamber.isActive ? 'Online bookings paused for this doctor.' : 'Online bookings resumed.');
        await reload();
      }
    } finally {
      setRowBusy(null);
    }
  };

  const remove = async (item: FacilityDoctorItem) => {
    if (!window.confirm(`Remove ${item.doctor.name} from your ${facilityLabel.toLowerCase()}? Their own account is not deleted.`)) return;
    setRowBusy(item.chamber.id);
    try {
      const res = await fetch(`/api/hospital-admin/doctors?ownerId=${ownerId}&chamberId=${item.chamber.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) showToast(data?.error || 'Could not remove doctor.', 'error');
      else {
        showToast('Doctor removed.');
        await reload();
      }
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Our Doctors</h2>
          <p className="text-sm text-gray-500 mt-1">Doctors who sit at your {facilityLabel.toLowerCase()}, their timetable, and who is IN right now.</p>
        </div>
        <button type="button" onClick={() => { setEditing(null); setModalOpen(true); }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/20">
          <UserPlus size={17} /> Add Doctor
        </button>
      </header>

      {items.length > 0 && (
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, specialty or email"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-emerald-600" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3"><Stethoscope size={26} /></div>
          <p className="font-black text-gray-900">No doctors yet</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Add the doctors who see patients here and set their days &amp; timings. Patients can then book them online.</p>
          <button type="button" onClick={() => { setEditing(null); setModalOpen(true); }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold"><Plus size={16} /> Add first doctor</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(item => {
            const { doctor, chamber } = item;
            const openToday = chamber.isActive && doctor.isVerified && isChamberOpenOn(chamber, today);
            return (
              <article key={chamber.id} className={`bg-white rounded-3xl border shadow-sm p-5 space-y-4 ${chamber.isDoctorIn ? 'border-emerald-300' : 'border-gray-100'}`}>
                <div className="flex items-start gap-3.5">
                  <DoctorAvatar doctor={doctor} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-gray-900 truncate">{doctor.name}</h3>
                      <LiveStatusBadge chamber={chamber} verified={doctor.isVerified} />
                    </div>
                    <p className="text-sm font-bold text-emerald-700">{doctor.specialty}</p>
                    <p className="text-xs text-gray-500 truncate">{[doctor.qual, doctor.exp && `${doctor.exp} exp`].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2 rounded-2xl bg-gray-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-0.5">Timetable</p>
                    <p className="font-semibold text-gray-800">{scheduleSummary(chamber)}</p>
                    <p className="text-gray-500 mt-0.5">{chamber.slotDuration} min per patient</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-0.5">Consultation fee</p>
                    <p className="font-black text-gray-900 flex items-center"><IndianRupee size={12} />{chamber.fee}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-0.5">Bookings</p>
                    <p className="font-black text-gray-900">{chamber.todaysBookings} today · {chamber.upcomingBookings} upcoming</p>
                  </div>
                </div>

                {!doctor.isVerified && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                    New doctor accounts are checked by the platform team before patients can book them.
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-gray-100">
                  {openToday && <PresenceButton item={item} busy={busyId === chamber.id} onPresence={onPresence} compact />}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button type="button" disabled={rowBusy === chamber.id} onClick={() => { setEditing(item); setModalOpen(true); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700"><Pencil size={13} /> Edit</button>
                    <button type="button" disabled={rowBusy === chamber.id} onClick={() => togglePaused(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700">
                      {chamber.isActive ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}
                    </button>
                    <button type="button" disabled={rowBusy === chamber.id} onClick={() => remove(item)} aria-label="Remove doctor"
                      className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600"><Trash2 size={13} /></button>
                  </div>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-gray-500 col-span-full">No doctor matches “{query}”.</p>}
        </div>
      )}

      {modalOpen && (
        <FacilityDoctorModal
          ownerId={ownerId}
          facilityId={facilityId}
          editing={editing}
          showToast={showToast}
          onClose={() => setModalOpen(false)}
          onSaved={async () => { setModalOpen(false); await reload(); }}
        />
      )}
    </div>
  );
}

/* ------------------------------- add / edit ------------------------------ */

const input = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 placeholder-gray-400';
const label = 'text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block';
const SLOT_DURATIONS = [5, 10, 15, 20, 30, 45, 60];
const FALLBACK_SPECIALTIES = ['General Physician', 'Cardiologist', 'Dermatologist', 'Dentist', 'ENT Specialist', 'Gynecologist', 'Neurologist', 'Orthopedic', 'Pediatrician', 'Psychiatrist'];
const OTHER = '__other__';

/** Specialty picker: platform list as a dropdown, plus "Other" for anything not listed. */
function SpecialtySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [options, setOptions] = useState<string[]>(FALLBACK_SPECIALTIES);
  const [other, setOther] = useState(false);

  useEffect(() => {
    fetch('/api/specialties')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d?.specialties) && d.specialties.length) setOptions(d.specialties); })
      .catch(() => {});
  }, []);

  const listed = options.includes(value);
  const selectValue = other || (value && !listed) ? OTHER : value;

  return (
    <div className="space-y-2">
      <select
        value={selectValue}
        onChange={e => {
          if (e.target.value === OTHER) { setOther(true); onChange(''); }
          else { setOther(false); onChange(e.target.value); }
        }}
        className={input}
      >
        <option value="" disabled>Select specialty</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
        <option value={OTHER}>Other (type below)…</option>
      </select>
      {selectValue === OTHER && (
        <input value={value} onChange={e => onChange(e.target.value)} className={input} placeholder="Type the specialty" maxLength={80} autoFocus={other} />
      )}
    </div>
  );
}

function FacilityDoctorModal({ ownerId, facilityId, editing, showToast, onClose, onSaved }: {
  ownerId: string | number;
  facilityId: number;
  editing: FacilityDoctorItem | null;
  showToast: ShowToast;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!editing;
  // Profile fields are editable only for accounts this facility created; other doctors manage their own profile.
  const canEditProfile = !isEdit || editing!.doctor.hospitalId === facilityId;
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [existingEmail, setExistingEmail] = useState('');
  const [doctor, setDoctor] = useState({
    name: editing?.doctor.name ?? '',
    email: editing?.doctor.email ?? '',
    phone: editing?.doctor.phone ?? '',
    specialty: editing?.doctor.specialty ?? '',
    qual: editing?.doctor.qual ?? '',
    exp: editing?.doctor.exp ?? '',
    about: editing?.doctor.about ?? '',
    image: editing?.doctor.image ?? '',
  });
  const [schedule, setSchedule] = useState({
    scheduleType: editing?.chamber.scheduleType ?? ('weekly' as 'weekly' | 'monthly'),
    weekDays: editing?.chamber.weekDays ?? [1, 2, 3, 4, 5],
    monthDays: editing?.chamber.monthDays ?? ([] as number[]),
    startTime: editing?.chamber.startTime ?? '10:00',
    endTime: editing?.chamber.endTime ?? '13:00',
    slotDuration: editing?.chamber.slotDuration ?? 15,
    fee: editing?.chamber.fee ?? 500,
    isActive: editing?.chamber.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const setD = <K extends keyof typeof doctor>(k: K, v: (typeof doctor)[K]) => setDoctor(d => ({ ...d, [k]: v }));
  const setS = <K extends keyof typeof schedule>(k: K, v: (typeof schedule)[K]) => setSchedule(s => ({ ...s, [k]: v }));
  const toggle = (list: number[], v: number) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v].sort((a, b) => a - b));

  const save = async () => {
    setSaving(true);
    try {
      const body = isEdit
        ? { ownerId, chamberId: editing!.chamber.id, schedule, ...(canEditProfile ? { doctor } : {}) }
        : mode === 'existing'
        ? { ownerId, mode, existingEmail, schedule }
        : { ownerId, mode, doctor, schedule };
      const res = await fetch('/api/hospital-admin/doctors', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data?.error || 'Could not save.', 'error');
        return;
      }
      showToast(isEdit ? 'Doctor updated.' : mode === 'new' ? 'Doctor added. They can be booked once the platform verifies the account.' : 'Doctor added to your facility.');
      onSaved();
    } catch {
      showToast('Could not save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-900">{isEdit ? `Edit ${editing!.doctor.name}` : 'Add Doctor'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {!isEdit && (
            <div className="grid grid-cols-2 gap-2">
              {([['new', 'New doctor', 'Create their account'], ['existing', 'Existing doctor', 'Already on the platform']] as const).map(([value, title, sub]) => (
                <button key={value} type="button" onClick={() => setMode(value)}
                  className={`p-3 rounded-2xl border-2 text-left ${mode === value ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className={`text-sm font-bold ${mode === value ? 'text-emerald-700' : 'text-gray-700'}`}>{title}</p>
                  <p className="text-[11px] text-gray-500">{sub}</p>
                </button>
              ))}
            </div>
          )}

          {/* Doctor details */}
          {!isEdit && mode === 'existing' ? (
            <div>
              <label className={label}>Doctor&apos;s registered email</label>
              <input type="email" value={existingEmail} onChange={e => setExistingEmail(e.target.value)} className={input} placeholder="doctor@example.com" />
              <p className="text-[11px] text-gray-500 mt-1">The doctor keeps managing their own profile. You set their timetable at your facility.</p>
            </div>
          ) : canEditProfile ? (
            <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center gap-4">
                <label className="relative cursor-pointer group shrink-0">
                  <SafeImage src={doctor.image} alt="Doctor photo" className="w-16 h-16 rounded-2xl object-cover"
                    fallback={<div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400"><Camera size={20} /></div>} />
                  <span className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 transition-colors" />
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) compressImageFile(f, 640, 0.85).then(img => setD('image', img)).catch(err => showToast(err.message, 'error'));
                    e.target.value = '';
                  }} />
                </label>
                <div className="flex-1 grid grid-cols-1 gap-3">
                  <div><label className={label}>Full name</label><input value={doctor.name} onChange={e => setD('name', e.target.value)} className={input} placeholder="Dr. Anika Roy" /></div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={label}>Specialty</label><SpecialtySelect value={doctor.specialty} onChange={v => setD('specialty', v)} /></div>
                <div><label className={label}>Qualification</label><input value={doctor.qual} onChange={e => setD('qual', e.target.value)} className={input} placeholder="MBBS, MD" /></div>
                <div><label className={label}>Experience</label><input value={doctor.exp} onChange={e => setD('exp', e.target.value)} className={input} placeholder="10 years" /></div>
                <div><label className={label}>Phone</label><input value={doctor.phone} onChange={e => setD('phone', e.target.value)} className={input} placeholder="+91…" /></div>
                {!isEdit && (
                  <div>
                    <label className={label}>Login email</label>
                    <input type="email" value={doctor.email} onChange={e => setD('email', e.target.value)} className={input} placeholder="doctor@example.com" />
                    <p className="text-[11px] text-gray-500 mt-1">The doctor signs in with a one-time code sent to this email.</p>
                  </div>
                )}
              </div>
              <div><label className={label}>About (optional)</label><textarea rows={2} value={doctor.about} onChange={e => setD('about', e.target.value)} className={`${input} resize-none`} /></div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3.5">
              <DoctorAvatar doctor={editing!.doctor} />
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">{editing!.doctor.name}</p>
                <p className="text-xs text-gray-500">{editing!.doctor.specialty} · manages their own profile</p>
              </div>
            </div>
          )}

          {/* Timetable */}
          <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
            <p className="font-bold text-sm text-gray-900 flex items-center gap-2"><CalendarDays size={15} className="text-emerald-600" /> Timetable at your facility</p>
            <div className="grid grid-cols-2 gap-2">
              {(['weekly', 'monthly'] as const).map(type => (
                <button key={type} type="button" onClick={() => setS('scheduleType', type)}
                  className={`p-2.5 rounded-xl border-2 text-left text-sm font-bold ${schedule.scheduleType === type ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>
                  {type === 'weekly' ? 'Days of the week' : 'Dates of the month'}
                </button>
              ))}
            </div>
            {schedule.scheduleType === 'weekly' ? (
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAY_SHORT.map((d, i) => (
                  <button key={d} type="button" aria-pressed={schedule.weekDays.includes(i)} onClick={() => setS('weekDays', toggle(schedule.weekDays, i))}
                    className={`py-2 rounded-xl text-xs font-bold ${schedule.weekDays.includes(i) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{d}</button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <button key={d} type="button" aria-pressed={schedule.monthDays.includes(d)} onClick={() => setS('monthDays', toggle(schedule.monthDays, d))}
                    className={`py-2 rounded-lg text-xs font-bold ${schedule.monthDays.includes(d) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{d}</button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><label className={label}>From</label><input type="time" value={schedule.startTime} onChange={e => setS('startTime', e.target.value)} className={input} /></div>
              <div><label className={label}>To</label><input type="time" value={schedule.endTime} onChange={e => setS('endTime', e.target.value)} className={input} /></div>
              <div>
                <label className={label}>Per patient</label>
                <select value={schedule.slotDuration} onChange={e => setS('slotDuration', Number(e.target.value))} className={input}>
                  {SLOT_DURATIONS.map(m => <option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
              <div><label className={label}>Fee (₹)</label><input type="number" min={0} value={schedule.fee} onChange={e => setS('fee', Number(e.target.value))} className={input} /></div>
            </div>
            <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 flex items-center gap-1.5">
              <CheckCircle2 size={13} /> {scheduleSummary(schedule)}
            </p>
            <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" checked={schedule.isActive} onChange={e => setS('isActive', e.target.checked)} className="w-4 h-4 accent-emerald-600" />
              Accept online bookings for this doctor
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white/95 backdrop-blur px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
          <button type="button" onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {isEdit ? 'Save Changes' : 'Add Doctor'}
          </button>
        </div>
      </div>
    </div>
  );
}
