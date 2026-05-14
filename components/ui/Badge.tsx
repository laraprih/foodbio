import React from 'react';
import { cn } from '@/lib/utils';

type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'dispatched' 
  | 'delivered' 
  | 'cancelled';

interface BadgeProps {
  status: OrderStatus | string;
  className?: string;
}

const statusMap: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Aguardando', classes: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmado', classes: 'bg-blue-100 text-blue-800' },
  preparing: { label: 'Preparando', classes: 'bg-orange-100 text-orange-800' },
  ready: { label: 'Pronto', classes: 'bg-lime-100 text-lime-800' },
  dispatched: { label: 'A caminho', classes: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Entregue', classes: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', classes: 'bg-red-100 text-red-800' },
};

export default function Badge({ status, className }: BadgeProps) {
  const config = statusMap[status] || { label: status, classes: 'bg-gray-100 text-gray-800' };

  return (
    <span
      className={cn(
        'px-3 py-1 rounded-full text-xs font-semibold inline-block',
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
