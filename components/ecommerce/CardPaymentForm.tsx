'use client'

import React, { useEffect, useState } from 'react'
import { usePayment } from '@/hooks/use-payment'
import { Button } from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import type { CardData } from '@/types'

interface CardPaymentFormProps {
  amount: number
  gateway: 'mercadopago' | 'pagbank'
  onSuccess: (token: string) => void
  loading?: boolean
}

export default function CardPaymentForm({ amount, gateway, onSuccess, loading }: CardPaymentFormProps) {
  const {
    loadMercadoPagoScript,
    loadPagSeguroScript,
    tokenizeMP,
    tokenizePagBank,
    loading: tokenizing,
    error,
  } = usePayment()

  const [cardData, setCardData] = useState<CardData>({
    cardNumber: '',
    cardholderName: '',
    cardExpirationMonth: '',
    cardExpirationYear: '',
    securityCode: '',
    identificationType: 'CPF',
    identificationNumber: '',
  })

  useEffect(() => {
    const loader = gateway === 'mercadopago' ? loadMercadoPagoScript : loadPagSeguroScript
    loader().catch(() => toast.error(`Erro ao carregar SDK de pagamento`))
  }, [gateway, loadMercadoPagoScript, loadPagSeguroScript])

  const set = (field: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCardData((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let token: string
      if (gateway === 'mercadopago') {
        token = await tokenizeMP(cardData)
      } else {
        token = await tokenizePagBank(cardData)
      }
      onSuccess(token)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar cartão')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <Input
          label="Número do Cartão"
          placeholder="0000 0000 0000 0000"
          value={cardData.cardNumber}
          onChange={set('cardNumber')}
          required
        />
        <Input
          label="Nome no Cartão"
          placeholder="Como está no cartão"
          value={cardData.cardholderName}
          onChange={set('cardholderName')}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Mês (MM)"
            placeholder="01"
            maxLength={2}
            value={cardData.cardExpirationMonth}
            onChange={set('cardExpirationMonth')}
            required
          />
          <Input
            label={gateway === 'pagbank' ? 'Ano (AAAA)' : 'Ano (AA)'}
            placeholder={gateway === 'pagbank' ? '2028' : '28'}
            maxLength={gateway === 'pagbank' ? 4 : 2}
            value={cardData.cardExpirationYear}
            onChange={set('cardExpirationYear')}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="CVV"
            placeholder="123"
            maxLength={4}
            value={cardData.securityCode}
            onChange={set('securityCode')}
            required
          />
          {gateway === 'mercadopago' && (
            <Input
              label="CPF do Titular"
              placeholder="000.000.000-00"
              value={cardData.identificationNumber ?? ''}
              onChange={set('identificationNumber')}
              required
            />
          )}
        </div>
      </div>

      <Button
        type="submit"
        variant="dark"
        className="w-full py-7"
        loading={loading || tokenizing}
      >
        Pagar {formatCurrency(amount)}
      </Button>

      {error && <p className="text-xs text-red-500 text-center font-medium">{error}</p>}
    </form>
  )
}
