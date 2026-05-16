'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, User, Mail, Phone, LogOut, ShoppingBag,
  MapPin, Plus, Trash2, Edit3, Check, X, Clock,
  ChevronRight, Package, Truck, Store, CheckCircle2,
  ChefHat, CheckCircle, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'react-hot-toast'

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending:   'Aguardando',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready:     'Pronto',
  dispatched:'A caminho',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-gray-100 text-gray-500',
  confirmed: 'bg-blue-50 text-blue-600',
  preparing: 'bg-yellow-50 text-yellow-700',
  ready:     'bg-orange-50 text-orange-600',
  dispatched:'bg-purple-50 text-purple-600',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}

const STATUS_ICON: Record<string, React.ElementType> = {
  pending:   Clock,
  confirmed: CheckCircle2,
  preparing: ChefHat,
  ready:     Package,
  dispatched:Truck,
  delivered: CheckCircle,
  cancelled: AlertCircle,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ── tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'pedidos',   label: 'Pedidos',   Icon: ShoppingBag },
  { id: 'dados',     label: 'Dados',     Icon: User },
  { id: 'enderecos', label: 'Endereços', Icon: MapPin },
]

// ── main ─────────────────────────────────────────────────────────────────────

export default function ContaPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { data: session, status } = useSession()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'pedidos' | 'dados' | 'enderecos'>('pedidos')

  const user = session?.user as any
  const isCustomer = user?.role === 'customer'

  const { data: profile, isLoading } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: () => fetch('/api/store/customer/profile').then(r => r.json()),
    enabled: !!session && isCustomer,
  })

  // ── loading / auth guard ──
  if (status === 'loading' || (isCustomer && isLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-lime-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || !isCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-[var(--color-lime-primary)]/10 rounded-full flex items-center justify-center mb-5">
          <User className="w-9 h-9 text-[var(--color-lime-primary)]" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Olá, visitante!</h2>
        <p className="text-gray-400 text-sm mb-8 max-w-xs">Entre na sua conta para ver seus pedidos, endereços e histórico de compras.</p>
        <Link href={`/${slug}/login`} className="w-full max-w-xs py-3.5 bg-[var(--color-lime-primary)] text-white font-bold rounded-2xl text-center block hover:brightness-95 transition-all shadow-lg shadow-[var(--color-lime-primary)]/20">
          Entrar na conta
        </Link>
        <Link href={`/${slug}/cadastro`} className="mt-3 w-full max-w-xs py-3.5 bg-white text-gray-700 font-bold rounded-2xl text-center block border border-gray-200 hover:bg-gray-50 transition-all">
          Criar uma conta
        </Link>
        <Link href={`/${slug}`} className="mt-5 text-sm text-gray-400 hover:text-gray-600">
          Continuar sem entrar
        </Link>
      </div>
    )
  }

  const initials = (profile?.user?.name ?? user?.name ?? '?').charAt(0).toUpperCase()
  const orders   = profile?.orders ?? []
  const addresses = profile?.addresses ?? []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-100 px-4 pt-safe-top">
        <div className="flex items-center gap-3 py-3.5">
          <Link href={`/${slug}`} className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </Link>
          <span className="font-black text-gray-900 text-base">Minha conta</span>
          <button
            onClick={() => signOut({ callbackUrl: `/${slug}` })}
            className="ml-auto flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="bg-white border-b border-gray-100 px-5 py-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-[var(--color-lime-primary)] rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-[var(--color-lime-primary)]/25">
          <span className="text-2xl font-black text-white">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="font-black text-gray-900 text-lg leading-tight truncate">{profile?.user?.name ?? user?.name}</p>
          <p className="text-xs text-gray-400 truncate">{profile?.user?.email ?? user?.email}</p>
          {profile?.user?.phone && (
            <p className="text-xs text-gray-400">{profile.user.phone}</p>
          )}
        </div>
        <div className="ml-auto text-right shrink-0">
          <p className="text-2xl font-black text-gray-900">{orders.length}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase">pedidos</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-gray-100 flex px-4 gap-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors border-b-2',
              tab === id
                ? 'border-[var(--color-lime-primary)] text-[var(--color-lime-primary)]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-5">
        {tab === 'pedidos' && <OrdersTab orders={orders} slug={slug} />}
        {tab === 'dados'   && <DadosTab profile={profile} queryClient={queryClient} />}
        {tab === 'enderecos' && <EnderecosTab addresses={addresses} queryClient={queryClient} />}
      </div>

    </div>
  )
}

