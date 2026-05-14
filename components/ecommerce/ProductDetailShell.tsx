'use client';

import React from 'react';
import { toast } from 'react-hot-toast';
import { useCart } from '@/hooks/use-cart';
import useSessionStore from '@/store/session-store';
import ProductDetail from '@/components/ecommerce/ProductDetail';

interface ProductDetailShellProps {
  product: any;
  slug: string;
}

export default function ProductDetailShell({ product, slug }: ProductDetailShellProps) {
  const { tenant } = useSessionStore();
  const { addToCart } = useCart();

  const handleAddToCart = (productData: any, selectedOptions: any[]) => {
    if (!tenant) return;

    const result = addToCart(
      {
        id: productData.id,
        name: productData.name,
        price: productData.price,
        imageUrl: productData.imageUrl,
      },
      selectedOptions.map((o) => ({ optionId: o.id, name: o.name, price: o.price })),
      tenant.id,
      tenant.slug
    );

    if (result.needsConfirm) {
      toast.error(result.message);
    } else {
      toast.success(`${productData.name} adicionado ao carrinho!`);
    }
  };

  return <ProductDetail product={product} onAdd={handleAddToCart} slug={slug} />;
}
