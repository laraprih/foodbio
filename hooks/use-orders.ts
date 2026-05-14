import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';

export function useOrder(id: string, socketConnected?: boolean) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => get<any>(`/bff/client/orders/${id}`),
    refetchInterval: socketConnected ? false : 30_000,
  });
}

export function useCreateOrder() {
  const router = useRouter();
  const { restaurantSlug } = useCartStore();

  return useMutation({
    mutationFn: (orderData: any) => post<any>('/bff/client/orders', orderData),
    onSuccess: (data: any) => {
      if (data && 'orderId' in data) {
        router.push(`/${restaurantSlug}/checkout`);
      }
    },
  });
}

export function usePayOrder() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { restaurantSlug } = useCartStore();

  return useMutation({
    mutationFn: ({ id, paymentData }: { id: string; paymentData: any }) =>
      post<any>(`/bff/client/orders/${id}/pay`, paymentData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      router.push(`/${restaurantSlug}/pedido/${variables.id}`);
    },
  });
}

export function useAdminOrders(filters: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: () => get<any>('/bff/admin/orders', filters as any),
    staleTime: 10_000,
  });
}
