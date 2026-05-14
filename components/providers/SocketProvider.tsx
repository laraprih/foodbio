'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';
import { getSession } from 'next-auth/react';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export const useSocketContext = () => useContext(SocketContext);

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socketInstance: Socket | null = null;

    const initSocket = async () => {
      const session = await getSession();
      if (!session?.user) return;

      socketInstance = getSocket();
      socketInstance.auth = { token: (session as any).accessToken };
      
      if (!socketInstance.connected) {
        socketInstance.connect();
      }

      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        setConnected(true);
      });

      socketInstance.on('disconnect', (reason) => {
        setConnected(false);
        if (reason === 'io server disconnect' || reason === 'transport close') {
          setTimeout(() => {
            socketInstance?.connect();
          }, 2000);
        }
      });
    };

    initSocket();

    return () => {
      if (socketInstance) {
        socketInstance.off('connect');
        socketInstance.off('disconnect');
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}
