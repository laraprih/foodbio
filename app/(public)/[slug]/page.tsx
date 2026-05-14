import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-api';
import RestaurantShell from '@/components/ecommerce/RestaurantShell';

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [tenant, menu] = await Promise.all([
    serverGet<any>(`/api/store/${slug}`, 0),
    serverGet<any>(`/api/store/${slug}/menu`, 0),
  ]);

  if (!tenant) notFound();

  return <RestaurantShell tenant={tenant} menu={menu} slug={slug} />;
}
