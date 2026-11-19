import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Boxes,
  PlusCircle,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  CheckCircle2,
  X,
  Search,
  RefreshCw
} from 'lucide-react';

export default function StaffInventoryManager() {
  const [inventories, setInventories] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState('');

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustType, setAdjustType] = useState('STOCK_IN');
  const [quantityDelta, setQuantityDelta] = useState(10);
  const [reason, setReason] = useState('Warehouse Supplier Ingest');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // History Tab Toggle
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'history'

  const fetchInventoryData = async () => {
    try {
      const [invRes, histRes] = await Promise.all([
        api.get(`/staff/inventory?low_stock_only=${lowStockOnly}`),
        api.get('/staff/inventory/history'),
      ]);
      setInventories(invRes.data);
      setHistory(histRes.data);
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [lowStockOnly]);

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmitting(true);

    try {
      const delta = adjustType === 'STOCK_OUT' ? -Math.abs(Number(quantityDelta)) : Math.abs(Number(quantityDelta));

      await api.post('/staff/inventory/adjust', {
        product_id: selectedProduct.product_id,
        quantity_delta: delta,
        transaction_type: adjustType,
        reason: reason,
        reference_id: `PO-${Date.now().toString().slice(-6)}`,
      });

      setShowAdjustModal(false);
      setSuccessMsg(`Inventory for '${selectedProduct.product_name}' adjusted successfully.`);
      fetchInventoryData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Adjustment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = inventories.filter(
    (inv) =>
      inv.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.product_sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1a263d]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-400" />
            Inventory & Warehouse Ledger
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Atomic stock balance tracking, safety threshold monitors & immutable transaction ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              activeTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Live Inventory
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Transaction History
          </button>
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

      {activeTab === 'inventory' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search inventory by product or SKU..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0c1424] border border-[#1a263d] text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-[#080d18] border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span>Show Low Stock Only</span>
            </label>
          </div>

          {/* Inventory Table */}
          <div className="rounded-2xl bg-[#0c1424] border border-[#1a263d] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080d18] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1a263d]">
                  <tr>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">SKU Code</th>
                    <th className="px-6 py-4">Available Units</th>
                    <th className="px-6 py-4">Reserved Units</th>
                    <th className="px-6 py-4">Reorder Threshold</th>
                    <th className="px-6 py-4">Stock Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a263d]">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-500 font-mono">
                        Checking inventory counts...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-500 font-mono">
                        No inventory records found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-200">
                          {inv.product_name}
                        </td>

                        <td className="px-6 py-4 font-mono font-bold text-cyan-400">
                          {inv.product_sku}
                        </td>

                        <td className="px-6 py-4 font-mono text-base font-bold text-white">
                          {inv.quantity_available}
                        </td>

                        <td className="px-6 py-4 font-mono text-slate-400">
                          {inv.quantity_reserved}
                        </td>

                        <td className="px-6 py-4 font-mono text-slate-400">
                          {inv.reorder_threshold} units
                        </td>

                        <td className="px-6 py-4">
                          {inv.is_out_of_stock ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px]">
                              OUT OF STOCK
                            </span>
                          ) : inv.is_low_stock ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px]">
                              LOW STOCK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
                              OPTIMAL
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedProduct(inv);
                              setShowAdjustModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs inline-flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                            <span>Adjust Stock</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* TRANSACTION HISTORY VIEW */
        <div className="rounded-2xl bg-[#0c1424] border border-[#1a263d] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080d18] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1a263d]">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Delta</th>
                  <th className="px-6 py-4">Before → After</th>
                  <th className="px-6 py-4">Reason / Reference</th>
                  <th className="px-6 py-4 text-right">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a263d]">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-500 font-mono">
                      No stock transactions recorded.
                    </td>
                  </tr>
                ) : (
                  history.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-200">
                        {tx.product_name || `Product #${tx.product_id}`}
                      </td>

                      <td className="px-6 py-4 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.transaction_type === 'STOCK_IN'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : tx.transaction_type === 'SALE_DEDUCT'
                              ? 'bg-indigo-500/10 text-indigo-400'
                              : 'bg-amber-500/10 text-amber-300'
                          }`}
                        >
                          {tx.transaction_type}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono font-bold">
                        <span className={tx.quantity_delta > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {tx.quantity_delta > 0 ? `+${tx.quantity_delta}` : tx.quantity_delta}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-300">
                        {tx.previous_quantity} → <strong className="text-white">{tx.new_quantity}</strong>
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {tx.reason} {tx.reference_id && <span className="font-mono text-slate-500">({tx.reference_id})</span>}
                      </td>

                      <td className="px-6 py-4 text-right font-mono text-slate-400">
                        {tx.user_email || 'System'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0c1424] border border-emerald-500/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-sm font-display flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-400" />
                  Adjust Stock Quantity
                </h3>
                <span className="text-xs text-slate-400 font-mono">{selectedProduct.product_name}</span>
              </div>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Transaction Category</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                >
                  <option value="STOCK_IN">STOCK_IN (Warehouse Restock Delivery)</option>
                  <option value="STOCK_OUT">STOCK_OUT (Damaged / Return Deduct)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Audit Reconciliation)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  Quantity Units ({adjustType === 'STOCK_OUT' ? 'Deduction' : 'Addition'})
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quantityDelta}
                  onChange={(e) => setQuantityDelta(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Mandatory Operational Reason</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                  placeholder="Supplier batch delivery, RMA damage, or audit..."
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Commit Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
