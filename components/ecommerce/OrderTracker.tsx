'use client';

import React from 'react';
import { CheckCircle2, Clock, ChefHat, Package, Truck, CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTrackerProps {
  status: string;
}

const steps = [
  { id: 'pending',    label: 'Pedido recebido',    desc: 'Aguardando confirmação', icon: Clock },
  { id: 'confirmed',  label: 'Confirmado',          desc: 'Pedido aceito pela loja', icon: CheckCircle2 },
  { id: 'preparing',  label: 'Preparando',          desc: 'Sua comida está sendo feita', icon: ChefHat },
  { id: 'ready',      label: 'Pronto',              desc: 'Pedido pronto para entrega', icon: Package },
  { id: 'dispatched', label: 'Saiu para entrega',   desc: 'A caminho de você', icon: Truck },
  { id: 'delivered',  label: 'Entregue',            desc: 'Pedido concluído', icon: CheckCircle },
];

export default function OrderTracker({ status }: OrderTrackerProps) {
  const currentStepIndex = steps.findIndex((s) => s.id === status);
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isCompleted = index < activeIndex;
        const isActive = index === activeIndex;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex gap-4">
            {/* Left: icon + line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-all border-2',
                  isCompleted ? 'bg-[var(--color-lime-primary)] border-[var(--color-lime-primary)]' :
                  isActive    ? 'bg-[var(--color-lime-primary)] border-[var(--color-lime-primary)] ring-4 ring-[var(--color-lime-primary)]/20' :
                                'bg-white border-gray-200'
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Icon className={cn('w-4.5 h-4.5', isActive ? 'text-white' : 'text-gray-300')} />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={cn('w-0.5 h-8 transition-colors', isCompleted ? 'bg-[var(--color-lime-primary)]' : 'bg-gray-100')} />
              )}
            </div>

            {/* Right: text */}
            <div className={cn('pb-8 pt-2', index === steps.length - 1 && 'pb-0')}>
              <div className="flex items-center gap-2">
                <p className={cn('text-sm font-bold transition-colors', isCompleted || isActive ? 'text-gray-900' : 'text-gray-400')}>
                  {step.label}
                </p>
                {isActive && (
                  <span className="text-[10px] font-black bg-[var(--color-lime-primary)] text-white px-2 py-0.5 rounded-full uppercase tracking-tight">
                    Agora
                  </span>
                )}
              </div>
              <p className={cn('text-xs mt-0.5 transition-colors', isActive ? 'text-gray-500' : 'text-gray-300')}>
                {step.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
