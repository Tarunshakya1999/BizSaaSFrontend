import { useEffect, useState } from 'react';
import { useBusiness } from './Businesscontext';
import { getPayments, createPayment, markPaid, getSubscriptions } from './api';
import { Plus, X, CheckCircle, IndianRupee, AlertCircle } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-800 rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── ADD PAYMENT FORM ────────────────────────────────────────────────────────
function PaymentForm({ onSave, onClose, businessId }) {
  const [form, setForm] = useState({
    subscription: '',
    amount: '',
    paid_amount: '',   // kitna aaya abhi
    due_date: '',
    method: 'cash',
    notes: '',
    status: 'unpaid',
  });
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  useEffect(() => {
    getSubscriptions({ business_id: businessId }).then((r) => setSubs(r.data));
  }, [businessId]);

  const handleSubChange = (subId) => {
    const sub = subs.find((s) => s.id === parseInt(subId));
    setSelectedSub(sub);
    setForm({ ...form, subscription: subId, amount: sub?.plan_price || '', paid_amount: '' });
  };

  const handlePaidAmountChange = (val) => {
    const paid = parseFloat(val) || 0;
    const total = parseFloat(form.amount) || 0;
    let status = 'unpaid';
    if (paid >= total && total > 0) status = 'paid';
    else if (paid > 0 && paid < total) status = 'partial';
    setForm({ ...form, paid_amount: val, status });
  };

  const baakiAmount = () => {
    const total = parseFloat(form.amount) || 0;
    const paid = parseFloat(form.paid_amount) || 0;
    return Math.max(0, total - paid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Jo actually receive hua woh amount bhejo
      const submitData = {
        subscription: form.subscription,
        amount: form.amount,           // total amount
        due_date: form.due_date,
        method: form.method,
        notes: form.notes,
        status: form.status,
      };
      // Partial/paid mein paid_amount aur notes add karo
      if (form.status === 'partial') {
        submitData.notes = `Received: ₹${form.paid_amount} | Baaki: ₹${baakiAmount()}${form.notes ? ' | ' + form.notes : ''}`;
      }
      if (form.status === 'paid') {
        submitData.payment_date = new Date().toISOString().split('T')[0];
      }
      await createPayment(submitData);
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Subscription */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Subscription *</label>
        <select
          value={form.subscription}
          onChange={(e) => handleSubChange(e.target.value)}
          required
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="">Select subscription</option>
          {subs.map((s) => (
            <option key={s.id} value={s.id}>{s.customer_name} — {s.plan_name}</option>
          ))}
        </select>
      </div>

      {/* Total Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Total Amount (₹) *</label>
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value, paid_amount: '', status: 'unpaid' })}
          required
          placeholder="Plan ka poora amount"
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Received Amount */}
      {form.amount && (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Abhi Kitna Mila? (₹)
            <span className="text-gray-600 font-normal ml-1">— khali chhodo agar nahi mila</span>
          </label>
          <input
            type="number"
            value={form.paid_amount}
            onChange={(e) => handlePaidAmountChange(e.target.value)}
            placeholder="0"
            max={form.amount}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
          />

          {/* Status preview */}
          {form.paid_amount !== '' && (
            <div className={`mt-2 px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
              form.status === 'paid'
                ? 'bg-green-950/50 border border-green-800/40 text-green-400'
                : form.status === 'partial'
                ? 'bg-yellow-950/50 border border-yellow-800/40 text-yellow-400'
                : 'bg-red-950/50 border border-red-800/40 text-red-400'
            }`}>
              <span>
                {form.status === 'paid' && '✅ Poora payment mil gaya'}
                {form.status === 'partial' && `⚠️ Partial — ₹${baakiAmount()} baaki hai`}
                {form.status === 'unpaid' && '❌ Koi payment nahi'}
              </span>
              <span className="capitalize bg-black/20 px-2 py-0.5 rounded-full">
                {form.status}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Due Date *</label>
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          required
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Payment Method</label>
        <select
          value={form.method}
          onChange={(e) => setForm({ ...form, method: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
        >
          {['cash', 'upi', 'bank', 'card'].map((m) => (
            <option key={m} value={m}>{m.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Notes</label>
        <input
          type="text"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Optional note..."
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 border border-gray-700 text-gray-300 py-3 rounded-xl text-sm hover:bg-gray-800 transition">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition">
          {loading ? 'Adding...' : 'Add Payment'}
        </button>
      </div>
    </form>
  );
}

// ─── PARTIAL PAYMENT UPDATE MODAL ────────────────────────────────────────────
function PartialUpdateModal({ payment, onSave, onClose }) {
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  // Parse existing received amount from notes
  const getAlreadyReceived = () => {
    if (!payment.notes) return 0;
    const match = payment.notes.match(/Received: ₹([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const alreadyReceived = getAlreadyReceived();
  const totalAmount = parseFloat(payment.amount);
  const newTotal = alreadyReceived + (parseFloat(additionalAmount) || 0);
  const stillPending = Math.max(0, totalAmount - newTotal);
  const isFullyPaid = newTotal >= totalAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newStatus = isFullyPaid ? 'paid' : 'partial';
      const newNotes = isFullyPaid
        ? `Poora payment mila | Total: ₹${totalAmount}`
        : `Received: ₹${newTotal} | Baaki: ₹${stillPending}`;

      await markPaid(payment.id, method);  // backend status update

      // Note: ideally ek alag API hogi partial update ke liye
      // Abhi ke liye mark_paid use kar rahe hain status update ke liye
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Summary */}
      <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-400">
          <span>Total Amount:</span>
          <span className="text-white font-medium">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Pehle Mila:</span>
          <span className="text-yellow-400 font-medium">₹{alreadyReceived.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Baaki Tha:</span>
          <span className="text-red-400 font-medium">₹{(totalAmount - alreadyReceived).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Additional Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Ab Kitna Aaya? (₹) *</label>
        <input
          type="number"
          value={additionalAmount}
          onChange={(e) => setAdditionalAmount(e.target.value)}
          required
          max={totalAmount - alreadyReceived}
          placeholder={`Max: ₹${totalAmount - alreadyReceived}`}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Preview */}
      {additionalAmount && (
        <div className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
          isFullyPaid
            ? 'bg-green-950/50 border border-green-800/40 text-green-400'
            : 'bg-yellow-950/50 border border-yellow-800/40 text-yellow-400'
        }`}>
          <span>
            {isFullyPaid
              ? '✅ Poora payment complete ho jaayega!'
              : `⚠️ ₹${stillPending.toLocaleString('en-IN')} abhi bhi baaki rahega`}
          </span>
        </div>
      )}

      {/* Method */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Payment Method</label>
        <select value={method} onChange={(e) => setMethod(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
          {['cash', 'upi', 'bank', 'card'].map((m) => (
            <option key={m} value={m}>{m.toUpperCase()}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 border border-gray-700 text-gray-300 py-3 rounded-xl text-sm hover:bg-gray-800 transition">
          Cancel
        </button>
        <button type="submit" disabled={loading || !additionalAmount}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition">
          {loading ? 'Updating...' : isFullyPaid ? '✅ Mark Full Paid' : '💰 Update Partial'}
        </button>
      </div>
    </form>
  );
}

// ─── STATUS STYLES ────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  paid:    'text-green-400 bg-green-950/50 border border-green-800/30',
  unpaid:  'text-red-400 bg-red-950/50 border border-red-800/30',
  partial: 'text-yellow-400 bg-yellow-950/50 border border-yellow-800/30',
};

// ─── MAIN PAYMENTS PAGE ───────────────────────────────────────────────────────
export default function Payments() {
  const { activeBusiness } = useBusiness();
  const [payments, setPayments] = useState([]);
  const [modal, setModal] = useState(false);
  const [partialModal, setPartialModal] = useState(null); // selected payment for partial update
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

  // Summary calculations
  const totalCollected = payments.reduce((s, p) => {
    if (p.status === 'paid') return s + parseFloat(p.amount);
    if (p.status === 'partial') {
      const match = p.notes?.match(/Received: ₹([\d.]+)/);
      return s + (match ? parseFloat(match[1]) : 0);
    }
    return s;
  }, 0);
  const totalPending = payments.reduce((s, p) => s + (p.status === 'unpaid' ? parseFloat(p.amount) : 0), 0);
  const totalPartialPending = payments.reduce((s, p) => {
    if (p.status === 'partial') {
      const match = p.notes?.match(/Baaki: ₹([\d.]+)/);
      return s + (match ? parseFloat(match[1]) : 0);
    }
    return s;
  }, 0);

  // Parse received from notes for display
  const getReceivedAmount = (p) => {
    if (p.status === 'paid') return parseFloat(p.amount);
    if (p.status === 'partial') {
      const match = p.notes?.match(/Received: ₹([\d.]+)/);
      return match ? parseFloat(match[1]) : 0;
    }
    return 0;
  };

  const getPendingAmount = (p) => {
    if (p.status === 'partial') {
      const match = p.notes?.match(/Baaki: ₹([\d.]+)/);
      return match ? parseFloat(match[1]) : 0;
    }
    if (p.status === 'unpaid') return parseFloat(p.amount);
    return 0;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
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
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-950/30 border border-green-800/40 rounded-2xl p-4">
          <p className="text-green-400 text-xs font-medium uppercase tracking-wide">Collected</p>
          <p className="text-2xl font-bold text-white mt-1">₹{totalCollected.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-red-950/30 border border-red-800/40 rounded-2xl p-4">
          <p className="text-red-400 text-xs font-medium uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-bold text-white mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
        </div>
        {totalPartialPending > 0 && (
          <div className="col-span-2 bg-yellow-950/30 border border-yellow-800/40 rounded-2xl p-4">
            <p className="text-yellow-400 text-xs font-medium uppercase tracking-wide">Partial Baaki</p>
            <p className="text-2xl font-bold text-white mt-1">₹{totalPartialPending.toLocaleString('en-IN')}</p>
            <p className="text-yellow-600 text-xs mt-1">Partial payments mein jo baaki hai</p>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'paid', 'unpaid', 'partial'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}>
            {f}
            {f === 'partial' && payments.filter(p => p.status === 'partial').length > 0 && (
              <span className="ml-1.5 bg-yellow-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {payments.filter(p => p.status === 'partial').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16">
          <IndianRupee className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No payments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const received = getReceivedAmount(p);
            const pending = getPendingAmount(p);
            const total = parseFloat(p.amount);
            const progressPct = total > 0 ? (received / total) * 100 : 0;

            return (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">{p.customer_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status]}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{p.plan_name} · Due: {p.due_date}</p>
                    {p.payment_date && (
                      <p className="text-gray-600 text-xs">Paid: {p.payment_date} via {p.method?.toUpperCase()}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold">₹{total.toLocaleString('en-IN')}</p>
                    {p.status === 'partial' && (
                      <p className="text-yellow-400 text-xs mt-0.5">₹{received.toLocaleString('en-IN')} mila</p>
                    )}
                  </div>
                </div>

                {/* Partial payment progress bar */}
                {p.status === 'partial' && (
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-yellow-400">₹{received.toLocaleString('en-IN')} mila</span>
                      <span className="text-red-400">₹{pending.toLocaleString('en-IN')} baaki</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  {p.status === 'unpaid' && (
                    <>
                      <button
                        onClick={() => handleMarkPaid(p.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition"
                      >
                        <CheckCircle className="w-3 h-3" /> Full Paid
                      </button>
                      <button
                        onClick={() => setPartialModal(p)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition"
                      >
                        <AlertCircle className="w-3 h-3" /> Partial Mila
                      </button>
                    </>
                  )}
                  {p.status === 'partial' && (
                    <>
                      <button
                        onClick={() => setPartialModal(p)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition"
                      >
                        <AlertCircle className="w-3 h-3" /> Aur Mila
                      </button>
                      <button
                        onClick={() => handleMarkPaid(p.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition"
                      >
                        <CheckCircle className="w-3 h-3" /> Full Paid
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Payment Modal */}
      {modal && (
        <Modal title="Add Payment" onClose={() => setModal(false)}>
          <PaymentForm
            businessId={activeBusiness?.id}
            onSave={() => { setModal(false); fetchPayments(); }}
            onClose={() => setModal(false)}
          />
        </Modal>
      )}

      {/* Partial Update Modal */}
      {partialModal && (
        <Modal title="Payment Update Karo" onClose={() => setPartialModal(null)}>
          <PartialUpdateModal
            payment={partialModal}
            onSave={() => { setPartialModal(null); fetchPayments(); }}
            onClose={() => setPartialModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}