'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CreditCard, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { get, post, isApiError } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { connectPagBankSchema } from '@/lib/validations'
import type { z } from 'zod'

type PBForm = z.infer<typeof connectPagBankSchema>

export default function ConectarContaPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [loadingMP, setLoadingMP] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PBForm>({ resolver: zodResolver(connectPagBankSchema) })

  const handleConnectMP = async () => {
    setLoadingMP(true)
    const res = await get<{ url: string }>('/api/admin/payment/mp/authorize')
    if (isApiError(res)) {
      toast.error('Erro ao gerar URL de autorização')
      setLoadingMP(false)
      return
    }
    window.location.href = res.url
  }

  const handleConnectPB = async (data: PBForm) => {
    const res = await post('/api/admin/payment/pb/connect', data)
    if (isApiError(res)) {
      toast.error(res.error)
      return
    }
    toast.success('Conta PagBank vinculada com sucesso!')
    router.push(`/${slug}/financeiro?connected=true`)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href={`/${slug}/financeiro`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <h1 className="text-3xl font-black text-gray-900 mb-2">Conectar Conta Financeira</h1>
      <p className="text-gray-500 mb-10">
        Escolha o gateway de pagamento. O split automático será configurado com a comissão da plataforma.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mercado Pago */}
        <div className="bg-white rounded-[28px] p-8 border border-black/5 shadow-sm flex flex-col">
          <div className="w-14 h-14 bg-[var(--color-app-bg)] rounded-[18px] flex items-center justify-center mb-6">
            <CreditCard className="w-7 h-7 text-[var(--color-app-dark)]" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Mercado Pago</h2>
          <p className="text-sm text-gray-500 mb-8 flex-1">
            Checkout transparente com Pix e cartão. Split automático via OAuth.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleConnectMP}
            loading={loadingMP}
            className="w-full"
          >
            {loadingMP ? 'Redirecionando...' : 'Autorizar com Mercado Pago'}
            {!loadingMP && <ExternalLink className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        {/* PagBank */}
        <div className="bg-white rounded-[28px] p-8 border border-black/5 shadow-sm flex flex-col">
          <div className="w-14 h-14 bg-[var(--color-app-bg)] rounded-[18px] flex items-center justify-center mb-6">
            <CreditCard className="w-7 h-7 text-[var(--color-app-dark)]" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">PagBank</h2>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            Checkout transparente com Pix e cartão via PagSeguro.
          </p>
          <form onSubmit={handleSubmit(handleConnectPB)} className="space-y-4">
            <Input
              label="E-mail da conta PagBank"
              placeholder="seu@pagbank.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Button
              type="submit"
              variant="dark"
              size="lg"
              loading={isSubmitting}
              className="w-full"
            >
              Conectar PagBank
            </Button>
          </form>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400 text-center leading-relaxed">
        Ao conectar sua conta, você autoriza o Foodbio a processar pagamentos em seu nome com split automático.
        A comissão da plataforma é descontada no momento da transação — sem cobranças mensais.
      </p>
    </div>
  )
}
