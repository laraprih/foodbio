'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSectionAuth } from '@/hooks/use-section-auth'
import { toast } from 'react-hot-toast'

import { PDVNavbar } from '@/components/pdv/PDVNavbar'
import { PDVCatalog } from '@/components/pdv/PDVCatalog'
import { PDVComanda } from '@/components/pdv/PDVComanda'
import { PDVCheckout } from '@/components/pdv/PDVCheckout'
import { PDVTables } from '@/components/pdv/PDVTables'
import { PDVOrders } from '@/components/pdv/PDVOrders'
import { PDVCashDrawer } from '@/components/pdv/PDVCashDrawer'
import { PDVShiftSummary } from '@/components/pdv/PDVShiftSummary'

import type {
  PDVModule, CartItem, Discount, OrderType,
  CashSession, PaymentLine, PDVMenuCategory, PDVTable,
} from '@/components/pdv/types'

// ─── Keyboard shortcuts ─────────────────────────────────────────────────────
const KEY_MAP: Record<string, PDVModule | 'checkout' | 'clear'> = {
  F2: 'catalog',
  F8: 'cash',
  F10: 'orders',
}

export default function PDVPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const qc = useQueryClient()

  const { user, status, logout } = useSectionAuth('pdv')

  // ── Modules ─────────────────────────────────────────────────────────────
  const [activeModule, setActiveModule] = useState<PDVModule>('cash')

  // ── Cart state ───────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<OrderType>('pickup')
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)

  // ── Cash session ─────────────────────────────────────────────────────────
  const [cashSession, setCashSession] = useState<CashSession | null>(null)
  const { data: cashData } = useQuery<{ session: CashSession | null }>({
    queryKey: ['pdv-cash-session'],
    queryFn: () => fetch('/api/pdv/cash-session/current').then(r => r.json()),
    enabled: status === 'authenticated',
    refetchInterval: 30_000,
  })
  useEffect(() => {
    if (cashData !== undefined) {
      setCashSession(cashData.session)
      if (cashData.session && activeModule === 'cash') setActiveModule('catalog')
    }
  }, [cashData])

  // ── Menu & tables ─────────────────────────────────────────────────────────
  const { data: menuData } = useQuery<{ categories: PDVMenuCategory[] }>({
    queryKey: ['pdv-menu'],
    queryFn: () => fetch('/api/pdv/menu').then(r => r.json()),
    enabled: status === 'authenticated',
    staleTime: 60_000,
  })

  const { data: tablesData } = useQuery<{ tables: PDVTable[] }>({
    queryKey: ['pdv-tables'],
    queryFn: () => fetch('/api/pdv/tables').then(r => r.json()),
    enabled: status === 'authenticated',
    refetchInterval: 15_000,
  })

  const categories = menuData?.categories ?? []
  const tables = tablesData?.tables ?? []

  // ── Delivery fee from tenant config ──────────────────────────────────────
  const [deliveryFee] = useState(0) // TODO: fetch from tenant settings

  // ── Cart operations ──────────────────────────────────────────────────────
  const addItem = useCallback((item: CartItem) => {
    setCart(prev => {
      // Merge if same product + same options + no notes
      if (!item.notes && item.options.length === 0) {
        const existing = prev.find(
          i => i.productId === item.productId && i.options.length === 0 && !i.notes
        )
        if (existing) {
          return prev.map(i =>
            i.cartId === existing.cartId ? { ...i, quantity: i.quantity + item.quantity } : i
          )
        }
      }
      return [...prev, item]
    })
    toast.success(`${item.name} adicionado`, { duration: 1000, position: 'bottom-left' })
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

  const updateNotes = useCallback((cartId: string, notes: string) => {
    setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, notes } : i))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setDiscount(null)
    setSelectedTableId(null)
    setOrderType('pickup')
  }, [])

  // ── Totals ───────────────────────────────────────────────────────────────
  const subtotal = useMemo(() =>
    cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [cart]
  )

  const discountAmount = useMemo(() => {
    if (!discount) return 0
    return discount.type === 'value'
      ? Math.min(discount.amount, subtotal)
      : subtotal * (discount.amount / 100)
  }, [discount, subtotal])

  const actualDeliveryFee = orderType === 'delivery' ? deliveryFee : 0
  const total = Math.max(0, subtotal - discountAmount + actualDeliveryFee)

  // ── Order mutation ────────────────────────────────────────────────────────
  const orderMutation = useMutation({
    mutationFn: (payments: PaymentLine[]) =>
      fetch('/api/pdv/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            notes: i.notes,
            options: i.options,
          })),
          orderType,
          customerName: customerName.trim() || 'Balcão',
          customerPhone: customerPhone.trim() || null,
          tableId: orderType === 'in_store' ? selectedTableId : null,
          cashSessionId: cashSession?.id ?? null,
          payments,
          discount: discountAmount,
          deliveryFee: actualDeliveryFee,
        }),
      }).then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error)
        return data
      }),
    onSuccess: ({ orderId }) => {
      toast.success(`Pedido #${orderId.slice(-6).toUpperCase()} registrado!`)
      clearCart()
      setShowCheckout(false)
      qc.invalidateQueries({ queryKey: ['pdv-orders-today'] })
      qc.invalidateQueries({ queryKey: ['pdv-tables'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao registrar pedido'),
  })

  // ── Navigate to catalog when table selected from table view ──────────────
  function handleSelectTable(tableId: string) {
    setSelectedTableId(tableId)
    setOrderType('in_store')
    setActiveModule('catalog')
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      const action = KEY_MAP[e.key]
      if (!action) return
      e.preventDefault()
      if (action === 'clear') { clearCart(); return }
      if (action === 'checkout') { if (cart.length > 0 && cashSession) setShowCheckout(true); return }
      setActiveModule(action as PDVModule)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [cart.length, cashSession, clearCart])

  // ── Auth guards ───────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-lime-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    if (typeof window !== 'undefined') {
      router.replace(`/${slug}/pdv/login?callbackUrl=/${slug}/pdv`)
    }
    return null
  }

  if (user?.role !== 'attendant') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500 font-semibold">Acesso não autorizado</p>
      </div>
    )
  }

  const hasCashSession = !!cashSession

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Left icon navbar */}
      <PDVNavbar
        active={activeModule}
        onNavigate={setActiveModule}
        onLogout={logout}
        hasCashSession={hasCashSession}
      />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center panel — switches between modules */}
        <div className={`flex flex-1 overflow-hidden ${activeModule === 'catalog' ? '' : 'w-full'}`}>

          {activeModule === 'catalog' && (
            <PDVCatalog
              categories={categories}
              onAddItem={addItem}
            />
          )}

          {activeModule === 'tables' && (
            <PDVTables onSelectTable={handleSelectTable} />
          )}

          {activeModule === 'orders' && (
            <PDVOrders />
          )}

          {activeModule === 'cash' && (
            <PDVCashDrawer
              cashSession={cashSession}
              onSessionChange={s => {
                setCashSession(s)
                if (s) setActiveModule('catalog')
              }}
            />
          )}

          {activeModule === 'summary' && (
            <PDVShiftSummary cashSession={cashSession} />
          )}
        </div>

        {/* Right comanda — always visible in catalog mode */}
        {activeModule === 'catalog' && (
          <PDVComanda
            cart={cart}
            onUpdateQty={updateQty}
            onRemove={removeItem}
            onUpdateNotes={updateNotes}
            onClear={clearCart}
            orderType={orderType}
            onSetOrderType={setOrderType}
            selectedTableId={selectedTableId}
            onSetTable={setSelectedTableId}
            tables={tables}
            customerName={customerName}
            onSetCustomerName={setCustomerName}
            customerPhone={customerPhone}
            onSetCustomerPhone={setCustomerPhone}
            discount={discount}
            onSetDiscount={setDiscount}
            deliveryFee={actualDeliveryFee}
            subtotal={subtotal}
            total={total}
            onCheckout={() => setShowCheckout(true)}
            cashSessionOpen={hasCashSession}
          />
        )}
      </div>

      {/* Checkout modal */}
      {showCheckout && (
        <PDVCheckout
          total={total}
          loading={orderMutation.isPending}
          onConfirm={payments => orderMutation.mutate(payments)}
          onCancel={() => setShowCheckout(false)}
        />
      )}
    </div>
  )
}
