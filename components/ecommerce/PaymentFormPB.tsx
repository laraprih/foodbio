'use client';

import React, { useEffect, useState } from 'react';
import { usePayment } from '@/hooks/use-payment';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

interface PaymentFormPBProps {
  amount: number;
  onSuccess: (encryptedCard: string) => void;
  loading?: boolean;
}

export default function PaymentFormPB({ amount, onSuccess, loading }: PaymentFormPBProps) {
  const { loadPagSeguroScript, tokenizePagBank, loading: tokenizing, error } = usePayment();
  const [cardData, setCardData] = useState({
    number: '',
    holder: '',
    expMonth: '',
    expYear: '',
    securityCode: '',
  });

  useEffect(() => {
    loadPagSeguroScript().catch((err) => {
      console.error(err);
      toast.error('Erro ao carregar PagBank');
    });
  }, [loadPagSeguroScript]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const encrypted = await tokenizePagBank(cardData);
      onSuccess(encrypted);
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
          value={cardData.number}
          onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
          required
        />
        <Input
          label="Nome no Cartão"
          placeholder="Como está no cartão"
          value={cardData.holder}
          onChange={(e) => setCardData({ ...cardData, holder: e.target.value })}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Mês (MM)"
            placeholder="01"
            maxLength={2}
            value={cardData.expMonth}
            onChange={(e) => setCardData({ ...cardData, expMonth: e.target.value })}
            required
          />
          <Input
            label="Ano (AAAA)"
            placeholder="2028"
            maxLength={4}
            value={cardData.expYear}
            onChange={(e) => setCardData({ ...cardData, expYear: e.target.value })}
            required
          />
        </div>
        <Input
          label="CVV"
          placeholder="123"
          maxLength={4}
          className="w-1/2"
          value={cardData.securityCode}
          onChange={(e) => setCardData({ ...cardData, securityCode: e.target.value })}
          required
        />
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
