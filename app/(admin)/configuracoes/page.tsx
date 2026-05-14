'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, isApiError } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { Upload, X, Loader2, CheckCircle, Store, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import ImageEditorModal from '@/components/ui/ImageEditorModal'

interface Tenant {
  id: string; name: string; slug: string; phone?: string
  address?: string; city?: string; state?: string
  logoUrl?: string; logoFormat: string; coverUrl?: string
  deliveryFee: number; minOrderValue: number; deliveryRadius: number
}

async function uploadBlob(blob: Blob, filename: string, token: string): Promise<string> {
  const form = new FormData()
  form.append('file', blob, filename)
  const res = await fetch('/bff/api/admin/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) throw new Error('Erro no upload')
  return (await res.json()).url
}

function ImageUploader({
  label, value, onChange, aspect = 'square',
}: {
  label: string; value: string; onChange: (url: string) => void; aspect?: 'square' | 'wide'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const openEditor = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setPendingFile(file)
    // reset input so same file can be selected again
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleEditorConfirm = async (blob: Blob, filename: string) => {
    setPendingFile(null)
    setUploading(true)
    try {
      const { getSession } = await import('next-auth/react')
      const session = await getSession() as any
      const url = await uploadBlob(blob, filename, session?.accessToken ?? '')
      onChange(url)
      toast.success('Imagem salva!')
    } catch {
      toast.error('Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }

  const previewClass = aspect === 'wide'
    ? 'w-full h-32 rounded-2xl'
    : 'w-24 h-24 rounded-2xl'

  return (
    <div>
      {pendingFile && (
        <ImageEditorModal
          file={pendingFile}
          onConfirm={handleEditorConfirm}
          onClose={() => setPendingFile(null)}
        />
      )}

      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      <div className={cn('flex gap-4 flex-wrap', aspect === 'wide' ? 'flex-col' : 'items-start')}>
        {/* Preview */}
        <div className={cn('relative bg-gray-100 overflow-hidden border border-gray-200 group shrink-0', previewClass)}>
          {value ? (
            <>
              <Image src={value} alt={label} fill className="object-cover" referrerPolicy="no-referrer" />
              <button type="button" onClick={() => onChange('')}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <X className="w-5 h-5 text-white" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-300" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className={cn('flex flex-col gap-2 min-w-0', aspect !== 'wide' && 'flex-1')}>
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) openEditor(f) }}
            onDragOver={(e) => e.preventDefault()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 cursor-pointer hover:border-[var(--color-lime-primary)] hover:text-[var(--color-lime-primary)] hover:bg-[var(--color-app-bg)] transition-all font-semibold w-fit"
          >
            {uploading
              ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" /> Enviando...</>
              : <><Upload className="w-4 h-4 shrink-0" /> Fazer upload</>}
          </div>
          <input
            type="text" value={value} onChange={(e) => onChange(e.target.value)}
            placeholder="Ou cole uma URL..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)] bg-white"
          />
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) openEditor(f) }} />
        </div>
      </div>
    </div>
  )
}

// ── Logo format preview cards ────────────────────────────────────────────────
function LogoFormatPicker({ value, onChange, logoUrl }: {
  value: string; onChange: (v: string) => void; logoUrl: string
}) {
  const formats = [
    {
      id: 'square',
      label: 'Quadrado',
      description: 'Ícone compacto — ideal para logos com símbolo',
      preview: (
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 w-fit">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 relative">
            {logoUrl
              ? <Image src={logoUrl} alt="preview" fill className="object-cover" referrerPolicy="no-referrer" />
              : <div className="w-full h-full bg-[var(--color-lime-primary)] rounded-xl flex items-center justify-center"><span className="text-white font-black text-sm">F</span></div>}
          </div>
          <div className="w-20 h-2.5 bg-gray-200 rounded-full" />
        </div>
      ),
    },
    {
      id: 'wide',
      label: 'Horizontal',
      description: 'Logotipo completo — ideal para logos com texto',
      preview: (
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 w-fit">
          <div className="h-10 w-28 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 relative">
            {logoUrl
              ? <Image src={logoUrl} alt="preview" fill className="object-contain p-1" referrerPolicy="no-referrer" />
              : <div className="w-full h-full bg-[var(--color-lime-primary)] rounded-xl flex items-center justify-center"><span className="text-white font-black text-sm">Logo</span></div>}
          </div>
        </div>
      ),
    },
  ]

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-3">Formato da logo na navbar</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {formats.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={cn(
              'flex flex-col gap-3 p-4 rounded-2xl border-2 text-left transition-all',
              value === f.id
                ? 'border-[var(--color-lime-primary)] bg-[var(--color-app-bg)]'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            )}
          >
            {f.preview}
            <div>
              <p className={cn('text-sm font-bold', value === f.id ? 'text-[var(--color-lime-primary)]' : 'text-gray-700')}>
                {f.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{f.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const queryClient = useQueryClient()

  const { data: tenantData, isLoading } = useQuery({
    queryKey: ['admin-tenant'],
    queryFn: () => get<Tenant>('/bff/api/admin/tenant'),
  })
  const tenant = isApiError(tenantData) || !tenantData ? null : tenantData

  const [form, setForm] = useState({
    name: '', phone: '', address: '', city: '', state: '',
    logoUrl: '', logoFormat: 'square', coverUrl: '',
    deliveryFee: '', minOrderValue: '', deliveryRadius: '',
  })

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name ?? '',
        phone: tenant.phone ?? '',
        address: tenant.address ?? '',
        city: tenant.city ?? '',
        state: tenant.state ?? '',
        logoUrl: tenant.logoUrl ?? '',
        logoFormat: tenant.logoFormat ?? 'square',
        coverUrl: tenant.coverUrl ?? '',
        deliveryFee: String(tenant.deliveryFee ?? 0),
        minOrderValue: String(tenant.minOrderValue ?? 0),
        deliveryRadius: String(tenant.deliveryRadius ?? 5),
      })
    }
  }, [tenant])

  const update = useMutation({
    mutationFn: () => patch('/bff/api/admin/tenant', {
      name: form.name,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      logoUrl: form.logoUrl || null,
      logoFormat: form.logoFormat,
      coverUrl: form.coverUrl || null,
      deliveryFee: Number(form.deliveryFee),
      minOrderValue: Number(form.minOrderValue),
      deliveryRadius: Number(form.deliveryRadius),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenant'] })
      toast.success('Configurações salvas!')
    },
    onError: () => toast.error('Erro ao salvar'),
  })

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }))

  const field = (label: string, key: keyof typeof form, opts?: { placeholder?: string; type?: string }) => (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1.5">{label}</label>
      <input
        type={opts?.type ?? 'text'}
        value={form[key]}
        onChange={(e) => set(key)(e.target.value)}
        placeholder={opts?.placeholder}
        step={opts?.type === 'number' ? '0.01' : undefined}
        min={opts?.type === 'number' ? '0' : undefined}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)] bg-white"
      />
    </div>
  )

  if (isLoading) return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-3.5 w-56" /></div>
      </div>
      {/* Visual identity card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        <Skeleton className="h-5 w-36" />
        <div className="flex items-start gap-4">
          <Skeleton className="w-24 h-24 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="w-full h-32 rounded-2xl" />
      </div>
      {/* Store info card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <Skeleton className="h-5 w-44" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      {/* Delivery card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <Skeleton className="h-5 w-52" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-[var(--color-app-bg)] flex items-center justify-center">
          <Store className="w-5 h-5 text-[var(--color-lime-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Configurações</h1>
          <p className="text-gray-400 text-sm">Informações e aparência da sua loja</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); update.mutate() }} className="space-y-6">

        {/* Identidade visual */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="font-black text-gray-900">Identidade visual</h2>

          <ImageUploader
            label="Logo da loja"
            value={form.logoUrl}
            onChange={set('logoUrl')}
            aspect="square"
          />

          <LogoFormatPicker
            value={form.logoFormat}
            onChange={set('logoFormat')}
            logoUrl={form.logoUrl}
          />

          <ImageUploader
            label="Imagem de capa"
            value={form.coverUrl}
            onChange={set('coverUrl')}
            aspect="wide"
          />
        </section>

        {/* Informações básicas */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-black text-gray-900">Informações da loja</h2>
          {field('Nome da loja *', 'name', { placeholder: 'Ex: Burguer Bros' })}
          {field('Telefone / WhatsApp', 'phone', { placeholder: '(11) 99999-9999' })}
          {field('Endereço', 'address', { placeholder: 'Rua, número, bairro' })}
          <div className="grid grid-cols-2 gap-4">
            {field('Cidade', 'city', { placeholder: 'São Paulo' })}
            {field('Estado', 'state', { placeholder: 'SP' })}
          </div>
        </section>

        {/* Entrega */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-black text-gray-900">Configurações de entrega</h2>
          <div className="grid grid-cols-3 gap-4">
            {field('Taxa de entrega (R$)', 'deliveryFee', { type: 'number', placeholder: '0,00' })}
            {field('Pedido mínimo (R$)', 'minOrderValue', { type: 'number', placeholder: '0,00' })}
            {field('Raio (km)', 'deliveryRadius', { type: 'number', placeholder: '5' })}
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" loading={update.isPending}>
            <CheckCircle className="w-4 h-4" />
            Salvar configurações
          </Button>
        </div>
      </form>
    </div>
  )
}
