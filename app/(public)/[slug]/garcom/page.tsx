'use client'

import React, { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSectionAuth } from '@/hooks/use-section-auth'
import { useSocket } from '@/hooks/use-socket'
import { toast } from 'react-hot-toast'

import { GarcomNavbar } from '@/components/garcom/GarcomNavbar'
import { GarcomTableGrid } from '@/components/garcom/GarcomTableGrid'
import { GarcomTableDetail } from '@/components/garcom/GarcomTableDetail'
import { GarcomCatalog } from '@/components/garcom/GarcomCatalog'
import { GarcomOrderSummary } from '@/components/garcom/GarcomOrderSummary'
import { GarcomBillModal } from '@/components/garcom/GarcomBillModal'

import type {
  GarcomView, GarcomTable, GarcomTableDetail as GarcomTableDetailType,
  GarcomCategory, CartItem,
} from '@/components/garcom/types'

import { GARCOM_POLL_MS } from '@/lib/constants'

interface PixInfo {
  pixKey: string | null
  name: string
  city: string
}

export default function GarcomPage() {
  const params = useParams()
  const slug = params.slug as string
  const qc = useQueryClient()

  const { user, status, logout } = useSectionAuth('garcom')

  // Notificações em tempo real via socket
  useSocket(user?.tenantId ? `garcom:${user.tenantId}` : undefined, {
    order_ready_for_table: (data: any) => {
      toast(`🍽️ ${data.message ?? `Mesa ${data.tableNumber} está pronta!`}`, {
        duration: 8000,
        style: { background: '#1a1a1a', color: '#a3e635', fontWeight: 'bold' },
      })
      // Som de notificação
      try {
        const ctx = new AudioContext()
        ;[0, 0.15, 0.3].forEach(t => {
          const osc = ctx.createOscillator()
          const g   = ctx.createGain()
          osc.connect(g); g.connect(ctx.destination)
          osc.frequency.value = 1046
          g.gain.setValueAtTime(0.4, ctx.currentTime + t)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2)
          osc.start(ctx.currentTime + t)
          osc.stop(ctx.currentTime + t + 0.2)
        })
      } catch { /* AudioContext pode estar bloqueado */ }
      qc.invalidateQueries({ queryKey: ['garcom-tables'] })
      qc.invalidateQueries({ queryKey: ['garcom-table'] })
    },
  })

  const [view, setView]                   = useState<GarcomView>('tables')
  const [selectedTable, setSelectedTable] = useState<GarcomTable | null>(null)
  const [cart, setCart]                   = useState<CartItem[]>([])
  const [showBill, setShowBill]           = useState(false)

  // ── Tenant info ─────────────────────────────────────────────────────────────
  const { data: tenantData } = useQuery<{ tenant: { name: string } }>({
    queryKey: ['garcom-tenant'],
    queryFn: () => fetch('/api/garcom/tenant').then(r => r.json()),
    enabled: status === 'authenticated',
    staleTime: 10 * 60_000,
  })
  const tenantName = tenantData?.tenant?.name ?? user?.tenantName ?? ''

  // ── PIX info ────────────────────────────────────────────────────────────────
  const { data: pixData } = useQuery<PixInfo>({
    queryKey: ['garcom-pix'],
    queryFn: () => fetch('/api/garcom/pix').then(r => r.json()),
    enabled: status === 'authenticated',
    staleTime: 10 * 60_000,
  })

  // ── Tables ──────────────────────────────────────────────────────────────────
  const { data: tablesData, isLoading: tablesLoading } = useQuery<{ tables: GarcomTable[] }>({
    queryKey: ['garcom-tables'],
    queryFn: () => fetch('/api/garcom/tables').then(r => r.json()),
    enabled: status === 'authenticated',
    refetchInterval: GARCOM_POLL_MS,
  })
  const tables = tablesData?.tables ?? []

  // ── Table detail ─────────────────────────────────────────────────────────────
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

  // ── Menu ─────────────────────────────────────────────────────────────────────
  const { data: menuData, isLoading: menuLoading } = useQuery<{ categories: GarcomCategory[] }>({
    queryKey: ['garcom-menu'],
    queryFn: () => fetch('/api/garcom/menu').then(r => r.json()),
    enabled: status === 'authenticated',
    staleTime: 5 * 60_000,
  })
  const categories = menuData?.categories ?? []

  // ── Enviar pedido ────────────────────────────────────────────────────────────
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
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao enviar pedido')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Pedido enviado para a cozinha!')
      setCart([])
      setView('table-detail')
      qc.invalidateQueries({ queryKey: ['garcom-tables'] })
      qc.invalidateQueries({ queryKey: ['garcom-table', selectedTable?.id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ── Confirmar pagamento (checkout) ────────────────────────────────────────────
  const handleConfirmPayment = useCallback(async (method: string) => {
    if (!selectedTable) throw new Error('Nenhuma mesa selecionada')
    const res = await fetch('/api/garcom/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: selectedTable.id, paymentMethod: method }),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Erro ao processar pagamento')
    }
    // Sucesso: atualiza todo o sistema
    qc.invalidateQueries({ queryKey: ['garcom-tables'] })
    qc.invalidateQueries({ queryKey: ['garcom-table', selectedTable.id] })
    toast.success('Pagamento confirmado! Mesa liberada.')
  }, [selectedTable, qc])

  const handleBillPaid = useCallback(() => {
    setShowBill(false)
    setSelectedTable(null)
    setView('tables')
  }, [])

  // ── Cart handlers ─────────────────────────────────────────────────────────────
  const addToCart    = useCallback((item: CartItem) => setCart(prev => [...prev, item]), [])
  const updateQty    = useCallback((cartId: string, qty: number) => {
    setCart(prev => qty <= 0
      ? prev.filter(i => i.cartId !== cartId)
      : prev.map(i => i.cartId === cartId ? { ...i, quantity: qty } : i)
    )
  }, [])
  const removeItem   = useCallback((cartId: string) => setCart(prev => prev.filter(i => i.cartId !== cartId)), [])

  // ── Navegação ─────────────────────────────────────────────────────────────────
  const handleSelectTable = useCallback((table: GarcomTable) => {
    setSelectedTable(table)
    setView('table-detail')
  }, [])

  const handleBack = useCallback(() => {
    if (view === 'catalog' || view === 'cart') setView('table-detail')
    else { setSelectedTable(null); setCart([]); setView('tables') }
  }, [view])

  // ── Auth guard ────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-t-transparent border-gray-300 rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    if (typeof window !== 'undefined') window.location.href = `/${slug}/garcom/login`
    return null
  }

  const navbarTitle =
    view === 'table-detail' ? `Mesa ${selectedTable?.number ?? ''}` :
    view === 'catalog'      ? 'Cardápio' :
    view === 'cart'         ? 'Pedido'   : undefined

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GarcomNavbar
        tenantName={tenantName}
        waiterName={user?.name ?? ''}
        onBack={view !== 'tables' ? handleBack : undefined}
        backLabel={(view === 'catalog' || view === 'cart') ? `Mesa ${selectedTable?.number ?? ''}` : 'Mesas'}
        title={navbarTitle}
        onLogout={logout}
      />

      <main className="flex-1 flex flex-col">
        {/* Mesas */}
        {view === 'tables' && (
          <>
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-lg font-black text-gray-900">Mesas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Toque para ver ou lançar pedido</p>
            </div>
            <GarcomTableGrid tables={tables} onSelectTable={handleSelectTable} isLoading={tablesLoading} />
          </>
        )}

        {/* Detalhe da mesa */}
        {view === 'table-detail' && selectedTable && (
          <GarcomTableDetail
            detail={tableDetail ?? null}
            isLoading={detailLoading}
            onAddItems={() => setView('catalog')}
            onOpenBill={() => setShowBill(true)}
            onRefresh={() => refetchDetail()}
          />
        )}

        {/* Catálogo */}
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

        {/* Carrinho */}
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

      {/* Modal de conta + pagamento */}
      {showBill && selectedTable && tableDetail && (
        <GarcomBillModal
          table={selectedTable}
          orders={tableDetail.orders}
          pendingTotal={tableDetail.pendingTotal}
          pixInfo={pixData ?? null}
          onClose={() => setShowBill(false)}
          onConfirm={handleConfirmPayment}
        />
      )}
    </div>
  )
}
