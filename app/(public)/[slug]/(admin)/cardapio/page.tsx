'use client'

import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, patch, del, isApiError } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import {
  Plus, Edit2, Trash2, Eye, EyeOff, X, Upload, ImageIcon,
  FolderOpen, ChevronDown, ChevronUp, Loader2, CheckCircle,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn, formatCurrency } from '@/lib/utils'
import Image from 'next/image'

interface Category { id: string; name: string; order: number; active: boolean; products: Product[] }
interface Product {
  id: string; name: string; description?: string; price: number
  available: boolean; imageUrl?: string; sortOrder: number
  category: { id: string; name: string }
}

const EMPTY_PRODUCT = { name: '', description: '', price: '', categoryId: '', imageUrl: '', available: true }
const EMPTY_CATEGORY = { name: '', order: 0 }

// ── Image upload helper ───────────────────────────────────────────────────────
async function uploadFile(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Erro ao enviar imagem')
  }
  const data = await res.json()
  return data.url
}

// Use <img> for data URLs (next/image doesn't support base64), <Image> for external
function ProductImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (src.startsWith('data:')) {
    return <img src={src} alt={alt} className={className} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
  }
  return <Image src={src} alt={alt} fill className={className} referrerPolicy="no-referrer" />
}

// ── ImageInput ────────────────────────────────────────────────────────────────
function ImageInput({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState<'url' | 'upload'>('url')

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadFile(file)
      onChange(url)
      toast.success('Imagem enviada!')
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleFile(file)
  }

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1.5">Imagem do produto</label>

      {/* Tab */}
      <div className="flex gap-1 mb-3 bg-gray-100 rounded-xl p-1 w-fit">
        {(['url', 'upload'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {t === 'url' ? 'URL' : 'Upload'}
          </button>
        ))}
      </div>

      {tab === 'url' ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://exemplo.com/foto.jpg"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)] bg-white"
        />
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[var(--color-lime-primary)] hover:bg-[var(--color-app-bg)] transition-all"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-[var(--color-lime-primary)] animate-spin" />
              <p className="text-sm text-gray-500">Enviando...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-gray-400" />
              <p className="text-sm text-gray-500">Clique ou arraste uma imagem</p>
              <p className="text-xs text-gray-400">JPG, PNG, WebP — máx. 5MB</p>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="mt-3 relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
          <ProductImg src={value} alt="Preview" className="object-cover" />
          <button type="button" onClick={() => onChange('')}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CardapioPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products')
  const [activeCategory, setActiveCategory] = useState('all')

  // Product form state
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [showProductForm, setShowProductForm] = useState(false)
  const [productErrors, setProductErrors] = useState<Record<string, string>>({})

  // Category form state
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['admin-menu'],
    queryFn: () => get<{ categories: Category[] }>('/api/admin/menu'),
  })
  const menu = isApiError(menuData) || !menuData ? null : menuData
  const categories = menu?.categories ?? []
  const allProducts = categories.flatMap((c) => c.products.map((p) => ({ ...p, category: { id: c.id, name: c.name } })))
  const displayed = activeCategory === 'all' ? allProducts : allProducts.filter((p) => p.category.id === activeCategory)

  // ── Product mutations ────────────────────────────────────────────────────────
  const createProduct = useMutation({
    mutationFn: (data: any) => post('/api/admin/menu/products', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-menu'] }); toast.success('Produto criado!'); resetProductForm() },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao criar produto'),
  })
  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => patch(`/api/admin/menu/products/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-menu'] }); toast.success('Produto atualizado!'); resetProductForm() },
    onError: () => toast.error('Erro ao atualizar produto'),
  })
  const deleteProduct = useMutation({
    mutationFn: (id: string) => del(`/api/admin/menu/products/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-menu'] }); toast.success('Produto removido') },
    onError: () => toast.error('Erro ao remover produto'),
  })
  const toggleAvailability = useMutation({
    mutationFn: (id: string) => patch(`/api/admin/menu/products/${id}/availability`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-menu'] }),
  })

  // ── Category mutations ───────────────────────────────────────────────────────
  const createCategory = useMutation({
    mutationFn: (data: any) => post('/api/admin/menu/categories', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-menu'] }); toast.success('Categoria criada!'); resetCategoryForm() },
    onError: () => toast.error('Erro ao criar categoria'),
  })
  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => patch(`/api/admin/menu/categories/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-menu'] }); toast.success('Categoria atualizada!'); resetCategoryForm() },
    onError: () => toast.error('Erro ao atualizar categoria'),
  })
  const deleteCategory = useMutation({
    mutationFn: (id: string) => del(`/api/admin/menu/categories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-menu'] }); toast.success('Categoria removida') },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao remover categoria'),
  })

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const resetProductForm = () => { setProductForm(EMPTY_PRODUCT); setEditingProductId(null); setShowProductForm(false); setProductErrors({}) }
  const resetCategoryForm = () => { setCategoryForm(EMPTY_CATEGORY); setEditingCategoryId(null); setShowCategoryForm(false) }

  const openEditProduct = (p: Product) => {
    setProductForm({ name: p.name, description: p.description ?? '', price: String(p.price), categoryId: p.category.id, imageUrl: p.imageUrl ?? '', available: p.available })
    setEditingProductId(p.id); setShowProductForm(true); setProductErrors({})
    setTimeout(() => document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  const openEditCategory = (c: Category) => {
    setCategoryForm({ name: c.name, order: c.order })
    setEditingCategoryId(c.id); setShowCategoryForm(true)
  }

  const validateProduct = () => {
    const errs: Record<string, string> = {}
    if (!productForm.name.trim()) errs.name = 'Nome obrigatório'
    if (!productForm.price || isNaN(Number(productForm.price)) || Number(productForm.price) <= 0) errs.price = 'Preço inválido'
    if (!productForm.categoryId) errs.categoryId = 'Selecione uma categoria'
    setProductErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submitProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateProduct()) return
    const data = { ...productForm, price: Number(productForm.price), imageUrl: productForm.imageUrl || null }
    if (editingProductId) updateProduct.mutate({ id: editingProductId, data })
    else createProduct.mutate(data)
  }

  const submitCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryForm.name.trim()) return toast.error('Nome obrigatório')
    if (editingCategoryId) updateCategory.mutate({ id: editingCategoryId, data: categoryForm })
    else createCategory.mutate(categoryForm)
  }

  const confirmDeleteProduct = (p: Product) => {
    if (confirm(`Remover "${p.name}"? Esta ação não pode ser desfeita.`)) deleteProduct.mutate(p.id)
  }
  const confirmDeleteCategory = (c: Category) => {
    if (c.products.length > 0) { toast.error(`Mova ou remova os ${c.products.length} produto(s) primeiro`); return }
    if (confirm(`Remover categoria "${c.name}"?`)) deleteCategory.mutate(c.id)
  }

  if (isLoading) return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><Skeleton className="h-7 w-32" /><Skeleton className="h-3.5 w-44" /></div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-52 rounded-2xl" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-4 px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
            <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-52" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex gap-1.5 shrink-0">
              {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="w-8 h-8 rounded-xl" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Cardápio</h1>
          <p className="text-gray-400 text-sm mt-0.5">{allProducts.length} produto{allProducts.length !== 1 ? 's' : ''} · {categories.length} categoria{categories.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" size="md" onClick={() => { resetProductForm(); setShowProductForm(true); setActiveTab('products') }}>
          <Plus className="w-4 h-4" /> Novo Produto
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit mb-6">
        {([['products', 'Produtos'], ['categories', 'Categorias']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={cn('px-5 py-2 rounded-xl text-sm font-bold transition-all',
              activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {label}
          </button>
        ))}
      </div>

      {/* ── PRODUCTS TAB ── */}
      {activeTab === 'products' && (
        <div className="space-y-5">
          {/* Product Form */}
          {showProductForm && (
            <div id="product-form" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-gray-900 text-lg">{editingProductId ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={resetProductForm} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={submitProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Nome do produto *</label>
                    <input value={productForm.name} onChange={(e) => setProductForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Ex: X-Burguer Artesanal"
                      className={cn('w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]',
                        productErrors.name ? 'border-red-300' : 'border-gray-200')} />
                    {productErrors.name && <p className="text-red-500 text-xs mt-1">{productErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Preço (R$) *</label>
                    <input type="number" step="0.01" min="0" value={productForm.price}
                      onChange={(e) => setProductForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="0,00"
                      className={cn('w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]',
                        productErrors.price ? 'border-red-300' : 'border-gray-200')} />
                    {productErrors.price && <p className="text-red-500 text-xs mt-1">{productErrors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Categoria *</label>
                    <select value={productForm.categoryId} onChange={(e) => setProductForm(f => ({ ...f, categoryId: e.target.value }))}
                      className={cn('w-full px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]',
                        productErrors.categoryId ? 'border-red-300' : 'border-gray-200')}>
                      <option value="">Selecione...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {productErrors.categoryId && <p className="text-red-500 text-xs mt-1">{productErrors.categoryId}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Descrição</label>
                    <textarea value={productForm.description} onChange={(e) => setProductForm(f => ({ ...f, description: e.target.value }))}
                      rows={3} placeholder="Descreva os ingredientes, modo de preparo, etc."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)] resize-none" />
                  </div>

                  <div className="md:col-span-2">
                    <ImageInput value={productForm.imageUrl} onChange={(url) => setProductForm(f => ({ ...f, imageUrl: url }))} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <div onClick={() => setProductForm(f => ({ ...f, available: !f.available }))}
                        className={cn('w-11 h-6 rounded-full transition-colors relative', productForm.available ? 'bg-[var(--color-lime-primary)]' : 'bg-gray-200')}>
                        <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', productForm.available ? 'translate-x-5' : 'translate-x-0.5')} />
                      </div>
                      <span className="text-sm font-bold text-gray-700">Disponível para venda</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" variant="primary" size="md" loading={createProduct.isPending || updateProduct.isPending}>
                    <CheckCircle className="w-4 h-4" />
                    {editingProductId ? 'Salvar alterações' : 'Criar produto'}
                  </Button>
                  <Button type="button" variant="outline" size="md" onClick={resetProductForm}>Cancelar</Button>
                </div>
              </form>
            </div>
          )}

          {/* Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[{ id: 'all', name: `Todos (${allProducts.length})` }, ...categories.map(c => ({ id: c.id, name: `${c.name} (${c.products.length})` }))].map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={cn('px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shrink-0',
                  activeCategory === cat.id ? 'bg-[var(--color-lime-primary)] text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300')}>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product list */}
          {displayed.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Nenhum produto encontrado</p>
              <button onClick={() => setShowProductForm(true)} className="mt-4 text-sm font-bold text-[var(--color-lime-primary)] hover:underline">Adicionar produto</button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {displayed.map((product, idx) => (
                <div key={product.id} className={cn('flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors', idx > 0 && 'border-t border-gray-50', !product.available && 'opacity-60')}>
                  {/* Image */}
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                    {product.imageUrl ? (
                      <ProductImg src={product.imageUrl} alt={product.name} className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm truncate">{product.name}</p>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">{product.category.name}</span>
                      {!product.available && <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full shrink-0">Indisponível</span>}
                    </div>
                    {product.description && <p className="text-xs text-gray-400 truncate mt-0.5">{product.description}</p>}
                    <p className="text-sm font-black text-[var(--color-lime-primary)] mt-0.5">{formatCurrency(product.price)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => toggleAvailability.mutate(product.id)} title={product.available ? 'Desativar' : 'Ativar'}
                      className={cn('w-8 h-8 rounded-xl border flex items-center justify-center transition-colors',
                        product.available ? 'border-emerald-200 text-emerald-500 hover:bg-emerald-50' : 'border-gray-200 text-gray-400 hover:bg-gray-50')}>
                      {product.available ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => openEditProduct(product)} title="Editar"
                      className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => confirmDeleteProduct(product)} title="Remover"
                      className="w-8 h-8 rounded-xl border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CATEGORIES TAB ── */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Category form */}
          {showCategoryForm && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-gray-900">{editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
                <button onClick={resetCategoryForm} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={submitCategory} className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-48">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nome da categoria *</label>
                  <input value={categoryForm.name} onChange={(e) => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Hambúrgueres, Bebidas..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]" />
                </div>
                <div className="w-28">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Ordem</label>
                  <input type="number" min="0" value={categoryForm.order} onChange={(e) => setCategoryForm(f => ({ ...f, order: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" size="md" loading={createCategory.isPending || updateCategory.isPending}>
                    {editingCategoryId ? 'Salvar' : 'Criar'}
                  </Button>
                  <Button type="button" variant="outline" size="md" onClick={resetCategoryForm}>Cancelar</Button>
                </div>
              </form>
            </div>
          )}

          {!showCategoryForm && (
            <button onClick={() => { resetCategoryForm(); setShowCategoryForm(true) }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-[var(--color-lime-primary)] hover:text-[var(--color-lime-primary)] hover:bg-[var(--color-app-bg)] transition-all w-full font-semibold text-sm">
              <Plus className="w-4 h-4" /> Nova Categoria
            </button>
          )}

          {/* Category list */}
          {categories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Nenhuma categoria criada</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {categories.map((cat, idx) => (
                <div key={cat.id} className={cn('px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors', idx > 0 && 'border-t border-gray-50', !cat.active && 'opacity-60')}>
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-app-bg)] flex items-center justify-center shrink-0">
                    <FolderOpen className="w-4 h-4 text-[var(--color-lime-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{cat.products.length} produto{cat.products.length !== 1 ? 's' : ''} · ordem {cat.order}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateCategory.mutate({ id: cat.id, data: { active: !cat.active } })} title={cat.active ? 'Desativar' : 'Ativar'}
                      className={cn('w-8 h-8 rounded-xl border flex items-center justify-center transition-colors',
                        cat.active ? 'border-emerald-200 text-emerald-500 hover:bg-emerald-50' : 'border-gray-200 text-gray-400 hover:bg-gray-50')}>
                      {cat.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => openEditCategory(cat)} title="Editar"
                      className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => confirmDeleteCategory(cat)} title="Remover"
                      className="w-8 h-8 rounded-xl border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
