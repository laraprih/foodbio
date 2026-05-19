'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { printPDVReceipt, printKitchenTicket, type PrintReceiptData } from '@/lib/pdv-print'

import type {
  PDVModule, CartItem, Discount, OrderType,
  CashSession, PaymentLine, PDVMenuCategory, PDVTable, AddressState,
} from '@/components/pdv/types'

const EMPTY_ADDRESS: AddressState = {
  cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
}

export default function PDVPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const qc = useQueryClient()

  const { user, status, logout } = useSectionAuth('pdv')

  // ── Modules ──────────────────────────────────────────────────────────────
  const [activeModule, setActiveModule] = useState<PDVModule>('cash')

  // ── Cart state ────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<OrderType>('pickup')
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [address, setAddress] = useState<AddressState>(EMPTY_ADDRESS)
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)

  // ── For printing after order ──────────────────────────────────────────────
  const pendingPrintRef = useRef<PrintReceiptData | null>(null)

  // ── Cash session ──────────────────────────────────────────────────────────
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

  // ── Tenant info (deliveryFee) ─────────────────────────────────────────────
  const { data: tenantData } = useQuery<{ tenant: { name: string; deliveryFee: number } }>({
    queryKey: ['pdv-tenant'],
    queryFn: () => fetch('/api/pdv/tenant').then(r => r.json()),
    enabled: status === 'authenticated',
    staleTime: 5 * 60_000,
  })
  const tenantDeliveryFee = tenantData?.tenant?.deliveryFee ?? 0
  const tenantName = tenantData?.tenant?.name ?? user?.tenantName ?? ''

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

  // ── Totals ────────────────────────────────────────────────────────────────
  const subtotal = useMemo(() =>
    cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [cart]
  )
  const discountAmount = useMemo(() => {
    if (!discount) return 0
    return discount.type === 'value'
      ? Math.min(discount.amount, subtotal)
      : subtotal * (discount.amount / 100)
  }, [discount, subtotal])
  const actualDeliveryFee = orderType === 'delivery' ? tenantDeliveryFee : 0
  const total = Math.max(0, subtotal - discountAmount + actualDeliveryFee)

  // ── Cart operations ───────────────────────────────────────────────────────
  const lastAddedRef = useRef<string | null>(null)

  const addItem = useCallback((item: CartItem) => {
    setCart(prev => {
      if (!item.notes && item.options.length === 0) {
        const existing = prev.find(i => i.productId === item.productId && i.options.length === 0 && !i.notes)
        if (existing) {
          lastAddedRef.current = existing.cartId
          return prev.map(i => i.cartId === existing.cartId ? { ...i, quantity: i.quantity + item.quantity } : i)
        }
      }
      lastAddedRef.current = item.cartId
      return [...prev, item]
    })
    toast.success(`${item.name} adicionado`, { duration: 800, position: 'bottom-left' })
  }, [])

  const updateQty = useCallback((cartId: string, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.cartId !== cartId))
    else setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, quantity: qty } : i))
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
    setAddress(EMPTY_ADDRESS)
    lastAddedRef.current = null
  }, [])

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
          address: orderType === 'delivery' ? address : null,
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

      // Print using data captured just before mutation
      if (pendingPrintRef.current) {
        const printData = { ...pendingPrintRef.current, orderId }
        printPDVReceipt(printData)
        printKitchenTicket(printData)
        pendingPrintRef.current = null
      }

      clearCart()
      setShowCheckout(false)
      qc.invalidateQueries({ queryKey: ['pdv-orders-today'] })
      qc.invalidateQueries({ queryKey: ['pdv-tables'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao registrar pedido'),
  })

  function handleConfirm(payments: PaymentLine[]) {
    const change = payments
      .filter(p => p.method === 'cash')
      .reduce((s, p) => s + ((p.received ?? p.amount) - p.amount), 0)

    // Capture print data before state is cleared
    pendingPrintRef.current = {
      orderId: '',   // filled in onSuccess
      tenantName,
      items: [...cart],
      subtotal,
      discountAmount,
      deliveryFee: actualDeliveryFee,
      total,
      customerName: customerName.trim() || 'Balcão',
      customerPhone: customerPhone.trim() || '',
      orderType,
      tableNumber: tables.find(t => t.id === selectedTableId)?.number ?? null,
      payments,
      change: Math.max(0, change),
      address: orderType === 'delivery' ? address : undefined,
    }
    orderMutation.mutate(payments)
  }

  // ── Table selection from table view ──────────────────────────────────────
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

      switch (e.key) {
        case 'F2':
          e.preventDefault(); setActiveModule('catalog'); break
        case 'F4':
          e.preventDefault(); clearCart(); break
        case 'F6':
          e.preventDefault()
          if (cart.length > 0 && cashSession) setShowCheckout(true)
          break
        case 'F8':
          e.preventDefault(); setActiveModule('cash'); break
        case 'F10':
          e.preventDefault(); setActiveModule('orders'); break
        case 'Escape':
          if (showCheckout) setShowCheckout(false)
          break
        case '+':
          e.preventDefault()
          if (lastAddedRef.current) updateQty(lastAddedRef.current, (cart.find(i => i.cartId === lastAddedRef.current)?.quantity ?? 0) + 1)
          break
        case '-':
          e.preventDefault()
          if (lastAddedRef.current) {
            const item = cart.find(i => i.cartId === lastAddedRef.current)
            if (item) updateQty(lastAddedRef.current, item.quantity - 1)
          }
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [cart, cashSession, showCheckout, clearCart, updateQty])

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
    if (typeof window !== 'undefined') router.replace(`/${slug}/pdv/login?callbackUrl=/${slug}/pdv`)
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
      <PDVNavbar
        active={activeModule}
        onNavigate={setActiveModule}
        onLogout={logout}
        hasCashSession={hasCashSession}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {activeModule === 'catalog' && (
            <PDVCatalog categories={categories} onAddItem={addItem} />
          )}
          {activeModule === 'tables' && (
            <PDVTables onSelectTable={handleSelectTable} />
          )}
          {activeModule === 'orders' && (
            <PDVOrders
              tenantName={tenantName}
              tenantId={user?.tenantId ?? ''}
              menu={menuData?.categories ?? []}
              cashSession={cashSession}
            />
          )}
          {activeModule === 'cash' && (
            <PDVCashDrawer
              cashSession={cashSession}
              onSessionChange={s => { setCashSession(s); if (s) setActiveModule('catalog') }}
            />
          )}
          {activeModule === 'summary' && <PDVShiftSummary cashSession={cashSession} />}
        </div>

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
            address={address}
            onSetAddress={setAddress}
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

      {showCheckout && (
        <PDVCheckout
          total={total}
          loading={orderMutation.isPending}
          onConfirm={handleConfirm}
          onCancel={() => setShowCheckout(false)}
        />
      )}
    </div>
  )
}
