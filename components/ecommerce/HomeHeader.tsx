'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, MapPin, ShoppingBag, Clock, Star, Bike } from 'lucide-react';

interface HomeHeaderProps {
  restaurantName: string;
  restaurantLogo?: string;
  logoFormat?: string;
  location?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  cartCount?: number;
  slug?: string;
  minOrder?: number;
  deliveryTime?: string;
  rating?: number;
  categoryBar?: React.ReactNode;
}

export default function HomeHeader({
  restaurantName,
  restaurantLogo,
  logoFormat = 'square',
  location,
  onSearch,
  searchValue,
  cartCount = 0,
  slug,
  deliveryTime = '30-50',
  rating = 4.8,
  categoryBar,
}: HomeHeaderProps) {
  return (
    <div>
      {/* Top sticky block: navbar + category bar together */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        {/* Main navbar row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            {/* Restaurant logo + name */}
            <Link href={slug ? `/${slug}` : '/'} className="flex items-center gap-2.5 shrink-0">
              {restaurantLogo ? (
                logoFormat === 'wide' ? (
                  <div className="h-10 w-32 sm:h-11 sm:w-36 rounded-xl overflow-hidden shrink-0 relative">
                    <Image
                      src={restaurantLogo}
                      alt={restaurantName}
                      fill
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 relative">
                    <Image
                      src={restaurantLogo}
                      alt={restaurantName}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )
              ) : (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[var(--color-lime-primary)] flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-base">F</span>
                </div>
              )}
              {logoFormat !== 'wide' && (
                <span className="font-black text-gray-900 text-base line-clamp-1 max-w-[160px]">
                  {restaurantName}
                </span>
              )}
            </Link>

            {/* Search bar — desktop */}
            <div className="hidden md:flex flex-1 max-w-lg mx-auto relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar no cardápio..."
                value={searchValue}
                onChange={(e) => onSearch?.(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/50 focus:border-transparent"
              />
            </div>

            {/* Location */}
            {location && (
              <div className="hidden lg:flex items-center gap-1.5 text-sm text-gray-500 shrink-0 ml-auto mr-4">
                <MapPin className="h-4 w-4 text-[var(--color-lime-primary)] shrink-0" />
                <span className="line-clamp-1 max-w-[180px]">{location}</span>
              </div>
            )}

            {/* Cart */}
            {slug && (
              <Link
                href={`/${slug}/cart`}
                className="relative ml-auto md:ml-0 flex items-center justify-center bg-[var(--color-lime-primary)] text-white w-11 h-11 rounded-xl hover:brightness-90 transition-all shrink-0"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-[var(--color-lime-primary)] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Category bar slot — rendered inside the sticky header */}
        {categoryBar && (
          <div className="border-t border-gray-100 bg-white">
            {categoryBar}
          </div>
        )}
      </header>

      {/* Non-sticky info strip — scrolls away with the page */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Mobile search */}
          <div className="md:hidden mb-3 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar no cardápio..."
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/50 focus:border-transparent"
            />
          </div>

          {/* Info pills */}
          <div className="flex items-center gap-4 text-sm overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="font-bold text-gray-900">{rating}</span>
              <span className="text-gray-400">(500+)</span>
            </div>
            <div className="w-px h-4 bg-gray-200 shrink-0" />
            <div className="flex items-center gap-1.5 text-gray-600 shrink-0">
              <Clock className="h-4 w-4" />
              <span>{deliveryTime} min</span>
            </div>
            <div className="w-px h-4 bg-gray-200 shrink-0" />
            <div className="flex items-center gap-1.5 text-gray-600 shrink-0">
              <Bike className="h-4 w-4" />
              <span>Entrega disponível</span>
            </div>
            {location && (
              <>
                <div className="w-px h-4 bg-gray-200 shrink-0" />
                <div className="flex items-center gap-1.5 text-gray-500 shrink-0 md:hidden">
                  <MapPin className="h-4 w-4 text-[var(--color-lime-primary)]" />
                  <span className="line-clamp-1 max-w-[160px]">{location}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
