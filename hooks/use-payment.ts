import { useState, useCallback } from 'react';

declare global {
  interface Window {
    MercadoPago: any;
    PagSeguro: any;
  }
}

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMercadoPagoScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.MercadoPago) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar SDK do Mercado Pago'));
      document.body.appendChild(script);
    });
  }, []);

  const loadPagSeguroScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.PagSeguro) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/pagseguro.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar SDK do PagSeguro'));
      document.body.appendChild(script);
    });
  }, []);

  const tokenizeMP = useCallback(async (cardData: any) => {
    setLoading(true);
    setError(null);
    try {
      if (!window.MercadoPago) await loadMercadoPagoScript();
      const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);
      const token = await mp.createCardToken(cardData);
      return token.id;
    } catch (err: any) {
      setError(err.message || 'Erro ao tokenizar cartão no Mercado Pago');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadMercadoPagoScript]);

  const tokenizePagBank = useCallback(async (cardData: any) => {
    setLoading(true);
    setError(null);
    try {
      if (!window.PagSeguro) await loadPagSeguroScript();
      // PagBank usually requires an encryption step
      const encrypted = window.PagSeguro.encryptCard(cardData);
      return encrypted.encryptedCard;
    } catch (err: any) {
      setError(err.message || 'Erro ao tokenizar cartão no PagBank');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPagSeguroScript]);

  return {
    loadMercadoPagoScript,
    loadPagSeguroScript,
    tokenizeMP,
    tokenizePagBank,
    loading,
    error,
  };
}
