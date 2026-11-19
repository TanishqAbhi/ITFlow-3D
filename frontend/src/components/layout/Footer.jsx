import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, Headphones, ArrowRight } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="w-full bg-[#030610] border-t border-slate-800/80 text-slate-400 text-xs">
      {/* Value Proposition Highlights */}
      <div className="border-b border-slate-900 bg-slate-950/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-200">Express Air Delivery</div>
              <div className="text-[11px] text-slate-500">Bluedart Priority Insured Shipping</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-200">2-Year Official Warranty</div>
              <div className="text-[11px] text-slate-500">100% Genuine Certified Hardware</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-200">7-Day Replacement</div>
              <div className="text-[11px] text-slate-500">Zero-hassle RMA guarantee</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-200">24/7 Tech Concierge</div>
              <div className="text-[11px] text-slate-500">Dedicated systems engineer support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-cyan-500 to-purple-600 flex items-center justify-center text-white font-mono font-bold">
              3D
            </div>
            <span className="font-display font-extrabold text-base text-white">
              ITFLOW<span className="text-cyan-400">.3D</span>
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed max-w-sm">
            Enterprise IT hardware ecosystem engineered for enthusiasts, creators, and engineering labs. Featuring real-time 3D WebGL product inspection and instant order fulfillment.
          </p>
          {/* Newsletter */}
          <form onSubmit={handleSubscribe} className="space-y-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono">
              Subscribe for VIP Hardware Drops
            </span>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@enterprise.com"
                className="px-3 py-2 rounded-xl glass-input text-xs flex-1"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all flex items-center gap-1"
              >
                <span>Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {subscribed && (
              <p className="text-xs text-emerald-400">Welcome to the VIP Drop Circle!</p>
            )}
          </form>
        </div>

        <div>
          <h4 className="font-semibold text-slate-200 uppercase font-mono tracking-wider mb-4">
            Hardware Categories
          </h4>
          <ul className="space-y-2.5">
            <li><Link to="/store?category=laptops" className="hover:text-cyan-400 transition-colors">Ultra Laptops</Link></li>
            <li><Link to="/store?category=desktops" className="hover:text-cyan-400 transition-colors">Workstation Towers</Link></li>
            <li><Link to="/store?category=monitors" className="hover:text-cyan-400 transition-colors">Curved OLED Displays</Link></li>
            <li><Link to="/store?category=computer-components" className="hover:text-cyan-400 transition-colors">GeForce RTX GPUs</Link></li>
            <li><Link to="/store?category=keyboards" className="hover:text-cyan-400 transition-colors">Mechanical Keyboards</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-200 uppercase font-mono tracking-wider mb-4">
            Enterprise Portals
          </h4>
          <ul className="space-y-2.5">
            <li><Link to="/admin" className="text-rose-400 hover:text-rose-300 transition-colors">Super Admin Portal</Link></li>
            <li><Link to="/staff" className="text-emerald-400 hover:text-emerald-300 transition-colors">Staff Operations Hub</Link></li>
            <li><Link to="/store?has_3d=true" className="text-cyan-400 hover:text-cyan-300 transition-colors">3D Interactive Viewer</Link></li>
            <li><Link to="/customer/account" className="hover:text-cyan-400 transition-colors">Customer Order Tracker</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-200 uppercase font-mono tracking-wider mb-4">
            Security & Compliance
          </h4>
          <ul className="space-y-2.5">
            <li><span className="text-slate-500">256-bit SSL Cryptography</span></li>
            <li><span className="text-slate-500">Razorpay Verified Gateway</span></li>
            <li><span className="text-slate-500">Immutable Audit Logging</span></li>
            <li><span className="text-slate-500">RBAC Token Protection</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-900 py-6 text-center text-slate-600 text-[11px]">
        © 2026 ITFlow 3D Enterprise Systems. All rights reserved. Architected with FastAPI, PostgreSQL, React, and Three.js.
      </div>
    </footer>
  );
}
