'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, isApiError } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import {
  UserPlus, Trash2, ChefHat, Store, Bike,
  UtensilsCrossed, Briefcase, Users, Wine, Eye, EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { STAFF_ROLE_LABEL, STAFF_ROLE_SECTION } from '@/lib/constants'

const ROLE_META: Record<string, {
  icon: React.ElementType
  color: string
  bg: string
}> = {
  cook:      { icon: ChefHat,          color: 'text-orange-700', bg: 'bg-orange-100' },
  attendant: { icon: Store,            color: 'text-blue-700',   bg: 'bg-blue-100'   },
  driver:    { icon: Bike,             color: 'text-green-700',  bg: 'bg-green-100'  },
  waiter:    { icon: UtensilsCrossed,  color: 'text-lime-700',   bg: 'bg-lime-100'   },
  manager:   { icon: Briefcase,        color: 'text-purple-700', bg: 'bg-purple-100' },
  host:      { icon: Users,            color: 'text-pink-700',   bg: 'bg-pink-100'   },
  bartender: { icon: Wine,             color: 'text-rose-700',   bg: 'bg-rose-100'   },
}

const ALL_ROLES = Object.keys(ROLE_META)

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
  roleLabel?: string
  roleSection?: string | null
}

export default function EquipePage() {
  const params = useParams()
  const slug = params.slug as string
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'waiter' })

  const { data: staff, isLoading } = useQuery({
    queryKey: ['equipe'],
    queryFn: () => get<StaffMember[]>('/api/admin/equipe'),
  })

  const create = useMutation({
    mutationFn: () => post('/api/admin/equipe', form),
    onSuccess: () => {
      toast.success('Funcionário criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['equipe'] })
      setForm({ name: '', email: '', password: '', role: 'waiter' })
      setShowForm(false)
    },
    onError: (err: any) => toast.error(err?.message ?? 'Erro ao criar funcionário'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/equipe/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      toast.success('Funcionário removido')
      queryClient.invalidateQueries({ queryKey: ['equipe'] })
    },
    onError: () => toast.error('Erro ao remover funcionário'),
  })

  const staffArr: StaffMember[] = isApiError(staff) || !Array.isArray(staff) ? [] : staff

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Equipe</h1>
          <p className="text-gray-500 font-medium">Gerencie garçons, cozinheiros, atendentes e mais.</p>
        </div>
        <Button variant="dark" onClick={() => setShowForm(v => !v)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Novo funcionário
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h2 className="font-black text-gray-900 mb-4">Adicionar funcionário</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="João Silva"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="joao@restaurante.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
              />
            </div>
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Senha</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-700"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Função</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)] bg-white"
              >
                <optgroup label="Atendimento">
                  <option value="waiter">Garçom</option>
                  <option value="host">Maître / Recepcionista</option>
                  <option value="attendant">Operador PDV</option>
                </optgroup>
                <optgroup label="Cozinha & Bar">
                  <option value="cook">Cozinheiro</option>
                  <option value="bartender">Barman</option>
                </optgroup>
                <optgroup label="Logística">
                  <option value="driver">Entregador</option>
                </optgroup>
                <optgroup label="Gestão">
                  <option value="manager">Gerente</option>
                </optgroup>
              </select>

              {/* Dica de acesso */}
              {STAFF_ROLE_SECTION[form.role] ? (
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Login em: <span className="font-semibold text-gray-600">/{slug}/{STAFF_ROLE_SECTION[form.role]}/login</span>
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 mt-1.5">Cargo organizacional — sem acesso a seção específica ainda</p>
              )}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button
              variant="dark"
              loading={create.isPending}
              disabled={!form.name || !form.email || form.password.length < 6}
              onClick={() => create.mutate()}
            >
              Criar funcionário
            </Button>
          </div>
        </div>
      )}

      {/* Staff list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      ) : staffArr.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-bold text-gray-600">Nenhum funcionário cadastrado</p>
          <p className="text-gray-400 text-sm mt-1">Adicione garçons, cozinheiros, atendentes e mais</p>
        </div>
      ) : (
        <div className="space-y-6">
          {ALL_ROLES.map(role => {
            const members = staffArr.filter(s => s.role === role)
            if (members.length === 0) return null
            const meta = ROLE_META[role]
            const Icon = meta.icon
            const label = STAFF_ROLE_LABEL[role] ?? role
            const section = STAFF_ROLE_SECTION[role]

            return (
              <div key={role}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Icon className={cn('w-4 h-4', meta.color)} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}s</span>
                  {section
                    ? <span className="text-xs text-gray-300">· login: /{slug}/{section}/login</span>
                    : <span className="text-xs text-gray-300">· cargo organizacional</span>
                  }
                </div>
                <div className="space-y-2">
                  {members.map(member => (
                    <div key={member.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', meta.bg)}>
                        <Icon className={cn('w-5 h-5', meta.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{member.name}</p>
                        <p className="text-xs text-gray-400 truncate">{member.email}</p>
                      </div>
                      <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full shrink-0', meta.bg, meta.color)}>
                        {label}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Remover ${member.name}?`)) remove.mutate(member.id)
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
