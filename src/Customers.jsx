import { useEffect, useState } from 'react';
import { useBusiness } from './BusinessContext';
import { useAuth } from './AuthContext';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from './api';
import { Plus, Search, Edit2, Trash2, Phone, User, X, CheckCircle, XCircle, MessageCircle } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60">
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

function CustomerForm({ initial, onSave, onClose, businessId }) {
  const [form, setForm] = useState(
    initial || { name: '', phone: '', email: '', address: '', business: businessId }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial?.id) {
        await updateCustomer(initial.id, form);
      } else {
        await createCustomer({ ...form, business: businessId });
      }
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { key: 'name', label: 'Full Name', required: true, placeholder: 'Customer ka naam' },
        { key: 'phone', label: 'Phone / WhatsApp Number *', required: true, placeholder: '10 digit number (WhatsApp reminder ke liye)' },
        { key: 'email', label: 'Email', type: 'email', placeholder: 'optional' },
        { key: 'address', label: 'Address', textarea: true },
      ].map(({ key, label, required, type, textarea, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>
          {textarea ? (
            <textarea
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
              rows={3}
              placeholder={placeholder}
            />
          ) : (
            <input
              type={type || 'text'}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required={required}
              placeholder={placeholder}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          )}
        </div>
      ))}
      <div className="bg-green-950/30 border border-green-800/30 rounded-xl px-4 py-3">
        <p className="text-green-400 text-xs flex items-center gap-1.5">
          <MessageCircle className="w-3 h-3" />
          Phone number se WhatsApp payment reminder bheja jaayega
        </p>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 border border-gray-700 text-gray-300 py-3 rounded-xl text-sm hover:bg-gray-800 transition">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition">
          {loading ? 'Saving...' : (initial?.id ? 'Update' : 'Add Customer')}
        </button>
      </div>
    </form>
  );
}

export default function Customers() {
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = () => {
    if (!activeBusiness) return;
    setLoading(true);
    getCustomers({ business_id: activeBusiness.id, search })
      .then((r) => setCustomers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, [activeBusiness, search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    await deleteCustomer(id);
    fetchCustomers();
  };

  // WhatsApp reminder message with business owner info + UPI payment link
  const handleWhatsAppReminder = (customer) => {
    if (!customer.phone) {
      alert('Is customer ka phone number nahi hai. Edit karke add karo.');
      return;
    }

    const businessName = activeBusiness?.name || 'Business';
    const businessType = activeBusiness?.type || '';
    const ownerName = user?.first_name || user?.username || 'Owner';
    const upiId = activeBusiness?.upi_id || '';

    // Active subscription check
    const sub = customer.active_subscription;
    const planName = sub?.plan_name || 'Subscription';
    const daysLeft = sub?.days_remaining;
    const endDate = sub?.end_date;

    // UPI payment link (amount auto-fill)
    const upiLink = upiId
      ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&cu=INR&tn=${encodeURIComponent(`${planName} renewal`)}`
      : '';

    const msg =
      `Namaste ${customer.name} ji! 🙏\n\n` +
      `Aapko ${businessName} (${businessType}) ki taraf se payment reminder bheja ja raha hai.\n\n` +
      `📋 Plan: ${planName}\n` +
      (endDate ? `📅 Expiry Date: ${endDate}\n` : '') +
      (daysLeft !== undefined ? `⏰ Bacha hua samay: ${daysLeft} din\n` : '') +
      `\nKripya payment jald karein taaki aapki service uninterrupted rahe.\n\n` +
      (upiId
        ? `💳 UPI Payment:\nUPI ID: ${upiId}\n${upiLink ? `👉 Pay Here: ${upiLink}\n` : ''}\n`
        : '') +
      `📞 Contact: ${ownerName}\n\n` +
      `Thank you! 😊`;

    const phone = customer.phone.replace(/\D/g, ''); // sirf digits
    const waPhone = phone.startsWith('91') ? phone : `91${phone}`;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const statusBadge = (sub) => {
    if (!sub) return <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">No Plan</span>;
    if (sub.status === 'active') return (
      <span className="text-xs text-green-400 bg-green-950/50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
        <CheckCircle className="w-3 h-3" /> Active · {sub.days_remaining}d left
      </span>
    );
    return (
      <span className="text-xs text-red-400 bg-red-950/50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
        <XCircle className="w-3 h-3" /> Expired
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Customers</h1>
          <p className="text-gray-500 text-sm">{customers.length} total</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16">
          <User className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No customers yet</p>
          <button onClick={() => setModal('add')} className="mt-3 text-indigo-400 text-sm hover:underline">
            Add your first customer
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 bg-indigo-900/60 rounded-full flex items-center justify-center text-indigo-300 font-bold text-sm flex-shrink-0">
                    {c.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm">{c.name}</p>
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {c.phone || 'No phone'}
                    </p>
                    <div className="mt-2">
                      {statusBadge(c.active_subscription)}
                    </div>
                    {c.active_subscription && (
                      <p className="text-gray-600 text-xs mt-1">{c.active_subscription.plan_name}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {/* WhatsApp Reminder Button */}
                  <button
                    onClick={() => handleWhatsAppReminder(c)}
                    className="flex items-center gap-1.5 text-xs bg-green-800/60 hover:bg-green-700 text-green-300 px-3 py-1.5 rounded-lg transition"
                    title="WhatsApp Payment Reminder"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Remind
                  </button>

                  <div className="flex gap-1">
                    <button onClick={() => setModal(c)} className="text-gray-500 hover:text-indigo-400 transition p-1.5 bg-gray-800 rounded-lg">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-gray-500 hover:text-red-400 transition p-1.5 bg-gray-800 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === 'add' ? 'Add Customer' : 'Edit Customer'}
          onClose={() => setModal(null)}
        >
          <CustomerForm
            initial={modal !== 'add' ? modal : null}
            businessId={activeBusiness?.id}
            onSave={() => { setModal(null); fetchCustomers(); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}