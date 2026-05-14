import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-api';
import ProductDetailShell from '@/components/ecommerce/ProductDetailShell';

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const product = await serverGet<any>(`/api/store/${slug}/products/${id}`, 30);

  if (!product) notFound();

  return <ProductDetailShell product={product} slug={slug} />;
}
