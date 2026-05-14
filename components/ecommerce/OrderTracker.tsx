'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ChefHat, Package, Truck, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTrackerProps {
  status: string;
}

const steps = [
  { id: 'pending', label: 'Pendente', icon: Clock },
  { id: 'confirmed', label: 'Confirmado', icon: CheckCircle2 },
  { id: 'preparing', label: 'Em Preparo', icon: ChefHat },
  { id: 'ready', label: 'Pronto para Entrega', icon: Package },
  { id: 'dispatched', label: 'Saiu para Entrega', icon: Truck },
  { id: 'delivered', label: 'Entregue', icon: CheckCircle },
];

export default function OrderTracker({ status }: OrderTrackerProps) {
  const currentStepIndex = steps.findIndex((s) => s.id === status);
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className="space-y-6 py-4">
      {steps.map((step, index) => {
        const isCompleted = index < activeIndex;
        const isActive = index === activeIndex;
        const Icon = step.icon;

        return (
          <div key={step.id} className="relative flex items-start gap-4">
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'absolute left-[19px] top-10 w-0.5 h-10 transition-colors duration-500',
                  isCompleted ? 'bg-[var(--color-lime-primary)]' : 'bg-gray-100'
                )}
              />
            )}

            {/* Icon Circle */}
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-500 border-2',
                isCompleted
                  ? 'bg-[var(--color-lime-primary)] border-[var(--color-lime-primary)]'
                  : isActive
                  ? 'bg-white border-[var(--color-lime-primary)] scale-110 shadow-lg'
                  : 'bg-white border-gray-100'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  isCompleted ? 'text-black' : isActive ? 'text-black' : 'text-gray-300'
                )}
              />
            </div>

            {/* Label */}
            <div className="pt-2">
              <p
                className={cn(
                  'text-sm font-bold transition-colors',
                  isCompleted ? 'text-gray-900' : isActive ? 'text-black' : 'text-gray-400'
                )}
              >
                {step.label}
              </p>
              {isActive && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[11px] text-[var(--color-lime-primary)] font-bold bg-black px-2 py-0.5 rounded-full inline-block mt-1 uppercase tracking-tighter"
                >
                  Status Atual
                </motion.p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
