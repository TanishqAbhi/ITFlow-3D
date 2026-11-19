import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  ShoppingBag,
  FileText,
  Settings,
  LogOut,
  ExternalLink,
  ShieldAlert,
  Activity,
  Bell
} from 'lucide-react';

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.ui);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin', label: 'Executive Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/staff', label: 'Staff Management', icon: Users },
    { to: '/admin/approvals', label: 'Product Approvals', icon: CheckSquare },
    { to: '/admin/orders', label: 'All Platform Orders', icon: ShoppingBag },
    { to: '/admin/audit-logs', label: 'Audit & Activity Trails', icon: FileText },
    { to: '/admin/settings', label: 'Platform Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex font-sans">
      {/* Enterprise Dark Sidebar */}
      <aside className="w-64 bg-[#0a0d14] border-r border-[#1e2638] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand */}
          <div className="h-16 px-6 border-b border-[#1e2638] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center font-mono font-bold text-sm text-white shadow-lg shadow-rose-900/30">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-wide">ADMIN CENTER</div>
              <div className="text-[10px] font-mono text-rose-400">ITFlow 3D Platform</div>
            </div>
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
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm'
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
        <div className="p-4 border-t border-[#1e2638] space-y-3">
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
              <div className="w-7 h-7 rounded-lg bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xs font-bold">
                SA
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">{user?.first_name || 'Admin'}</div>
                <div className="text-[10px] font-mono text-slate-500">Super Administrator</div>
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
        <header className="h-16 bg-[#0a0d14]/80 backdrop-blur-md border-b border-[#1e2638] px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM OPERATIONAL
            </div>
            <span className="text-xs text-slate-500 font-mono">NODE: US-EAST-PRIMARY-DB</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/admin/approvals"
              className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Approvals"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </Link>

            <div className="text-xs font-mono text-slate-400 border-l border-slate-800 pl-4">
              ROLE: <span className="text-rose-400 font-bold">SUPER_ADMIN</span>
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
