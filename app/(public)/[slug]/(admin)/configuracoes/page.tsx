'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, isApiError } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { Upload, X, Loader2, CheckCircle, Store, Image as ImageIcon, CreditCard, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import ImageEditorModal from '@/components/ui/ImageEditorModal'

interface Tenant {
  id: string; name: string; slug: string; phone?: string
  address?: string; city?: string; state?: string
  logoUrl?: string; logoFormat: string; coverUrl?: string
  showHeroLogo: boolean
  deliveryFee: number; minOrderValue: number; deliveryRadius: number
  gateway?: string | null; mpAccessToken?: string | null
}

async function uploadImage(blob: Blob, filename: string): Promise<string> {
  const form = new FormData()
  form.append('file', blob, filename)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
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
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleEditorConfirm = async (blob: Blob, filename: string) => {
    setPendingFile(null)
    setUploading(true)
    try {
      const url = await uploadImage(blob, filename)
      onChange(url)
      toast.success('Imagem salva!')
    } catch {
      toast.error('Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }

  const previewClass = aspect === 'wide' ? 'w-full h-32 rounded-2xl' : 'w-24 h-24 rounded-2xl'

  return (
    <div>
      {pendingFile && (
        <ImageEditorModal file={pendingFile} onConfirm={handleEditorConfirm} onClose={() => setPendingFile(null)} />
      )}
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      <div className={cn('flex gap-4 flex-wrap', aspect === 'wide' ? 'flex-col' : 'items-start')}>
        <div className={cn('relative bg-gray-100 overflow-hidden border border-gray-200 group shrink-0', previewClass)}>
          {value ? (
            <>
              <Image src={value} alt={label} fill className="object-cover" referrerPolicy="no-referrer" unoptimized={value.startsWith('data:')} />
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

function LogoFormatPicker({ value, onChange, logoUrl }: { value: string; onChange: (v: string) => void; logoUrl: string }) {
  const formats = [
    {
      id: 'square', label: 'Quadrado', description: 'Ícone compacto — ideal para logos com símbolo',
      preview: (
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 w-fit">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 relative">
            {logoUrl
              ? <Image src={logoUrl} alt="preview" fill className="object-cover" referrerPolicy="no-referrer" unoptimized={logoUrl.startsWith('data:')} />
              : <div className="w-full h-full bg-[var(--color-lime-primary)] rounded-xl flex items-center justify-center"><span className="text-white font-black text-sm">F</span></div>}
          </div>
          <div className="w-20 h-2.5 bg-gray-200 rounded-full" />
        </div>
      ),
    },
    {
      id: 'wide', label: 'Horizontal', description: 'Logotipo completo — ideal para logos com texto',
      preview: (
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 w-fit">
          <div className="h-10 w-28 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 relative">
            {logoUrl
              ? <Image src={logoUrl} alt="preview" fill className="object-contain p-1" referrerPolicy="no-referrer" unoptimized={logoUrl.startsWith('data:')} />
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
          <button key={f.id} type="button" onClick={() => onChange(f.id)}
            className={cn('flex flex-col gap-3 p-4 rounded-2xl border-2 text-left transition-all',
              value === f.id ? 'border-[var(--color-lime-primary)] bg-[var(--color-app-bg)]' : 'border-gray-200 hover:border-gray-300 bg-white')}>
            {f.preview}
            <div>
              <p className={cn('text-sm font-bold', value === f.id ? 'text-[var(--color-lime-primary)]' : 'text-gray-700')}>{f.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{f.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ConfiguracoesPage() {
  const queryClient = useQueryClient()
  const [showToken, setShowToken] = useState(false)

  const { data: tenantData, isLoading } = useQuery({
    queryKey: ['admin-tenant'],
    queryFn: () => get<Tenant>('/api/admin/tenant'),
  })
  const tenant = isApiError(tenantData) || !tenantData ? null : tenantData

  const [form, setForm] = useState({
    name: '', phone: '', address: '', city: '', state: '',
    logoUrl: '', logoFormat: 'square', coverUrl: '',
    showHeroLogo: true,
    deliveryFee: '', minOrderValue: '', deliveryRadius: '',
    mpAccessToken: '',
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
        showHeroLogo: tenant.showHeroLogo ?? true,
        deliveryFee: String(tenant.deliveryFee ?? 0),
        minOrderValue: String(tenant.minOrderValue ?? 0),
        deliveryRadius: String(tenant.deliveryRadius ?? 5),
        mpAccessToken: tenant.mpAccessToken ?? '',
      })
    }
  }, [tenant])

  const update = useMutation({
    mutationFn: () => patch('/api/admin/tenant', {
      name: form.name,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      logoUrl: form.logoUrl || null,
      logoFormat: form.logoFormat,
      coverUrl: form.coverUrl || null,
      showHeroLogo: form.showHeroLogo,
      deliveryFee: Number(form.deliveryFee),
      minOrderValue: Number(form.minOrderValue),
      deliveryRadius: Number(form.deliveryRadius),
      mpAccessToken: form.mpAccessToken || '',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenant'] })
      toast.success('Configurações salvas!')
    },
    onError: () => toast.error('Erro ao salvar'),
  })

  type StringKey = { [K in keyof typeof form]: (typeof form)[K] extends string ? K : never }[keyof typeof form]

  const set = (key: StringKey) => (val: string) => setForm((f) => ({ ...f, [key]: val }))

  const field = (label: string, key: StringKey, opts?: { placeholder?: string; type?: string }) => (
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
      {[120, 80, 60, 80].map((h, i) => (
        <Skeleton key={i} className={`h-${h < 100 ? '['+h+'px]' : '['+h+'px]'} w-full rounded-2xl`} style={{ height: h }} />
      ))}
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
          <ImageUploader label="Logo da loja" value={form.logoUrl} onChange={set('logoUrl')} aspect="square" />
          <LogoFormatPicker value={form.logoFormat} onChange={set('logoFormat')} logoUrl={form.logoUrl} />
          <ImageUploader label="Imagem de capa" value={form.coverUrl} onChange={set('coverUrl')} aspect="wide" />

          {/* Toggle: exibir logo circular no card mobile */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Logo circular no card da loja (mobile)</label>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, showHeroLogo: !f.showHeroLogo }))}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                form.showHeroLogo ? 'bg-[var(--color-lime-primary)]' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  form.showHeroLogo ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
            <p className="text-xs text-gray-400 mt-1.5">
              {form.showHeroLogo
                ? 'Logo exibida em círculo sobre o banner. Recomendado para logos quadradas ou com símbolo.'
                : 'Logo oculta. Use quando a logo for retangular ou horizontal e não ficar bem em formato circular.'}
            </p>
          </div>
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

        {/* Pagamento PIX */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[var(--color-lime-primary)]" />
            <h2 className="font-black text-gray-900">Pagamento — Mercado Pago</h2>
          </div>

          {/* Instruções visuais */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2 text-xs text-blue-800">
            <p className="font-bold">Como encontrar o Access Token:</p>
            <ol className="space-y-1 list-decimal list-inside text-blue-700">
              <li>Acesse <span className="font-mono bg-white px-1 rounded">mercadopago.com.br/developers/panel/app</span></li>
              <li>Clique em <strong>Suas integrações</strong> → selecione sua aplicação</li>
              <li>No menu lateral: <strong>Produção → Credenciais de produção</strong></li>
              <li>Copie o campo <strong>Access Token</strong> (começa com <span className="font-mono">APP_USR-</span> seguido de números e letras — é mais longo que a Public Key)</li>
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="font-bold text-red-700 mb-1">❌ NÃO usar (Public Key)</p>
              <p className="font-mono text-red-500 break-all">APP_USR-0b29aa65-be9a-46d9-8e0e-8b25d572347e</p>
              <p className="text-red-400 mt-1">Formato curto · UUID · usado no frontend</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="font-bold text-emerald-700 mb-1">✓ Usar (Access Token)</p>
              <p className="font-mono text-emerald-600 break-all">APP_USR-1234567-050525-abc...xyz-123456</p>
              <p className="text-emerald-500 mt-1">Formato longo · com data e ID · servidor</p>
            </div>
          </div>

          {tenant?.gateway === 'mercadopago' && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              Mercado Pago conectado — pagamentos PIX ativos
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Access Token (privado — nunca compartilhe)
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={form.mpAccessToken}
                onChange={(e) => set('mpAccessToken')(e.target.value)}
                placeholder="APP_USR-1234567890123456-050525-..."
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)] bg-white font-mono"
              />
              <button type="button" onClick={() => setShowToken(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Deixe em branco para desconectar.</p>
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
