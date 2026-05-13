import { useState } from 'react';
import { useBusiness } from './Businesscontext';
import { createBusiness, updateBusiness, deleteBusiness } from './Api';
import { Plus, Edit2, Trash2, Building2, X, QrCode } from 'lucide-react';

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

function BizForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { name: '', type: 'other', address: '', phone: '', upi_id: '' });
  const [loading, setLoading] = useState(false);

  const types = ['gym', 'salon', 'coaching', 'pg', 'tiffin', 'other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial?.id) await updateBusiness(initial.id, form);
      else await createBusiness(form);
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Business Name *</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          required className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Business Type</label>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
          {types.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Phone</label>
        <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Your contact number"
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      {/* UPI ID — important for WhatsApp reminder payment link */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">
          UPI ID <span className="text-indigo-400">(WhatsApp reminder mein payment link ke liye)</span>
        </label>
        <div className="relative">
          <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={form.upi_id}
            onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
            placeholder="yourname@upi / phone@okicici"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <p className="text-gray-600 text-xs mt-1.5">
          Ye UPI ID customer ke WhatsApp reminder mein payment link mein jayegi
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Address</label>
        <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none" rows={3} />
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

export default function Settings() {
  const { businesses, activeBusiness, switchBusiness, refreshBusinesses } = useBusiness();
  const [modal, setModal] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('Delete this business? All data will be lost.')) return;
    await deleteBusiness(id);
    refreshBusinesses();
  };

  const typeColors = {
    gym: 'bg-blue-950/50 text-blue-400',
    salon: 'bg-pink-950/50 text-pink-400',
    coaching: 'bg-purple-950/50 text-purple-400',
    pg: 'bg-orange-950/50 text-orange-400',
    tiffin: 'bg-green-950/50 text-green-400',
    other: 'bg-gray-800 text-gray-400',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your businesses</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Your Businesses</h2>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
            <Plus className="w-4 h-4" /> Add Business
          </button>
        </div>

        {businesses.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
            <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No businesses yet</p>
            <button onClick={() => setModal('add')} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
              Create your first business
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {businesses.map((b) => (
              <div key={b.id} className={`bg-gray-900 border rounded-2xl p-4 ${activeBusiness?.id === b.id ? 'border-indigo-600' : 'border-gray-800'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 bg-indigo-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-medium">{b.name}</p>
                        {activeBusiness?.id === b.id && (
                          <span className="text-xs bg-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${typeColors[b.type]}`}>
                        {b.type.charAt(0).toUpperCase() + b.type.slice(1)}
                      </span>
                      {b.phone && <p className="text-gray-500 text-xs mt-1">📞 {b.phone}</p>}
                      {b.upi_id && (
                        <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                          <QrCode className="w-3 h-3 text-indigo-500" /> {b.upi_id}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {activeBusiness?.id !== b.id && (
                      <button onClick={() => switchBusiness(b)}
                        className="text-xs bg-indigo-900/30 text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-900/50 transition">
                        Switch
                      </button>
                    )}
                    <button onClick={() => setModal(b)} className="text-gray-500 hover:text-indigo-400 transition p-1">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="text-gray-500 hover:text-red-400 transition p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'New Business' : 'Edit Business'} onClose={() => setModal(null)}>
          <BizForm
            initial={modal !== 'add' ? modal : null}
            onSave={() => { setModal(null); refreshBusinesses(); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}