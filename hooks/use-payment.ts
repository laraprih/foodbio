import { useState, useCallback } from 'react'
import type { CardData } from '@/types'

declare global {
  interface Window {
    MercadoPago: {
      new (key: string): { createCardToken: (data: CardData) => Promise<{ id: string }> }
    }
    PagSeguro: {
      encryptCard: (data: Omit<CardData, 'identificationType' | 'identificationNumber'>) => {
        encryptedCard: string
      }
    }
  }
}

function loadScript(src: string, checkGlobal: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    if (checkGlobal()) { resolve(); return }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Falha ao carregar script: ${src}`))
    document.body.appendChild(script)
  })
}

export function usePayment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMercadoPagoScript = useCallback(
    () => loadScript('https://sdk.mercadopago.com/js/v2', () => !!window.MercadoPago),
    []
  )

  const loadPagSeguroScript = useCallback(
    () => loadScript(
      'https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/pagseguro.min.js',
      () => !!window.PagSeguro
    ),
    []
  )

  const tokenizeMP = useCallback(async (cardData: CardData): Promise<string> => {
    setLoading(true)
    setError(null)
    try {
      await loadMercadoPagoScript()
      const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? '')
      const token = await mp.createCardToken(cardData)
      return token.id
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao tokenizar cartão no Mercado Pago'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadMercadoPagoScript])

  const tokenizePagBank = useCallback(async (
    cardData: Omit<CardData, 'identificationType' | 'identificationNumber'>
  ): Promise<string> => {
    setLoading(true)
    setError(null)
    try {
      await loadPagSeguroScript()
      const result = window.PagSeguro.encryptCard(cardData)
      return result.encryptedCard
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao tokenizar cartão no PagBank'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadPagSeguroScript])

  return {
    loadMercadoPagoScript,
    loadPagSeguroScript,
    tokenizeMP,
    tokenizePagBank,
    loading,
    error,
  }
}
