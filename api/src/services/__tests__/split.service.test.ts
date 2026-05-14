import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processSplit } from '../split.service'

vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    paymentTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('../tenant.service', () => ({
  getPaymentAccount: vi.fn(),
}))

vi.mock('../mercadopago.service', () => ({
  createOrder: vi.fn(),
}))

vi.mock('../pagbank.service', () => ({
  createOrder: vi.fn(),
}))

import prisma from '@/lib/prisma'
import { getPaymentAccount } from '../tenant.service'
import * as mp from '../mercadopago.service'
import * as pb from '../pagbank.service'

const mockOrder = {
  id: 'order-123',
  tenantId: 'tenant-abc',
  total: 100,
  paymentStatus: 'pending',
  paymentTransaction: null,
}

const mockAccount = {
  id: 'acc-1',
  tenantId: 'tenant-abc',
  gateway: 'mercadopago',
  externalAccountId: 'mp-acc-id',
  commissionPercent: 8,
  accessToken: 'encrypted-token',
}

const mockTransaction = {
  id: 'tx-1',
  orderId: 'order-123',
  tenantId: 'tenant-abc',
  gateway: 'mercadopago',
  gatewayTransactionId: 'mp-tx-999',
  totalAmount: 100,
  marketplaceFee: 8,
  sellerAmount: 92,
  splitStatus: 'pending',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('processSplit', () => {
  it('creates a payment transaction with correct split amounts for mercadopago', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any)
    vi.mocked(getPaymentAccount).mockResolvedValue(mockAccount as any)
    vi.mocked(mp.createOrder).mockResolvedValue({ id: 'mp-tx-999' } as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([mockTransaction, {}] as any)

    const result = await processSplit({
      orderId: 'order-123',
      token: 'card-token',
      gateway: 'mercadopago',
    })

    expect(getPaymentAccount).toHaveBeenCalledWith('tenant-abc')
    expect(mp.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 100,
        marketplaceFee: 8,
        externalReference: 'foodin_order-123',
      })
    )
    expect(prisma.$transaction).toHaveBeenCalled()
    expect(result.marketplaceFee).toBe(8)
    expect(result.sellerAmount).toBe(92)
  })

  it('returns existing transaction if order already paid (idempotency)', async () => {
    const paidOrder = {
      ...mockOrder,
      paymentStatus: 'approved',
      paymentTransaction: mockTransaction,
    }
    vi.mocked(prisma.order.findUnique).mockResolvedValue(paidOrder as any)

    const result = await processSplit({
      orderId: 'order-123',
      token: 'card-token',
      gateway: 'mercadopago',
    })

    expect(mp.createOrder).not.toHaveBeenCalled()
    expect(result.id).toBe('tx-1')
  })

  it('throws if order not found', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)

    await expect(
      processSplit({ orderId: 'nonexistent', token: '', gateway: 'mercadopago' })
    ).rejects.toThrow('Pedido não encontrado')
  })

  it('records failed transaction and rethrows on gateway error', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any)
    vi.mocked(getPaymentAccount).mockResolvedValue(mockAccount as any)
    vi.mocked(mp.createOrder).mockRejectedValue(new Error('Gateway timeout'))
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any)

    await expect(
      processSplit({ orderId: 'order-123', token: 'tok', gateway: 'mercadopago' })
    ).rejects.toThrow('Gateway timeout')

    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('routes to pagbank service when gateway is pagbank', async () => {
    const pbAccount = { ...mockAccount, gateway: 'pagbank', commissionPercent: 10 }
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any)
    vi.mocked(getPaymentAccount).mockResolvedValue(pbAccount as any)
    vi.mocked(pb.createOrder).mockResolvedValue({ charges: [{ id: 'pb-charge-1' }] } as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([{ ...mockTransaction, gateway: 'pagbank' }, {}] as any)

    await processSplit({ orderId: 'order-123', token: '', gateway: 'pagbank' })

    expect(pb.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 100,
        receiverAccountId: 'mp-acc-id',
        receiverPercent: 90,
      })
    )
    expect(mp.createOrder).not.toHaveBeenCalled()
  })

  it('throws on unknown gateway', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any)
    vi.mocked(getPaymentAccount).mockResolvedValue(mockAccount as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any)

    await expect(
      processSplit({ orderId: 'order-123', token: '', gateway: 'stripe' })
    ).rejects.toThrow('Gateway desconhecido: stripe')
  })
})
