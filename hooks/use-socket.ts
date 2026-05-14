import { useEffect, useState, useCallback } from 'react';
import { useSocketContext } from '@/components/providers/SocketProvider';

export function useSocket(room?: string) {
  const { socket, connected: contextConnected } = useSocketContext();
  const [connected, setConnected] = useState(contextConnected);

  useEffect(() => {
    setConnected(contextConnected);
  }, [contextConnected]);

  useEffect(() => {
    if (!socket || !room) return;

    socket.emit('join', room);

    return () => {
      socket.emit('leave', room);
    };
  }, [socket, room]);

  const emit = useCallback((event: string, data?: any) => {
    if (socket && socket.connected) {
      socket.emit(event as any, data);
    } else {
      console.warn('Socket not connected. Could not emit:', event);
    }
  }, [socket]);

  return {
    socket,
    connected,
    emit,
  };
}
