'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, MapPin, ShoppingBag, Star, Bike, ChevronRight } from 'lucide-react';

interface HomeHeaderProps {
  restaurantName: string;
  restaurantLogo?: string;
  logoFormat?: string;
  coverUrl?: string;
  location?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  cartCount?: number;
  slug?: string;
  minOrderValue?: number;
  deliveryFee?: number;
  deliveryRadius?: number;
  deliveryTime?: string;
  rating?: number;
}

function fmt(n: number) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`
}

export default function HomeHeader({
  restaurantName,
  restaurantLogo,
  logoFormat = 'square',
  coverUrl,
  location,
  onSearch,
  searchValue,
  cartCount = 0,
  slug,
  minOrderValue,
  deliveryFee,
  deliveryRadius,
  deliveryTime = '30-50',
  rating = 4.8,
}: HomeHeaderProps) {

  const bannerStyle: React.CSSProperties = coverUrl
    ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: 'var(--color-lime-primary)' };

  const deliveryInfoParts = [
    deliveryRadius ? `${deliveryRadius} km` : null,
    minOrderValue ? `Min ${fmt(minOrderValue)}` : null,
  ].filter(Boolean);

  const logoContent = restaurantLogo ? (
    <Image
      src={restaurantLogo}
      alt={restaurantName}
      width={72}
      height={72}
      className="object-cover w-full h-full"
      referrerPolicy="no-referrer"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-lime-primary)' }}>
      <span className="text-white font-black text-2xl">{restaurantName.charAt(0)}</span>
    </div>
  );

  return (
    <div>
      {/* ── Sticky top navbar (todos os breakpoints) ───────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            {/* Logo + nome */}
            <Link href={slug ? `/${slug}` : '/'} className="flex items-center gap-2.5 shrink-0">
              {restaurantLogo ? (
                logoFormat === 'wide' ? (
                  <div className="h-10 w-32 sm:h-11 sm:w-36 rounded-xl overflow-hidden shrink-0 relative">
                    <Image src={restaurantLogo} alt={restaurantName} fill className="object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 relative">
                    <Image src={restaurantLogo} alt={restaurantName} fill className="object-cover" referrerPolicy="no-referrer" />
                  </div>
                )
              ) : (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-lime-primary)' }}>
                  <span className="text-white font-black text-base">F</span>
                </div>
              )}
              {logoFormat !== 'wide' && (
                <span className="font-black text-gray-900 text-base hidden sm:block line-clamp-1 max-w-[140px]">
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

            {/* Localização — desktop */}
            {location && (
              <div className="hidden lg:flex items-center gap-1.5 text-sm text-gray-500 shrink-0 ml-auto mr-4">
                <MapPin className="h-4 w-4 text-[var(--color-lime-primary)] shrink-0" />
                <span className="line-clamp-1 max-w-[180px]">{location}</span>
              </div>
            )}

            {/* Carrinho */}
            {slug && (
              <Link
                href={`/${slug}/cart`}
                className="relative ml-auto md:ml-0 flex items-center justify-center text-white w-11 h-11 rounded-xl hover:brightness-90 transition-all shrink-0"
                style={{ backgroundColor: 'var(--color-lime-primary)' }}
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm" style={{ color: 'var(--color-lime-primary)' }}>
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero MOBILE: card estilo iFood ─────────────────────────────── */}
      <div className="md:hidden">
        {/* Banner com logo sobreposto */}
        <div className="relative h-36 w-full flex items-end justify-center" style={bannerStyle}>
          {coverUrl && <div className="absolute inset-0 bg-black/20" />}
          {/* Logo circular centralizado, sobrepondo o início do card */}
          <div className="relative z-20 translate-y-9">
            <div className="w-[72px] h-[72px] rounded-full border-[3px] border-white overflow-hidden bg-white shadow-md">
              {logoContent}
            </div>
          </div>
        </div>

        {/* Card de informações */}
        <div className="bg-white rounded-t-3xl -mt-5 pt-14 px-4 pb-1 relative shadow-sm">
          {/* Nome + chevron */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="text-[18px] font-bold text-gray-900 leading-snug flex-1">
              {restaurantName}
            </h2>
            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          </div>

          {/* Subtítulo: raio + pedido mínimo */}
          <p className="text-[13px] text-gray-500 mb-3.5">
            {['Delivery', ...deliveryInfoParts].join(' • ')}
          </p>

          <div className="border-t border-gray-100 mb-3.5" />

          {/* Avaliação + chevron */}
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-1.5">
              <Star className="w-[15px] h-[15px] text-amber-400 fill-amber-400" />
              <span className="font-semibold text-gray-900 text-[14px]">{rating}</span>
              <span className="text-gray-500 text-[13px]">(500+ avaliações)</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
          </div>

          <div className="border-t border-gray-100 mb-3.5" />

          {/* Tempo de entrega + taxa */}
          <div className="mb-4">
            <p className="text-[13px] text-gray-800">
              <span className="font-bold">Entrega</span>
              {deliveryFee !== undefined && (
                <span>
                  {' '}•{' '}
                  {deliveryFee === 0
                    ? <span className="text-green-600 font-semibold">Grátis</span>
                    : <span>{fmt(deliveryFee)}</span>
                  }
                </span>
              )}
              {deliveryTime && (
                <span className="text-gray-600"> • {deliveryTime} min</span>
              )}
            </p>
            {location && (
              <p className="text-[12px] text-gray-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[var(--color-lime-primary)]" />
                {location}
              </p>
            )}
          </div>

          {/* Rodapé cinza */}
          <div className="bg-gray-100 rounded-2xl py-3 px-4 text-center mb-1">
            <div className="flex items-center justify-center gap-1.5">
              <Bike className="w-4 h-4 text-gray-500" />
              <span className="text-[13px] font-semibold text-gray-600">
                Entrega disponível
              </span>
            </div>
          </div>
        </div>

        {/* Barra de busca mobile */}
        <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar no cardápio..."
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/50 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* ── Hero DESKTOP: info strip original ─────────────────────────── */}
      <div className="hidden md:block bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 text-sm overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="font-bold text-gray-900">{rating}</span>
              <span className="text-gray-400">(500+)</span>
            </div>
            <div className="w-px h-4 bg-gray-200 shrink-0" />
            <div className="flex items-center gap-1.5 text-gray-600 shrink-0">
              <Bike className="h-4 w-4" />
              <span>{deliveryTime} min</span>
            </div>
            {deliveryFee !== undefined && (
              <>
                <div className="w-px h-4 bg-gray-200 shrink-0" />
                <div className="flex items-center gap-1.5 text-gray-600 shrink-0">
                  <span>{deliveryFee === 0 ? 'Entrega grátis' : fmt(deliveryFee)}</span>
                </div>
              </>
            )}
            {minOrderValue ? (
              <>
                <div className="w-px h-4 bg-gray-200 shrink-0" />
                <span className="text-gray-500 shrink-0">Min {fmt(minOrderValue)}</span>
              </>
            ) : null}
            {location && (
              <>
                <div className="w-px h-4 bg-gray-200 shrink-0" />
                <div className="flex items-center gap-1.5 text-gray-500 shrink-0">
                  <MapPin className="h-4 w-4 text-[var(--color-lime-primary)]" />
                  <span className="line-clamp-1 max-w-[180px]">{location}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
