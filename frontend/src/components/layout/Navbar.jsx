import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { markNotificationRead, markAllNotificationsRead } from '../../store/uiSlice';
import api from '../../services/api';
import {
  ShoppingBag,
  Bell,
  User as UserIcon,
  Search,
  Layers,
  LogOut,
  ShieldAlert,
  Briefcase,
  ChevronDown,
  CheckCheck
} from 'lucide-react';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const { notifications, unreadCount } = useSelector((state) => state.ui);

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPortalMenu, setShowPortalMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/store?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    dispatch(logout());
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      dispatch(markAllNotificationsRead());
    } catch (e) {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <span className="font-mono font-bold text-lg text-white">3D</span>
          </div>
          <div>
            <div className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              ITFLOW<span className="text-cyan-400">.3D</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 -mt-1 tracking-widest uppercase">
              Enterprise Store
            </div>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 3D Rigs, RTX 4090, Laptops, Keyboards..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs glass-input placeholder:text-slate-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </form>

        {/* Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
          <Link to="/store" className="hover:text-cyan-400 transition-colors">
            All Products
          </Link>
          <Link to="/store?category=laptops" className="hover:text-cyan-400 transition-colors">
            Laptops
          </Link>
          <Link to="/store?category=desktops" className="hover:text-cyan-400 transition-colors">
            Desktops
          </Link>
          <Link to="/store?category=monitors" className="hover:text-cyan-400 transition-colors">
            Monitors
          </Link>
          <Link to="/store?has_3d=true" className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            3D Showcase
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Portal Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPortalMenu(!showPortalMenu)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/60 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Portals</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showPortalMenu && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 text-xs font-sans"
                onClick={() => setShowPortalMenu(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-500">
                  Switch Portal
                </div>
                <Link
                  to="/"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-medium">Customer Storefront</div>
                    <div className="text-[10px] text-slate-400">Immersive 3D Experience</div>
                  </div>
                </Link>
                <Link
                  to="/staff/login"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-medium">Staff Workspace</div>
                    <div className="text-[10px] text-slate-400">Catalog & Inventory Control</div>
                  </div>
                </Link>
                <Link
                  to="/admin"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <div>
                    <div className="font-medium">Super Admin Center</div>
                    <div className="text-[10px] text-slate-400">RBAC, Audits & Analytics</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Cart Button */}
          <Link
            to="/cart"
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 text-slate-300" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
                  <span className="font-semibold text-slate-200">Real-Time Alerts</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No new notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          dispatch(markNotificationRead(n.id));
                          if (n.link_url) navigate(n.link_url);
                          setShowNotifMenu(false);
                        }}
                        className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                          n.is_read ? 'bg-slate-950/50 hover:bg-slate-800/50' : 'bg-slate-800/80 border-l-2 border-cyan-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs font-medium text-slate-200">{n.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account / Profile */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  {user?.first_name?.[0] || 'U'}
                </div>
                <span className="text-xs font-medium text-slate-200 max-w-[80px] truncate">
                  {user?.first_name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 text-xs"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <div className="font-semibold text-slate-200 truncate">{user?.first_name} {user?.last_name}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">{user?.role}</div>
                  </div>
                  <Link
                    to="/customer/account"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5" /> My Orders & Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-950/60 text-rose-400 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/20 transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
