"use client";
import React, { useState, useEffect } from 'react';
import { Users, Calendar, Star, IndianRupee, Clock, MapPin, Building2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { SafeImage } from '@/components/ui/SafeImage';
import { isDisplayableImage } from '@/lib/imageUrl';

const isValidDoctorImage = (image?: string) => isDisplayableImage(image);

const getInitials = (name?: string) =>
  (name || 'Doctor')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

export const DoctorDashboardScreen = () => {
  const router = useRouter();
  const { appointments, currentUser } = useAppContext();
  const [doctor, setDoctor] = useState<any>(null);

  useEffect(() => {
    if (currentUser?._id && currentUser.role === 'doctor') {
      fetch(`/api/doctors/${currentUser._id}`)
        .then(res => res.json())
        .then(data => setDoctor(data))
        .catch(err => console.error('Failed to fetch doctor:', err));
    }
  }, [currentUser?._id, currentUser?.role]);

  if (!doctor) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const myAppointments = appointments.filter((apt: any) => {
    const doctorId = apt.doctorId?._id || apt.doctorId;
    return doctorId === currentUser?._id;
  });

  const confirmedCount = myAppointments.filter((a: any) => a.status === 'Confirmed').length;
  const completedCount = myAppointments.filter((a: any) => a.status === 'Completed').length;
  const totalEarnings = myAppointments
    .filter((a: any) => a.status === 'Completed')
    .reduce((sum: number, a: any) => {
      // Chamber bookings store the consultation fee collected at the chamber in basePrice.
      const fee = Number(a.basePrice) || a.doctorId?.fee || doctor.fee || 0;
      return sum + fee;
    }, 0);

  const stats = [
    { label: "Upcoming", value: confirmedCount, icon: <Calendar size={20} />, color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', sub: 'Confirmed', path: '/doctor-panel/appointments' },
    { label: 'Completed', value: completedCount, icon: <Users size={20} />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', sub: 'All time', path: '/doctor-panel/appointments' },
    { label: 'Rating', value: doctor.rating, icon: <Star size={20} />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', sub: `${doctor.reviews} reviews`, path: '/doctor-panel/profile' },
    { label: 'Earnings', value: `₹${totalEarnings.toLocaleString('en-IN')}`, icon: <IndianRupee size={20} />, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', sub: 'From completed', path: '/doctor-panel/wallet' },
  ];

  return (
    <div className="p-4 pb-28 md:pb-8 md:p-8 xl:px-12 space-y-6 w-full max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white truncate">
              Welcome, {doctor.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm md:text-base">{doctor.specialty} · {doctor.qual}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/doctor-panel/chambers"
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-sm whitespace-nowrap bg-teal-600 text-white hover:bg-teal-700"
            >
              <Building2 size={16} />
              <span className="hidden sm:inline">My Chambers &amp; Check-in</span>
              <span className="sm:hidden">Chambers</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {stats.map((s) => (
          <div 
            key={s.label} 
            onClick={() => s.path && router.push(s.path)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 group select-none"
            role="button"
            tabIndex={0}
            title={`View ${s.label}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`inline-flex p-2 rounded-xl ${s.color}`}>{s.icon}</div>
              <ArrowUpRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{s.value}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">{s.label}</p>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Doctor Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg">My Profile</h3>
            <Link
              href="/doctor-panel/profile"
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>Edit Profile</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
          <div 
            onClick={() => router.push('/doctor-panel/profile')}
            className="flex items-center gap-4 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-700/30 p-2 rounded-2xl transition-colors group"
            role="button"
            tabIndex={0}
            title="Click to view/edit profile"
          >
            {isValidDoctorImage(doctor.image) ? (
              <SafeImage
                src={doctor.image}
                alt={doctor.name}
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-teal-100 dark:border-teal-900 shrink-0"
                fallback={
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-teal-100 dark:border-teal-900 shrink-0 bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-300 font-extrabold text-lg md:text-xl">
                    {getInitials(doctor.name) || 'DR'}
                  </div>
                }
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-teal-100 dark:border-teal-900 shrink-0 bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-300 font-extrabold text-lg md:text-xl">
                {getInitials(doctor.name) || 'DR'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-base md:text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{doctor.name}</h4>
              <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">{doctor.specialty}</p>
              <p className="text-xs text-gray-400 mt-0.5">{doctor.qual} · {doctor.exp}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3 mt-4">
            <div 
              onClick={() => router.push('/doctor-panel/profile')}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5 md:p-3 text-center cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-200 border border-transparent transition-all select-none active:scale-95 group"
              role="button"
              tabIndex={0}
              title="View rating in profile"
            >
              <p className="text-base md:text-lg font-extrabold text-gray-900 dark:text-white group-hover:text-teal-600">{doctor.rating}</p>
              <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Rating</p>
            </div>
            <div 
              onClick={() => router.push('/doctor-panel/profile')}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5 md:p-3 text-center cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-200 border border-transparent transition-all select-none active:scale-95 group"
              role="button"
              tabIndex={0}
              title="View reviews in profile"
            >
              <p className="text-base md:text-lg font-extrabold text-gray-900 dark:text-white group-hover:text-teal-600">{doctor.reviews}</p>
              <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Reviews</p>
            </div>
            <div 
              onClick={() => router.push('/doctor-panel/profile')}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5 md:p-3 text-center cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-200 border border-transparent transition-all select-none active:scale-95 group"
              role="button"
              tabIndex={0}
              title="View fee in profile"
            >
              <p className="text-base md:text-lg font-extrabold text-gray-900 dark:text-white group-hover:text-teal-600">₹{doctor.fee}</p>
              <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Fee</p>
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
          <div 
            onClick={() => router.push('/doctor-panel/appointments')}
            className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors group select-none"
            role="button"
            tabIndex={0}
            title="View all appointments"
          >
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Appointments</h3>
              <ArrowUpRight size={16} className="text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <span className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 px-2.5 py-1 rounded-full font-bold group-hover:underline">{myAppointments.length} total →</span>
          </div>
          {myAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 text-gray-400 dark:text-gray-500">
              <Calendar size={36} className="mb-3 opacity-50" />
              <p className="text-sm font-medium">No appointments yet</p>
              <p className="text-xs mt-1">Bookings from patients will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-72 overflow-y-auto">
              {myAppointments.slice(0, 8).map((apt: any) => (
                <div 
                  key={apt._id} 
                  onClick={() => router.push('/doctor-panel/appointments')}
                  className="px-5 md:px-6 py-3.5 flex items-center gap-3 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors cursor-pointer active:scale-[0.99] group"
                  role="button"
                  tabIndex={0}
                  title="Click to view appointment details"
                >
                  <div className="p-2 rounded-lg shrink-0 bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                    <MapPin size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{apt.patientId?.name || 'Patient'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock size={11} /> {apt.date} · {apt.slot}</p>
                  </div>
                  <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-full font-bold shrink-0 ${
                    apt.status === 'Confirmed' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                    apt.status === 'Completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Slots */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg">My Available Slots</h3>
          <Link
            href="/doctor-panel/schedule"
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            <span>Manage Schedule</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {doctor.slots.map((slot: string) => (
            <Link
              key={slot}
              href="/doctor-panel/schedule"
              className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-center hover:bg-teal-100/60 dark:hover:bg-teal-900/40 transition-colors active:scale-95"
            >
              <p className="text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                <Clock size={13} /> {slot}
              </p>
            </Link>
          ))}
          {doctor.slots.length === 0 && (
            <p className="text-sm text-gray-400 italic">No slots configured. Go to My Schedule to add slots.</p>
          )}
        </div>
      </div>
    </div>
  );
};
