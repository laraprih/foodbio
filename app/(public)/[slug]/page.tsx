'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import useSessionStore from '@/store/session-store';
import HomeHeader from '@/components/ecommerce/HomeHeader';
import CategoryBar from '@/components/ecommerce/CategoryBar';
import MenuCard from '@/components/ecommerce/MenuCard';
import Spinner from '@/components/ui/Spinner';
import { useCart } from '@/hooks/use-cart';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { Home as HomeIcon, ShoppingBag, Heart, User } from 'lucide-react';

import { use } from 'react';

export default function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { setTenant } = useSessionStore();
  const { addToCart, count: cartCount } = useCart();
  const [activeCategoryId, setActiveCategoryId] = useState('all');

  const { data: tenant, isLoading: loadingTenant } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => get<any>(`/bff/store/${slug}`),
  });

  const { data: menu, isLoading: loadingMenu } = useQuery({
    queryKey: ['menu', slug],
    queryFn: () => get<any>(`/bff/store/${slug}/menu`),
  });

  useEffect(() => {
    if (tenant && !('error' in tenant)) {
      setTenant({
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        gateway: tenant.gateway,
      });
    }
  }, [tenant, setTenant]);

  if (loadingTenant || loadingMenu) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <Spinner size="lg" className="text-[var(--color-lime-primary)]" />
      </div>
    );
  }

  if (!tenant || 'error' in tenant) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Restaurante não encontrado</h1>
        <p className="text-gray-500">O link que você acessou pode estar incorreto ou o restaurante não está mais ativo.</p>
      </div>
    );
  }

  const categories = [
    { id: 'all', name: 'Tudo' },
    ...(menu?.categories || []),
  ];

  const filteredProducts = activeCategoryId === 'all'
    ? menu?.products || []
    : (menu?.products || []).filter((p: any) => p.categoryId === activeCategoryId);

  const handleAddToCart = (productId: string) => {
    const product = menu.products.find((p: any) => p.id === productId);
    if (!product) return;

    const result = addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      [], // Sem opções na home por padrão
      tenant.id,
      tenant.slug
    );

    if (result.needsConfirm) {
      toast.error(result.message);
    } else {
      toast.success(`${product.name} adicionado!`);
    }
  };

  return (
    <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-32 bg-gray-100 relative">
      <HomeHeader
        restaurantName={tenant.name}
        restaurantLogo={tenant.logoUrl}
        location={tenant.address}
      />

      <div className="px-6 py-6 border-t-[8px] border-gray-100 bg-gray-50 flex-1">
        <CategoryBar
          categories={categories}
          activeId={activeCategoryId}
          onSelect={setActiveCategoryId}
        />

        <section className="grid grid-cols-2 gap-4 pb-6">
          {filteredProducts.map((product: any) => (
            <MenuCard
              key={product.id}
              product={product}
              restaurantSlug={tenant.slug}
              onAdd={handleAddToCart}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-2 py-12 text-center text-gray-400">
              Nenhum produto encontrado nesta categoria.
            </div>
          )}
        </section>
      </div>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[88%] max-w-[364px] bg-zinc-900 rounded-full py-4 px-8 flex items-center justify-between shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] z-50">
        <Link href={`/${slug}`} className="text-[var(--color-lime-primary)] flex flex-col items-center group">
          <HomeIcon className="h-[22px] w-[22px] fill-current group-hover:scale-110 transition-transform" />
        </Link>
        <Link href={`/${slug}/cart`} className="text-zinc-500 hover:text-zinc-300 transition-colors flex flex-col items-center group relative">
          <ShoppingBag className="h-[22px] w-[22px] group-hover:scale-110 transition-transform" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[var(--color-lime-primary)] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-zinc-900">
              {cartCount}
            </span>
          )}
        </Link>
        <button className="text-zinc-500 hover:text-zinc-300 transition-colors flex flex-col items-center group">
          <Heart className="h-[22px] w-[22px] group-hover:scale-110 transition-transform" />
        </button>
        <Link href="/login" className="text-zinc-500 hover:text-zinc-300 transition-colors flex flex-col items-center group">
          <User className="h-[22px] w-[22px] group-hover:scale-110 transition-transform" />
        </Link>
      </nav>
    </main>
  );
}
