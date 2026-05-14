import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const pool = getPool()
  const { id } = params

  const orderRes = await pool.query(
    `SELECT o.*, pt."payloadResponse" AS pix_payload
     FROM "Order" o
     LEFT JOIN "PaymentTransaction" pt ON pt."orderId" = o.id
     WHERE o.id = $1`,
    [id]
  )

  if (!orderRes.rows.length) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  const o = orderRes.rows[0]

  const itemsRes = await pool.query(
    `SELECT oi.id, oi."productId", oi.quantity, oi."unitPrice" AS price,
            p.name AS product_name, p."imageUrl" AS product_image
     FROM "OrderItem" oi
     JOIN "Product" p ON p.id = oi."productId"
     WHERE oi."orderId" = $1`,
    [id]
  )

  const pixPayload = o.pix_payload

  return NextResponse.json({
    id: o.id,
    status: o.status,
    type: o.type,
    total: o.total,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    tenantId: o.tenantId,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    address: o.deliveryAddress,
    externalReference: o.externalReference,
    items: itemsRes.rows.map((i) => ({
      id: i.id,
      productId: i.productId,
      quantity: i.quantity,
      price: i.price,
      product: { name: i.product_name, imageUrl: i.product_image },
    })),
    ...(pixPayload
      ? {
          pixQrCode: pixPayload.qrCode,
          pixQrBase64: pixPayload.qrBase64,
          pixExpiresAt: pixPayload.expiresAt,
        }
      : {}),
  })
}
