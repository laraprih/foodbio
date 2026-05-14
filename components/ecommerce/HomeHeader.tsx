'use client';

import React from 'react';
import Image from 'next/image';
import { Search, SlidersHorizontal, MapPin, Bell } from 'lucide-react';
import { images } from '@/lib/data';

interface HomeHeaderProps {
  restaurantName: string;
  restaurantLogo?: string;
  location?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
}

export default function HomeHeader({
  restaurantName,
  restaurantLogo,
  location,
  onSearch,
  searchValue,
}: HomeHeaderProps) {
  return (
    <header className="bg-zinc-900 pt-12 pb-8 px-6 rounded-b-[40px]">
      <div className="flex items-center justify-between mb-8">
        {/* User Profile / Logo */}
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
          <Image
            src={restaurantLogo || images.profile}
            alt={restaurantName}
            width={40}
            height={40}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Restaurant Name / Location */}
        <div className="text-center flex-1 px-2">
          <p className="text-[11px] text-zinc-400 font-medium mb-0.5">
            {restaurantName}
          </p>
          <div className="flex items-center justify-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-[var(--color-lime-primary)]" />
            <span className="text-sm text-white font-semibold line-clamp-1">
              {location || 'Kaligonj, Satkhira, Bangladesh'}
            </span>
          </div>
        </div>

        {/* Notification Bell */}
        <button className="relative w-10 h-10 shrink-0 flex items-center justify-center bg-zinc-800 rounded-full">
          <Bell className="h-5 w-5 text-white" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-zinc-900 rounded-full"></span>
        </button>
      </div>

      {/* Hero Card */}
      <section className="relative bg-zinc-800/60 rounded-3xl p-6 overflow-hidden border border-white/5 h-[160px] flex items-center">
        <div className="relative z-10 w-2/3">
          <h2 className="text-2xl font-bold text-white leading-tight">
            <span className="text-[var(--color-lime-primary)]">30%</span> EXTRA
            <br />
            DISCOUNT
          </h2>
          <p className="text-[11px] text-zinc-300 mt-2 leading-relaxed opacity-80">
            Enjoy your first ride with an
            <br />
            exclusive offer!
          </p>
        </div>
        {/* Hero Image */}
        <div className="absolute top-0 right-[-10%] h-full w-[60%] pointer-events-none">
          <Image
            src={images.heroBurger}
            alt="Special Offer"
            width={200}
            height={200}
            className="object-contain h-full w-full opacity-90 scale-[1.3] translate-y-3"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      {/* Search Bar */}
      <div className="mt-8 flex gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400" />
          </span>
          <input
            type="text"
            placeholder="Search"
            value={searchValue}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full bg-white rounded-[20px] py-4 pl-12 pr-4 text-sm border-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/50 text-zinc-800 shadow-sm outline-none"
          />
        </div>
        <button className="bg-white p-4 rounded-[20px] shadow-sm flex items-center justify-center shrink-0">
          <SlidersHorizontal className="h-5 w-5 text-zinc-800" />
        </button>
      </div>
    </header>
  );
}
