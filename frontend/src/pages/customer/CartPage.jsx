import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCart, setCoupon, removeCoupon } from '../../store/cartSlice';
import { showToast } from '../../store/uiSlice';
import api from '../../services/api';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/cart');
      dispatch(setCart(res.data));
    } catch (err) {
      console.error('Failed to load cart', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const handleUpdateQuantity = async (itemId, newQty) => {
    if (newQty <= 0) return;
    try {
      const res = await api.put(`/cart/items/${itemId}`, { quantity: newQty });
      dispatch(setCart(res.data));
    } catch (err) {
      alert(err.response?.data?.detail || 'Quantity update failed.');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const res = await api.delete(`/cart/items/${itemId}`);
      dispatch(setCart(res.data));
      dispatch(showToast({ message: 'Item removed from cart.', type: 'info' }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Removal failed.');
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponFeedback(null);

    try {
      const res = await api.post('/cart/apply-coupon', {
        code: couponCode.trim(),
        cart_total: cart.subtotal,
      });

      if (res.data.is_valid) {
        dispatch(setCoupon(res.data));
        setCouponFeedback({ success: true, message: res.data.message });
      } else {
        setCouponFeedback({ success: false, message: res.data.message });
      }
    } catch (err) {
      setCouponFeedback({ success: false, message: 'Invalid or expired coupon.' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveAppliedCoupon = () => {
    dispatch(removeCoupon());
    setCouponCode('');
    setCouponFeedback(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white font-display">Sign In to View Cart</h2>
        <p className="text-xs text-slate-400">
          Your saved items and exclusive discount coupons will be restored upon login.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold text-xs shadow-lg"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 font-mono text-xs flex flex-col items-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span>Restoring your cart...</span>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-slate-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white font-display">Your Cart is Empty</h2>
        <p className="text-xs text-slate-400">
          Explore our next-gen 3D tech catalog and discover ultra-spec hardware rigs.
        </p>
        <Link
          to="/store"
          className="inline-block px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950/40"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-extrabold text-white font-display tracking-tight flex items-center gap-3">
          <ShoppingBag className="w-7 h-7 text-cyan-400" />
          Shopping Cart ({cart.items.length} items)
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl glass-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all"
            >
              <div className="flex items-center gap-4">
                <img
                  src={
                    item.product_image ||
                    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={item.product_name}
                  className="w-20 h-20 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                />
                <div>
                  <h3 className="font-bold text-sm text-white">{item.product_name}</h3>
                  <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                    SKU: {item.product_sku}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    Unit: ₹{item.unit_price.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                {/* Quantity Controls */}
                <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-xs text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    className="p-1.5 text-slate-400 hover:text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-base text-white">
                    ₹{item.total_price.toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                  title="Remove from Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary & Coupon */}
        <div className="lg:col-span-4 space-y-6">
          {/* Coupon Input Box */}
          <div className="p-5 rounded-2xl glass-card space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-cyan-400" />
              Apply Discount Coupon
            </h3>

            {cart.coupon ? (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300">
                <div>
                  <strong>{cart.coupon.code}</strong> Applied (-₹{cart.coupon.discount_amount.toLocaleString('en-IN')})
                </div>
                <button onClick={handleRemoveAppliedCoupon} className="text-emerald-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TECH10, PROMO5000"
                    className="flex-1 px-3 py-2 rounded-xl glass-input text-xs font-mono uppercase"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-semibold text-cyan-400 transition-colors disabled:opacity-50"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>

                {couponFeedback && (
                  <p
                    className={`text-[11px] ${
                      couponFeedback.success ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {couponFeedback.message}
                  </p>
                )}
              </form>
            )}

            {/* Quick demo coupon suggestion */}
            <div className="pt-2 text-[10px] text-slate-500 font-mono">
              Available promo codes: <span className="text-cyan-400 cursor-pointer" onClick={() => setCouponCode('TECH10')}>TECH10</span> (10% off), <span className="text-cyan-400 cursor-pointer" onClick={() => setCouponCode('PROMO5000')}>PROMO5000</span> (₹5,000 off)
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-6 rounded-2xl glass-card space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">
              Order Breakdown
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal (Net Price):</span>
                <span className="text-white">₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>

              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Discount:</span>
                  <span>-₹{cart.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>GST (18% Applicable):</span>
                <span className="text-white">₹{cart.tax.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Priority Insured Shipping:</span>
                <span className={cart.shipping === 0 ? 'text-emerald-400' : 'text-white'}>
                  {cart.shipping === 0 ? 'FREE' : `₹${cart.shipping}`}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline text-sm font-bold">
                <span className="text-white font-sans">Final Payable:</span>
                <span className="text-cyan-400 text-lg">
                  ₹{cart.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-xl shadow-indigo-950 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>Proceed to Secure Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
