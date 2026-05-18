'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home as HomeIcon, ShoppingBag, Heart, User, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import HomeHeader from '@/components/ecommerce/HomeHeader';
import CategoryBar from '@/components/ecommerce/CategoryBar';
import MenuCard from '@/components/ecommerce/MenuCard';
import ProductModal from '@/components/ecommerce/ProductModal';
import useSessionStore from '@/store/session-store';
import { useCart } from '@/hooks/use-cart';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  logoFormat?: string;
  coverUrl?: string | null;
  address?: string | null;
  gateway: 'mercadopago' | 'pagbank' | null;
  minOrderValue?: number | null;
  deliveryFee?: number | null;
  deliveryRadius?: number | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  available: boolean;
  categoryId?: string;
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

export default function RestaurantShell({ tenant, menu, slug }: RestaurantShellProps) {
  const { setTenant } = useSessionStore();
  const { addToCart, count: cartCount } = useCart();
  const { data: session } = useSession();
  const customer = session?.user as any;
  const isLoggedIn = customer?.role === 'customer' && !!customer?.tenantId;
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [gridLayout, setGridLayout] = useState<'grid' | 'list'>('grid');
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  useEffect(() => {
    setTenant({ id: tenant.id, slug: tenant.slug, name: tenant.name, gateway: tenant.gateway });
  }, [tenant, setTenant]);

  const menuCategories = menu ?? [];
  const categories = [
    { id: 'all', name: 'Todos', products: [] as Product[] },
    ...menuCategories.map(({ id, name, iconUrl }) => ({ id, name, iconUrl, products: [] as Product[] })),
  ];
  const allProducts = menuCategories.flatMap((c) =>
    c.products.map((p) => ({ ...p, categoryId: p.categoryId ?? c.id }))
  );

  const filteredProducts = allProducts.filter((p) => {
    const matchesCategory = activeCategoryId === 'all' || p.categoryId === activeCategoryId;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (productId: string) => {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;
    setModalProduct(product);
  };

  const handleModalAdd = (product: Product, options: { id: string; name: string; price: number }[], quantity: number) => {
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
    <div className="min-h-screen bg-gray-50">
      <ProductModal
        product={modalProduct}
        slug={slug}
        onClose={() => setModalProduct(null)}
        onAdd={handleModalAdd}
      />
      <HomeHeader
        restaurantName={tenant.name}
        restaurantLogo={tenant.logoUrl}
        logoFormat={tenant.logoFormat}
        coverUrl={tenant.coverUrl ?? undefined}
        location={tenant.address ?? undefined}
        onSearch={setSearchQuery}
        searchValue={searchQuery}
        cartCount={cartCount}
        slug={slug}
        minOrderValue={tenant.minOrderValue ?? undefined}
        deliveryFee={tenant.deliveryFee ?? undefined}
        deliveryRadius={tenant.deliveryRadius ?? undefined}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12">
        <div className="lg:flex lg:gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-52 xl:w-56 shrink-0">
            <div className="sticky top-24">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Categorias</p>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={cn(
                      'w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                      cat.id === activeCategoryId
                        ? 'bg-[var(--color-lime-primary)] text-white'
                        : 'text-gray-600 hover:bg-[var(--color-app-bg)]'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Category bar (mobile/tablet) + layout toggle */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 overflow-hidden lg:hidden">
                <CategoryBar categories={categories} activeId={activeCategoryId} onSelect={setActiveCategoryId} />
              </div>
              {/* Layout toggle */}
              <div className="hidden sm:flex items-center bg-white border border-gray-100 rounded-xl p-0.5 shrink-0">
                <button
                  onClick={() => setGridLayout('grid')}
                  className={cn('p-2 rounded-lg transition-all', gridLayout === 'grid' ? 'bg-[var(--color-lime-primary)] text-white' : 'text-gray-400 hover:text-gray-600')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setGridLayout('list')}
                  className={cn('p-2 rounded-lg transition-all', gridLayout === 'list' ? 'bg-[var(--color-lime-primary)] text-white' : 'text-gray-400 hover:text-gray-600')}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Results count */}
            {searchQuery && (
              <p className="text-sm text-gray-500 mb-4">
                <span className="font-bold text-gray-900">{filteredProducts.length}</span>{' '}
                resultado{filteredProducts.length !== 1 ? 's' : ''} para &ldquo;{searchQuery}&rdquo;
              </p>
            )}

            {/* Product grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                </div>
                <p className="font-semibold text-gray-600">Nenhum produto encontrado</p>
                <p className="text-sm text-gray-400 mt-1">Tente outra categoria ou termo de busca</p>
              </div>
            ) : (
              <div
                className={cn(
                  gridLayout === 'list'
                    ? 'space-y-3'
                    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                )}
              >
                {filteredProducts.map((product) => (
                  <MenuCard
                    key={product.id}
                    product={product}
                    restaurantSlug={tenant.slug}
                    onAdd={handleAddToCart}
                    layout={gridLayout}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-100 px-6 py-3 z-40">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          <Link href={`/${slug}`} className="flex flex-col items-center gap-1 group">
            <HomeIcon className="h-5 w-5 text-[var(--color-lime-primary)] fill-[var(--color-lime-primary)]" />
            <span className="text-[10px] font-bold text-[var(--color-lime-primary)]">Início</span>
          </Link>
          <Link href={`/${slug}/cart`} className="relative flex flex-col items-center gap-1 group">
            <div className="relative">
              <ShoppingBag className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[var(--color-lime-primary)] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold text-gray-400">Carrinho</span>
          </Link>
          <button className="flex flex-col items-center gap-1 group">
            <Heart className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
            <span className="text-[10px] font-semibold text-gray-400">Favoritos</span>
          </button>
          <Link href={isLoggedIn ? `/${slug}/conta` : `/${slug}/login`} className="flex flex-col items-center gap-1 group">
            {isLoggedIn ? (
              <>
                <div className="w-5 h-5 bg-[var(--color-lime-primary)] rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-black text-white">{customer.name?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-[10px] font-semibold text-[var(--color-lime-primary)]">Conta</span>
              </>
            ) : (
              <>
                <User className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                <span className="text-[10px] font-semibold text-gray-400">Entrar</span>
              </>
            )}
          </Link>
        </div>
      </nav>
    </div>
  );
}
