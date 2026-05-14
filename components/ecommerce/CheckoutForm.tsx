'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema } from '@/lib/validations';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Truck, Store, CreditCard, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckoutData } from '@/types';

interface CheckoutFormProps {
  onSubmit: (data: CheckoutData) => void;
  loading?: boolean;
}

export default function CheckoutForm({ onSubmit, loading }: CheckoutFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryType: 'delivery',
      paymentMethod: 'pix',
    },
  });

  const deliveryType = watch('deliveryType');
  const paymentMethod = watch('paymentMethod');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Delivery Type Selection */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Como quer receber?</h3>
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => setValue('deliveryType', 'delivery')}
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer',
              deliveryType === 'delivery'
                ? 'border-[var(--color-lime-primary)] bg-[var(--color-lime-primary)]/5'
                : 'border-gray-100 bg-white opacity-60'
            )}
          >
            <Truck className={cn('w-6 h-6 mb-2', deliveryType === 'delivery' ? 'text-black' : 'text-gray-400')} />
            <span className="text-xs font-bold text-gray-900">Delivery</span>
          </div>
          <div
            onClick={() => setValue('deliveryType', 'pickup')}
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer',
              deliveryType === 'pickup'
                ? 'border-[var(--color-lime-primary)] bg-[var(--color-lime-primary)]/5'
                : 'border-gray-100 bg-white opacity-60'
            )}
          >
            <Store className={cn('w-6 h-6 mb-2', deliveryType === 'pickup' ? 'text-black' : 'text-gray-400')} />
            <span className="text-xs font-bold text-gray-900">Retirada</span>
          </div>
        </div>
      </section>

      {/* Identification */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Seus Dados</h3>
        <Input
          label="Nome Completo"
          placeholder="Como devemos te chamar?"
          error={errors.name?.message as string}
          {...register('name')}
        />
        <Input
          label="Telefone / WhatsApp"
          placeholder="(00) 00000-0000"
          error={errors.phone?.message as string}
          {...register('phone')}
        />
      </section>

      {/* Address (Only for Delivery) */}
      {deliveryType === 'delivery' && (
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Endereço de Entrega</h3>
          <div className="grid grid-cols-3 gap-4">
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
          <Input
            label="Bairro"
            placeholder="Ex: Centro"
            error={errors.address?.neighborhood?.message as string}
            {...register('address.neighborhood')}
          />
          <Input
            label="Cidade"
            placeholder="Ex: São Paulo"
            error={errors.address?.city?.message as string}
            {...register('address.city')}
          />
        </section>
      )}

      {/* Payment Method */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Forma de Pagamento</h3>
        <div className="space-y-3">
          <div
            onClick={() => setValue('paymentMethod', 'pix')}
            className={cn(
              'flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer',
              paymentMethod === 'pix'
                ? 'border-[var(--color-lime-primary)] bg-[var(--color-lime-primary)]/5'
                : 'border-gray-100 bg-white'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-lime-100 rounded-full flex items-center justify-center">
                <Landmark className="w-5 h-5 text-lime-700" />
              </div>
              <span className="text-sm font-bold text-gray-900">Pix</span>
            </div>
            {paymentMethod === 'pix' && <div className="w-4 h-4 bg-black rounded-full border-4 border-white" />}
          </div>

          <div
            onClick={() => setValue('paymentMethod', 'credit_card')}
            className={cn(
              'flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer',
              paymentMethod === 'credit_card'
                ? 'border-[var(--color-lime-primary)] bg-[var(--color-lime-primary)]/5'
                : 'border-gray-100 bg-white'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-700" />
              </div>
              <span className="text-sm font-bold text-gray-900">Cartão de Crédito</span>
            </div>
            {paymentMethod === 'credit_card' && <div className="w-4 h-4 bg-black rounded-full border-4 border-white" />}
          </div>
        </div>
      </section>

      <Button
        type="submit"
        variant="dark"
        className="w-full py-7 mt-4"
        loading={loading}
      >
        Revisar e Pagar
      </Button>
    </form>
  );
}
