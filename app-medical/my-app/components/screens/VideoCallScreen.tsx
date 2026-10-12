"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, User, Mic, MicOff, Phone, Video, VideoOff } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

export const VideoCallScreen = () => {
  const { activeVideoCall, endVideoCall } = useAppContext();
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!activeVideoCall) return null;
  const doctor = activeVideoCall;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-[100] flex flex-col overflow-hidden animate-fade-in w-full h-full">
      {/* Simulated Doctor Video Area (Background) */}
      <div className="absolute inset-0 opacity-60 flex items-center justify-center pointer-events-none">
        <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover blur-md scale-110" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex justify-between items-center p-6 md:p-8 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <img src={doctor.image} className="w-14 h-14 rounded-full border-2 border-green-400 shadow-lg" alt="Doctor" />
          <div>
            <h2 className="text-white font-bold text-lg md:text-xl drop-shadow-md">{doctor.name}</h2>
            <p className="text-green-400 text-sm font-medium drop-shadow-md">{formatTime(callDuration)} • Secure AES-256</p>
          </div>
        </div>
        <button onClick={endVideoCall} className="text-white/80 hover:text-white p-3 md:bg-white/10 md:rounded-full md:backdrop-blur-sm transition-colors">
          <ChevronLeft className="rotate-180" size={28} />
        </button>
      </div>

      {/* Focus Area (Simulating looking at doctor) */}
      <div className="flex-1 relative z-10 flex items-center justify-center p-6">
        {isVideoOff ? (
          <div className="w-40 h-40 md:w-64 md:h-64 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 border-[6px] border-gray-700 shadow-2xl">
            <User size={80} className="md:w-32 md:h-32" />
          </div>
        ) : (
          <div className="w-64 h-64 md:w-96 md:h-96 rounded-full overflow-hidden border-[6px] border-white/20 shadow-2xl animate-pulse">
            <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Self View Picture-in-Picture */}
      {!isVideoOff && (
        <div className="absolute bottom-40 right-6 md:bottom-10 md:right-10 w-28 h-40 md:w-48 md:h-64 bg-gray-800 border-2 border-white/30 rounded-2xl z-20 overflow-hidden flex items-center justify-center shadow-2xl">
          <User className="text-gray-500" size={60} />
          <p className="absolute bottom-2 left-3 text-xs md:text-sm text-white/80 font-medium drop-shadow-md">You</p>
        </div>
      )}

      {/* Call Controls */}
      <div className="relative z-10 bg-gradient-to-t from-black via-black/80 to-transparent p-10 flex justify-center items-center gap-8 md:gap-12 pb-safe">
        <button onClick={() => setIsMuted(!isMuted)} className={`p-5 rounded-full transition-colors shadow-lg ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700/80 text-white hover:bg-gray-600 backdrop-blur-md'}`}>
          {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
        <button onClick={endVideoCall} className="p-6 md:p-8 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-2xl shadow-red-900/50 transition-transform active:scale-90 relative">
          <span className="absolute inset-0 rounded-full animate-ping bg-red-600 opacity-20"></span>
          <Phone size={36} className="rotate-[135deg]" />
        </button>
        <button onClick={() => setIsVideoOff(!isVideoOff)} className={`p-5 rounded-full transition-colors shadow-lg ${isVideoOff ? 'bg-white text-gray-900' : 'bg-gray-700/80 text-white hover:bg-gray-600 backdrop-blur-md'}`}>
          {isVideoOff ? <VideoOff size={28} /> : <Video size={28} />}
        </button>
      </div>
    </div>
  );
};
