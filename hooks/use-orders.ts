import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post } from '@/lib/api-client'
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
  payerEmail?: string
}

interface PayOrderPayload {
  token: string
  method: 'pix' | 'credit_card'
  gateway: string
}

export function useGetOrder(id: string, _socketConnected?: boolean) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => get<Order>(`/api/store/orders/${id}`),
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
    enabled: !!id,
  })
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (orderData: CreateOrderPayload) =>
      post<{ orderId: string; pixQrCode?: string; pixQrBase64?: string; pixExpiresAt?: string; pixError?: string }>(
        '/api/store/orders',
        orderData
      ),
  })
}

export function usePayOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, paymentData }: { id: string; paymentData: PayOrderPayload }) =>
      post<{ status: string }>(`/api/store/orders/${id}/pay`, paymentData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
    },
  })
}

export function useAdminOrders(filters?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: () => get<Order[]>('/api/admin/orders', filters as Record<string, string>),
    staleTime: POLL.ORDERS,
  })
}

// Backward-compat alias
export { useGetOrder as useOrder }
