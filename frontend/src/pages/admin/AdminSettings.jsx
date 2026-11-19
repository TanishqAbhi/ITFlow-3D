import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Shield, CreditCard, Bell, Database } from 'lucide-react';

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    storeName: 'ITFlow 3D Enterprise',
    currency: 'INR (₹)',
    taxRate: '18',
    freeShippingThreshold: '10000',
    razorpayKey: 'rzp_test_itflowmock12345',
    razorpaySecret: '••••••••••••••••••••',
    testMode: true,
    emailAlerts: true,
    websocketRealtime: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      <div className="pb-4 border-b border-[#1e2638]">
        <h1 className="text-2xl font-bold text-white tracking-tight font-display flex items-center gap-2">
          <Settings className="w-6 h-6 text-rose-400" />
          Enterprise Platform Settings
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Configure financial rules, payment gateway keys, tax calculations, and real-time triggers
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Platform configuration updated and applied successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Store & Tax Configuration */}
        <div className="p-6 rounded-2xl bg-[#0e131f] border border-[#1e2638] space-y-4">
          <h3 className="font-mono uppercase font-bold text-slate-200 text-xs tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            Store & Tax Configurations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-mono mb-1">Store Brand Title</label>
              <input
                type="text"
                value={config.storeName}
                onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono mb-1">Primary Settlement Currency</label>
              <input
                type="text"
                disabled
                value={config.currency}
                className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-800 text-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono mb-1">Standard Tax Rate (GST %)</label>
              <input
                type="number"
                value={config.taxRate}
                onChange={(e) => setConfig({ ...config, taxRate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono mb-1">Free Express Shipping Threshold (₹)</label>
              <input
                type="number"
                value={config.freeShippingThreshold}
                onChange={(e) => setConfig({ ...config, freeShippingThreshold: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Razorpay Gateway Configuration */}
        <div className="p-6 rounded-2xl bg-[#0e131f] border border-[#1e2638] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono uppercase font-bold text-slate-200 text-xs tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Razorpay Payment Gateway Integration
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px]">
              TEST SANDBOX READY
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 font-mono mb-1">Razorpay Key ID</label>
              <input
                type="text"
                value={config.razorpayKey}
                onChange={(e) => setConfig({ ...config, razorpayKey: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono mb-1">Razorpay Key Secret</label>
              <input
                type="password"
                value={config.razorpaySecret}
                onChange={(e) => setConfig({ ...config, razorpaySecret: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200 font-mono"
              />
            </div>

            <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.testMode}
                onChange={(e) => setConfig({ ...config, testMode: e.target.checked })}
                className="w-4 h-4 rounded bg-[#080d18] border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-slate-300">
                Enable Simulated Razorpay Verification (Permits instant checkout verification without real bank cards)
              </span>
            </label>
          </div>
        </div>

        {/* Real-time WebSockets & Alerts */}
        <div className="p-6 rounded-2xl bg-[#0e131f] border border-[#1e2638] space-y-4">
          <h3 className="font-mono uppercase font-bold text-slate-200 text-xs tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-400" />
            Real-Time WebSocket Notification Bus
          </h3>

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.websocketRealtime}
                onChange={(e) => setConfig({ ...config, websocketRealtime: e.target.checked })}
                className="w-4 h-4 rounded bg-[#080d18] border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-slate-300">
                Broadcast live order confirmation notifications across connected client browsers
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.emailAlerts}
                onChange={(e) => setConfig({ ...config, emailAlerts: e.target.checked })}
                className="w-4 h-4 rounded bg-[#080d18] border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-slate-300">
                Trigger low-stock email alerts when inventory reaches reorder thresholds
              </span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-rose-950 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Configuration Changes</span>
        </button>
      </form>
    </div>
  );
}
