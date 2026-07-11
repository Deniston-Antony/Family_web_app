"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { getClientSocketUrl } from "@/lib/socket-url";
import type { SocketEvents, ClientEmitEvents } from "@/types";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: <K extends keyof ClientEmitEvents>(event: K, data: ClientEmitEvents[K]) => void;
  on: <K extends keyof SocketEvents>(
    event: K,
    callback: (data: SocketEvents[K]) => void,
  ) => void;
  off: <K extends keyof SocketEvents>(
    event: K,
    callback: (data: SocketEvents[K]) => void,
  ) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  emit: () => {},
  on: () => {},
  off: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = getClientSocketUrl();
    const newSocket = io(socketUrl, {
      path: "/api/socketio",
      auth: { userId: session.user.id },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    newSocket.on("connect", () => setIsConnected(true));
    newSocket.on("disconnect", () => setIsConnected(false));
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const emit = useCallback(
    <K extends keyof ClientEmitEvents>(event: K, data: ClientEmitEvents[K]) => {
      socket?.emit(event as string, data);
    },
    [socket],
  );

  const on = useCallback(
    <K extends keyof SocketEvents>(event: K, callback: (data: SocketEvents[K]) => void) => {
      socket?.on(event as string, callback);
    },
    [socket],
  );

  const off = useCallback(
    <K extends keyof SocketEvents>(event: K, callback: (data: SocketEvents[K]) => void) => {
      socket?.off(event as string, callback);
    },
    [socket],
  );

  return (
    <SocketContext.Provider value={{ socket, isConnected, emit, on, off }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
