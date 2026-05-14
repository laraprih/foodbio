'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, isApiError } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import Spinner from '@/components/ui/Spinner'
import DeliveryCard from '@/components/delivery/DeliveryCard'
import { useSocket } from '@/hooks/use-socket'

export default function EntregasPage() {
  const queryClient = useQueryClient()

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: () => get<any[]>('/bff/api/delivery'),
    refetchInterval: 20000,
  })

  useSocket('drivers', {
    new_delivery: () => queryClient.invalidateQueries({ queryKey: ['my-deliveries'] }),
  })

  const pickUp = useMutation({
    mutationFn: (id: string) => patch(`/bff/api/delivery/${id}/pickup`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-deliveries'] })
      toast.success('Coleta confirmada!')
    },
    onError: () => toast.error('Erro ao confirmar coleta'),
  })

  const deliver = useMutation({
    mutationFn: (id: string) => patch(`/bff/api/delivery/${id}/deliver`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-deliveries'] })
      toast.success('Entrega confirmada!')
    },
    onError: () => toast.error('Erro ao confirmar entrega'),
  })

  const deliveriesArr = isApiError(deliveries) || !Array.isArray(deliveries) ? [] : deliveries
  const active = deliveriesArr.filter((d: any) => d.status !== 'delivered')
  const done = deliveriesArr.filter((d: any) => d.status === 'delivered')

  return (
    <div className="max-w-[414px] mx-auto p-4 pb-24 space-y-6">
      <div className="pt-4">
        <h1 className="text-2xl font-black text-gray-900">Minhas Entregas</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">{active.length} ativas</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : active.length === 0 && done.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 font-medium">Nenhuma entrega atribuída.</p>
          <p className="text-gray-300 text-sm mt-1">Aguarde novas atribuições.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-4">
              {active.map((d: any) => (
                <DeliveryCard
                  key={d.id}
                  delivery={d}
                  onPickUp={() => pickUp.mutate(d.id)}
                  onDeliver={() => deliver.mutate(d.id)}
                />
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                Concluídas hoje
              </h2>
              <div className="space-y-3 opacity-60">
                {done.map((d: any) => (
                  <DeliveryCard key={d.id} delivery={d} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
