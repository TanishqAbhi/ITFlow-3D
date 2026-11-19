import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero3DCanvas from '../../components/3d/Hero3DCanvas';
import api from '../../services/api';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight,
  Star,
  ShoppingBag,
  Zap
} from 'lucide-react';

export default function Home3D() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [featRes, catRes] = await Promise.all([
          api.get('/store/featured?limit=6'),
          api.get('/store/categories'),
        ]);
        setFeatured(featRes.data);
        setCategories(catRes.data);
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="space-y-20 pb-20 font-sans">
      {/* 3D HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-between overflow-hidden px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Cyber Background Glow Elements */}
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-[450px] h-[450px] bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full z-10 py-12">
          {/* Left Text Pitch */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-400 text-xs font-mono shadow-glow-cyan">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Next-Gen 3D WebGL Storefront</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-display leading-[1.1]">
              ENGINEERED FOR{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                SUPREME
              </span>{' '}
              PERFORMANCE.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              Experience IT hardware in true 360-degree interactive 3D WebGL before buying. High-tier creator rigs, liquid-cooled towers, and esports peripherals directly from verified labs.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/store"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-950 flex items-center gap-2 hover:scale-105 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Catalog</span>
              </Link>

              <Link
                to="/store?has_3d=true"
                className="px-6 py-3.5 rounded-2xl glass-panel text-cyan-300 hover:text-white hover:border-cyan-500/50 font-semibold text-sm flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Interactive 3D Models</span>
              </Link>
            </div>

            {/* Micro specs strip */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 max-w-lg text-xs font-mono">
              <div>
                <div className="text-slate-400">Resolution</div>
                <div className="text-white font-bold text-sm mt-0.5">4K UHD Dual</div>
              </div>
              <div>
                <div className="text-slate-400">Rendering</div>
                <div className="text-cyan-400 font-bold text-sm mt-0.5">60 FPS WebGL</div>
              </div>
              <div>
                <div className="text-slate-400">Delivery</div>
                <div className="text-white font-bold text-sm mt-0.5">Air Express</div>
              </div>
            </div>
          </div>

          {/* Right 3D Interactive Hero Canvas */}
          <div className="lg:col-span-5 h-[420px] sm:h-[500px] w-full relative">
            <Hero3DCanvas />
          </div>
        </div>
      </section>

      {/* HARDWARE CATEGORIES DISCOVERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white font-display tracking-tight">
              Browse by Hardware Category
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Enterprise-grade computing, displays, and peripheral ecosystems
            </p>
          </div>
          <Link
            to="/store"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {categories.slice(0, 12).map((cat) => (
            <Link
              key={cat.id}
              to={`/store?category=${cat.slug}`}
              className="p-4 rounded-2xl glass-card hover:border-cyan-500/40 hover:scale-[1.02] transition-all group flex flex-col items-center text-center space-y-2.5"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:text-cyan-300 group-hover:bg-cyan-500/10 transition-colors">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED 3D HARDWARE SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-2xl font-bold text-white font-display tracking-tight">
              Featured 3D Showcases
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Rotate & Zoom in 3D</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((product) => (
            <Link
              key={product.id}
              to={`/store/product/${product.slug}`}
              className="rounded-2xl glass-card border border-slate-800/80 hover:border-cyan-500/40 overflow-hidden group transition-all flex flex-col justify-between"
            >
              <div className="relative aspect-video bg-gradient-to-b from-[#0a0f1d] to-[#04060c] overflow-hidden flex items-center justify-center p-4">
                <img
                  src={product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80'}
                  alt={product.name}
                  className="max-h-48 object-contain group-hover:scale-105 transition-transform duration-300"
                />
                {product.model_3d_url && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>3D Interactive</span>
                  </div>
                )}
                {product.discount_price && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold">
                    SAVE ₹{(product.regular_price - product.discount_price).toLocaleString('en-IN')}
                  </div>
                )}
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{product.brand?.name || 'Enterprise'}</span>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{product.rating || '4.9'}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                  {product.name}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {product.short_description || product.description}
                </p>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold font-mono text-white">
                      ₹{(product.discount_price || product.regular_price).toLocaleString('en-IN')}
                    </div>
                    {product.discount_price && (
                      <div className="text-[10px] text-slate-500 line-through font-mono">
                        ₹{product.regular_price.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 group-hover:border-cyan-500/60 text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5 transition-colors">
                    <span>Inspect 3D</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* VERIFIED CUSTOMER REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            Client Testimonials
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
            Trusted by Game Studios & Engineers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "Being able to rotate the Razer Blade 18 in 3D right in the browser and inspect the rear vapor chamber vents before ordering gave us total confidence. Delivered in 24 hours to our studio."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                AV
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Alex Vance</div>
                <div className="text-[10px] text-slate-500 font-mono">Senior Lead Developer, BKC</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "The custom packaging and instant courier tracking notifications via WebSocket were flawless. The Alienware R16 desktop runs dead silent even under heavy AI model training workloads."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                ML
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Maya Lin</div>
                <div className="text-[10px] text-slate-500 font-mono">AI Research Director, Bangalore</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "The Samsung Odyssey 49 OLED monitor is mind-blowing. The coupon code TECH10 saved us ₹15,000 instantly. Best enterprise purchasing experience we've had."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                RK
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Rohit Kapoor</div>
                <div className="text-[10px] text-slate-500 font-mono">Creative VFX Director, Pune</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
