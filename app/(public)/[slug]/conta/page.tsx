'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, LogOut, ShoppingBag } from 'lucide-react'

export default function ContaPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-lime-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const user = session?.user as any
  const isCustomer = user?.role === 'customer'

  if (!session || !isCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-gray-300" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Você não está logado</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">Entre na sua conta para acompanhar seus pedidos</p>
        <Link href={`/${slug}/login`} className="px-6 py-3 bg-[var(--color-lime-primary)] text-white font-bold rounded-xl hover:brightness-95 transition-all">
          Entrar
        </Link>
        <Link href={`/${slug}`} className="mt-3 text-sm text-gray-400 hover:text-gray-600">Voltar à loja</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href={`/${slug}`} className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </Link>
        <h1 className="font-black text-gray-900">Minha conta</h1>
      </header>

      <div className="max-w-sm mx-auto w-full p-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-[var(--color-lime-primary)]/10 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xl font-black text-[var(--color-lime-primary)]">
              {user.name?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <div>
            <p className="font-black text-gray-900 text-lg">{user.name}</p>
            <p className="text-xs text-gray-400">Cliente</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dados da conta</p>
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-700">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700">{user.phone}</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <Link href={`/${slug}`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
            <ShoppingBag className="w-4 h-4 text-[var(--color-lime-primary)]" />
            <span className="text-sm font-semibold text-gray-700">Continuar comprando</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: `/${slug}` })}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition-colors text-left"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-500">Sair da conta</span>
          </button>
        </div>
      </div>
    </div>
  )
}
