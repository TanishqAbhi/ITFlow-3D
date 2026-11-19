import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Clock,
  Sparkles,
  Boxes
} from 'lucide-react';

export default function ProductApprovals() {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchPending = async () => {
    try {
      const res = await api.get('/admin/products/pending-approvals');
      setPendingProducts(res.data);
    } catch (err) {
      console.error('Failed to load pending products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (productId, name) => {
    try {
      await api.post(`/admin/products/${productId}/approve`);
      setFeedbackMsg(`Product '${name}' approved and published to storefront.`);
      fetchPending();
    } catch (err) {
      alert(err.response?.data?.detail || 'Approval failed.');
    }
  };

  const handleReject = async (productId, name) => {
    if (!rejectNotes) {
      alert('Please specify rejection review notes for the staff member.');
      return;
    }
    try {
      await api.post(`/admin/products/${productId}/reject`, {
        status: 'REJECTED',
        review_notes: rejectNotes,
      });
      setFeedbackMsg(`Product '${name}' rejected. Review notes sent to staff.`);
      setRejectingId(null);
      setRejectNotes('');
      fetchPending();
    } catch (err) {
      alert(err.response?.data?.detail || 'Rejection failed.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2638]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-rose-400" />
            Product Publishing Approvals
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Catalog validation gate: Verify staff submissions, specs, and 3D assets before storefront publishing
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>{pendingProducts.length} Awaiting Review</span>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg('')} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500 font-mono text-xs">
          Loading approval queue...
        </div>
      ) : pendingProducts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0e131f] border border-[#1e2638] p-8">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white font-display">Approval Queue Clear</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            All submitted products have been reviewed and published.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingProducts.map((p) => (
            <div
              key={p.id}
              className="p-6 rounded-2xl bg-[#0e131f] border border-[#1e2638] shadow-xl hover:border-slate-700 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-5">
                <img
                  src={p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80'}
                  alt={p.name}
                  className="w-24 h-24 rounded-xl object-cover border border-slate-800 bg-slate-950 shrink-0"
                />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px]">
                      PENDING REVIEW
                    </span>
                    {p.model_3d_url && (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> 3D GLB Model
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white">{p.name}</h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>SKU: <strong className="text-slate-200">{p.sku}</strong></span>
                    <span>•</span>
                    <span>Brand: <strong className="text-slate-200">{p.brand?.name || 'N/A'}</strong></span>
                    <span>•</span>
                    <span>Price: <strong className="text-emerald-400">₹{p.regular_price.toLocaleString('en-IN')}</strong></span>
                    <span>•</span>
                    <span>Stock: <strong className="text-cyan-400">{p.stock_quantity} units</strong></span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 max-w-xl">
                    {p.short_description || p.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <button
                  onClick={() => handleApprove(p.id, p.name)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Publish</span>
                </button>

                <button
                  onClick={() => setRejectingId(p.id)}
                  className="px-4 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>

              {/* Rejection Notes Inline Prompt */}
              {rejectingId === p.id && (
                <div className="w-full mt-4 pt-4 border-t border-slate-800 flex items-center gap-3">
                  <input
                    type="text"
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Provide revision instructions for staff (e.g. Price too high, add 3D asset, fix SKU)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={() => handleReject(p.id, p.name)}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 transition-colors"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => setRejectingId(null)}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
