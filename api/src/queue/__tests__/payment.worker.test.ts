import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/redis', () => ({
  bullRedis: {},
}))

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation((_queue, processor) => ({
    processor,
    on: vi.fn(),
  })),
}))

vi.mock('@/services/split.service', () => ({
  processSplit: vi.fn(),
}))

vi.mock('@/services/socket.service', () => ({
  emitToOrder: vi.fn(),
  emitToKitchen: vi.fn(),
  emitToAdmin: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(),
    },
  },
}))

import prisma from '@/lib/prisma'
import { processSplit } from '@/services/split.service'
import { emitToOrder, emitToKitchen, emitToAdmin } from '@/services/socket.service'
import { Worker } from 'bullmq'

const mockOrder = {
  id: 'order-123',
  tenantId: 'tenant-abc',
  total: 100,
  type: 'delivery',
  items: [{ product: { name: 'X-Burger' }, quantity: 2 }],
  createdAt: new Date().toISOString(),
}

describe('payment worker processor', () => {
  let processor: (job: any) => Promise<void>

  beforeEach(() => {
    vi.clearAllMocks()
    // Re-import to trigger Worker constructor and capture processor
    const capturedProcessor = vi.mocked(Worker).mock.calls[0]?.[1]
    if (capturedProcessor) processor = capturedProcessor
  })

  it('calls processSplit and emits socket events on success', async () => {
    // Manually instantiate worker to capture processor
    const processorFn = vi.fn()
    vi.mocked(Worker).mockImplementationOnce((_queue, proc) => {
      processorFn.mockImplementation(proc as any)
      return { on: vi.fn() } as any
    })

    // Re-import worker module to trigger constructor
    vi.resetModules()
    const { default: _worker } = await import('../payment.worker')

    vi.mocked(processSplit).mockResolvedValue({ id: 'tx-1' } as any)
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any)

    const job = {
      id: 'job-1',
      data: { orderId: 'order-123', token: 'tok', gateway: 'mercadopago' },
      attemptsMade: 0,
      opts: { attempts: 3 },
    }

    await processorFn(job)

    expect(processSplit).toHaveBeenCalledWith({
      orderId: 'order-123',
      token: 'tok',
      gateway: 'mercadopago',
    })
    expect(emitToOrder).toHaveBeenCalledWith('order-123', 'order:confirmed', { orderId: 'order-123' })
    expect(emitToKitchen).toHaveBeenCalledWith('tenant-abc', 'new_order', expect.objectContaining({ orderId: 'order-123' }))
    expect(emitToAdmin).toHaveBeenCalledWith('tenant-abc', 'new_order', expect.objectContaining({ orderId: 'order-123' }))
  })
})
