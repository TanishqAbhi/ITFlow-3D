import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  Eye,
  X,
  CreditCard,
  MapPin,
  RefreshCw
} from 'lucide-react';

export default function OrderControl() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = '/admin/orders?limit=100';
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await api.get(url);
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">DELIVERED</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px]">IN TRANSIT</span>;
      case 'PROCESSING':
      case 'PACKED':
        return <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-[10px]">PROCESSING</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-[10px]">CONFIRMED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px]">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px]">PENDING</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2638]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-rose-400" />
            Executive Order Control
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Full platform order lifecycle, payment settlement statuses & logistics dispatch logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0e131f] border border-[#1e2638] text-xs text-slate-200 focus:outline-none"
          >
            <option value="">All Order Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="PACKED">PACKED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <button
            onClick={fetchOrders}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 font-medium flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-[#0e131f] border border-[#1e2638] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1e2638]">
              <tr>
                <th className="px-6 py-4">Order Number</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Logistics Tracking</th>
                <th className="px-6 py-4">Final Amount</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2638]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500 font-mono">
                    Loading orders registry...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500 font-mono">
                    No orders match filter.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-cyan-400">
                      {o.order_number}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{o.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{o.customer_email}</div>
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(o.order_status)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 font-semibold">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{o.payment?.payment_method || 'RAZORPAY'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                      {o.shipment?.tracking_number ? (
                        <div className="text-slate-300">
                          {o.shipment.carrier} • <strong>{o.shipment.tracking_number}</strong>
                        </div>
                      ) : (
                        <span className="text-slate-500">Awaiting Dispatch</span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-white">
                      ₹{o.final_amount.toLocaleString('en-IN')}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT ORDER MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0e131f] border border-cyan-500/30 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-base font-display flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-cyan-400" />
                  Order #{selectedOrder.order_number}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Items List */}
              <div>
                <h4 className="font-mono uppercase text-slate-400 text-[11px] mb-2 font-semibold">
                  Purchased Items ({selectedOrder.items?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{item.product_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">SKU: {item.product_sku}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-slate-300">
                          {item.quantity} × ₹{item.unit_price.toLocaleString('en-IN')}
                        </div>
                        <div className="font-bold text-cyan-400">
                          ₹{item.total_price.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <h4 className="font-mono uppercase text-slate-400 text-[11px] mb-1 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    Delivery Destination
                  </h4>
                  <div className="text-slate-200">{selectedOrder.shipping_address.full_name} ({selectedOrder.shipping_address.phone})</div>
                  <div className="text-slate-400">
                    {selectedOrder.shipping_address.street_address}, {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.postal_code}
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono space-y-1.5 text-right">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Subtotal:</span>
                  <span>₹{selectedOrder.total_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Savings:</span>
                  <span>-₹{selectedOrder.discount_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST (18%):</span>
                  <span>₹{selectedOrder.tax_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Express Shipping:</span>
                  <span>₹{selectedOrder.shipping_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                  <span>Final Payable:</span>
                  <span className="text-cyan-400">₹{selectedOrder.final_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
