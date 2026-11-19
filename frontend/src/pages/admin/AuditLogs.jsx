import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FileText,
  Search,
  Filter,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Terminal
} from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = '/admin/audit-logs?limit=100';
      if (actionFilter) url += `&action=${encodeURIComponent(actionFilter)}`;
      if (entityFilter) url += `&entity_type=${encodeURIComponent(entityFilter)}`;
      if (emailFilter) url += `&user_email=${encodeURIComponent(emailFilter)}`;

      const res = await api.get(url);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px]">ADMIN</span>;
      case 'STAFF':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">STAFF</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px]">CUSTOMER</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2638]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <FileText className="w-6 h-6 text-rose-400" />
            Immutable Audit & Activity Trails
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Cryptographic ledger tracking all staff modifications, order state changes, inventory deltas & logins
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 font-medium flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
          <span>Refresh Audit Feed</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <input
            type="text"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            placeholder="Filter by user email..."
            className="w-full px-3 py-2 rounded-xl bg-[#0e131f] border border-[#1e2638] text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0e131f] border border-[#1e2638] text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
          >
            <option value="">All Action Types</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="PRODUCT_CREATED">PRODUCT_CREATED</option>
            <option value="PRODUCT_APPROVED">PRODUCT_APPROVED</option>
            <option value="PRODUCT_REJECTED">PRODUCT_REJECTED</option>
            <option value="INVENTORY_ADJUSTED">INVENTORY_ADJUSTED</option>
            <option value="ORDER_STATUS_UPDATED">ORDER_STATUS_UPDATED</option>
            <option value="ORDER_PAID_AND_CONFIRMED">ORDER_PAID_AND_CONFIRMED</option>
            <option value="STAFF_ACCOUNT_CREATED">STAFF_ACCOUNT_CREATED</option>
          </select>
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0e131f] border border-[#1e2638] text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
          >
            <option value="">All Entity Categories</option>
            <option value="Product">Product</option>
            <option value="Inventory">Inventory</option>
            <option value="Order">Order</option>
            <option value="Staff">Staff</option>
            <option value="User">User</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 transition-colors"
        >
          Apply Filters
        </button>
      </form>

      {/* Log Feed Table */}
      <div className="rounded-2xl bg-[#0e131f] border border-[#1e2638] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1e2638]">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Action Event</th>
                <th className="px-5 py-3.5">Target Entity</th>
                <th className="px-5 py-3.5">IP Origin</th>
                <th className="px-5 py-3.5 text-right">State Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2638]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500 font-mono">
                    Streaming audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500 font-mono">
                    No audit records match criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 font-medium text-slate-200">
                        {log.user_email}
                      </td>

                      <td className="px-5 py-3.5">
                        {getRoleBadge(log.user_role)}
                      </td>

                      <td className="px-5 py-3.5 font-mono font-semibold text-cyan-400">
                        {log.action}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-slate-300">
                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {(log.previous_state || log.new_state) && (
                          <button
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-[10px] font-mono text-slate-300 inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Diff</span>
                            {expandedId === log.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expandable JSON State Diff Box */}
                    {expandedId === log.id && (
                      <tr className="bg-slate-950/80 border-t border-b border-indigo-500/20">
                        <td colSpan="7" className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                                Previous State (Before)
                              </span>
                              <pre className="p-3 rounded-xl bg-[#090d16] border border-slate-800 text-rose-300 overflow-x-auto text-[11px]">
                                {log.previous_state ? JSON.stringify(JSON.parse(log.previous_state), null, 2) : 'None (Created entity)'}
                              </pre>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                                Updated State (After)
                              </span>
                              <pre className="p-3 rounded-xl bg-[#090d16] border border-slate-800 text-emerald-300 overflow-x-auto text-[11px]">
                                {log.new_state ? JSON.stringify(JSON.parse(log.new_state), null, 2) : 'None'}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
