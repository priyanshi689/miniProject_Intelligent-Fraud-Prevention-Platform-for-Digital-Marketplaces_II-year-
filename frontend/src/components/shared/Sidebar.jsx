import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, AlertTriangle, Network, BarChart3, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: CreditCard, label: 'Transactions' },
  { to: '/cases', icon: AlertTriangle, label: 'Fraud Cases' },
  { to: '/graph', icon: Network, label: 'Graph View' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="w-64 h-screen bg-gray-900 flex flex-col fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <Shield className="text-red-500" size={24} />
        <div>
          <p className="text-white font-bold text-sm">FraudGuard</p>
          <p className="text-gray-400 text-xs">Fraud Prevention Platform</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="text-white text-xs font-medium">{user?.name}</p>
            <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-gray-400 hover:text-white text-xs w-full px-2 py-1.5 rounded hover:bg-gray-800 transition-colors">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
}
