"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2, Plus, MapPin, Clock, IndianRupee, Navigation, LocateFixed, Link2, Pencil, Trash2, X, Save,
  LogIn, LogOut, CalendarDays, Users, Loader2, CheckCircle2, AlertTriangle, Phone, Power, ImagePlus,
} from 'lucide-react';
import { compressImageFile, displayableImages } from '@/lib/imageUrl';
import { SafeImage } from '@/components/ui/SafeImage';
import { useAppContext } from '@/app/context/AppContext';
import {
  WEEKDAY_SHORT, checkInWindow, directionsUrl, formatDistance, isChamberOpenOn, isValidLatLng, istNow,
  parseLatLngFromMapsUrl, scheduleSummary, to12h,
} from '@/lib/chamber';

type Chamber = {
  _id: number;
  id: number;
  name: string;
  address: string;
  phone: string;
  mapUrl: string | null;
  locationLat: number | null;
  locationLng: number | null;
  fee: number;
  scheduleType: 'weekly' | 'monthly';
  weekDays: number[];
  monthDays: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  photos: string[];
  hospitalId?: number | null;
  isActive: boolean;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  liveStatus: 'in' | 'later_today' | 'finished_today' | 'not_today';
  isDoctorIn: boolean;
  upcomingBookings?: number;
  todaysBookings?: number;
};

type FormState = {
  name: string;
  address: string;
  phone: string;
  mapUrl: string;
  locationLat: number | null;
  locationLng: number | null;
  fee: number;
  scheduleType: 'weekly' | 'monthly';
  weekDays: number[];
  monthDays: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  photos: string[];
  isActive: boolean;
};

const emptyForm = (fee = 500): FormState => ({
  name: '',
  address: '',
  phone: '',
  mapUrl: '',
  locationLat: null,
  locationLng: null,
  fee,
  scheduleType: 'weekly',
  weekDays: [1, 3, 5],
  monthDays: [],
  startTime: '17:00',
  endTime: '20:00',
  slotDuration: 15,
  photos: [],
  isActive: true,
});

const SLOT_DURATIONS = [5, 10, 15, 20, 30, 45, 60];
const MAX_CHAMBER_PHOTOS = 8;

const getCurrentPosition = (timeout = 15000) =>
  new Promise<{ lat: number; lng: number; accuracy: number }>((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('GPS is not available on this device/browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      err => reject(new Error(err.code === err.PERMISSION_DENIED
        ? 'Location permission denied. Allow location access in your browser settings.'
        : 'Could not get your GPS location. Move near a window and try again.')),
      { enableHighAccuracy: true, timeout, maximumAge: 0 }
    );
  });

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder-gray-400';
const labelCls = 'text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5';

