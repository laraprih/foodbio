import { io, Socket } from 'socket.io-client';

export interface ServerToClientEvents {
  'order:confirmed': (data: { orderId: string }) => void;
  'order:update': (data: { orderId: string; status: string; updatedAt: string }) => void;
  'order:payment-failed': (data: { orderId: string; message: string }) => void;
  'order:ready': (data: { orderId: string }) => void;
  'new_order': (data: { orderId: string; total: number; type: string; createdAt: string }) => void;
  'order:assigned': (data: { orderId: string; driverName: string }) => void;
  'order:dispatched': (data: { orderId: string }) => void;
  'order:delivered': (data: { orderId: string }) => void;
}

export interface ClientToServerEvents {
  'join': (room: string) => void;
  'leave': (room: string) => void;
}

let _socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!_socket) {
    _socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001', {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    });
  }
  return _socket;
}

export function connectWithToken(token: string): void {
  const socket = getSocket();
  socket.auth = { token };
  if (!socket.connected) socket.connect();
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}
