'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, patch, isApiError } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { Plus, Edit2, Eye, EyeOff, Loader2 } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema } from '@/lib/validations'
import type { z } from 'zod'
import { cn } from '@/lib/utils'

type ProductForm = z.infer<typeof productSchema>

interface Category {
  id: string
  name: string
  position: number
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  available: boolean
  imageUrl?: string
  category: Category
}

export default function CardapioPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['admin-menu'],
    queryFn: () => get<{ categories: (Category & { products: Product[] })[] }>('/bff/api/admin/menu'),
  })

  const menu = isApiError(menuData) || !menuData ? null : menuData
  const categories = menu?.categories ?? []
  const allProducts = categories.flatMap((c) => c.products.map((p) => ({ ...p, category: c })))
  const displayed = activeCategory === 'all' ? allProducts : allProducts.filter((p) => p.category.id === activeCategory)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({ resolver: zodResolver(productSchema) })

  const createProduct = useMutation({
    mutationFn: (data: ProductForm) => post('/bff/api/admin/menu/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu'] })
      toast.success('Produto criado!')
      setShowForm(false)
      reset()
    },
    onError: () => toast.error('Erro ao criar produto'),
  })

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductForm> }) =>
      patch(`/bff/api/admin/menu/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu'] })
      toast.success('Produto atualizado!')
      setEditingProduct(null)
      reset()
    },
  })

  const toggleAvailability = useMutation({
    mutationFn: (id: string) => patch(`/bff/api/admin/menu/products/${id}/availability`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-menu'] }),
    onError: () => toast.error('Erro ao alterar disponibilidade'),
  })

  const onSubmit = (data: ProductForm) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data })
    } else {
      createProduct.mutate(data)
    }
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setValue('name', product.name)
    setValue('price', product.price)
    setValue('description', product.description ?? '')
    setValue('categoryId', product.category.id)
    setValue('available', product.available)
    setShowForm(true)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Cardápio</h1>
          <p className="text-gray-500 font-medium">Gerencie produtos e categorias.</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => { setEditingProduct(null); reset(); setShowForm(true) }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            'px-4 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-colors',
            activeCategory === 'all'
              ? 'bg-zinc-900 text-[var(--color-lime-primary)]'
              : 'bg-white text-gray-500 border border-gray-200'
          )}
        >
          Todos ({allProducts.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-4 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-colors',
              activeCategory === cat.id
                ? 'bg-zinc-900 text-[var(--color-lime-primary)]'
                : 'bg-white text-gray-500 border border-gray-200'
            )}
          >
            {cat.name} ({cat.products.length})
          </button>
        ))}
      </div>

      {/* Product form */}
      {showForm && (
        <div className="bg-white rounded-[28px] border border-black/5 shadow-sm p-6 mb-6">
          <h2 className="font-black text-gray-900 mb-6">
            {editingProduct ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nome do produto" error={errors.name?.message} {...register('name')} />
            <Input
              label="Preço (R$)"
              type="number"
              step="0.01"
              error={errors.price?.message}
              {...register('price', { valueAsNumber: true })}
            />
            <div className="md:col-span-2">
              <Input label="Descrição (opcional)" error={errors.description?.message} {...register('description')} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Categoria</label>
              <select
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                {...register('categoryId')}
              >
                <option value="">Selecione...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
            </div>
            <div className="flex items-end gap-4 md:col-span-2">
              <Button type="submit" variant="dark" size="md" loading={isSubmitting}>
                {editingProduct ? 'Salvar alterações' : 'Criar produto'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => { setShowForm(false); setEditingProduct(null); reset() }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Products list */}
      <div className="space-y-3">
        {displayed.length === 0 && (
          <div className="text-center py-16 text-gray-400 font-medium">
            Nenhum produto encontrado.
          </div>
        )}
        {displayed.map((product) => (
          <div
            key={product.id}
            className={cn(
              'bg-white rounded-[28px] border shadow-sm px-6 py-4 flex items-center gap-4 transition-opacity',
              !product.available && 'opacity-50',
              'border-black/5'
            )}
          >
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-14 h-14 rounded-2xl object-cover shrink-0 bg-gray-100"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">{product.name}</p>
              {product.description && (
                <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{product.description}</p>
              )}
              <p className="text-sm font-black text-gray-900 mt-1">{fmt(product.price)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleAvailability.mutate(product.id)}
                className={cn(
                  'w-9 h-9 rounded-xl border flex items-center justify-center transition-colors',
                  product.available
                    ? 'border-green-200 text-green-500 hover:bg-green-50'
                    : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                )}
                title={product.available ? 'Desativar' : 'Ativar'}
              >
                {product.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => openEdit(product)}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
