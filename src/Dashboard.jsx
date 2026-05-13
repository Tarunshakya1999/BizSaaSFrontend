import { useEffect, useState } from 'react';
import { useBusiness } from './Businesscontext';
import { getDashboard, getExpiringSoon } from './api';
import { Users, CalendarCheck, CreditCard, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { activeBusiness } = useBusiness();
  const [stats, setStats] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeBusiness) return;
    setLoading(true);
    Promise.all([
      getDashboard(activeBusiness.id),
      getExpiringSoon()
    ]).then(([dashRes, expRes]) => {
      setStats(dashRes.data);
      setExpiring(expRes.data);
    }).finally(() => setLoading(false));
  }, [activeBusiness]);

  if (!activeBusiness) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-gray-400 mb-4">No business found. Create one first.</p>
      <Link to="/settings" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm">
        Go to Settings
      </Link>
    </div>
  );

  if (loading) return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-900 rounded-2xl h-28 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">{activeBusiness.name}</h1>
        <p className="text-gray-500 text-sm mt-0.5">Here's what's happening today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Customers" value={stats.total_customers} color="bg-blue-600" />
        <StatCard icon={CalendarCheck} label="Active Subs" value={stats.active_subscriptions} color="bg-green-600" />
        <StatCard icon={AlertTriangle} label="Expired Subs" value={stats.expired_subscriptions} color="bg-red-600" />
        <StatCard icon={Clock} label="Due Today" value={stats.due_today} color="bg-orange-600" sub="payments pending" />
        <StatCard icon={AlertTriangle} label="Expiring Soon" value={stats.expiring_soon} color="bg-yellow-600" sub="within 2 days" />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={`₹${Number(stats.total_revenue_month).toLocaleString('en-IN')}`}
          color="bg-indigo-600"
          sub="revenue collected"
        />
      </div>

      {/* Expiring Soon Alert */}
      {expiring.length > 0 && (
        <div className="bg-yellow-950/30 border border-yellow-800/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h2 className="text-yellow-400 font-semibold text-sm">Subscriptions Expiring Soon</h2>
          </div>
          <div className="space-y-2">
            {expiring.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between bg-yellow-950/30 rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{sub.customer_name}</p>
                  <p className="text-gray-400 text-xs">{sub.plan_name} · {sub.customer_phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 text-sm font-bold">{sub.days_remaining}d left</p>
                  <p className="text-gray-500 text-xs">Expires {sub.end_date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Add Customer', to: '/customers', color: 'bg-blue-600' },
          { label: 'New Subscription', to: '/subscriptions', color: 'bg-green-600' },
          { label: 'View Payments', to: '/payments', color: 'bg-indigo-600' },
          { label: 'Manage Plans', to: '/plans', color: 'bg-purple-600' },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className={`${a.color} text-white text-center py-3 px-4 rounded-xl text-sm font-medium hover:opacity-90 transition`}
          >
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}