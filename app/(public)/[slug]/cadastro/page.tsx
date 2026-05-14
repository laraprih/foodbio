'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react'

export default function CadastroPage() {
  const { slug } = useParams<{ slug: string }>()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('As senhas não coincidem'); return }
    if (form.password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/store/${slug}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao criar conta'); return }

      // Auto-login
      const login = await signIn('credentials', { email: form.email, password: form.password, slug, redirect: false })
      if (login?.error) {
        window.location.href = `/${slug}/login`
      } else {
        window.location.href = `/${slug}`
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
        <Link href={`/${slug}/login`} className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </Link>
        <h1 className="font-black text-gray-900">Criar conta</h1>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[var(--color-lime-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Crie sua conta</h2>
            <p className="text-gray-400 text-sm mt-1">Acompanhe seus pedidos e histórico</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

            <Field label="Nome completo *" value={form.name} onChange={set('name')} placeholder="Seu nome" required />
            <Field label="E-mail *" type="email" value={form.email} onChange={set('email')} placeholder="seu@email.com" required />
            <Field label="Telefone / WhatsApp" type="tel" value={form.phone} onChange={set('phone')} placeholder="(00) 00000-0000" />

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Senha * <span className="text-gray-400 font-normal">(mín. 6 caracteres)</span>
              </label>
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

            <Field label="Confirmar senha *" type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" required />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--color-lime-primary)] text-white font-bold rounded-xl hover:brightness-95 transition-all disabled:opacity-60 mt-2"
            >
              {loading ? 'Criando conta…' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            Já tem conta?{' '}
            <Link href={`/${slug}/login`} className="text-[var(--color-lime-primary)] font-bold hover:underline">
              Entre aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/30 focus:border-[var(--color-lime-primary)] transition"
      />
    </div>
  )
}
