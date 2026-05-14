'use client';

import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema } from '@/lib/validations';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Truck, Store, CreditCard, Landmark, ArrowRight, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import type { CheckoutData } from '@/types';

interface CheckoutFormProps {
  onSubmit: (data: CheckoutData) => void;
  loading?: boolean;
  defaultName?: string;
  defaultPhone?: string;
}

type CepStatus = 'idle' | 'loading' | 'found' | 'error';

function maskCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export default function CheckoutForm({ onSubmit, loading, defaultName, defaultPhone }: CheckoutFormProps) {
  const { register, handleSubmit, watch, setValue, setFocus, formState: { errors } } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    shouldUnregister: true,
    defaultValues: { deliveryType: 'delivery', paymentMethod: 'pix', name: defaultName ?? '', phone: defaultPhone ?? '' },
  });

  const deliveryType = watch('deliveryType');
  const paymentMethod = watch('paymentMethod');

  const [cepStatus, setCepStatus] = useState<CepStatus>('idle');
  const cepRef = useRef('');

  const fetchCep = async (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return;
    if (digits === cepRef.current) return;
    cepRef.current = digits;

    setCepStatus('loading');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepStatus('error');
        return;
      }

      setValue('address.street', data.logradouro ?? '', { shouldValidate: true });
      setValue('address.neighborhood', data.bairro ?? '', { shouldValidate: true });
      setValue('address.city', data.localidade ?? '', { shouldValidate: true });
      setValue('address.state', data.uf ?? '', { shouldValidate: true });
      setCepStatus('found');

      // Foca no campo número se rua foi preenchida, senão foca na rua
      setTimeout(() => {
        setFocus(data.logradouro ? 'address.number' : 'address.street');
      }, 50);
    } catch {
      setCepStatus('error');
    }
  };

  const handleInvalid = () => {
    toast.error('Preencha todos os campos obrigatórios antes de continuar.');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, handleInvalid)} className="space-y-6">
      {/* Delivery Type */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-[var(--color-lime-primary)] text-white rounded-full flex items-center justify-center text-xs font-black">1</span>
          Como deseja receber?
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'delivery', label: 'Delivery', icon: Truck, desc: 'Receber em casa' },
            { value: 'pickup', label: 'Retirada', icon: Store, desc: 'Buscar no local' },
          ].map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('deliveryType', value as 'delivery' | 'pickup')}
              className={cn(
                'flex flex-col items-center p-4 rounded-xl border-2 transition-all text-left',
                deliveryType === value
                  ? 'border-[var(--color-lime-primary)] bg-[var(--color-app-bg)]'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              )}
            >
              <Icon className={cn('w-6 h-6 mb-2', deliveryType === value ? 'text-[var(--color-lime-primary)]' : 'text-gray-400')} />
              <span className="font-bold text-sm text-gray-900">{label}</span>
              <span className="text-[11px] text-gray-400 mt-0.5">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-[var(--color-lime-primary)] text-white rounded-full flex items-center justify-center text-xs font-black">2</span>
          Seus dados
        </h3>
        <Input label="Nome Completo" placeholder="Como devemos te chamar?" error={errors.name?.message as string} {...register('name')} />
        <Input label="Telefone / WhatsApp" placeholder="(00) 00000-0000" error={errors.phone?.message as string} {...register('phone')} />
      </div>

      {/* Address */}
      {deliveryType === 'delivery' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span className="w-6 h-6 bg-[var(--color-lime-primary)] text-white rounded-full flex items-center justify-center text-xs font-black">3</span>
            Endereço de entrega
          </h3>

          {/* CEP com busca automática */}
          <div className="relative">
            <Input
              label="CEP"
              placeholder="00000-000"
              inputMode="numeric"
              maxLength={9}
              error={errors.address?.cep?.message as string}
              {...register('address.cep', {
                onChange: (e) => {
                  const masked = maskCep(e.target.value);
                  e.target.value = masked;
                  if (masked.replace(/\D/g, '').length === 8) {
                    fetchCep(masked);
                  } else {
                    setCepStatus('idle');
                    cepRef.current = '';
                  }
                },
              })}
            />
            {/* Status icon */}
            <div className="absolute right-3 top-[34px]">
              {cepStatus === 'loading' && (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              )}
              {cepStatus === 'found' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
              {cepStatus === 'error' && (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
            {cepStatus === 'error' && (
              <p className="text-xs text-red-500 mt-1">CEP não encontrado. Preencha o endereço manualmente.</p>
            )}
          </div>

          {/* Rua + Número */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Rua"
                placeholder="Ex: Av. Brasil"
                error={errors.address?.street?.message as string}
                {...register('address.street')}
              />
            </div>
            <Input
              label="Nº"
              placeholder="123"
              error={errors.address?.number?.message as string}
              {...register('address.number')}
            />
          </div>

          {/* Complemento */}
          <Input
            label="Complemento"
            placeholder="Apto, bloco, referência (opcional)"
            {...register('address.complement')}
          />

          {/* Bairro */}
          <Input
            label="Bairro"
            placeholder="Ex: Centro"
            error={errors.address?.neighborhood?.message as string}
            {...register('address.neighborhood')}
          />

          {/* Cidade + Estado */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Cidade"
                placeholder="Ex: São Paulo"
                error={errors.address?.city?.message as string}
                {...register('address.city')}
              />
            </div>
            <Input
              label="Estado"
              placeholder="SP"
              maxLength={2}
              error={errors.address?.state?.message as string}
              {...register('address.state', {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                },
              })}
            />
          </div>
        </div>
      )}

      {/* Payment */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-[var(--color-lime-primary)] text-white rounded-full flex items-center justify-center text-xs font-black">
            {deliveryType === 'delivery' ? '4' : '3'}
          </span>
          Forma de pagamento
        </h3>
        <div className="space-y-3">
          {[
            { value: 'pix', label: 'Pix', desc: 'Pagamento instantâneo', icon: Landmark, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
            { value: 'credit_card', label: 'Cartão de Crédito', desc: 'Visa, Master, Elo e mais', icon: CreditCard, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
          ].map(({ value, label, desc, icon: Icon, iconBg, iconColor }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('paymentMethod', value as 'pix' | 'credit_card')}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
                paymentMethod === value ? 'border-[var(--color-lime-primary)] bg-[var(--color-app-bg)]' : 'border-gray-100 bg-white hover:border-gray-200'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
                  <Icon className={cn('w-5 h-5', iconColor)} />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{label}</p>
                  <p className="text-[11px] text-gray-400">{desc}</p>
                </div>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                paymentMethod === value ? 'border-[var(--color-lime-primary)]' : 'border-gray-300'
              )}>
                {paymentMethod === value && <div className="w-2.5 h-2.5 bg-[var(--color-lime-primary)] rounded-full" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" variant="dark" size="xl" className="w-full" loading={loading}>
        Revisar e Pagar <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}
