import { useEffect, useState } from 'react';
import { useBusiness } from './BusinessContext';
import { getPayments, createPayment, markPaid, getSubscriptions } from './api';
import { Plus, X, CheckCircle, Clock, IndianRupee } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-800 rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function PaymentForm({ onSave, onClose, businessId }) {
  const [form, setForm] = useState({ subscription: '', amount: '', due_date: '', method: 'cash', notes: '' });
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSubscriptions({ business_id: businessId }).then((r) => setSubs(r.data));
  }, [businessId]);

  const handleSubChange = (subId) => {
    const sub = subs.find((s) => s.id === parseInt(subId));
    setForm({ ...form, subscription: subId, amount: sub?.plan_price || '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createPayment(form);
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Subscription *</label>
        <select value={form.subscription} onChange={(e) => handleSubChange(e.target.value)}
          required className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
          <option value="">Select subscription</option>
          {subs.map((s) => <option key={s.id} value={s.id}>{s.customer_name} — {s.plan_name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Amount (₹) *</label>
        <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Due Date *</label>
        <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          required className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Payment Method</label>
        <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
          {['cash', 'upi', 'bank', 'card'].map((m) => (
            <option key={m} value={m}>{m.toUpperCase()}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 border border-gray-700 text-gray-300 py-3 rounded-xl text-sm hover:bg-gray-800 transition">Cancel</button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition">
          {loading ? 'Adding...' : 'Add Payment'}
        </button>
      </div>
    </form>
  );
}

const STATUS_STYLES = {
  paid: 'text-green-400 bg-green-950/50',
  unpaid: 'text-red-400 bg-red-950/50',
  partial: 'text-yellow-400 bg-yellow-950/50',
};

export default function Payments() {
  const { activeBusiness } = useBusiness();
  const [payments, setPayments] = useState([]);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchPayments = () => {
    if (!activeBusiness) return;
    setLoading(true);
    const params = { business_id: activeBusiness.id };
    if (filter !== 'all') params.status = filter;
    getPayments(params).then((r) => setPayments(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, [activeBusiness, filter]);

  const handleMarkPaid = async (id) => {
    await markPaid(id, 'cash');
    fetchPayments();
  };

  const total = payments.reduce((s, p) => s + (p.status === 'paid' ? parseFloat(p.amount) : 0), 0);
  const pending = payments.reduce((s, p) => s + (p.status === 'unpaid' ? parseFloat(p.amount) : 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Payments</h1>
          <p className="text-gray-500 text-sm">{payments.length} records</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-950/30 border border-green-800/40 rounded-2xl p-4">
          <p className="text-green-400 text-xs font-medium uppercase tracking-wide">Collected</p>
          <p className="text-2xl font-bold text-white mt-1">₹{total.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-red-950/30 border border-red-800/40 rounded-2xl p-4">
          <p className="text-red-400 text-xs font-medium uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-bold text-white mt-1">₹{pending.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'paid', 'unpaid', 'partial'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-gray-900 rounded-2xl h-20 animate-pulse" />)}</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16">
          <IndianRupee className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No payments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium text-sm">{p.customer_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status]}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">{p.plan_name} · Due: {p.due_date}</p>
                {p.payment_date && <p className="text-gray-600 text-xs">Paid: {p.payment_date} via {p.method?.toUpperCase()}</p>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="text-white font-bold">₹{parseFloat(p.amount).toLocaleString('en-IN')}</p>
                {p.status === 'unpaid' && (
                  <button onClick={() => handleMarkPaid(p.id)}
                    className="flex items-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition">
                    <CheckCircle className="w-3 h-3" /> Paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="Add Payment" onClose={() => setModal(false)}>
          <PaymentForm businessId={activeBusiness?.id} onSave={() => { setModal(false); fetchPayments(); }} onClose={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}