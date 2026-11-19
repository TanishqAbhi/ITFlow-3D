import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Briefcase,
  Layers,
  Boxes,
  Truck,
  AlertTriangle,
  Clock,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function StaffDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/staff/dashboard');
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load staff dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono text-xs">Loading Operations Workspace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1a263d]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            Operations Command Center
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Manage product catalog, inventory transactions, and order fulfillment workflows
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/staff/products"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Managed Products */}
        <div className="p-5 rounded-2xl bg-[#0d1424] border border-[#1a263d] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Managed Products</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics?.assigned_products || 0}
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-mono">
            {metrics?.published_products || 0} live on customer storefront
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="p-5 rounded-2xl bg-[#0d1424] border border-[#1a263d] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Pending Approval</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics?.pending_approvals || 0}
          </div>
          <div className="mt-2 text-[11px] text-amber-300 font-mono">
            Submitted to Super Admin
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 rounded-2xl bg-[#0d1424] border border-[#1a263d] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Low Stock Warnings</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono text-rose-400">
            {metrics?.low_stock_products || 0}
          </div>
          <div className="mt-2 text-[11px] text-rose-300 font-mono">
            Requires inventory stock-in
          </div>
        </div>

        {/* Orders to Process */}
        <div className="p-5 rounded-2xl bg-[#0d1424] border border-[#1a263d] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Orders To Fulfill</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono text-cyan-400">
            {metrics?.orders_requiring_processing || 0}
          </div>
          <div className="mt-2 text-[11px] text-cyan-300 font-mono">
            Ready for packing & tracking
          </div>
        </div>
      </div>

      {/* Quick Action Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/staff/products"
          className="p-6 rounded-2xl bg-[#0d1424] border border-[#1a263d] hover:border-emerald-500/50 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Catalog Management</h3>
          <p className="text-xs text-slate-400 mb-4">
            Upload new products, configure technical specifications, and link 3D WebGL assets.
          </p>
          <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Open Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          to="/staff/inventory"
          className="p-6 rounded-2xl bg-[#0d1424] border border-[#1a263d] hover:border-cyan-500/50 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Boxes className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Stock Ledger & Ingest</h3>
          <p className="text-xs text-slate-400 mb-4">
            Perform stock-in, stock-out adjustments and review immutable warehouse transaction history.
          </p>
          <span className="text-xs text-cyan-400 font-mono font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Manage Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          to="/staff/orders"
          className="p-6 rounded-2xl bg-[#0d1424] border border-[#1a263d] hover:border-indigo-500/50 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Order Fulfillment</h3>
          <p className="text-xs text-slate-400 mb-4">
            Process confirmed customer orders, generate shipping labels, and attach courier tracking IDs.
          </p>
          <span className="text-xs text-indigo-400 font-mono font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Process Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
