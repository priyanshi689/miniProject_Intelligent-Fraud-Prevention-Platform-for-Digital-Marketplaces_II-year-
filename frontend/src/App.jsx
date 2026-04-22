import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/shared/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Cases from './pages/Cases';
import GraphView from './pages/GraphView';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import LoadingSpinner from './components/shared/LoadingSpinner';
import AlertToast from './components/transactions/AlertToast';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex bg-gray-950 min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <SocketProvider>
          <AlertToast alerts={[]} />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
              <Route path="/transactions" element={<ProtectedLayout><Transactions /></ProtectedLayout>} />
              <Route path="/cases" element={<ProtectedLayout><Cases /></ProtectedLayout>} />
              <Route path="/graph" element={<ProtectedLayout><GraphView /></ProtectedLayout>} />
              <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </Provider>
  );
}
