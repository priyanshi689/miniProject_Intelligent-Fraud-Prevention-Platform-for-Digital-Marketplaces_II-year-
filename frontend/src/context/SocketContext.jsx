import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const s = io({ path: '/socket.io' });
    s.emit('join_analyst_room');
    s.on('fraud_alert', (alert) => {
      setAlerts(prev => [{ ...alert, id: Date.now() }, ...prev].slice(0, 50));
    });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  return <SocketContext.Provider value={{ socket, alerts }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
