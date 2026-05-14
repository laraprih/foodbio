import { notFound } from 'next/navigation';
import { getTenantBySlugDirect, getTenantMenuDirect } from '@/lib/store-db';
import RestaurantShell from '@/components/ecommerce/RestaurantShell';

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await getTenantBySlugDirect(slug);
  if (!tenant) notFound();

  const menu = await getTenantMenuDirect(tenant.id);

  return <RestaurantShell tenant={tenant} menu={menu} slug={slug} />;
}