export const DoctorChambersScreen = () => {
  const { currentUser, showToast } = useAppContext();
  const doctorId = currentUser?._id;

  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultFee, setDefaultFee] = useState(500);
  const [editing, setEditing] = useState<Chamber | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [, setTick] = useState(0);

  const loadChambers = useCallback(async () => {
    if (!doctorId) return;
    try {
      const res = await fetch(`/api/doctors/${doctorId}/chambers`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setChambers(data);
      else showToast(data?.error || 'Failed to load chambers.', 'error');
    } catch {
      showToast('Failed to load chambers.', 'error');
    } finally {
      setLoading(false);
    }
    // showToast comes from context and is not memoized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  useEffect(() => {
    loadChambers();
    if (doctorId) {
      fetch(`/api/doctors/${doctorId}`)
        .then(r => r.json())
        .then(d => { if (Number.isFinite(Number(d?.fee))) setDefaultFee(Number(d.fee)); })
        .catch(() => {});
    }
  }, [doctorId, loadChambers]);

  // Re-render every minute so check-in buttons enable/disable as the session window opens/closes.
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const now = istNow();
  const todays = useMemo(
    () => chambers.filter(c => c.isActive && isChamberOpenOn(c, now.dateISO)),
    [chambers, now.dateISO]
  );

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c: Chamber) => { setEditing(c); setFormOpen(true); };

  const handlePresence = async (chamber: Chamber, action: 'in' | 'out') => {
    if (!doctorId) return;
    setBusyId(chamber.id);
    try {
      let coords: { lat: number; lng: number } | null = null;
      if (action === 'in') {
        try {
          coords = await getCurrentPosition(10000);
        } catch {
          coords = null; // check-in still works without GPS
        }
      }
      const res = await fetch(`/api/doctors/${doctorId}/chambers/${chamber.id}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(coords ? { lat: coords.lat, lng: coords.lng } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || 'Failed to update status.', 'error');
        return;
      }
      if (action === 'in') {
        const far = typeof data.distanceFromChamberKm === 'number' && data.distanceFromChamberKm > 0.5;
        showToast(
          far
            ? `Checked in. Note: you seem to be ${formatDistance(data.distanceFromChamberKm)} from the saved chamber location.`
            : `You're marked IN at ${chamber.name}. Patients can see it now.`,
          far ? 'error' : 'success'
        );
      } else {
        showToast(`Checked out of ${chamber.name}.`);
      }
      await loadChambers();
    } catch {
      showToast('Failed to update status.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (chamber: Chamber) => {
    if (!doctorId) return;
    setBusyId(chamber.id);
    try {
      const res = await fetch(`/api/doctors/${doctorId}/chambers/${chamber.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !chamber.isActive }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(chamber.isActive ? 'Chamber hidden from patients.' : 'Chamber is live for booking.');
        await loadChambers();
      } else showToast(data?.error || 'Failed to update chamber.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const deleteChamber = async (chamber: Chamber) => {
    if (!doctorId) return;
    if (!window.confirm(`Delete "${chamber.name}"? This cannot be undone.`)) return;
    setBusyId(chamber.id);
    try {
      const res = await fetch(`/api/doctors/${doctorId}/chambers/${chamber.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast('Chamber deleted.');
        await loadChambers();
      } else showToast(data?.error || 'Failed to delete chamber.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-40 md:pb-8 md:p-6 lg:p-8 w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-gray-900 dark:text-white">My Chambers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            Add every place you sit, set its days &amp; timings, and mark yourself IN when you arrive.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors shadow-lg shadow-teal-600/20 active:scale-[0.98] shrink-0"
        >
          <Plus size={18} /> Add Chamber
        </button>
      </div>

      {/* Today */}
      {todays.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2 mb-3">
            <CalendarDays size={16} className="text-teal-600" /> Today&apos;s Chambers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todays.map(c => (
              <PresenceCard key={c.id} chamber={c} busy={busyId === c.id} onPresence={handlePresence} />
            ))}
          </div>
        </div>
      )}

      {/* All chambers */}
      {chambers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <Building2 size={26} />
          </div>
          <p className="font-bold text-gray-900 dark:text-white">No chambers yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Add the clinics or chambers where you see patients. Patients will pick a chamber, date and slot while booking.
          </p>
          <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-bold">
            <Plus size={16} /> Add your first chamber
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {chambers.map(c => (
            <ChamberCard
              key={c.id}
              chamber={c}
              busy={busyId === c.id}
              onEdit={() => openEdit(c)}
              onToggle={() => toggleActive(c)}
              onDelete={() => deleteChamber(c)}
              onPresence={handlePresence}
            />
          ))}
        </div>
      )}

      {formOpen && doctorId && (
        <ChamberFormModal
          doctorId={doctorId}
          chamber={editing}
          defaultFee={defaultFee}
          onClose={() => setFormOpen(false)}
          onSaved={async () => { setFormOpen(false); await loadChambers(); }}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

function LiveBadge({ chamber }: { chamber: Chamber }) {
  if (!chamber.isActive) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Hidden</span>;
  }
  if (chamber.isDoctorIn) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> You are IN
      </span>
    );
  }
  if (chamber.liveStatus === 'later_today') {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Today</span>;
  }
  return null;
}

function PresenceButton({ chamber, busy, onPresence, compact }: {
  chamber: Chamber;
  busy: boolean;
  onPresence: (c: Chamber, action: 'in' | 'out') => void;
  compact?: boolean;
}) {
  const win = checkInWindow(chamber);
  const size = compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';

  if (chamber.isDoctorIn) {
    return (
      <button
        onClick={() => onPresence(chamber, 'out')}
        disabled={busy}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 transition-colors disabled:opacity-60 ${size}`}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />} Check Out
      </button>
    );
  }
  return (
    <button
      onClick={() => onPresence(chamber, 'in')}
      disabled={busy || !win.allowed}
      title={win.allowed ? 'Mark yourself as present in this chamber' : win.reason}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-colors disabled:cursor-not-allowed ${size} ${
        win.allowed
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-60'
          : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
      }`}
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />} I&apos;m In
    </button>
  );
}

