import React from 'react';
import Badge from '@/components/ui/Badge';
import { Eye, CheckCircle, ChefHat, Truck } from 'lucide-react';
import { formatCurrency, formatOrderTime } from '@/lib/utils';
import { OrderStatus } from '@/lib/constants';
import type { Order } from '@/types';

interface OrderListProps {
  orders: Order[];
  onStatusUpdate: (id: string, status: OrderStatus) => void;
  onViewDetails: (order: Order) => void;
}

const nextStatus: Partial<Record<OrderStatus, { status: OrderStatus; icon: any; label: string; color: string }>> = {
  [OrderStatus.PENDING]:   { status: OrderStatus.CONFIRMED,  icon: CheckCircle, label: 'Confirmar',   color: 'text-emerald-600 hover:bg-emerald-50' },
  [OrderStatus.CONFIRMED]: { status: OrderStatus.PREPARING,  icon: ChefHat,     label: 'Preparar',    color: 'text-orange-600 hover:bg-orange-50' },
  [OrderStatus.PREPARING]: { status: OrderStatus.READY,      icon: CheckCircle, label: 'Pronto',      color: 'text-blue-600 hover:bg-blue-50' },
  [OrderStatus.READY]:     { status: OrderStatus.DELIVERED,  icon: Truck,       label: 'Despachar',   color: 'text-purple-600 hover:bg-purple-50' },
};

export default function OrderList({ orders, onStatusUpdate, onViewDetails }: OrderListProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Pedido</th>
              <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
              <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Valor</th>
              <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => {
              const next = nextStatus[order.status as OrderStatus];
              const NextIcon = next?.icon;
              return (
                <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-bold text-gray-900 font-mono text-xs">#{order.id.slice(-8).toUpperCase()}</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatOrderTime(order.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-800">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.customerPhone}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-black text-gray-900">{formatCurrency(order.total)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge status={order.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewDetails(order)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {next && NextIcon && (
                        <button
                          onClick={() => onStatusUpdate(order.id, next.status)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold ${next.color}`}
                          title={next.label}
                        >
                          <NextIcon className="w-3.5 h-3.5" />
                          {next.label}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden divide-y divide-gray-50">
        {orders.map((order) => {
          const next = nextStatus[order.status as OrderStatus];
          const NextIcon = next?.icon;
          return (
            <div key={order.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-bold text-gray-900 text-sm font-mono">#{order.id.slice(-8).toUpperCase()}</span>
                  <p className="text-xs text-gray-400">{formatOrderTime(order.createdAt)}</p>
                </div>
                <Badge status={order.status} />
              </div>
              <p className="font-semibold text-gray-700 text-sm">{order.customerName}</p>
              <p className="font-black text-gray-900 text-base mt-1">{formatCurrency(order.total)}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => onViewDetails(order)} className="flex-1 py-2 text-xs font-bold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  Detalhes
                </button>
                {next && NextIcon && (
                  <button
                    onClick={() => onStatusUpdate(order.id, next.status)}
                    className="flex-1 py-2 text-xs font-bold bg-[var(--color-lime-primary)] text-white rounded-xl hover:brightness-90 transition-all"
                  >
                    {next.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-gray-400 text-sm">Nenhum pedido encontrado</p>
        </div>
      )}
    </div>
  );
}
