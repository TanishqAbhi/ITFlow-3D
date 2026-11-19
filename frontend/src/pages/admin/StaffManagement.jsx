import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Lock,
  PauseCircle,
  PlayCircle,
  X,
  Search,
  Award
} from 'lucide-react';

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    employee_id: '',
    department: 'Hardware & Systems',
    designation: 'Operations Specialist',
  });
  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchStaff = async () => {
    try {
      const res = await api.get('/admin/staff');
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to load staff list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/admin/staff', formData);
      setShowCreateModal(false);
      setActionSuccess(`Staff account for '${formData.email}' created successfully!`);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        employee_id: '',
        department: 'Hardware & Systems',
        designation: 'Operations Specialist',
      });
      fetchStaff();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create staff account.');
    }
  };

  const handleToggleStatus = async (staffId, action, reason = '') => {
    try {
      await api.patch(`/admin/staff/${staffId}/status?action=${action}&reason=${encodeURIComponent(reason)}`);
      setActionSuccess(`Staff account status updated: ${action.toUpperCase()}`);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update staff status.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedStaff || !newPassword) return;
    try {
      await api.post(`/admin/staff/${selectedStaff.id}/reset-password?new_password=${encodeURIComponent(newPassword)}`);
      setShowResetModal(false);
      setNewPassword('');
      setActionSuccess(`Password for ${selectedStaff.email} was securely reset.`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reset password.');
    }
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.first_name.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.staff_profile?.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2638]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            Staff & Personnel Management
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Provision employee access, control security clearance, and monitor performance
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-rose-950 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Staff Account</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or Employee ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0e131f] border border-[#1e2638] text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl bg-[#0e131f] border border-[#1e2638] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1e2638]">
              <tr>
                <th className="px-6 py-4">Specialist</th>
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">Department & Designation</th>
                <th className="px-6 py-4">Performance</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2638]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500 font-mono">
                    Loading personnel registry...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500 font-mono">
                    No staff members match the query.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center">
                          {staff.first_name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">
                            {staff.first_name} {staff.last_name}
                          </div>
                          <div className="text-[11px] text-slate-400">{staff.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-cyan-400 font-medium">
                      {staff.staff_profile?.employee_id || 'N/A'}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-slate-200 font-medium">
                        {staff.staff_profile?.department || 'Operations'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {staff.staff_profile?.designation || 'Specialist'}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {staff.staff_profile?.performance_score || '95'}%
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {staff.is_suspended ? (
                        <span className="px-2 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono">
                          SUSPENDED
                        </span>
                      ) : staff.is_active ? (
                        <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-mono">
                          DEACTIVATED
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {staff.is_suspended ? (
                          <button
                            onClick={() => handleToggleStatus(staff.id, 'activate')}
                            title="Unsuspend / Activate"
                            className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900 border border-emerald-500/30 transition-colors"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(staff.id, 'suspend', 'Audit review suspension')}
                            title="Suspend Access"
                            className="p-1.5 rounded-lg bg-amber-950/60 text-amber-400 hover:bg-amber-900 border border-amber-500/30 transition-colors"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedStaff(staff);
                            setShowResetModal(true);
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STAFF MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0e131f] border border-rose-500/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="font-bold text-white text-base font-display flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-rose-400" />
                Provision Staff Specialist
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                    placeholder="Liam"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                    placeholder="Neeson"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                  placeholder="liam.n@itflow3d.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200 font-mono"
                    placeholder="ITF-STF-003"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                  >
                    <option value="Hardware & Systems">Hardware & Systems</option>
                    <option value="Fulfillment & Operations">Fulfillment & Operations</option>
                    <option value="Quality & Approvals">Quality & Approvals</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                    placeholder="Operations Lead"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-950 transition-colors"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#0e131f] border border-rose-500/30 p-6 shadow-2xl">
            <h3 className="font-bold text-white text-sm font-display mb-1">
              Reset Staff Password
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Setting new credentials for {selectedStaff.email}
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">New Secure Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                  placeholder="NewPassword@123"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
