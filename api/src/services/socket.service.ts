import { getIO } from '@/socket'

export function emitToOrder(orderId: string, event: string, data: unknown) {
  try {
    getIO().to(`order:${orderId}`).emit(event, data)
  } catch {
    // Socket pode não estar inicializado em testes
  }
}

export function emitToKitchen(tenantId: string, event: string, data: unknown) {
  try {
    getIO().to(`kitchen:${tenantId}`).emit(event, data)
  } catch {
    //
  }
}

export function emitToAdmin(tenantId: string, event: string, data: unknown) {
  try {
    getIO().to(`admin:${tenantId}`).emit(event, data)
  } catch {
    //
  }
}

export function emitToDrivers(tenantId: string, event: string, data: unknown) {
  try {
    getIO().to(`drivers:${tenantId}`).emit(event, data)
  } catch {
    //
  }
}
