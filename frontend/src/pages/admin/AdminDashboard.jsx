import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Briefcase,
  Boxes,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/dashboard/analytics');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load admin analytics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono text-xs">Aggregating Enterprise Analytics...</span>
      </div>
    );
  }

  const { metrics, revenue_chart, category_sales, staff_performance, recent_activities } = data || {};

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2638]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            Super Admin Control Center
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time platform overview, staff metrics, inventory valuation & audit records
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            fetchAnalytics();
          }}
          disabled={refreshing}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-[#0e131f] border border-[#1e2638] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Gross Platform Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ₹{metrics?.total_revenue?.toLocaleString('en-IN') || '0.00'}
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Monthly: ₹{metrics?.monthly_revenue?.toLocaleString('en-IN') || '0'}</span>
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="p-5 rounded-2xl bg-[#0e131f] border border-[#1e2638] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Inventory Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ₹{metrics?.inventory_valuation?.toLocaleString('en-IN') || '0.00'}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            {metrics?.total_products} items in catalog
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-[#0e131f] border border-[#1e2638] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics?.total_orders || 0}
          </div>
          <div className="mt-2 text-[11px] text-indigo-300 font-mono">
            {metrics?.pending_orders} pending • {metrics?.completed_orders} delivered
          </div>
        </div>

        {/* Staff & Users */}
        <div className="p-5 rounded-2xl bg-[#0e131f] border border-[#1e2638] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Staff & Consumers</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics?.total_customers || 0} <span className="text-sm text-slate-400 font-normal">cust</span>
          </div>
          <div className="mt-2 text-[11px] text-purple-300 font-mono">
            {metrics?.total_staff || 0} active operations staff
          </div>
        </div>
      </div>

      {/* Stock Health Alerts Strip */}
      {(metrics?.low_stock_products > 0 || metrics?.out_of_stock_products > 0) && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Inventory Warning:</strong> {metrics.low_stock_products} product(s) below reorder threshold and {metrics.out_of_stock_products} out of stock.
            </span>
          </div>
          <span className="font-mono text-[11px] underline cursor-pointer">View Inventory</span>
        </div>
      )}

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Performance Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0e131f] border border-[#1e2638]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Monthly Revenue Performance
              </h3>
              <p className="text-xs text-slate-400">Total transaction values over trailing operational months</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">INR (₹)</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e2638',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sales Breakdown */}
        <div className="p-6 rounded-2xl bg-[#0e131f] border border-[#1e2638]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-1">
            Category Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-4">Volume by product taxonomy</p>

          <div className="h-64 flex items-center justify-center">
            {category_sales && category_sales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={category_sales}
                    dataKey="sales"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {category_sales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#1e2638',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                    }}
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 font-mono">No category sales recorded yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Performance & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Performance */}
        <div className="p-6 rounded-2xl bg-[#0e131f] border border-[#1e2638]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Staff Productivity Matrix
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Active Specialists</span>
          </div>

          <div className="space-y-3">
            {staff_performance && staff_performance.length > 0 ? (
              staff_performance.map((staff) => (
                <div
                  key={staff.employee_id}
                  className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                      {staff.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{staff.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {staff.employee_id} • {staff.department}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      Score: {staff.performance_score}%
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {staff.products_managed} Prods • {staff.orders_processed} Orders
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 font-mono text-center py-6">No staff assigned</div>
            )}
          </div>
        </div>

        {/* Recent Audit & Activity Trails */}
        <div className="p-6 rounded-2xl bg-[#0e131f] border border-[#1e2638]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Recent Activity Audit
            </h3>
            <span className="text-[11px] text-rose-400 font-mono">Immutable Log</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {recent_activities && recent_activities.length > 0 ? (
              recent_activities.map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-start justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{act.action}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
                      {act.user_email} • {act.entity_type} #{act.entity_id}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 font-mono text-center py-6">No recent events</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
