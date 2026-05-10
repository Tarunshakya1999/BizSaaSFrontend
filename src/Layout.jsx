import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import { TrialBanner } from './SaasBanner';
import {
  LayoutDashboard, Users, CreditCard, CalendarCheck,
  Settings, LogOut, Menu, Building2, ChevronDown, Lock
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/subscriptions', icon: CalendarCheck, label: 'Subscriptions' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/plans', icon: Building2, label: 'Plans' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

// Full screen block jab access band ho
function AccessBlockedScreen() {
  const [showModal, setShowModal] = useState(false);
  const { SubscribeModal } = require('./SaasBanner');
  const { user } = useAuth();
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gray-950">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <Lock className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-white text-xl font-bold mb-2">Access Band Ho Gaya</h2>
        <p className="text-gray-400 text-sm mb-6">
          Aapka trial ya subscription expire ho gaya hai. Continue karne ke liye subscribe karo.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 py-3 rounded-xl transition"
        >
          Subscribe Karo
        </button>
        {showModal && <SubscribeModal onClose={() => setShowModal(false)} user={user} />}
      </div>
    </div>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bizDropdown, setBizDropdown] = useState(false);
  const { user, logout } = useAuth();
  const { businesses, activeBusiness, switchBusiness } = useBusiness();
  const navigate = useNavigate();

  const saasStatus = user?.saas_status;
  const isBlocked = saasStatus && !saasStatus.is_access_allowed;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = ({ mobile }) => (
    <div className={`flex flex-col h-full bg-gray-900 border-r border-gray-800 ${mobile ? 'w-72' : 'w-64'}`}>
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">BizTrack</p>
            <p className="text-gray-500 text-xs">Business Manager</p>
          </div>
        </div>
      </div>

      {activeBusiness && (
        <div className="p-3 border-b border-gray-800">
          <button
            onClick={() => setBizDropdown(!bizDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-200 hover:bg-gray-750 transition"
          >
            <span className="truncate">{activeBusiness.name}</span>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
          {bizDropdown && (
            <div className="mt-1 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              {businesses.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { switchBusiness(b); setBizDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition ${b.id === activeBusiness.id ? 'text-indigo-400' : 'text-gray-300'}`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.first_name || user?.username}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400">
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-white font-bold text-sm">BizTrack</p>
          <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* SaaS Trial / Expiry Banner — always visible */}
        <TrialBanner saasStatus={saasStatus} user={user} />

        {/* Content or Block screen */}
        {isBlocked ? (
          <AccessBlockedScreen />
        ) : (
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>
        )}
      </div>
    </div>
  );
}