function PresenceCard({ chamber, busy, onPresence }: {
  chamber: Chamber;
  busy: boolean;
  onPresence: (c: Chamber, action: 'in' | 'out') => void;
}) {
  const win = checkInWindow(chamber);
  return (
    <div className={`rounded-xl border p-3.5 flex items-center gap-3 ${
      chamber.isDoctorIn
        ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-900/10'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{chamber.name}</p>
          <LiveBadge chamber={chamber} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
          <Clock size={11} /> {to12h(chamber.startTime)} – {to12h(chamber.endTime)}
          {typeof chamber.todaysBookings === 'number' && (
            <span className="ml-2 inline-flex items-center gap-1"><Users size={11} /> {chamber.todaysBookings} booked</span>
          )}
        </p>
        {!chamber.isDoctorIn && !win.allowed && (
          <p className="text-[11px] text-gray-400 mt-0.5">{win.reason}</p>
        )}
      </div>
      <PresenceButton chamber={chamber} busy={busy} onPresence={onPresence} compact />
    </div>
  );
}

function ChamberCard({ chamber, busy, onEdit, onToggle, onDelete, onPresence }: {
  chamber: Chamber;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onPresence: (c: Chamber, action: 'in' | 'out') => void;
}) {
  const hasPin = isValidLatLng(chamber.locationLat, chamber.locationLng);
  const mapsLink = directionsUrl(chamber);
  const openToday = chamber.isActive && isChamberOpenOn(chamber, istNow().dateISO);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-sm p-4 sm:p-5 space-y-3.5 ${chamber.isActive ? 'border-gray-100 dark:border-gray-700' : 'border-dashed border-gray-300 dark:border-gray-700 opacity-80'}`}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
          <Building2 size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 dark:text-white truncate">{chamber.name}</h3>
            {chamber.hospitalId ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Managed by hospital</span>
            ) : null}
            <LiveBadge chamber={chamber} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-start gap-1">
            <MapPin size={12} className="shrink-0 mt-0.5" /> <span className="line-clamp-2">{chamber.address}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 p-2.5 col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Schedule</p>
          <p className="font-semibold text-gray-800 dark:text-gray-200">{scheduleSummary(chamber)}</p>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">{chamber.slotDuration}-min slots</p>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Fee at chamber</p>
          <p className="font-bold text-gray-900 dark:text-white flex items-center"><IndianRupee size={12} />{chamber.fee}</p>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Upcoming</p>
          <p className="font-bold text-gray-900 dark:text-white">{chamber.upcomingBookings ?? 0} bookings</p>
        </div>
      </div>

      {displayableImages(chamber.photos).length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto">
          {displayableImages(chamber.photos).slice(0, 6).map((photo, i) => (
            <SafeImage key={i} src={photo} alt={`${chamber.name} photo ${i + 1}`} className="w-14 h-14 rounded-lg object-cover shrink-0 bg-gray-100 dark:bg-gray-700" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap text-xs">
        {hasPin ? (
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
            <CheckCircle2 size={12} /> Location pinned
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
            <AlertTriangle size={12} /> No GPS pin — patients can&apos;t see distance
          </span>
        )}
        {mapsLink && (
          <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-teal-700 dark:text-teal-400 hover:underline">
            <Navigation size={12} /> Open in Maps
          </a>
        )}
        {chamber.phone && (
          <span className="inline-flex items-center gap-1 text-gray-500"><Phone size={12} /> {chamber.phone}</span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100 dark:border-gray-700/60">
        {openToday && <div className="pt-2"><PresenceButton chamber={chamber} busy={busy} onPresence={onPresence} compact /></div>}
        {chamber.hospitalId ? (
          <p className="pt-2 ml-auto text-[11px] text-gray-500 dark:text-gray-400">Timetable &amp; fee are set by the hospital / nursing home.</p>
        ) : (
        <div className="flex items-center gap-1.5 pt-2 ml-auto">
          <button onClick={onEdit} disabled={busy} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200">
            <Pencil size={13} /> Edit
          </button>
          <button onClick={onToggle} disabled={busy} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200">
            <Power size={13} /> {chamber.isActive ? 'Hide' : 'Activate'}
          </button>
          <button onClick={onDelete} disabled={busy} aria-label="Delete chamber" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400">
            <Trash2 size={13} />
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ChamberFormModal({ doctorId, chamber, defaultFee, onClose, onSaved }: {
  doctorId: string | number;
  chamber: Chamber | null;
  defaultFee: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useAppContext();
  const [form, setForm] = useState<FormState>(() =>
    chamber
      ? {
          name: chamber.name,
          address: chamber.address,
          phone: chamber.phone || '',
          mapUrl: chamber.mapUrl || '',
          locationLat: chamber.locationLat,
          locationLng: chamber.locationLng,
          fee: chamber.fee,
          scheduleType: chamber.scheduleType,
          weekDays: chamber.weekDays,
          monthDays: chamber.monthDays,
          startTime: chamber.startTime,
          endTime: chamber.endTime,
          slotDuration: chamber.slotDuration,
          photos: displayableImages(chamber.photos),
          isActive: chamber.isActive,
        }
      : emptyForm(defaultFee)
  );
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }));

  const resolveMapLink = async (url: string) => {
    const link = url.trim();
    if (!link) return;
    const local = parseLatLngFromMapsUrl(link);
    if (local) {
      setForm(f => ({ ...f, locationLat: local.lat, locationLng: local.lng }));
      setLocationNote('Location read from the Google Maps link.');
      return;
    }
    setResolving(true);
    setLocationNote(null);
    try {
      const res = await fetch('/api/maps/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link }),
      });
      const data = await res.json();
      if (res.ok && isValidLatLng(data.lat, data.lng)) {
        setForm(f => ({ ...f, locationLat: data.lat, locationLng: data.lng }));
        setLocationNote('Location read from the Google Maps link.');
      } else {
        setLocationNote(data?.error || "Couldn't read the location from this link. Use the GPS button at the chamber.");
      }
    } catch {
      setLocationNote("Couldn't read the location from this link. Use the GPS button at the chamber.");
    } finally {
      setResolving(false);
    }
  };

  const useMyLocation = async () => {
    setLocating(true);
    setLocationNote(null);
    try {
      const pos = await getCurrentPosition();
      setForm(f => ({ ...f, locationLat: pos.lat, locationLng: pos.lng }));
      setLocationNote(`GPS location captured (±${Math.round(pos.accuracy)} m). Do this while standing inside the chamber.`);
    } catch (err) {
      setLocationNote(err instanceof Error ? err.message : 'Could not get GPS location.');
    } finally {
      setLocating(false);
    }
  };

  const [uploading, setUploading] = useState(false);
  const addPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_CHAMBER_PHOTOS - form.photos.length;
    if (room <= 0) {
      showToast(`You can add up to ${MAX_CHAMBER_PHOTOS} photos per chamber.`, 'error');
      return;
    }
    setUploading(true);
    try {
      const picked = Array.from(files).slice(0, room);
      const compressed = await Promise.all(picked.map(f => compressImageFile(f)));
      setForm(f => ({ ...f, photos: [...f.photos, ...compressed].slice(0, MAX_CHAMBER_PHOTOS) }));
      if (files.length > room) showToast(`Only ${room} more photo(s) could be added.`, 'error');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add photo.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const toggleWeekDay = (d: number) =>
    set('weekDays', form.weekDays.includes(d) ? form.weekDays.filter(x => x !== d) : [...form.weekDays, d].sort((a, b) => a - b));
  const toggleMonthDay = (d: number) =>
    set('monthDays', form.monthDays.includes(d) ? form.monthDays.filter(x => x !== d) : [...form.monthDays, d].sort((a, b) => a - b));

  const save = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      showToast('Chamber name and address are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const url = chamber ? `/api/doctors/${doctorId}/chambers/${chamber.id}` : `/api/doctors/${doctorId}/chambers`;
      const res = await fetch(url, {
        method: chamber ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || 'Failed to save chamber.', 'error');
        return;
      }
      showToast(chamber ? 'Chamber updated.' : 'Chamber added. Patients can now book it.');
      onSaved();
    } catch {
      showToast('Failed to save chamber.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasPin = isValidLatLng(form.locationLat, form.locationLng);
  const previewSummary = scheduleSummary(form);

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={chamber ? 'Edit chamber' : 'Add chamber'}
      >
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-extrabold text-gray-900 dark:text-white">{chamber ? 'Edit Chamber' : 'Add Chamber'}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Basic details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}><Building2 size={11} /> Chamber / Clinic Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g., Sanjeevani Medical Hall" className={inputCls} maxLength={120} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}><MapPin size={11} /> Full Address</label>
              <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} placeholder="Street, area, city, PIN" className={`${inputCls} resize-none`} maxLength={500} />
            </div>
            <div>
              <label className={labelCls}><IndianRupee size={11} /> Consultation Fee (paid at chamber)</label>
              <input type="number" min={0} value={form.fee} onChange={e => set('fee', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}><Phone size={11} /> Chamber Phone (optional)</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91…" className={inputCls} maxLength={20} />
            </div>
          </div>

          {/* Location */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Navigation size={15} className="text-teal-600" /> Chamber Location
            </p>
            <div>
              <label className={labelCls}><Link2 size={11} /> Google Maps link</label>
              <div className="flex gap-2">
                <input
                  value={form.mapUrl}
                  onChange={e => set('mapUrl', e.target.value)}
                  onBlur={e => resolveMapLink(e.target.value)}
                  onPaste={e => {
                    const text = e.clipboardData.getData('text');
                    if (text) setTimeout(() => resolveMapLink(text), 0);
                  }}
                  placeholder="https://maps.app.goo.gl/…"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => resolveMapLink(form.mapUrl)}
                  disabled={resolving || !form.mapUrl.trim()}
                  className="shrink-0 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold disabled:opacity-50"
                >
                  {resolving ? <Loader2 size={15} className="animate-spin" /> : 'Read'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Open the place in Google Maps → Share → Copy link, then paste here.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              <span className="text-[10px] font-bold uppercase text-gray-400">or</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>

            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-teal-600 text-teal-700 dark:text-teal-400 font-bold text-sm hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-60"
            >
              {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
              Use my current GPS location (I&apos;m at the chamber)
            </button>

            <div className={`text-xs rounded-xl px-3 py-2 ${hasPin ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'}`}>
              {hasPin ? (
                <span className="flex items-center gap-1.5 flex-wrap">
                  <CheckCircle2 size={13} /> Pinned at {form.locationLat!.toFixed(5)}, {form.locationLng!.toFixed(5)}
                  <a
                    href={`https://www.google.com/maps?q=${form.locationLat},${form.locationLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold"
                  >
                    Verify on map
                  </a>
                  <button type="button" onClick={() => setForm(f => ({ ...f, locationLat: null, locationLng: null }))} className="underline">
                    Clear
                  </button>
                </span>
              ) : (
                <span className="flex items-center gap-1.5"><AlertTriangle size={13} /> No location pinned yet — patients won&apos;t see the distance.</span>
              )}
            </div>
            {locationNote && <p className="text-[11px] text-gray-500 dark:text-gray-400">{locationNote}</p>}
          </div>

          {/* Schedule */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarDays size={15} className="text-teal-600" /> When are you available here?
            </p>

            <div className="grid grid-cols-2 gap-2">
              {(['weekly', 'monthly'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set('scheduleType', type)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.scheduleType === type
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <p className={`text-sm font-bold ${form.scheduleType === type ? 'text-teal-700 dark:text-teal-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {type === 'weekly' ? 'Days of the week' : 'Dates of the month'}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {type === 'weekly' ? 'e.g. every Mon, Wed, Fri' : 'e.g. every 5th, 15th, 25th'}
                  </p>
                </button>
              ))}
            </div>

            {form.scheduleType === 'weekly' ? (
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAY_SHORT.map((label, d) => {
                  const on = form.weekDays.includes(d);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleWeekDay(d)}
                      aria-pressed={on}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        on ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                    const on = form.monthDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleMonthDay(d)}
                        aria-pressed={on}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${
                          on ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">Dates 29–31 are skipped automatically in shorter months.</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}><Clock size={11} /> From</label>
                <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}><Clock size={11} /> To</label>
                <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Per patient</label>
                <select value={form.slotDuration} onChange={e => set('slotDuration', Number(e.target.value))} className={inputCls}>
                  {SLOT_DURATIONS.map(m => <option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
            </div>

            <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded-xl px-3 py-2">
              {previewSummary}
            </p>
          </div>

          {/* Photos */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <ImagePlus size={15} className="text-teal-600" /> Chamber Photos
              </p>
              <span className="text-[11px] text-gray-400">{form.photos.length}/{MAX_CHAMBER_PHOTOS}</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 -mt-1">
              Entrance, waiting area, signboard — shown to patients in your profile gallery.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {form.photos.map((photo, i) => (
                <div key={i} className="relative group h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <SafeImage src={photo} alt={`Chamber photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))}
                    aria-label="Remove photo"
                    className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {form.photos.length < MAX_CHAMBER_PHOTOS && (
                <label className={`h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:text-teal-600 hover:border-teal-400 cursor-pointer transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  <span className="text-[10px] font-bold mt-0.5">{uploading ? 'Adding…' : 'Add photos'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => { addPhotos(e.target.files); e.target.value = ''; }}
                  />
                </label>
              )}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="w-4 h-4 accent-teal-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show this chamber to patients for booking</span>
          </label>
        </div>

        <div className="sticky bottom-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || resolving || uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/20 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {chamber ? 'Save Changes' : 'Add Chamber'}
          </button>
        </div>
      </div>
    </div>
  );
}
