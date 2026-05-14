'use client';

import React, { useEffect, useState } from 'react';
import { usePayment } from '@/hooks/use-payment';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

interface PaymentFormMPProps {
  amount: number;
  onSuccess: (token: string) => void;
  loading?: boolean;
}

export default function PaymentFormMP({ amount, onSuccess, loading }: PaymentFormMPProps) {
  const { loadMercadoPagoScript, tokenizeMP, loading: tokenizing, error } = usePayment();
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardholderName: '',
    cardExpirationMonth: '',
    cardExpirationYear: '',
    securityCode: '',
    identificationType: 'CPF',
    identificationNumber: '',
  });

  useEffect(() => {
    loadMercadoPagoScript().catch((err) => {
      console.error(err);
      toast.error('Erro ao carregar Mercado Pago');
    });
  }, [loadMercadoPagoScript]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await tokenizeMP(cardData);
      onSuccess(token);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar cartão');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <Input
          label="Número do Cartão"
          placeholder="0000 0000 0000 0000"
          value={cardData.cardNumber}
          onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
          required
        />
        <Input
          label="Nome no Cartão"
          placeholder="Como está no cartão"
          value={cardData.cardholderName}
          onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value })}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Mês (MM)"
            placeholder="01"
            maxLength={2}
            value={cardData.cardExpirationMonth}
            onChange={(e) => setCardData({ ...cardData, cardExpirationMonth: e.target.value })}
            required
          />
          <Input
            label="Ano (AA)"
            placeholder="28"
            maxLength={2}
            value={cardData.cardExpirationYear}
            onChange={(e) => setCardData({ ...cardData, cardExpirationYear: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="CVV"
            placeholder="123"
            maxLength={4}
            value={cardData.securityCode}
            onChange={(e) => setCardData({ ...cardData, securityCode: e.target.value })}
            required
          />
          <Input
            label="CPF do Titular"
            placeholder="000.000.000-00"
            value={cardData.identificationNumber}
            onChange={(e) => setCardData({ ...cardData, identificationNumber: e.target.value })}
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="dark"
        className="w-full py-7"
        loading={loading || tokenizing}
      >
        Pagar R$ {amount.toFixed(2)}
      </Button>
      
      {error && <p className="text-xs text-red-500 text-center font-medium">{error}</p>}
    </form>
  );
}
