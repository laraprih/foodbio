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
  pending:   { label: 'Aguardando', classes: 'bg-amber-50   text-amber-700   border border-amber-200' },
  confirmed: { label: 'Confirmado', classes: 'bg-blue-50    text-blue-700    border border-blue-200' },
  preparing: { label: 'Preparando', classes: 'bg-orange-50  text-orange-700  border border-orange-200' },
  ready:     { label: 'Pronto',     classes: 'bg-lime-50    text-lime-700    border border-lime-200' },
  dispatched:{ label: 'A caminho', classes: 'bg-purple-50  text-purple-700  border border-purple-200' },
  delivered: { label: 'Entregue',  classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  cancelled: { label: 'Cancelado', classes: 'bg-red-50     text-red-700     border border-red-200' },
};

export default function Badge({ status, className }: BadgeProps) {
  const config = statusMap[status] || { label: status, classes: 'bg-gray-50 text-gray-700 border border-gray-200' };
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold inline-block', config.classes, className)}>
      {config.label}
    </span>
  );
}
