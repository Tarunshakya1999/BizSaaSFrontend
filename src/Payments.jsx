import { useEffect, useState } from 'react';
import { useBusiness } from './Businesscontext';
import { getPayments, createPayment, markPaid, getSubscriptions } from './api';
import api from './api';
import { Plus, X, CheckCircle, IndianRupee, AlertCircle, Edit2, Trash2 } from 'lucide-react';

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

// ─── ADD / EDIT PAYMENT FORM ─────────────────────────────────────────────────
function PaymentForm({ onSave, onClose, businessId, initial }) {
  const isEdit = !!initial;

  const [form, setForm] = useState({
    subscription: initial?.subscription || '',
    amount: initial?.amount || '',
    paid_amount: '',
    due_date: initial?.due_date || '',
    method: initial?.method || 'cash',
    notes: initial?.notes || '',
    status: initial?.status || 'unpaid',
  });
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSubscriptions({ business_id: businessId }).then((r) => setSubs(r.data));
  }, [businessId]);

  const handleSubChange = (subId) => {
    const sub = subs.find((s) => s.id === parseInt(subId));
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

  const remainingAmount = () => {
    const total = parseFloat(form.amount) || 0;
    const paid = parseFloat(form.paid_amount) || 0;
    return Math.max(0, total - paid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        subscription: form.subscription,
        amount: form.amount,
        due_date: form.due_date,
        method: form.method,
        notes: form.notes,
        status: form.status,
      };

      if (form.status === 'partial' && form.paid_amount) {
        submitData.notes = `Received: ₹${form.paid_amount} | Remaining: ₹${remainingAmount()}${form.notes ? ' | ' + form.notes : ''}`;
      }
      if (form.status === 'paid') {
        submitData.payment_date = new Date().toISOString().split('T')[0];
      }

      if (isEdit) {
        await api.put(`/payments/${initial.id}/`, submitData);
      } else {
        await createPayment(submitData);
      }
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
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
      )}

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Total Amount (₹) *</label>
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value, paid_amount: '', status: 'unpaid' })}
          required
          placeholder="Full plan amount"
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {form.amount && !isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Amount Received Now (₹)
            <span className="text-gray-600 font-normal ml-1">— leave empty if not received</span>
          </label>
          <input
            type="number"
            value={form.paid_amount}
            onChange={(e) => handlePaidAmountChange(e.target.value)}
            placeholder="0"
            max={form.amount}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
          />
          {form.paid_amount !== '' && (
            <div className={`mt-2 px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
              form.status === 'paid'
                ? 'bg-green-950/50 border border-green-800/40 text-green-400'
                : form.status === 'partial'
                ? 'bg-yellow-950/50 border border-yellow-800/40 text-yellow-400'
                : 'bg-red-950/50 border border-red-800/40 text-red-400'
            }`}>
              <span>
                {form.status === 'paid' && '✅ Full payment received'}
                {form.status === 'partial' && `⚠️ Partial — ₹${remainingAmount()} remaining`}
                {form.status === 'unpaid' && '❌ No payment'}
              </span>
              <span className="capitalize bg-black/20 px-2 py-0.5 rounded-full">{form.status}</span>
            </div>
          )}
        </div>
      )}

      {isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Payment Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      )}

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
          {loading ? 'Saving...' : isEdit ? 'Update Payment' : 'Add Payment'}
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

  // Supports both old Hindi format (Baaki:) and new English format (Remaining:)
  const getAlreadyReceived = () => {
    if (!payment.notes) return 0;
    const match = payment.notes.match(/Received: ₹([\d.]+)/);
    if (match) return parseFloat(match[1]);
    return 0;
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
        ? `Full payment received | Total: ₹${totalAmount}`
        : `Received: ₹${newTotal} | Remaining: ₹${stillPending}`;

      if (isFullyPaid) {
        await markPaid(payment.id, method);
      } else {
        await api.patch(`/payments/${payment.id}/`, {
          status: newStatus,
          method: method,
          notes: newNotes,
        });
      }
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-400">
          <span>Total Amount:</span>
          <span className="text-white font-medium">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Already Received:</span>
          <span className="text-yellow-400 font-medium">₹{alreadyReceived.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Remaining:</span>
          <span className="text-red-400 font-medium">₹{(totalAmount - alreadyReceived).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Amount Received Now (₹) *</label>
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

      {additionalAmount && (
        <div className={`px-3 py-2 rounded-xl text-xs font-medium ${
          isFullyPaid
            ? 'bg-green-950/50 border border-green-800/40 text-green-400'
            : 'bg-yellow-950/50 border border-yellow-800/40 text-yellow-400'
        }`}>
          {isFullyPaid
            ? '✅ Full payment will be completed!'
            : `⚠️ ₹${stillPending.toLocaleString('en-IN')} will still be remaining`}
        </div>
      )}

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

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

// Supports both formats: "Received: ₹500" and fallback calculation
const getReceivedAmount = (p) => {
  if (p.status === 'paid') return parseFloat(p.amount);
  if (p.status === 'partial') {
    // Try English format first
    const matchEn = p.notes?.match(/Received: ₹([\d.]+)/);
    if (matchEn) return parseFloat(matchEn[1]);
    // Fallback: 0 received
    return 0;
  }
  return 0;
};

// Supports both formats: "Remaining: ₹1800" and old "Baaki: ₹1800"
// If neither matches, calculate from total - received
const getRemainingAmount = (p) => {
  if (p.status === 'unpaid') return parseFloat(p.amount);
  if (p.status === 'partial') {
    // Try new English format
    const matchEn = p.notes?.match(/Remaining: ₹([\d.]+)/);
    if (matchEn) return parseFloat(matchEn[1]);

    // Try old Hindi format
    const matchHi = p.notes?.match(/Baaki: ₹([\d.]+)/);
    if (matchHi) return parseFloat(matchHi[1]);

    // Last fallback: calculate directly
    const received = getReceivedAmount(p);
    return Math.max(0, parseFloat(p.amount) - received);
  }
  return 0;
};

// ─── MAIN PAYMENTS PAGE ───────────────────────────────────────────────────────
export default function Payments() {
  const { activeBusiness } = useBusiness();
  const [payments, setPayments] = useState([]);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [partialModal, setPartialModal] = useState(null);
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

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment record?')) return;
    await api.delete(`/payments/${id}/`);
    fetchPayments();
  };

  // ─── Summary ───────────────────────────────────────────────────────────────
  const totalCollected = payments.reduce((s, p) => {
    if (p.status === 'paid') return s + parseFloat(p.amount);
    if (p.status === 'partial') return s + getReceivedAmount(p);
    return s;
  }, 0);

  const totalPending = payments.reduce((s, p) =>
    s + (p.status === 'unpaid' ? parseFloat(p.amount) : 0), 0);

  const totalPartialPending = payments.reduce((s, p) =>
    p.status === 'partial' ? s + getRemainingAmount(p) : s, 0);

  const partialCount = payments.filter(p => p.status === 'partial').length;

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
            <p className="text-yellow-400 text-xs font-medium uppercase tracking-wide">Partial Remaining</p>
            <p className="text-2xl font-bold text-white mt-1">₹{totalPartialPending.toLocaleString('en-IN')}</p>
            <p className="text-yellow-600 text-xs mt-1">Amount still due from partial payments</p>
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
            {f === 'partial' && partialCount > 0 && (
              <span className="ml-1.5 bg-yellow-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {partialCount}
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
            const remaining = getRemainingAmount(p);
            const total = parseFloat(p.amount);
            const progressPct = total > 0 ? Math.min((received / total) * 100, 100) : 0;

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
                    <p className="text-gray-500 text-xs mt-0.5">
                      {p.plan_name} · Due: {p.due_date}
                    </p>
                    {p.payment_date && (
                      <p className="text-gray-600 text-xs">
                        Paid: {p.payment_date} via {p.method?.toUpperCase()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-white font-bold">₹{total.toLocaleString('en-IN')}</p>
                    {p.status === 'partial' && (
                      <p className="text-yellow-400 text-xs">₹{received.toLocaleString('en-IN')} received</p>
                    )}
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditModal(p)}
                        className="p-1.5 text-gray-500 hover:text-indigo-400 bg-gray-800 rounded-lg transition">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 bg-gray-800 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Partial progress bar — sirf tab dikhao jab partial ho */}
                {p.status === 'partial' && (
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-yellow-400">
                        ₹{received.toLocaleString('en-IN')} received
                      </span>
                      {/* Remaining: sirf tab dikhao jab > 0 ho */}
                      {remaining > 0 ? (
                        <span className="text-red-400">
                          ₹{remaining.toLocaleString('en-IN')} remaining
                        </span>
                      ) : (
                        <span className="text-green-400">
                          Fully received ✓
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  {p.status === 'unpaid' && (
                    <>
                      <button onClick={() => handleMarkPaid(p.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition">
                        <CheckCircle className="w-3 h-3" /> Mark Full Paid
                      </button>
                      <button onClick={() => setPartialModal(p)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition">
                        <AlertCircle className="w-3 h-3" /> Partial Received
                      </button>
                    </>
                  )}
                  {p.status === 'partial' && (
                    <>
                      <button onClick={() => setPartialModal(p)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition">
                        <AlertCircle className="w-3 h-3" /> Add More Payment
                      </button>
                      <button onClick={() => handleMarkPaid(p.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition">
                        <CheckCircle className="w-3 h-3" /> Mark Full Paid
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title="Add Payment" onClose={() => setModal(false)}>
          <PaymentForm
            businessId={activeBusiness?.id}
            onSave={() => { setModal(false); fetchPayments(); }}
            onClose={() => setModal(false)}
          />
        </Modal>
      )}

      {editModal && (
        <Modal title="Edit Payment" onClose={() => setEditModal(null)}>
          <PaymentForm
            initial={editModal}
            businessId={activeBusiness?.id}
            onSave={() => { setEditModal(null); fetchPayments(); }}
            onClose={() => setEditModal(null)}
          />
        </Modal>
      )}

      {partialModal && (
        <Modal title="Update Partial Payment" onClose={() => setPartialModal(null)}>
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