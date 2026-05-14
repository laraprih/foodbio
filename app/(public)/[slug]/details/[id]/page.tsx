'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import ProductDetail from '@/components/ecommerce/ProductDetail';
import Spinner from '@/components/ui/Spinner';
import { useCart } from '@/hooks/use-cart';
import { toast } from 'react-hot-toast';
import useSessionStore from '@/store/session-store';

import { use } from 'react';

export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const { tenant } = useSessionStore();
  const { addToCart } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => get<any>(`/bff/store/${slug}/products/${id}`),
  });

  const handleAddToCart = (productData: any, selectedOptions: any[]) => {
    if (!tenant) return;

    const result = addToCart(
      {
        id: productData.id,
        name: productData.name,
        price: productData.price,
        imageUrl: productData.imageUrl,
      },
      selectedOptions.map(o => ({
        optionId: o.id,
        name: o.name,
        price: o.price
      })),
      tenant.id,
      tenant.slug
    );

    if (result.needsConfirm) {
      toast.error(result.message);
    } else {
      toast.success(`${productData.name} adicionado ao carrinho!`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <Spinner size="lg" className="text-[var(--color-lime-primary)]" />
      </div>
    );
  }

  if (!product || 'error' in product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Produto não encontrado</h1>
        <p className="text-gray-500">Este item pode ter sido removido ou não está mais disponível.</p>
      </div>
    );
  }

  return (
    <ProductDetail
      product={product}
      onAdd={handleAddToCart}
    />
  );
}
