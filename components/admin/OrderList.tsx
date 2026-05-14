import React from 'react'
import Badge from '@/components/ui/Badge'
import { Eye, CheckCircle, Clock } from 'lucide-react'
import { formatCurrency, formatOrderTime } from '@/lib/utils'
import { OrderStatus } from '@/lib/constants'
import type { Order } from '@/types'

interface OrderListProps {
  orders: Order[]
  onStatusUpdate: (id: string, status: OrderStatus) => void
  onViewDetails: (order: Order) => void
}

export default function OrderList({ orders, onStatusUpdate, onViewDetails }: OrderListProps) {
  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Pedido</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Cliente</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Valor</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <span className="font-bold text-gray-900">#{order.id.slice(-6)}</span>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatOrderTime(order.createdAt)}</p>
              </td>
              <td className="px-6 py-4">
                <span className="font-bold text-gray-700">{order.customerName}</span>
                <p className="text-xs text-gray-400">{order.customerPhone}</p>
              </td>
              <td className="px-6 py-4">
                <span className="font-black text-gray-900">{formatCurrency(order.total)}</span>
              </td>
              <td className="px-6 py-4">
                <Badge status={order.status} />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onViewDetails(order)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                    title="Ver Detalhes"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  {order.status === OrderStatus.PENDING && (
                    <button
                      onClick={() => onStatusUpdate(order.id, OrderStatus.CONFIRMED)}
                      className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                      title="Confirmar Pedido"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  {order.status === OrderStatus.CONFIRMED && (
                    <button
                      onClick={() => onStatusUpdate(order.id, OrderStatus.PREPARING)}
                      className="p-2 hover:bg-orange-50 rounded-lg transition-colors text-orange-600"
                      title="Iniciar Preparo"
                    >
                      <Clock className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="py-20 text-center text-gray-400">Nenhum pedido encontrado.</div>
      )}
    </div>
  )
}
