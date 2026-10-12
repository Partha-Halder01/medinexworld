"use client";
import React from 'react';

export const CategoryCard = ({ icon, label, color, onClick }: any) => (
  <div onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform group">
    <div className={`w-[72px] h-[72px] rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow ${color}`}>
      {React.cloneElement(icon, { size: 30, strokeWidth: 1.5 })}
    </div>
    <span className="text-[11px] font-bold text-gray-700 text-center w-full truncate px-1 dark:text-gray-300">{label}</span>
  </div>
);
