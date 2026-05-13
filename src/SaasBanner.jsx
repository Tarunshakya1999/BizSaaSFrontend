import { useState, useEffect } from 'react';
import { getSaaSPlans } from './api';
import { X, Crown, QrCode, MessageCircle, Clock, AlertTriangle, Shield } from 'lucide-react';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const YOUR_WHATSAPP = '919971866919';
const YOUR_UPI_ID = 'shakyatarun32-3@okicici';
const YOUR_NAME = 'BizTrack Support';

// UPI deep link — amount auto-fill ho jaata hai UPI app mein
function makeUpiLink(amount, note) {
  return `upi://pay?pa=${YOUR_UPI_ID}&pn=BizTrack&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
}

// WhatsApp message after payment
function makeWhatsAppMsg(user, plan) {
  const msg = `Namaste! Main BizTrack ka subscription lena chahta/chahti hoon.

👤 Name: ${user?.first_name || user?.username}
📧 Email: ${user?.email || '-'}
📦 Plan: ${plan?.name} (${plan?.plan_type === 'monthly' ? 'Monthly' : 'Yearly'})
💰 Amount: ₹${plan?.price}

Main payment ka screenshot attach kar raha/rahi hoon.

📋 Payment Details:
UPI ID: ${YOUR_UPI_ID}
Amount: ₹${plan?.price}

Payment karne ke baad:
1. Is WhatsApp pe screenshot bhejein
2. Aapka plan 24 ghante mein activate ho jaayega
3. Koi problem ho toh isi number pe batayein

Thank you! 🙏`;
  return encodeURIComponent(msg);
}

// ─── QR CODE (simple UPI QR using qr-server API) ─────────────────────────────
function UpiQR({ amount, plan }) {
  const upiLink = makeUpiLink(amount, `BizTrack ${plan?.name}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`;
  return (
    <div className="flex flex-col items-center">
      <img src={qrUrl} alt="UPI QR" className="rounded-xl border-2 border-indigo-600 w-44 h-44" />
      <p className="text-gray-400 text-xs mt-2">QR Scan karo ya UPI ID use karo</p>
      <div className="mt-2 bg-gray-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
        <QrCode className="w-3 h-3 text-indigo-400" />
        <span className="text-indigo-300 text-xs font-mono">{YOUR_UPI_ID}</span>
      </div>
    </div>
  );
}

// ─── SUBSCRIPTION MODAL ───────────────────────────────────────────────────────
function SubscribeModal({ onClose, user }) {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSaaSPlans().then((r) => {
      setPlans(r.data);
      setSelected(r.data[0] || null);
    }).finally(() => setLoading(false));
  }, []);

  const handleUpiPay = () => {
    if (!selected) return;
    const link = makeUpiLink(selected.price, `BizTrack ${selected.name}`);
    window.open(link, '_blank');
  };

  const handleWhatsApp = () => {
    if (!selected) return;
    const msg = makeWhatsAppMsg(user, selected);
    window.open(`https://wa.me/${YOUR_WHATSAPP}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-0 md:p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-bold text-lg">Subscribe to BizTrack</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Plan Selection */}
              <div>
                <p className="text-gray-400 text-sm font-medium mb-3">Plan chuno:</p>
                <div className="grid grid-cols-2 gap-3">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelected(plan)}
                      className={`p-4 rounded-2xl border-2 text-left transition ${
                        selected?.id === plan.id
                          ? 'border-indigo-500 bg-indigo-950/40'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-bold text-sm">{plan.name}</p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {plan.plan_type === 'monthly' ? '30 days' : '365 days'}
                          </p>
                        </div>
                        {plan.plan_type === 'yearly' && (
                          <span className="text-xs bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded-full">
                            Save 30%
                          </span>
                        )}
                      </div>
                      <p className="text-indigo-400 font-bold text-xl mt-2">₹{plan.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Code */}
              {selected && (
                <div className="bg-gray-800/60 rounded-2xl p-5">
                  <UpiQR amount={selected.price} plan={selected} />
                </div>
              )}

              {/* Payment Buttons */}
              {selected && (
                <div className="space-y-3">
                  <button
                    onClick={handleUpiPay}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <QrCode className="w-4 h-4" />
                    ₹{selected.price} — UPI Se Pay Karo
                  </button>

                  <button
                    onClick={handleWhatsApp}
                    className="w-full bg-green-700 hover:bg-green-600 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Payment ke baad WhatsApp Karo
                  </button>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4 text-sm text-blue-300 space-y-1.5">
                <p className="font-semibold text-blue-200 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Payment ke baad kya karna hai:
                </p>
                <p>1. UPI se ₹{selected?.price || '...'} pay karo</p>
                <p>2. Screenshot lo</p>
                <p>3. "WhatsApp Karo" button se screenshot bhejo</p>
                <p>4. 24 ghante mein plan active ho jaayega ✅</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TRIAL BANNER ─────────────────────────────────────────────────────────────
export function TrialBanner({ saasStatus, user }) {
  const [showModal, setShowModal] = useState(false);
  if (!saasStatus) return null;

  const { status, trial_days_remaining, subscription_days_remaining } = saasStatus;

  // Suspended ya expired — hard block banner
  if (status === 'suspended' || status === 'expired') {
    return (
      <>
        <div className="bg-red-950 border-b border-red-800 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">
              {status === 'suspended'
                ? 'Aapka account suspend kar diya gaya hai. Support se contact karo.'
                : 'Aapka trial/subscription expire ho gaya hai. Subscribe karo to continue.'}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex-shrink-0 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
          >
            Subscribe Karo
          </button>
        </div>
        {showModal && <SubscribeModal onClose={() => setShowModal(false)} user={user} />}
      </>
    );
  }

  // Trial — warning banner
  if (status === 'trial') {
    const urgent = trial_days_remaining <= 3;
    return (
      <>
        <div className={`border-b px-4 py-2.5 flex items-center justify-between gap-3 ${
          urgent ? 'bg-red-950/60 border-red-800' : 'bg-yellow-950/40 border-yellow-800/50'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <Clock className={`w-4 h-4 flex-shrink-0 ${urgent ? 'text-red-400' : 'text-yellow-400'}`} />
            <p className={`text-sm ${urgent ? 'text-red-300' : 'text-yellow-300'}`}>
              <span className="font-bold">{trial_days_remaining} din</span> bacha hai free trial mein
              {urgent ? ' — Jaldi subscribe karo!' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-lg transition ${
              urgent
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-yellow-600 hover:bg-yellow-500 text-white'
            }`}
          >
            Subscribe Karo
          </button>
        </div>
        {showModal && <SubscribeModal onClose={() => setShowModal(false)} user={user} />}
      </>
    );
  }

  // Active — subscription expiry warning (last 5 days)
  if (status === 'active' && subscription_days_remaining <= 5) {
    return (
      <>
        <div className="bg-orange-950/40 border-b border-orange-800/50 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-orange-400" />
            <p className="text-orange-300 text-sm">
              Subscription <span className="font-bold">{subscription_days_remaining} din</span> mein expire hogi — Renew karo!
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex-shrink-0 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
          >
            Renew Karo
          </button>
        </div>
        {showModal && <SubscribeModal onClose={() => setShowModal(false)} user={user} />}
      </>
    );
  }

  return null;
}

export { SubscribeModal };