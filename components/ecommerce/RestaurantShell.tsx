'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home as HomeIcon, ShoppingBag, Heart, User,
  Star, Plus, Search, Clock, Bike, MapPin,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { cn, formatCurrency } from '@/lib/utils';
import CategoryBar from '@/components/ecommerce/CategoryBar';
import ProductModal from '@/components/ecommerce/ProductModal';
import { StoreImage } from '@/components/ui/StoreImage';
import useSessionStore from '@/store/session-store';
import { useCart } from '@/hooks/use-cart';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  logoFormat?: string;
  address?: string | null;
  gateway: 'mercadopago' | 'pagbank' | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  available: boolean;
  categoryId?: string;
  featured?: boolean;
}

interface Category {
  id: string;
  name: string;
  iconUrl?: string;
  products: Product[];
}

interface RestaurantShellProps {
  tenant: Tenant;
  menu: Category[] | null;
  slug: string;
}

// ── Featured card (Destaques grid) ──────────────────────────────────────────
function FeaturedCard({ product, onAdd }: { product: Product; onAdd: (id: string) => void }) {
  return (
    <div
      className="cursor-pointer group active:scale-[0.97] transition-transform"
      onClick={() => onAdd(product.id)}
    >
      <div className="aspect-square rounded-2xl overflow-hidden relative bg-gray-100">
        {product.imageUrl ? (
          <StoreImage
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <ShoppingBag className="w-8 h-8 text-gray-200" />
          </div>
        )}
        {!product.available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-[9px] font-bold bg-black/60 px-1.5 py-0.5 rounded-full">
              Esgotado
            </span>
          </div>
        )}
      </div>
      <p className="font-black text-gray-900 text-sm mt-2">{formatCurrency(product.price)}</p>
      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-snug">{product.name}</p>
    </div>
  );
}

// ── List item (category sections) ───────────────────────────────────────────
function ProductListItem({ product, onAdd }: { product: Product; onAdd: (id: string) => void }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 py-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors px-1 rounded-xl',
        !product.available && 'opacity-60'
      )}
      onClick={() => onAdd(product.id)}
    >
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 text-sm leading-snug">{product.name}</h4>
        {product.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        <span className="font-black text-gray-900 text-base mt-2 block">
          {formatCurrency(product.price)}
        </span>
      </div>
      {product.imageUrl ? (
        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative bg-gray-100">
          <StoreImage
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="w-24 h-24 rounded-2xl shrink-0 bg-gray-100 flex items-center justify-center">
          <Plus className="w-8 h-8 text-gray-200" />
        </div>
      )}
    </div>
  );
}

