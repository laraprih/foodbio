'use client'

import React, { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSectionAuth } from '@/hooks/use-section-auth'
import { toast } from 'react-hot-toast'

import { GarcomNavbar } from '@/components/garcom/GarcomNavbar'
import { GarcomTableGrid } from '@/components/garcom/GarcomTableGrid'
import { GarcomTableDetail } from '@/components/garcom/GarcomTableDetail'
import { GarcomCatalog } from '@/components/garcom/GarcomCatalog'
import { GarcomOrderSummary } from '@/components/garcom/GarcomOrderSummary'

import type {
  GarcomView, GarcomTable, GarcomTableDetail as GarcomTableDetailType,
  GarcomCategory, CartItem,
} from '@/components/garcom/types'

import { GARCOM_POLL_MS } from '@/lib/constants'

export default function GarcomPage() {
  const params = useParams()
  const slug = params.slug as string
  const qc = useQueryClient()

  const { user, status, logout } = useSectionAuth('garcom')

  const [view, setView] = useState<GarcomView>('tables')
  const [selectedTable, setSelectedTable] = useState<GarcomTable | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])

  // ── Tenant info ────────────────────────────────────────────────────────────
  const { data: tenantData } = useQuery<{ tenant: { name: string } }>({
    queryKey: ['garcom-tenant'],
    queryFn: () => fetch('/api/garcom/tenant').then(r => r.json()),
    enabled: status === 'authenticated',
    staleTime: 10 * 60_000,
  })
  const tenantName = tenantData?.tenant?.name ?? user?.tenantName ?? ''

  // ── Tables ─────────────────────────────────────────────────────────────────
  const { data: tablesData, isLoading: tablesLoading } = useQuery<{ tables: GarcomTable[] }>({
    queryKey: ['garcom-tables'],
    queryFn: () => fetch('/api/garcom/tables').then(r => r.json()),
    enabled: status === 'authenticated',
    refetchInterval: GARCOM_POLL_MS,
  })
  const tables = tablesData?.tables ?? []

  // ── Table detail ───────────────────────────────────────────────────────────
  const {
    data: tableDetail,
    isLoading: detailLoading,
    refetch: refetchDetail,
  } = useQuery<GarcomTableDetailType>({
    queryKey: ['garcom-table', selectedTable?.id],
    queryFn: () => fetch(`/api/garcom/tables/${selectedTable!.id}`).then(r => r.json()),
    enabled: !!selectedTable && status === 'authenticated',
    refetchInterval: GARCOM_POLL_MS,
  })

  // ── Menu ───────────────────────────────────────────────────────────────────
  const { data: menuData, isLoading: menuLoading } = useQuery<{ categories: GarcomCategory[] }>({
    queryKey: ['garcom-menu'],
    queryFn: () => fetch('/api/garcom/menu').then(r => r.json()),
    enabled: status === 'authenticated',
    staleTime: 5 * 60_000,
  })
  const categories = menuData?.categories ?? []

  // ── Send order mutation ─────────────────────────────────────────────────────
  const sendOrder = useMutation({
    mutationFn: async () => {
      if (!selectedTable) throw new Error('Nenhuma mesa selecionada')
      const res = await fetch('/api/garcom/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable.id,
          items: cart.map(i => ({
            productId: i.productId,
            quantity:  i.quantity,
            unitPrice: i.unitPrice,
            notes:     i.notes,
            options:   i.options,
          })),
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Erro ao enviar pedido')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Pedido enviado para a cozinha!')
      setCart([])
      setView('table-detail')
      qc.invalidateQueries({ queryKey: ['garcom-tables'] })
      qc.invalidateQueries({ queryKey: ['garcom-table', selectedTable?.id] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  // ── Request bill mutation ──────────────────────────────────────────────────
  const requestBill = useMutation({
    mutationFn: async () => {
      if (!selectedTable) throw new Error('Nenhuma mesa selecionada')
      const res = await fetch(`/api/garcom/tables/${selectedTable.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'waiting_payment' }),
      })
      if (!res.ok) throw new Error('Erro ao solicitar conta')
    },
    onSuccess: () => {
      toast.success('Conta solicitada! PDV notificado.')
      qc.invalidateQueries({ queryKey: ['garcom-tables'] })
      qc.invalidateQueries({ queryKey: ['garcom-table', selectedTable?.id] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  // ── Cart handlers ──────────────────────────────────────────────────────────
  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => [...prev, item])
  }, [])

  const updateQty = useCallback((cartId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.cartId !== cartId))
    } else {
      setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, quantity: qty } : i))
    }
  }, [])

  const removeItem = useCallback((cartId: string) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId))
  }, [])

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleSelectTable = useCallback((table: GarcomTable) => {
    setSelectedTable(table)
    setView('table-detail')
  }, [])

  const handleBack = useCallback(() => {
    if (view === 'catalog' || view === 'cart') {
      setView('table-detail')
    } else {
      setSelectedTable(null)
      setCart([])
      setView('tables')
    }
  }, [view])

  // ── Auth guard ──────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-t-transparent border-gray-300 rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    if (typeof window !== 'undefined') {
      window.location.href = `/${slug}/garcom/login`
    }
    return null
  }

  // ── Navbar props ────────────────────────────────────────────────────────────
  const navbarTitle =
    view === 'table-detail' ? `Mesa ${selectedTable?.number ?? ''}` :
    view === 'catalog'      ? 'Cardápio' :
    view === 'cart'         ? 'Pedido' : undefined

  const navbarBack =
    view !== 'tables'
      ? handleBack
      : undefined

  const navbarBackLabel =
    (view === 'catalog' || view === 'cart') ? `Mesa ${selectedTable?.number ?? ''}` : 'Mesas'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GarcomNavbar
        tenantName={tenantName}
        waiterName={user?.name ?? ''}
        onBack={navbarBack}
        backLabel={navbarBackLabel}
        title={navbarTitle}
        onLogout={logout}
      />

      <main className="flex-1 flex flex-col">
        {/* ── Tables grid ──────────────────────────────────────────────── */}
        {view === 'tables' && (
          <>
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-lg font-black text-gray-900">Mesas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Toque para ver ou lançar pedido</p>
            </div>
            <GarcomTableGrid
              tables={tables}
              onSelectTable={handleSelectTable}
              isLoading={tablesLoading}
            />
          </>
        )}

        {/* ── Table detail ──────────────────────────────────────────────── */}
        {view === 'table-detail' && selectedTable && (
          <GarcomTableDetail
            detail={tableDetail ?? null}
            isLoading={detailLoading}
            onAddItems={() => setView('catalog')}
            onRequestBill={() => requestBill.mutate()}
            onRefresh={() => refetchDetail()}
            isRequestingBill={requestBill.isPending}
          />
        )}

        {/* ── Catalog ──────────────────────────────────────────────────── */}
        {view === 'catalog' && (
          <GarcomCatalog
            categories={categories}
            cart={cart}
            onAddToCart={addToCart}
            onViewCart={() => setView('cart')}
            onClose={() => setView('table-detail')}
            isLoading={menuLoading}
          />
        )}

        {/* ── Cart / Order summary ──────────────────────────────────────── */}
        {view === 'cart' && selectedTable && (
          <GarcomOrderSummary
            cart={cart}
            tableNumber={selectedTable.number}
            onUpdateQty={updateQty}
            onRemoveItem={removeItem}
            onSend={() => sendOrder.mutate()}
            onBack={() => setView('catalog')}
            isSending={sendOrder.isPending}
          />
        )}
      </main>
    </div>
  )
}
