import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCart } from '../../store/cartSlice';
import { showToast } from '../../store/uiSlice';
import api from '../../services/api';
import {
  Search,
  Filter,
  Sparkles,
  ShoppingBag,
  Star,
  Check,
  ArrowRight,
  SlidersHorizontal,
  X
} from 'lucide-react';

export default function ProductCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters from URL
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort_by') || 'featured';
  const has3D = searchParams.get('has_3d') === 'true';

  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/store/categories'),
          api.get('/store/brands'),
        ]);
        setCategories(catRes.data);
        setBrands(brandRes.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `/store/products?sort_by=${currentSort}`;
        if (currentCategory) url += `&category=${encodeURIComponent(currentCategory)}`;
        if (currentBrand) url += `&brand=${encodeURIComponent(currentBrand)}`;
        if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
        if (has3D) url += `&has_3d=true`;

        const res = await api.get(url);
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (!value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setAddingId(product.id);
    try {
      const res = await api.post('/cart/items', {
        product_id: product.id,
        quantity: 1,
      });
      dispatch(setCart(res.data));
      dispatch(showToast({ message: `Added ${product.name} to your cart.`, type: 'success' }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add item to cart.');
    } finally {
      setTimeout(() => setAddingId(null), 800);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">
            IT Product Catalog
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Browse {products.length} high-performance certified products with interactive 3D WebGL inspection
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">Sort by:</span>
          <select
            value={currentSort}
            onChange={(e) => updateParam('sort_by', e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="featured">Featured First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest Arrivals</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Filters */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl glass-card space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                Filters
              </span>
              {(currentCategory || currentBrand || currentSearch || has3D) && (
                <button
                  onClick={() => setSearchParams(new URLSearchParams())}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* 3D Only Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-300 font-mono">
              <input
                type="checkbox"
                checked={has3D}
                onChange={(e) => updateParam('has_3d', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                3D Models Only
              </span>
            </label>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 font-semibold mb-2">
                Category
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                <button
                  onClick={() => updateParam('category', '')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    !currentCategory ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => updateParam('category', c.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      currentCategory === c.slug
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 font-semibold mb-2">
                Brand / Manufacturer
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                <button
                  onClick={() => updateParam('brand', '')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    !currentBrand ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Brands
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => updateParam('brand', b.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      currentBrand === b.slug
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="py-24 text-center text-slate-500 font-mono text-xs flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
              <span>Querying hardware catalog...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center rounded-2xl glass-card p-8">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white font-display">No Products Found</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Try adjusting search keywords or clearing active filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => (
                <Link
                  key={p.id}
                  to={`/store/product/${p.slug}`}
                  className="rounded-2xl glass-card border border-slate-800/80 hover:border-cyan-500/40 overflow-hidden group transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-gradient-to-b from-[#0a0f1d] to-[#04060c] overflow-hidden flex items-center justify-center p-4">
                    <img
                      src={
                        p.images?.[0]?.image_url ||
                        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={p.name}
                      className="max-h-40 object-contain group-hover:scale-105 transition-transform duration-300"
                    />

                    {p.model_3d_url && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>3D View</span>
                      </div>
                    )}

                    {p.discount_price && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold">
                        SALE
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{p.brand?.name || 'Pro Brand'}</span>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{p.rating || '4.8'}</span>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {p.name}
                    </h3>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold font-mono text-white">
                          ₹{(p.discount_price || p.regular_price).toLocaleString('en-IN')}
                        </div>
                        {p.discount_price && (
                          <div className="text-[10px] text-slate-500 line-through font-mono">
                            ₹{p.regular_price.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(e, p)}
                        disabled={addingId === p.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 text-xs font-mono font-semibold text-slate-200 transition-all flex items-center gap-1"
                      >
                        {addingId === p.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ShoppingBag className="w-3.5 h-3.5" />
                        )}
                        <span>{addingId === p.id ? 'Added' : 'Cart'}</span>
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
