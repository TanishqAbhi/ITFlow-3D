import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Truck,
  CheckCircle2,
  Package,
  Clock,
  MapPin,
  ExternalLink,
  X,
  CreditCard,
  Send
} from 'lucide-react';

export default function StaffOrderFulfillment() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('PROCESSING');
  const [carrier, setCarrier] = useState('Bluedart Apex Priority');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await api.get('/staff/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load staff orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);

    try {
      await api.patch(`/staff/orders/${selectedOrder.id}/status`, {
        status: statusUpdate,
        carrier: carrier,
        tracking_number: trackingNumber || undefined,
        notes: notes || undefined,
      });

      setSelectedOrder(null);
      setSuccessMsg(`Order #${selectedOrder.order_number} transitioned to ${statusUpdate}. Customer notified.`);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.detail || 'Status update failed.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1a263d]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-400" />
            Order Fulfillment & Logistics Hub
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Process confirmed customer purchases, verify packaging, and dispatch live tracking manifests
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500 font-mono text-xs">
            Loading fulfillment queues...
          </div>
        ) : orders.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-2xl bg-[#0c1424] border border-[#1a263d] p-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-white font-display">Fulfillment Queue Clear</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">No orders currently waiting for dispatch.</p>
          </div>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="p-5 rounded-2xl bg-[#0c1424] border border-[#1a263d] shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    {o.order_number}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 font-mono text-[10px] text-slate-300 uppercase">
                    {o.order_status}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-200">{o.customer_name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{o.customer_email}</div>
                </div>

                {/* Items summary */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                  {o.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 truncate max-w-[180px]">{item.product_name}</span>
                      <span className="font-mono text-slate-400 font-bold">×{item.quantity}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-mono text-xs font-bold text-white">
                    <span>Payable Total:</span>
                    <span className="text-emerald-400">₹{o.final_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Shipping Address destination */}
                {o.shipping_address && (
                  <div className="text-[11px] text-slate-400 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      {o.shipping_address.city}, {o.shipping_address.state} ({o.shipping_address.postal_code})
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setSelectedOrder(o);
                  setStatusUpdate(
                    o.order_status === 'CONFIRMED'
                      ? 'PROCESSING'
                      : o.order_status === 'PROCESSING'
                      ? 'PACKED'
                      : o.order_status === 'PACKED'
                      ? 'SHIPPED'
                      : 'DELIVERED'
                  );
                  setTrackingNumber(o.shipment?.tracking_number || `BD-EXP-${Math.floor(100000 + Math.random() * 900000)}`);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950 transition-colors"
              >
                <Package className="w-4 h-4" />
                <span>Update Fulfillment Status</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* UPDATE STATUS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0c1424] border border-emerald-500/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-sm font-display flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  Fulfill Order #{selectedOrder.order_number}
                </h3>
                <span className="text-xs text-slate-400 font-mono">Current Status: {selectedOrder.order_status}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">New Order Status</label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                >
                  <option value="PROCESSING">PROCESSING (Picking components from warehouse)</option>
                  <option value="PACKED">PACKED (Securely boxed with anti-static foam)</option>
                  <option value="SHIPPED">SHIPPED (Handed over to priority air courier)</option>
                  <option value="DELIVERED">DELIVERED (Signature verified arrival)</option>
                </select>
              </div>

              {(statusUpdate === 'SHIPPED' || statusUpdate === 'PACKED') && (
                <>
                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Carrier Provider</label>
                    <input
                      type="text"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Airway Bill / Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200 font-mono"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-400 font-mono mb-1">Fulfillment Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                  placeholder="Inspected quality seal, included HDMI 2.1 cable..."
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Confirm Status Progression'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
