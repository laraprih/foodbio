import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

interface KDSCardProps {
  order: any;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}

export default function KDSCard({ order, onComplete, onCancel }: KDSCardProps) {
  const timeElapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const isLate = timeElapsed > 20;

  return (
    <div className={cn(
      'bg-white rounded-3xl border-2 flex flex-col overflow-hidden transition-all',
      isLate ? 'border-red-200 shadow-red-100 shadow-lg' : 'border-gray-100 shadow-sm'
    )}>
      <div className={cn(
        'px-6 py-4 flex items-center justify-between',
        isLate ? 'bg-red-50' : 'bg-gray-50'
      )}>
        <div className="flex items-center gap-3">
          <span className="text-lg font-black text-gray-900">#{order.id.slice(-4)}</span>
          {isLate && <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />}
        </div>
        <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase">
          <Clock className="w-4 h-4" />
          {timeElapsed} min
        </div>
      </div>

      <div className="flex-1 p-6 space-y-4">
        <div className="space-y-3">
          {order.items.map((item: any, idx: number) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="w-8 h-8 bg-black text-[var(--color-lime-primary)] rounded-lg flex items-center justify-center font-black text-sm shrink-0">
                {item.quantity}
              </span>
              <div>
                <p className="font-bold text-gray-900 leading-tight">{item.product.name}</p>
                {item.options?.map((o: any, oIdx: number) => (
                  <p key={oIdx} className="text-[10px] text-gray-400 font-medium">+ {o.name}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-50/50 border-t border-gray-100 grid grid-cols-2 gap-3">
        <button
          onClick={() => onCancel(order.id)}
          className="py-3 rounded-xl border border-gray-200 text-gray-400 font-bold text-sm hover:bg-white hover:text-red-500 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onComplete(order.id)}
          className="py-3 rounded-xl bg-black text-[var(--color-lime-primary)] font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Pronto
        </button>
      </div>
    </div>
  );
}
