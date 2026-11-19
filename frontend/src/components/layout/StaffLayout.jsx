import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import {
  Briefcase,
  Layers,
  Boxes,
  Truck,
  LogOut,
  ExternalLink,
  Award,
  Bell
} from 'lucide-react';

export default function StaffLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.ui);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/staff/login');
  };

  const navItems = [
    { to: '/staff', label: 'Operations Dashboard', icon: Briefcase, end: true },
    { to: '/staff/products', label: 'Product Catalog Workspace', icon: Layers },
    { to: '/staff/inventory', label: 'Inventory & Stock Adjustments', icon: Boxes },
    { to: '/staff/orders', label: 'Order Fulfillment & Shipments', icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex font-sans">
      {/* Operations Sidebar */}
      <aside className="w-64 bg-[#0a101d] border-r border-[#1a263d] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand */}
          <div className="h-16 px-6 border-b border-[#1a263d] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center font-mono font-bold text-sm text-white shadow-lg shadow-emerald-900/30">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-wide">STAFF PORTAL</div>
              <div className="text-[10px] font-mono text-emerald-400">Operations & Catalog</div>
            </div>
          </div>

          {/* Performance Score Pill */}
          <div className="p-3 mx-3 mt-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-300">Staff Rating</span>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-400">
              {user?.staff_profile?.performance_score || '98.5'}%
            </span>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-[#1a263d] space-y-3">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              View Customer Store
            </span>
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs font-bold">
                {user?.first_name?.[0] || 'S'}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">{user?.first_name} {user?.last_name}</div>
                <div className="text-[10px] font-mono text-slate-500">
                  {user?.staff_profile?.employee_id || 'ITF-STF-001'}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-[#0a101d]/80 backdrop-blur-md border-b border-[#1a263d] px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              OPERATIONS ACTIVE
            </div>
            <span className="text-xs text-slate-400 font-mono">
              DEPT: {user?.staff_profile?.department || 'Hardware & Systems'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-slate-400">
              LOGGED AS: <span className="text-emerald-400 font-bold">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
