"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Save, MapPin, Star, Mail, Phone, Camera, X, Briefcase, GraduationCap, Clock, FileText, Building2, Navigation, LocateFixed, CheckCircle2, AlertTriangle, Plus, Trash2, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { compressImageFile, isDisplayableImage } from '@/lib/imageUrl';

// ── Reverse-geocode GPS → human address via OpenStreetMap Nominatim ──────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  );
  if (!res.ok) throw new Error('Geocode failed');
  const data = await res.json();
  // Build a clean address: neighbourhood, suburb, city, state
  const { road, neighbourhood, suburb, city, town, village, state, country } = data.address || {};
  const parts = [road || neighbourhood, suburb, city || town || village, state, country].filter(Boolean);
  return parts.slice(0, 4).join(', ') || data.display_name || 'Unknown location';
}

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const INITIALS_COLORS = [
  'from-teal-500 to-emerald-600',
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
];

const getColorForName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return INITIALS_COLORS[Math.abs(hash) % INITIALS_COLORS.length];
};

// Check if image is a valid uploadable image (not a random placeholder)
const isValidImage = (image: string) => isDisplayableImage(image);

export const DoctorProfileScreen = () => {
  const { showToast, currentUser } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clinicPhotoRef = useRef<HTMLInputElement>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [image, setImage] = useState('');
  const [clinicPhotos, setClinicPhotos] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  const [qual, setQual] = useState('');
  const [exp, setExp] = useState('');
  const [patientsTreated, setPatientsTreated] = useState('');
  const [avgWaitTime, setAvgWaitTime] = useState('');
  const [about, setAbout] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  // Location state
  const [locStatus, setLocStatus] = useState<'idle' | 'locating' | 'done' | 'error'>('idle');
  const [locAddress, setLocAddress] = useState('');
  const [locCoords, setLocCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetch('/api/specialties')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.specialties) && data.specialties.length > 0) {
          setAvailableSpecialties(data.specialties);
        }
      })
      .catch(err => console.error('Failed to load specialties:', err));
  }, []);

  useEffect(() => {
    if (currentUser?._id && currentUser.role === 'doctor') {
      fetch(`/api/doctors/${currentUser._id}`)
        .then(res => res.json())
        .then(data => {
          setDoctor(data);
          setImage(data.image || '');
          setName(data.name || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setSpecialty(data.specialty || '');
          setQual(data.qual || '');
          setExp(data.exp || '');
          setPatientsTreated(data.patientsTreated || '');
          setAvgWaitTime(data.avgWaitTime || '');
          setAbout(data.about || '');
          setAddress(data.address || '');
          setClinicPhotos(data.clinicPhotos || []);
        })
        .catch(err => console.error('Failed to fetch doctor:', err));
    }
  }, [currentUser?._id, currentUser?.role]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 'error');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      showToast('Image must be under 15MB.', 'error');
      return;
    }

    // Resize before saving so the photo loads quickly everywhere it's shown.
    compressImageFile(file, 640, 0.85)
      .then(setImage)
      .catch(err => showToast(err.message || 'Could not use this image.', 'error'));
  };

  const removeImage = () => {
    setImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor?._id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/doctors/${doctor._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, specialty, qual, exp, patientsTreated, avgWaitTime, about, address, image, clinicPhotos }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDoctor(updated);
        showToast('Profile updated successfully!');
      } else {
        showToast('Failed to update profile.', 'error');
      }
    } catch {
      showToast('Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported by your browser.', 'error');
      return;
    }
    setLocStatus('locating');
    setLocAddress('');
    setLocCoords(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocCoords({ lat, lng });
        try {
          const addr = await reverseGeocode(lat, lng);
          setLocAddress(addr);
          setLocStatus('done');
          // Save to DB silently
          await fetch('/api/location', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: doctor._id, role: 'doctor', lat, lng }),
          });
          showToast('Location saved successfully!');
        } catch {
          setLocStatus('done');
          setLocAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          showToast('Location saved, but address lookup failed.', 'error');
        }
      },
      (err) => {
        setLocStatus('error');
        if (err.code === 1) showToast('Location permission denied. Please allow access.', 'error');
        else showToast('Could not get location. Try again.', 'error');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  if (!doctor) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasImage = isValidImage(image);
  const initials = getInitials(name);
  const colorClass = getColorForName(name);

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder-gray-400";

  return (
    <div className="p-4 pb-40 md:pb-8 md:p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="mb-5 md:mb-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs md:text-sm">Manage your professional information</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">

          {/* ---- LEFT COLUMN: Profile Card ---- */}
          <div className="lg:col-span-1 space-y-5">
            {/* Avatar Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6 text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                {hasImage ? (
                  <img
                    src={image}
                    alt={name}
                    className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-teal-100 dark:border-teal-900/50 shadow-lg"
                  />
                ) : (
                  <div className={`w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg`}>
                    <span className="text-white font-black text-3xl md:text-4xl select-none">{initials}</span>
                  </div>
                )}

                {/* Camera overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-9 h-9 bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center justify-center shadow-lg transition-colors"
                  title="Change photo"
                >
                  <Camera size={16} />
                </button>

                {/* Remove button (only if has image) */}
                {hasImage && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                    title="Remove photo"
                  >
                    <X size={12} />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">JPG, PNG under 2MB</p>

              {/* Name & Specialty */}
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white truncate">{name || 'Doctor Name'}</h2>
              <p className="text-teal-600 dark:text-teal-400 font-semibold text-sm mt-0.5">{specialty || 'Specialty'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{qual} · {exp}</p>

              {/* Rating */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <Star size={15} className="text-amber-400 fill-amber-400" />
                <span className="font-bold text-gray-900 dark:text-white text-sm">{doctor.rating}</span>
                <span className="text-gray-400 text-sm">({doctor.reviews} reviews)</span>
              </div>
            </div>

            {/* Contact Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6 space-y-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Contact Information</h3>

              {email && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Email</p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{email}</p>
                  </div>
                </div>
              )}

              {phone && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                    <Phone size={16} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Phone</p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{phone}</p>
                  </div>
                </div>
              )}

              {address && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Clinic</p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{address}</p>
                  </div>
                </div>
              )}

              {!email && !phone && !address && (
                <p className="text-sm text-gray-400 text-center py-2">No contact info added yet</p>
              )}
            </div>
          </div>

          {/* ---- RIGHT COLUMN: Edit Form ---- */}
          <div className="lg:col-span-2 space-y-5">

            {/* Personal Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-teal-600" /> Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Dr. John Doe" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specialty</label>
                  <div className="relative">
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className={`${inputClass} appearance-none cursor-pointer pr-10`}
                      required
                    >
                      <option value="" disabled>Select Specialty</option>
                      {specialty && !availableSpecialties.includes(specialty) && (
                        <option key={specialty} value={specialty}>{specialty}</option>
                      )}
                      {availableSpecialties.map((spec) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Mail size={16} className="text-teal-600" /> Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="doctor@example.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone Number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
                </div>
              </div>
            </div>

            {/* Qualifications */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCap size={16} className="text-teal-600" /> Qualifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qualification</label>
                  <input value={qual} readOnly className={`${inputClass} opacity-70 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50`} placeholder="MBBS, MD" />
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Contact admin to change qualification</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={11} /> Experience
                  </label>
                  <input value={exp} onChange={e => setExp(e.target.value)} maxLength={40} className={inputClass} placeholder="e.g. 12 years" />
                </div>
              </div>
            </div>

            {/* Profile highlights shown on the public profile */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Clock size={16} className="text-teal-600" /> Profile Highlights
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Shown on your public profile next to your rating. Leave blank to hide.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patients Treated</label>
                  <input value={patientsTreated} onChange={e => setPatientsTreated(e.target.value)} maxLength={40} className={inputClass} placeholder="e.g. 3,500+" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Average Chamber Wait</label>
                  <input value={avgWaitTime} onChange={e => setAvgWaitTime(e.target.value)} maxLength={40} className={inputClass} placeholder="e.g. ~15 mins" />
                </div>
              </div>
            </div>

            {/* GPS Location Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Navigation size={16} className="text-teal-600" /> My Location
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Fetch your current GPS location so patients can see how far you are from them.
              </p>

              <button
                type="button"
                onClick={fetchLocation}
                disabled={locStatus === 'locating'}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                  locStatus === 'locating'
                    ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-500 cursor-not-allowed border border-teal-200 dark:border-teal-800'
                    : locStatus === 'done'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                    : locStatus === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-[0.98]'
                }`}
              >
                {locStatus === 'locating' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                    Fetching location…
                  </>
                ) : locStatus === 'done' ? (
                  <>
                    <CheckCircle2 size={16} />
                    Location Saved · Fetch Again
                  </>
                ) : locStatus === 'error' ? (
                  <>
                    <AlertTriangle size={16} />
                    Retry Fetch Location
                  </>
                ) : (
                  <>
                    <LocateFixed size={16} />
                    Fetch My Current Location
                  </>
                )}
              </button>

              {/* Show fetched address */}
              {locStatus === 'done' && locAddress && (
                <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1.5">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 leading-relaxed">{locAddress}</p>
                  </div>
                  {locCoords && (
                    <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 font-mono pl-5">
                      {locCoords.lat.toFixed(5)}°N, {locCoords.lng.toFixed(5)}°E
                    </p>
                  )}
                </div>
              )}

              {locStatus === 'error' && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-400">
                    Permission denied or location unavailable. Please allow location access in your browser settings.
                  </p>
                </div>
              )}

              {/* Show existing saved location from DB */}
              {locStatus === 'idle' && doctor?.location?.lat && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl flex items-start gap-2">
                  <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Last saved location</p>
                    <p className="text-[10px] text-gray-600 dark:text-gray-300 font-mono">
                      {doctor.location.lat.toFixed(5)}°N, {doctor.location.lng.toFixed(5)}°E
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Clinic & About */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Building2 size={16} className="text-teal-600" /> Clinic & About
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clinic Address</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="123 Medical Street, City" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={11} /> About
                  </label>
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Tell patients about yourself, your practice, and specializations..."
                  />
                </div>
              </div>
            </div>

            {/* Clinic Photos Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <ImageIcon size={16} className="text-teal-600" /> Clinic Photos
                <span className="text-[10px] text-gray-400 font-normal ml-1">(Max 10)</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1 mb-3">Shown in the gallery on your public profile. Add chamber-specific photos from the Chambers page.</p>
              <input
                ref={clinicPhotoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (clinicPhotos.length >= 10) { showToast('Maximum 10 photos allowed.', 'error'); return; }
                  if (file.size > 15 * 1024 * 1024) { showToast('Image must be under 15MB.', 'error'); return; }
                  compressImageFile(file)
                    .then(photo => setClinicPhotos(prev => [...prev, photo].slice(0, 10)))
                    .catch(err => showToast(err.message || 'Could not use this image.', 'error'));
                  if (clinicPhotoRef.current) clinicPhotoRef.current.value = '';
                }}
              />
              <div className="grid grid-cols-3 gap-2">
                {clinicPhotos.map((photo, i) => (
                  <div key={i} className="relative group">
                    <img src={photo} alt={`Clinic ${i + 1}`} className="w-full h-24 object-cover rounded-xl bg-gray-100 dark:bg-gray-700" />
                    <button
                      type="button"
                      onClick={() => setClinicPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
                {clinicPhotos.length < 10 && (
                  <button
                    type="button"
                    onClick={() => clinicPhotoRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-teal-500 hover:border-teal-400 transition-colors"
                  >
                    <Plus size={20} />
                    <span className="text-[9px] mt-1">Add Photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Save Button */}
            <div className="hidden md:flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold text-sm transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98] w-full sm:w-auto justify-center"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Mobile Sticky Save Button (above bottom nav) */}
      <div className="md:hidden fixed bottom-[68px] left-0 right-0 z-40 px-4 pb-2 pt-2 bg-gradient-to-t from-gray-50 via-gray-50 to-gray-50/0 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900/0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors shadow-lg shadow-teal-600/20 active:scale-[0.98] disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
