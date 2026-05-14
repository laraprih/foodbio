import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  description?: string;
  className?: string;
}

export default function MetricsCard({ title, value, icon: Icon, trend, description, className }: MetricsCardProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 bg-[var(--color-app-bg)] rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-[var(--color-lime-primary)]" />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full',
            trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          )}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}%
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </div>
  );
}
