'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, isApiError } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Navigation, Phone, Package, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import DeliveryCard from '@/components/delivery/DeliveryCard'

interface DeliveryDetail {
  id: string
  status: 'assigned' | 'picked_up' | 'on_the_way' | 'delivered'
  estimatedMinutes?: number
  createdAt: string
  order: {
    id: string
    total: number
    items: { quantity: number; product: { name: string } }[]
    customer?: { name: string; phone: string }
    address?: {
      street: string
      number: string
      neighborhood: string
      city: string
    }
  }
}

export default function EntregaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const { data: delivery, isLoading } = useQuery({
    queryKey: ['delivery', id],
    queryFn: () => get<DeliveryDetail>(`/bff/api/delivery/${id}`),
    refetchInterval: 20000,
  })

  const pickUp = useMutation({
    mutationFn: () => patch(`/bff/api/delivery/${id}/pickup`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', id] })
      toast.success('Coleta confirmada!')
    },
    onError: () => toast.error('Erro ao confirmar coleta'),
  })

  const deliver = useMutation({
    mutationFn: () => patch(`/bff/api/delivery/${id}/deliver`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', id] })
      toast.success('Entrega confirmada!')
      setTimeout(() => router.push('/entregas'), 1500)
    },
    onError: () => toast.error('Erro ao confirmar entrega'),
  })

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!delivery || isApiError(delivery)) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 font-medium mb-4">Entrega não encontrada.</p>
        <Link href="/entregas" className="text-sm font-bold text-zinc-900 underline">
          Voltar às entregas
        </Link>
      </div>
    )
  }

  const { order } = delivery
  const mapsUrl = order.address
    ? `https://maps.google.com/?q=${encodeURIComponent(
        `${order.address.street} ${order.address.number} ${order.address.neighborhood} ${order.address.city}`
      )}`
    : null

  return (
    <div className="max-w-[414px] mx-auto pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/entregas" className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="font-black text-gray-900 leading-tight">Entrega #{order.id.slice(-4)}</h1>
          <p className="text-xs text-gray-400 font-medium">Pedido #{order.id.slice(-6)}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <DeliveryCard
          delivery={delivery}
          onPickUp={() => pickUp.mutate()}
          onDeliver={() => deliver.mutate()}
        />

        {/* Google Maps CTA */}
        {mapsUrl && delivery.status !== 'delivered' && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-[28px] border-2 border-zinc-900 text-zinc-900 font-bold text-sm hover:bg-zinc-900 hover:text-white transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Abrir no Google Maps
          </a>
        )}

        {/* Call customer */}
        {order.customer?.phone && delivery.status !== 'delivered' && (
          <a
            href={`tel:${order.customer.phone}`}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-[28px] bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            <Phone className="w-4 h-4" />
            Ligar para {order.customer.name}
          </a>
        )}

        {delivery.status === 'delivered' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-black text-gray-900 text-lg">Entregue!</p>
            <p className="text-sm text-gray-500">Esta entrega foi concluída.</p>
            <Link
              href="/entregas"
              className="mt-2 px-6 py-3 rounded-2xl bg-zinc-900 text-[var(--color-lime-primary)] font-bold text-sm"
            >
              Ver próximas entregas
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
