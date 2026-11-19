import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  ArrowLeft,
  Package,
  Calendar,
  ShieldCheck
} from 'lucide-react';

export default function OrderDetailPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const res = await api.get(`/orders/${orderNumber}`);
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to load order details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 font-mono text-xs flex flex-col items-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span>Tracking order #{orderNumber}...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4">
        <h2 className="text-xl font-bold text-white font-display">Order Not Found</h2>
        <Link to="/customer/account" className="text-xs text-cyan-400 font-mono mt-2 inline-block">
          ← Return to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <Link
            to="/customer/account"
            className="text-xs text-slate-400 hover:text-cyan-400 font-mono flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Account
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight flex items-center gap-3">
            <Package className="w-7 h-7 text-cyan-400" />
            Order #{order.order_number}
          </h1>
          <span className="text-xs text-slate-400 font-mono mt-0.5 block">
            Placed on {new Date(order.created_at).toLocaleString()}
          </span>
        </div>

        <div className="text-right">
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 font-mono text-xs font-bold text-cyan-400 uppercase">
            {order.order_status}
          </span>
        </div>
      </div>

      {/* Live Timeline Tracker */}
      <div className="p-6 rounded-2xl glass-card space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-2">
          <Truck className="w-4 h-4 text-cyan-400" />
          Live Fulfillment & Dispatch Status
        </h3>

        <div className="py-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className={order.order_status !== 'CANCELLED' ? 'text-emerald-400 font-bold' : ''}>Confirmed</span>
            <span className={['PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(order.order_status) ? 'text-emerald-400 font-bold' : ''}>Processing</span>
            <span className={['SHIPPED', 'DELIVERED'].includes(order.order_status) ? 'text-cyan-400 font-bold' : ''}>In Transit</span>
            <span className={order.order_status === 'DELIVERED' ? 'text-emerald-400 font-bold' : ''}>Delivered</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 ${
                order.order_status === 'DELIVERED'
                  ? 'w-full bg-emerald-400'
                  : order.order_status === 'SHIPPED'
                  ? 'w-3/4 bg-cyan-400 animate-pulse'
                  : order.order_status === 'PROCESSING' || order.order_status === 'PACKED'
                  ? 'w-1/2 bg-indigo-500'
                  : 'w-1/4 bg-emerald-400'
              }`}
            />
          </div>
        </div>

        {order.shipment?.tracking_number && (
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-white">Courier: {order.shipment.carrier}</div>
              <div className="text-slate-400 font-mono mt-0.5">
                Tracking Airway Bill: <strong className="text-cyan-400">{order.shipment.tracking_number}</strong>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px]">
              PRIORITY AIR
            </span>
          </div>
        )}
      </div>

      {/* Items & Shipping Address Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="p-6 rounded-2xl glass-card space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">
            Items in Shipment ({order.items?.length || 0})
          </h3>
          <div className="space-y-2.5">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{item.product_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">SKU: {item.product_sku}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-slate-400">{item.quantity} × ₹{item.unit_price.toLocaleString('en-IN')}</div>
                  <div className="font-bold text-white">₹{item.total_price.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Destination & Payment Summary */}
        <div className="space-y-6">
          {order.shipping_address && (
            <div className="p-6 rounded-2xl glass-card space-y-2 text-xs">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Shipping Destination
              </h3>
              <div className="font-bold text-white text-sm">{order.shipping_address.full_name}</div>
              <div className="text-slate-400 font-mono">{order.shipping_address.phone}</div>
              <div className="text-slate-300">
                {order.shipping_address.street_address}, {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}
              </div>
            </div>
          )}

          {/* Payment receipt */}
          <div className="p-6 rounded-2xl glass-card space-y-2 text-xs font-mono">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 font-sans">
              Financial Settlement
            </h3>
            <div className="flex justify-between text-slate-400">
              <span>Gross Total:</span>
              <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount Applied:</span>
                <span>-₹{order.discount_amount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>GST Tax (18%):</span>
              <span>₹{order.tax_amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Express Delivery:</span>
              <span>₹{order.shipping_amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
              <span>Total Paid:</span>
              <span className="text-cyan-400">₹{order.final_amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
