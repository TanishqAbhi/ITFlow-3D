import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/authSlice';
import api from '../../services/api';
import { Briefcase, Lock, Mail, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

export default function StaffLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('tanishqabhi627@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email,
        password,
        portal: 'STAFF',
      });

      const { access_token, refresh_token, ...userData } = res.data;
      dispatch(
        loginSuccess({
          token: access_token,
          refresh_token,
          user: {
            id: userData.user_id,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
          },
        })
      );

      navigate('/staff');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (e, p) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#070b12] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-600 text-white shadow-xl shadow-emerald-950 mb-4">
            <Briefcase className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Staff Operations Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Catalog Management & Inventory Control Portal
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-[#0c1424] border border-emerald-500/20 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                Staff Corporate Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#080d18] border border-slate-700/80 text-white text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                  placeholder="staff.name@itflow3d.com"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                Staff Access Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#080d18] border border-slate-700/80 text-white text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                  placeholder="••••••••••••"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Operations Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credential Pills */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-2">
            <span className="text-[11px] text-slate-500 font-mono block">
              Demo Operations Credentials:
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fillCredentials('staff.john@itflow3d.com', 'Staff@123456')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500 text-[11px] font-mono text-slate-300 transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3 h-3 text-emerald-400" />
                staff.john@itflow3d.com (Catalog Lead)
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('staff.sarah@itflow3d.com', 'Staff@123456')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500 text-[11px] font-mono text-slate-300 transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3 h-3 text-emerald-400" />
                staff.sarah@itflow3d.com (Logistics Lead)
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">
            ← Return to Customer 3D Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
