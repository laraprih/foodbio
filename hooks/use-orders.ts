import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart-store'
import type { Order } from '@/types'
import type { CheckoutData } from '@/types'
import { POLL } from '@/lib/constants'

interface CreateOrderPayload {
  restaurantId: string
  items: { productId: string; quantity: number; options: string[] }[]
  deliveryType: 'delivery' | 'pickup'
  address?: CheckoutData['address']
  customerName: string
  customerPhone: string
  paymentMethod: 'pix' | 'credit_card'
}

interface PayOrderPayload {
  token: string
  method: 'pix' | 'credit_card'
  gateway: string
}

export function useGetOrder(id: string, socketConnected?: boolean) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => get<Order>(`/bff/api/client/orders/${id}`),
    refetchInterval: socketConnected ? false : 30_000,
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const router = useRouter()
  const { restaurantSlug } = useCartStore()

  return useMutation({
    mutationFn: (orderData: CreateOrderPayload) =>
      post<{ orderId: string }>('/bff/api/client/orders', orderData),
    onSuccess: (data) => {
      if (data && !('error' in data)) {
        router.push(`/${restaurantSlug}/checkout`)
      }
    },
  })
}

export function usePayOrder() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { restaurantSlug } = useCartStore()

  return useMutation({
    mutationFn: ({ id, paymentData }: { id: string; paymentData: PayOrderPayload }) =>
      post<{ status: string }>(`/bff/api/client/orders/${id}/pay`, paymentData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
      router.push(`/${restaurantSlug}/pedido/${variables.id}`)
    },
  })
}

export function useAdminOrders(filters?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: () => get<Order[]>('/bff/api/admin/orders', filters as Record<string, string>),
    staleTime: POLL.ORDERS,
  })
}

// Backward-compat alias
export { useGetOrder as useOrder }