// ── Pedidos tab ───────────────────────────────────────────────────────────────

function OrdersTab({ orders, slug }: { orders: any[]; slug: string }) {
  if (!orders.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-gray-300" />
        </div>
        <p className="font-bold text-gray-600 mb-1">Nenhum pedido ainda</p>
        <p className="text-sm text-gray-400 mb-6">Seus pedidos vão aparecer aqui.</p>
        <Link href={`/${slug}`} className="px-6 py-3 bg-[var(--color-lime-primary)] text-white font-bold rounded-2xl text-sm hover:brightness-95 transition-all">
          Ver cardápio
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const StatusIcon = STATUS_ICON[order.status] ?? Clock
        const isActive = !['delivered', 'cancelled'].includes(order.status)
        return (
          <Link
            key={order.id}
            href={`/${slug}/pedido/${order.id}`}
            className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-black text-gray-900 text-sm">
                    #{order.id.slice(-8).toUpperCase()}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-lime-primary)] animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {formatDate(order.createdAt)} às {formatTime(order.createdAt)}
                </p>
              </div>
              <span className={cn('flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shrink-0', STATUS_STYLE[order.status])}>
                <StatusIcon className="w-3 h-3" />
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              {order.type === 'delivery'
                ? <><Truck className="w-3 h-3 text-blue-400" />Delivery</>
                : <><Store className="w-3 h-3 text-orange-400" />Retirada</>}
              <span className="text-gray-300">·</span>
              <span>{order.items?.length ?? 0} {order.items?.length === 1 ? 'item' : 'itens'}</span>
              {order.items?.slice(0, 2).map((it: any, i: number) => (
                <React.Fragment key={i}>
                  <span className="text-gray-300">·</span>
                  <span className="truncate max-w-[80px]">{it.quantity}× {it.name}</span>
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-black text-gray-900">{formatCurrency(order.total)}</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ── Dados tab ─────────────────────────────────────────────────────────────────

function DadosTab({ profile, queryClient }: { profile: any; queryClient: any }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })

  function startEdit() {
    setForm({ name: profile?.user?.name ?? '', phone: profile?.user?.phone ?? '' })
    setEditing(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => fetch('/api/store/customer/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(async r => {
      if (!r.ok) throw new Error((await r.json()).error)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] })
      setEditing(false)
      toast.success('Dados atualizados!')
    },
    onError: (err: any) => toast.error(err.message ?? 'Erro ao salvar'),
  })

  if (!profile) return null

  return (
    <div className="space-y-4">
      {/* Card dados */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informações pessoais</p>
          {!editing && (
            <button onClick={startEdit} className="flex items-center gap-1 text-xs font-bold text-[var(--color-lime-primary)] hover:brightness-90 transition-all">
              <Edit3 className="w-3.5 h-3.5" />
              Editar
            </button>
          )}
        </div>

        {editing ? (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Nome completo</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/30 focus:border-[var(--color-lime-primary)] transition"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Telefone / WhatsApp</label>
              <input
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                type="tel"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/30 focus:border-[var(--color-lime-primary)] transition"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !form.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-lime-primary)] text-white text-sm font-bold hover:brightness-90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Salvar
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <InfoRow icon={<User className="w-4 h-4 text-gray-400" />} label="Nome" value={profile.user?.name} />
            <InfoRow icon={<Mail className="w-4 h-4 text-gray-400" />} label="E-mail" value={profile.user?.email} />
            <InfoRow icon={<Phone className="w-4 h-4 text-gray-400" />} label="Telefone" value={profile.user?.phone ?? '—'} />
          </div>
        )}
      </div>

      {/* Membro desde */}
      {profile.user?.createdAt && (
        <p className="text-xs text-center text-gray-400">
          Membro desde {formatDate(profile.user.createdAt)}
        </p>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  )
}

// ── Endereços tab ─────────────────────────────────────────────────────────────

function EnderecosTab({ addresses, queryClient }: { addresses: any[]; queryClient: any }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ street: '', number: '', complement: '', neighborhood: '', city: '', state: '', cep: '' })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function fetchCep(cep: string) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const d = await r.json()
      if (!d.erro) setForm(p => ({ ...p, street: d.logradouro, neighborhood: d.bairro, city: d.localidade, state: d.uf }))
    } catch {}
  }

  const addMutation = useMutation({
    mutationFn: () => fetch('/api/store/customer/address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(async r => { if (!r.ok) throw new Error((await r.json()).error) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] })
      setShowForm(false)
      setForm({ street: '', number: '', complement: '', neighborhood: '', city: '', state: '', cep: '' })
      toast.success('Endereço adicionado!')
    },
    onError: (err: any) => toast.error(err.message ?? 'Erro ao salvar'),
  })

  const removeMutation = useMutation({
    mutationFn: (index: number) => fetch('/api/store/customer/address', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index }),
    }).then(async r => { if (!r.ok) throw new Error((await r.json()).error) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] })
      toast.success('Endereço removido')
    },
    onError: () => toast.error('Erro ao remover'),
  })

  return (
    <div className="space-y-3">
      {/* Lista de endereços */}
      {addresses.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
            <MapPin className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-bold text-gray-600 mb-1">Nenhum endereço salvo</p>
          <p className="text-sm text-gray-400">Salve endereços para agilizar seus pedidos.</p>
        </div>
      )}

      {addresses.map((addr: any, idx: number) => (
        <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
          <div className="w-9 h-9 bg-[var(--color-lime-primary)]/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-4 h-4 text-[var(--color-lime-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight">{addr.street}, {addr.number}</p>
            {addr.complement && <p className="text-xs text-gray-500">{addr.complement}</p>}
            <p className="text-xs text-gray-400">{addr.neighborhood} — {addr.city}/{addr.state}</p>
            {addr.cep && <p className="text-xs text-gray-400">CEP {addr.cep}</p>}
          </div>
          <button
            onClick={() => removeMutation.mutate(idx)}
            disabled={removeMutation.isPending}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Formulário de novo endereço */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Novo endereço</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">CEP</label>
              <input
                value={form.cep}
                onChange={e => { set('cep')(e); fetchCep(e.target.value) }}
                placeholder="00000-000"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/30"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Rua / Avenida *</label>
              <input value={form.street} onChange={set('street')} placeholder="Rua das Flores" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/30" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Número *</label>
              <input value={form.number} onChange={set('number')} placeholder="123" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/30" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Complemento</label>
              <input value={form.complement} onChange={set('complement')} placeholder="Apto 12" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Bairro *</label>
              <input value={form.neighborhood} onChange={set('neighborhood')} placeholder="Centro" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/30" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Cidade *</label>
              <input value={form.city} onChange={set('city')} placeholder="São Paulo" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/30" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Estado *</label>
              <input value={form.state} onChange={set('state')} placeholder="SP" maxLength={2} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/30 uppercase" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1.5">
              <X className="w-4 h-4" />Cancelar
            </button>
            <button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !form.street || !form.number || !form.neighborhood || !form.city || !form.state}
              className="flex-1 py-2.5 rounded-xl bg-[var(--color-lime-primary)] text-white text-sm font-bold hover:brightness-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />Salvar
            </button>
          </div>
        </div>
      )}

      {/* Botão adicionar */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-bold text-gray-400 hover:border-[var(--color-lime-primary)] hover:text-[var(--color-lime-primary)] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar endereço
        </button>
      )}
    </div>
  )
}
