import { useEffect, useState } from 'react';
import { useBusiness } from './BusinessContext';
import {
  getSubscriptions, createSubscription, updateSubscription,
  deleteSubscription, getCustomers, getPlans
} from './api';
import { Plus, X, CalendarCheck, CheckCircle, XCircle, Clock } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-800 rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function SubForm({ initial, onSave, onClose, businessId }) {
  const [form, setForm] = useState(initial || { customer: '', plan: '', start_date: '', end_date: '', notes: '' });
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCustomers({ business_id: businessId }).then((r) => setCustomers(r.data));
    getPlans(businessId).then((r) => setPlans(r.data));
  }, [businessId]);

  // Auto-calc end date when plan changes
  const handlePlanChange = (planId) => {
    const plan = plans.find((p) => p.id === parseInt(planId));
    if (plan && form.start_date) {
      const start = new Date(form.start_date);
      start.setDate(start.getDate() + plan.duration_days);
      const end = start.toISOString().split('T')[0];
      setForm({ ...form, plan: planId, end_date: end });
    } else {
      setForm({ ...form, plan: planId });
    }
  };

  const handleStartChange = (date) => {
    const plan = plans.find((p) => p.id === parseInt(form.plan));
    if (plan) {
      const start = new Date(date);
      start.setDate(start.getDate() + plan.duration_days);
      const end = start.toISOString().split('T')[0];
      setForm({ ...form, start_date: date, end_date: end });
    } else {
      setForm({ ...form, start_date: date });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial?.id) await updateSubscription(initial.id, form);
      else await createSubscription(form);
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Customer *</label>
        <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}
          required className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
          <option value="">Select customer</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Plan *</label>
        <select value={form.plan} onChange={(e) => handlePlanChange(e.target.value)}
          required className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
          <option value="">Select plan</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — ₹{p.price} / {p.duration_days} days</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Start Date *</label>
          <input type="date" value={form.start_date} onChange={(e) => handleStartChange(e.target.value)}
            required className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">End Date *</label>
          <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            required className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none" rows={2} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 border border-gray-700 text-gray-300 py-3 rounded-xl text-sm hover:bg-gray-800 transition">Cancel</button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition">
          {loading ? 'Saving...' : (initial?.id ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
}

const STATUS_COLORS = {
  active: 'text-green-400 bg-green-950/50',
  expired: 'text-red-400 bg-red-950/50',
  paused: 'text-yellow-400 bg-yellow-950/50',
};

const STATUS_ICONS = {
  active: CheckCircle,
  expired: XCircle,
  paused: Clock,
};

export default function Subscriptions() {
  const { activeBusiness } = useBusiness();
  const [subs, setSubs] = useState([]);
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchSubs = () => {
    if (!activeBusiness) return;
    setLoading(true);
    const params = { business_id: activeBusiness.id };
    if (filter !== 'all') params.status = filter;
    getSubscriptions(params).then((r) => setSubs(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubs(); }, [activeBusiness, filter]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this subscription?')) return;
    await deleteSubscription(id);
    fetchSubs();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Subscriptions</h1>
          <p className="text-gray-500 text-sm">{subs.length} records</p>
        </div>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'active', 'expired', 'paused'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-gray-900 rounded-2xl h-24 animate-pulse" />)}</div>
      ) : subs.length === 0 ? (
        <div className="text-center py-16">
          <CalendarCheck className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No subscriptions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map((s) => {
            const StatusIcon = STATUS_ICONS[s.status] || CheckCircle;
            return (
              <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">{s.customer_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_COLORS[s.status]}`}>
                        <StatusIcon className="w-3 h-3" /> {s.status}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">{s.customer_phone} · {s.plan_name}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{s.start_date} → {s.end_date}</span>
                      {s.status === 'active' && (
                        <span className={`font-medium ${s.days_remaining <= 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {s.days_remaining}d remaining
                        </span>
                      )}
                    </div>
                    {s.plan_price && (
                      <p className="text-indigo-400 text-sm font-medium mt-1">₹{s.plan_price}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setModal(s)} className="text-xs text-gray-500 hover:text-indigo-400 transition px-3 py-1.5 bg-gray-800 rounded-lg">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-xs text-gray-500 hover:text-red-400 transition px-3 py-1.5 bg-gray-800 rounded-lg">Del</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'New Subscription' : 'Edit Subscription'} onClose={() => setModal(null)}>
          <SubForm
            initial={modal !== 'add' ? modal : null}
            businessId={activeBusiness?.id}
            onSave={() => { setModal(null); fetchSubs(); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}