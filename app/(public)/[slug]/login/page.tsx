'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, LogIn, Eye, EyeOff } from 'lucide-react'

export default function CustomerLoginPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email: form.email,
        password: form.password,
        slug,
        redirect: false,
      })
      if (res?.error) {
        setError('E-mail ou senha incorretos')
      } else {
        router.push(`/${slug}`)
        router.refresh()
      }
    } catch {
      setError('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href={`/${slug}`} className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </Link>
        <h1 className="font-black text-gray-900">Entrar</h1>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[var(--color-lime-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Bem-vindo de volta!</h2>
            <p className="text-gray-400 text-sm mt-1">Entre para acompanhar seus pedidos</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/30 focus:border-[var(--color-lime-primary)] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/30 focus:border-[var(--color-lime-primary)] transition"
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--color-lime-primary)] text-white font-bold rounded-xl hover:brightness-95 transition-all disabled:opacity-60 mt-2"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            Ainda não tem conta?{' '}
            <Link href={`/${slug}/cadastro`} className="text-[var(--color-lime-primary)] font-bold hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
