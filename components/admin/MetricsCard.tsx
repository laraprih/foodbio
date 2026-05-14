import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function MetricsCard({ title, value, icon: Icon, trend, className }: MetricsCardProps) {
  return (
    <div className={cn('bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-[var(--color-lime-primary)]/10 rounded-2xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-black" />
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-bold px-2.5 py-1 rounded-full',
              trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            )}
          >
            {trend.isPositive ? '+' : '-'}{trend.value}%
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 mt-1">{value}</h3>
      </div>
    </div>
  );
}
