import { useEffect, useState } from 'react';
import { useBusiness } from './BusinessContext';
import { getPlans, createPlan, updatePlan, deletePlan } from './api';
import { Plus, X, Edit2, Trash2, Tag } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-800 rounded-t-2xl md:rounded-2xl w-full md:max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function PlanForm({ initial, onSave, onClose, businessId }) {
  const [form, setForm] = useState(initial || { name: '', duration_days: 30, price: '', business: businessId });
  const [loading, setLoading] = useState(false);

  const presets = [{ label: 'Weekly', days: 7 }, { label: 'Monthly', days: 30 }, { label: 'Quarterly', days: 90 }, { label: 'Yearly', days: 365 }];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial?.id) await updatePlan(initial.id, form);
      else await createPlan({ ...form, business: businessId });
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Plan Name *</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          required placeholder="e.g. Monthly Gold Plan"
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Duration</label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {presets.map((p) => (
            <button key={p.days} type="button" onClick={() => setForm({ ...form, duration_days: p.days })}
              className={`py-2 rounded-lg text-xs font-medium transition ${form.duration_days === p.days ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) })}
          required min="1"
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
          placeholder="Or enter custom days" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Price (₹) *</label>
        <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
          required step="0.01"
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 border border-gray-700 text-gray-300 py-3 rounded-xl text-sm hover:bg-gray-800 transition">Cancel</button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition">
          {loading ? 'Saving...' : (initial?.id ? 'Update Plan' : 'Create Plan')}
        </button>
      </div>
    </form>
  );
}

export default function Plans() {
  const { activeBusiness } = useBusiness();
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlans = () => {
    if (!activeBusiness) return;
    setLoading(true);
    getPlans(activeBusiness.id).then((r) => setPlans(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlans(); }, [activeBusiness]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this plan?')) return;
    await deletePlan(id);
    fetchPlans();
  };

  const durationLabel = (days) => {
    if (days === 7) return 'Weekly';
    if (days === 30) return 'Monthly';
    if (days === 90) return 'Quarterly';
    if (days === 365) return 'Yearly';
    return `${days} days`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Plans</h1>
          <p className="text-gray-500 text-sm">{plans.length} plans</p>
        </div>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-gray-900 rounded-2xl h-24 animate-pulse" />)}</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16">
          <Tag className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No plans yet</p>
          <button onClick={() => setModal('add')} className="mt-3 text-indigo-400 text-sm hover:underline">
            Create your first plan
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-semibold">{p.name}</p>
                  <p className="text-gray-500 text-sm mt-1">{durationLabel(p.duration_days)}</p>
                </div>
                <p className="text-2xl font-bold text-indigo-400">₹{parseFloat(p.price).toLocaleString('en-IN')}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setModal(p)} className="flex-1 flex items-center justify-center gap-2 border border-gray-700 text-gray-300 py-2 rounded-xl text-xs hover:bg-gray-800 transition">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleDelete(p.id)} className="flex-1 flex items-center justify-center gap-2 border border-red-900/50 text-red-400 py-2 rounded-xl text-xs hover:bg-red-950/30 transition">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'New Plan' : 'Edit Plan'} onClose={() => setModal(null)}>
          <PlanForm
            initial={modal !== 'add' ? modal : null}
            businessId={activeBusiness?.id}
            onSave={() => { setModal(null); fetchPlans(); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}