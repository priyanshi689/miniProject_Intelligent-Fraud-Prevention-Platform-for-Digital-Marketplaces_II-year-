// frontend/src/context/SocketContext.jsx
// Replace your existing SocketContext with this

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const BACKEND_URL =
  import.meta.env.VITE_API_URL || "https://fraud-backend-lb7d.onrender.com";

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    socketRef.current = io(BACKEND_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current.on("connect", () => setConnected(true));
    socketRef.current.on("disconnect", () => setConnected(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

// ✅ Named export so AlertToast can import { useSocket }
export function useSocket() {
  return useContext(SocketContext);
}

export default SocketContext;
