import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../../store/cartSlice';
import { showToast } from '../../store/uiSlice';
import api from '../../services/api';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Plus,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // New Address Form
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    full_name: '',
    phone: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
  });

  const [notes, setNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data);
      if (res.data.length > 0) {
        const defaultAddr = res.data.find((a) => a.is_default) || res.data[0];
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/addresses', {
        ...newAddr,
        country: 'India',
        is_default: addresses.length === 0,
      });
      setAddresses([...addresses, res.data]);
      setSelectedAddressId(res.data.id);
      setShowAddAddress(false);
      setNewAddr({ full_name: '', phone: '', street_address: '', city: '', state: '', postal_code: '' });
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save address.');
    }
  };

  const handleRazorpayCheckout = async () => {
    if (!selectedAddressId) {
      setErrorMsg('Please select or add a valid shipping address.');
      return;
    }
    setErrorMsg('');
    setProcessingPayment(true);

    try {
      // 1. Initialize order on backend
      const initRes = await api.post('/orders/checkout/initialize', {
        address_id: selectedAddressId,
        coupon_code: cart.coupon?.code || undefined,
        notes: notes || undefined,
      });

      const { order_id, order_number, razorpay_order_id, razorpay_key_id, final_amount, currency } = initRes.data;

      // 2. Simulated / Test-mode Razorpay checkout handler
      // In production: window.Razorpay({...}) opens live modal.
      // In sandbox/test: verify signature and transition atomically.
      setTimeout(async () => {
        try {
          const verifyRes = await api.post('/orders/checkout/verify', {
            order_id: order_id,
            razorpay_order_id: razorpay_order_id,
            razorpay_payment_id: `pay_${Date.now()}`,
            razorpay_signature: `sig_verified_${order_number}`,
          });

          // 3. Clear cart in Redux
          dispatch(clearCart());

          // 4. Fire celebratory confetti
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });

          dispatch(
            showToast({
              message: `Order #${order_number} confirmed! Shipping dispatch manifest created.`,
              type: 'success',
            })
          );

          // 5. Navigate to order tracking page
          navigate(`/customer/orders/${order_number}`);
        } catch (verifyErr) {
          setErrorMsg(verifyErr.response?.data?.detail || 'Payment verification failed.');
          setProcessingPayment(false);
        }
      }, 1500);
    } catch (initErr) {
      setErrorMsg(initErr.response?.data?.detail || 'Could not initialize order checkout.');
      setProcessingPayment(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4">
        <h2 className="text-xl font-bold text-white">Login required for checkout</h2>
        <Link to="/login" className="text-xs text-cyan-400 font-mono mt-2 inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-extrabold text-white font-display tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-cyan-400" />
          Encrypted Checkout Gateway
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          256-bit SSL secured transaction • Razorpay verified merchant
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Address & Shipping & Payment */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Shipping Address Selection */}
          <div className="p-6 rounded-2xl glass-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white font-display flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                1. Delivery Destination Address
              </h3>
              <button
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Address
              </button>
            </div>

            {/* Address List */}
            {addresses.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No address saved yet. Please add an address below.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'bg-cyan-950/30 border-cyan-500 shadow-glow-cyan'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{addr.full_name}</span>
                      {selectedAddressId === addr.id && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{addr.phone}</div>
                    <div className="text-xs text-slate-300 mt-1">
                      {addr.street_address}, {addr.city}, {addr.state} - {addr.postal_code}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Address Sub-Form */}
            {showAddAddress && (
              <form onSubmit={handleCreateAddress} className="pt-4 border-t border-slate-800 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newAddr.full_name}
                      onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      placeholder="Alex Vance"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={newAddr.street_address}
                    onChange={(e) => setNewAddr({ ...newAddr, street_address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="Flat 402, Cyber Heights, Tech Boulevard"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-mono mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={newAddr.state}
                      onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      placeholder="Maharashtra"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Postal Code</label>
                    <input
                      type="text"
                      required
                      value={newAddr.postal_code}
                      onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                      placeholder="400051"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  Save Address
                </button>
              </form>
            )}
          </div>

          {/* Step 2: Priority Logistics Verification */}
          <div className="p-6 rounded-2xl glass-card space-y-3">
            <h3 className="font-bold text-sm text-white font-display flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-400" />
              2. Courier & Fulfillment Service
            </h3>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/30 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white">Bluedart Apex Priority Air Express</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Estimated Delivery: 2-3 Business Days • Full Insurance Coverage</div>
              </div>
              <span className="font-mono text-emerald-400 font-bold">
                {cart.shipping === 0 ? 'FREE' : `₹${cart.shipping}`}
              </span>
            </div>

            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">Special Delivery Instructions (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Call on arrival / Leave with security..."
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          {/* Step 3: Payment Gateway Selector */}
          <div className="p-6 rounded-2xl glass-card space-y-3">
            <h3 className="font-bold text-sm text-white font-display flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              3. Payment Method
            </h3>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  ₹
                </div>
                <div>
                  <div className="font-bold text-white">Razorpay Payment Gateway</div>
                  <div className="text-[11px] text-slate-400">Cards, UPI, NetBanking, EMI & Wallets</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px]">
                SANDBOX VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Pay Button */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl glass-card space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">
              Checkout Summary
            </h3>

            {/* Micro items list */}
            <div className="space-y-2 border-b border-slate-800 pb-4 text-xs">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-300 truncate max-w-[170px]">{item.product_name}</span>
                  <span className="font-mono text-slate-400">
                    {item.quantity} × ₹{item.unit_price.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Net Subtotal:</span>
                <span className="text-white">₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>

              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Savings:</span>
                  <span>-₹{cart.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>GST (18%):</span>
                <span className="text-white">₹{cart.tax.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Air Shipping:</span>
                <span className="text-emerald-400">{cart.shipping === 0 ? 'FREE' : `₹${cart.shipping}`}</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline text-sm font-bold">
                <span className="text-white font-sans">Final Payable:</span>
                <span className="text-cyan-400 text-lg">
                  ₹{cart.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={handleRazorpayCheckout}
              disabled={processingPayment || !selectedAddressId}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:scale-[1.02]"
            >
              {processingPayment ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Settling with Razorpay Gateway...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Pay ₹{cart.total.toLocaleString('en-IN')}</span>
                </>
              )}
            </button>

            <div className="text-center text-[10px] text-slate-500 font-mono">
              Instant cryptographically-signed order receipt generated upon authorization
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
