import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  User,
  ShoppingBag,
  MapPin,
  Award,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function CustomerAccount() {
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'addresses'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, addrRes] = await Promise.all([
          api.get('/orders'),
          api.get('/addresses'),
        ]);
        setOrders(ordersRes.data);
        setAddresses(addrRes.data);
      } catch (err) {
        console.error('Failed to load customer profile data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Platinum':
        return 'from-purple-500 to-indigo-500 text-purple-200 border-purple-400/40';
      case 'Gold':
        return 'from-amber-500 to-yellow-500 text-amber-200 border-amber-400/40';
      case 'Silver':
        return 'from-slate-400 to-slate-200 text-slate-100 border-slate-300/40';
      default:
        return 'from-amber-700 to-amber-600 text-amber-200 border-amber-600/40';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      {/* Profile Header Card */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-indigo-950">
            {user?.first_name?.[0] || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white font-display">
                {user?.first_name} {user?.last_name}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full bg-gradient-to-r ${getTierColor(
                  user?.customer_profile?.loyalty_tier || 'Gold'
                )} border text-[10px] font-mono font-bold uppercase tracking-wider`}
              >
                {user?.customer_profile?.loyalty_tier || 'Gold'} Member
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              {user?.email} • {user?.phone || '+91 9876543210'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6">
          <div>
            <div className="text-slate-500 uppercase text-[10px]">Lifetime Spend</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              ₹{(user?.customer_profile?.total_spent || 579998).toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="text-slate-500 uppercase text-[10px]">Total Purchases</div>
            <div className="text-base font-bold text-white mt-0.5">
              {orders.length} Orders
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'orders'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-glow-cyan'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>My Orders & Dispatch ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'addresses'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-glow-cyan'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Saved Addresses ({addresses.length})</span>
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs">
              Fetching your orders history...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center rounded-2xl glass-card p-8">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white font-display">No Orders Found</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                You haven't placed an order yet. Check out our high-performance 3D catalog!
              </p>
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-cyan-400 text-sm">
                        {o.order_number}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 font-mono text-[10px] text-slate-300">
                        {o.order_status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                      Ordered on {new Date(o.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 text-xs font-mono block">Paid Amount</span>
                    <span className="text-base font-bold font-mono text-white">
                      ₹{o.final_amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Status Timeline Bar */}
                <div className="py-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                    <span className={o.order_status !== 'CANCELLED' ? 'text-emerald-400 font-bold' : ''}>1. Confirmed</span>
                    <span className={['PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(o.order_status) ? 'text-emerald-400 font-bold' : ''}>2. Processing</span>
                    <span className={['SHIPPED', 'DELIVERED'].includes(o.order_status) ? 'text-cyan-400 font-bold' : ''}>3. In Transit</span>
                    <span className={o.order_status === 'DELIVERED' ? 'text-emerald-400 font-bold' : ''}>4. Delivered</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        o.order_status === 'DELIVERED'
                          ? 'w-full bg-emerald-400'
                          : o.order_status === 'SHIPPED'
                          ? 'w-3/4 bg-cyan-400 animate-pulse'
                          : o.order_status === 'PROCESSING' || o.order_status === 'PACKED'
                          ? 'w-1/2 bg-indigo-500'
                          : 'w-1/4 bg-emerald-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Items in order */}
                <div className="space-y-2 pt-2">
                  {o.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{item.product_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">SKU: {item.product_sku}</div>
                      </div>
                      <div className="font-mono text-right">
                        <div className="text-slate-300">Qty: {item.quantity}</div>
                        <div className="font-bold text-white">₹{item.total_price.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Courier Tracking Manifest */}
                {o.shipment?.tracking_number && (
                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-300">
                        Carrier: <strong>{o.shipment.carrier}</strong> • Airway Bill: <strong className="text-cyan-400 font-mono">{o.shipment.tracking_number}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Live GPS Connected</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ADDRESSES TAB */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="p-5 rounded-2xl glass-card space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{addr.full_name}</span>
                {addr.is_default && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px]">
                    DEFAULT
                  </span>
                )}
              </div>
              <div className="text-slate-400 font-mono">{addr.phone}</div>
              <div className="text-slate-300 leading-relaxed pt-1">
                {addr.street_address}, {addr.city}, {addr.state} - {addr.postal_code}, {addr.country}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