export default function RestaurantShell({ tenant, menu, slug }: RestaurantShellProps) {
  const { setTenant } = useSessionStore();
  const { addToCart, count: cartCount, cartSubtotal } = useCart();
  const { data: session } = useSession();
  const customer = session?.user as any;
  const isLoggedIn = customer?.role === 'customer' && !!customer?.tenantId;

  const [activeCategoryId, setActiveCategoryId] = useState('destaques');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  // Fixed header measurement — ResizeObserver ensures correct value
  // even when mobile URL bar appears/disappears
  const fixedHeaderRef = useRef<HTMLDivElement>(null);
  const headerHeightRef = useRef(112); // ref for scroll calculations (no re-render)
  const [headerH, setHeaderH] = useState(112);  // state for spacer rendering

  const blockScrollSpy = useRef(false);

  useEffect(() => {
    setTenant({ id: tenant.id, slug: tenant.slug, name: tenant.name, gateway: tenant.gateway });
  }, [tenant, setTenant]);

  // Measure fixed header height dynamically
  useEffect(() => {
    const el = fixedHeaderRef.current;
    if (!el) return;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      headerHeightRef.current = h;
      setHeaderH(h);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const menuCategories = menu ?? [];
  const allProducts = menuCategories.flatMap((c) =>
    c.products.map((p) => ({ ...p, categoryId: p.categoryId ?? c.id }))
  );
  const featuredProducts = allProducts.filter((p) => p.featured && p.available);

  const tabs = [
    ...(featuredProducts.length > 0 ? [{ id: 'destaques', name: 'Destaques' }] : []),
    ...menuCategories.map(({ id, name, iconUrl }) => ({ id, name, iconUrl })),
  ];
  const sectionIds = tabs.map((t) => t.id);

  // Scroll-spy
  const handleScroll = useCallback(() => {
    if (blockScrollSpy.current || searchQuery) return;
    const THRESHOLD = headerHeightRef.current + 8;
    let current = sectionIds[0] ?? '';
    for (const id of sectionIds) {
      const el = document.getElementById(`section-${id}`);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= THRESHOLD) current = id;
    }
    setActiveCategoryId(current);
  }, [sectionIds, searchQuery]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleTabSelect = (id: string) => {
    setActiveCategoryId(id);
    blockScrollSpy.current = true;
    setTimeout(() => { blockScrollSpy.current = false; }, 900);
    const el = document.getElementById(`section-${id}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeightRef.current - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const searchResults = searchQuery
    ? allProducts.filter(
        (p) =>
          p.available &&
          (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const handleAddToCart = (productId: string) => {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;
    setModalProduct(product);
  };

  const handleModalAdd = (
    product: Product,
    options: { id: string; name: string; price: number }[],
    quantity: number
  ) => {
    for (let i = 0; i < quantity; i++) {
      const result = addToCart(
        { id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl ?? null },
        options.map((o) => ({ optionId: o.id, name: o.name, price: o.price })),
        tenant.id,
        tenant.slug
      );
      if (result.needsConfirm) {
        toast.error(result.message);
        return;
      }
    }
    toast.success(`${product.name} adicionado!`);
  };

  return (
    <div className="min-h-[100dvh] bg-white">
      <ProductModal
        product={modalProduct}
        slug={slug}
        onClose={() => setModalProduct(null)}
        onAdd={handleModalAdd}
      />

      {/* ── FIXED top block: logo + cart + categories ────────────────────────
          position:fixed garante que nunca flutua quando a URL bar some/aparece
          no mobile. ResizeObserver mede a altura real para offsetar o conteúdo.
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        ref={fixedHeaderRef}
        className="fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200"
        style={{ WebkitBackfaceVisibility: 'hidden' }}
      >
        {/* Row 1: Logo + search (desktop) + cart */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center gap-3">
            {/* Logo */}
            <Link href={`/${slug}`} className="flex items-center gap-2.5 shrink-0">
              {tenant.logoUrl ? (
                tenant.logoFormat === 'wide' ? (
                  <div className="h-9 w-28 rounded-xl overflow-hidden relative shrink-0">
                    <Image
                      src={tenant.logoUrl}
                      alt={tenant.name}
                      fill
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl overflow-hidden relative shrink-0">
                    <Image
                      src={tenant.logoUrl}
                      alt={tenant.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[var(--color-lime-primary)] flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-sm">F</span>
                </div>
              )}
              {tenant.logoFormat !== 'wide' && (
                <span className="font-black text-gray-900 text-base line-clamp-1 max-w-[150px]">
                  {tenant.name}
                </span>
              )}
            </Link>

            {/* Desktop search */}
            <div className="hidden md:flex flex-1 max-w-lg mx-auto relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar no cardápio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/50 focus:border-transparent"
              />
            </div>

            {/* Cart */}
            <Link
              href={`/${slug}/cart`}
              className="relative ml-auto md:ml-0 flex items-center justify-center bg-[var(--color-lime-primary)] text-white w-10 h-10 rounded-xl hover:brightness-90 transition-all shrink-0"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-white text-[var(--color-lime-primary)] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Row 2: Category tabs */}
        {tabs.length > 0 && (
          <div className="border-t border-gray-100 bg-white">
            <div className="max-w-2xl mx-auto px-4 py-2">
              <CategoryBar
                categories={tabs}
                activeId={activeCategoryId}
                onSelect={handleTabSelect}
              />
            </div>
          </div>
        )}
      </div>

      {/* Spacer: exact height of fixed header, measured by ResizeObserver */}
      <div style={{ height: headerH }} aria-hidden="true" />

      {/* Info strip — scrolls naturally with the page */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Mobile search */}
          <div className="md:hidden mb-3 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar no cardápio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/50 focus:border-transparent"
            />
          </div>
          {/* Pills */}
          <div className="flex items-center gap-4 text-sm overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="font-bold text-gray-900">4.8</span>
              <span className="text-gray-400">(500+)</span>
            </div>
            <div className="w-px h-4 bg-gray-200 shrink-0" />
            <div className="flex items-center gap-1.5 text-gray-600 shrink-0">
              <Clock className="h-4 w-4" />
              <span>30-50 min</span>
            </div>
            <div className="w-px h-4 bg-gray-200 shrink-0" />
            <div className="flex items-center gap-1.5 text-gray-600 shrink-0">
              <Bike className="h-4 w-4" />
              <span>Entrega disponível</span>
            </div>
            {tenant.address && (
              <>
                <div className="w-px h-4 bg-gray-200 shrink-0" />
                <div className="flex items-center gap-1.5 text-gray-500 shrink-0">
                  <MapPin className="h-4 w-4 text-[var(--color-lime-primary)]" />
                  <span className="line-clamp-1 max-w-[160px]">{tenant.address}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-5 pb-40">
        {searchQuery ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-bold text-gray-900">{searchResults.length}</span>{' '}
              resultado{searchResults.length !== 1 ? 's' : ''} para &ldquo;{searchQuery}&rdquo;
            </p>
            {searchResults.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-semibold text-gray-500">Nenhum produto encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {searchResults.map((p) => (
                  <ProductListItem key={p.id} product={p} onAdd={handleAddToCart} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {featuredProducts.length > 0 && (
              <section id="section-destaques" className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h2 className="font-black text-gray-900 text-xl">Destaques</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {featuredProducts.map((p) => (
                    <FeaturedCard key={p.id} product={p} onAdd={handleAddToCart} />
                  ))}
                </div>
              </section>
            )}

            {menuCategories.map((cat) => {
              const available = cat.products.filter((p) => p.available);
              if (available.length === 0) return null;
              return (
                <section key={cat.id} id={`section-${cat.id}`} className="mb-8">
                  <h2 className="font-black text-gray-900 text-xl mb-1">{cat.name}</h2>
                  <p className="text-xs text-gray-400 mb-3">
                    {available.length} item{available.length !== 1 ? 's' : ''}
                  </p>
                  <div className="divide-y divide-gray-100">
                    {available.map((p) => (
                      <ProductListItem key={p.id} product={p} onAdd={handleAddToCart} />
                    ))}
                  </div>
                </section>
              );
            })}

            {menuCategories.length === 0 && (
              <div className="text-center py-20">
                <ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="font-semibold text-gray-400">Cardápio vazio</p>
                <p className="text-sm text-gray-300 mt-1">Os produtos aparecerão aqui</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart bottom bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-[60px] lg:bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.10)]">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-lime-primary)] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              {tenant.logoUrl ? (
                <div className="w-full h-full relative">
                  <StoreImage src={tenant.logoUrl} alt={tenant.name} fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <ShoppingBag className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400 leading-tight">Total sem a entrega</p>
              <p className="font-black text-gray-900 text-sm leading-tight">
                {formatCurrency(cartSubtotal)}{' '}
                <span className="font-normal text-gray-400 text-xs">
                  / {cartCount} {cartCount === 1 ? 'item' : 'itens'}
                </span>
              </p>
            </div>
            <Link
              href={`/${slug}/cart`}
              className="bg-[var(--color-lime-primary)] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:brightness-90 active:scale-[0.97] transition-all shrink-0 shadow-sm"
            >
              Ver sacola
            </Link>
          </div>
        </div>
      )}

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-100 px-6 py-3 z-40">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          <Link href={`/${slug}`} className="flex flex-col items-center gap-1">
            <HomeIcon className="h-5 w-5 text-[var(--color-lime-primary)] fill-[var(--color-lime-primary)]" />
            <span className="text-[10px] font-bold text-[var(--color-lime-primary)]">Início</span>
          </Link>
          <Link href={`/${slug}/cart`} className="relative flex flex-col items-center gap-1">
            <div className="relative">
              <ShoppingBag className="h-5 w-5 text-gray-400" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[var(--color-lime-primary)] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold text-gray-400">Carrinho</span>
          </Link>
          <button className="flex flex-col items-center gap-1">
            <Heart className="h-5 w-5 text-gray-400" />
            <span className="text-[10px] font-semibold text-gray-400">Favoritos</span>
          </button>
          <Link
            href={isLoggedIn ? `/${slug}/conta` : `/${slug}/login`}
            className="flex flex-col items-center gap-1"
          >
            {isLoggedIn ? (
              <>
                <div className="w-5 h-5 bg-[var(--color-lime-primary)] rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-black text-white">
                    {customer.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[var(--color-lime-primary)]">Conta</span>
              </>
            ) : (
              <>
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-[10px] font-semibold text-gray-400">Entrar</span>
              </>
            )}
          </Link>
        </div>
      </nav>
    </div>
  );
}
