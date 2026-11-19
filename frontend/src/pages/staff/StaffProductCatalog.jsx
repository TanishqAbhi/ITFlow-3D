import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Layers,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Edit2,
  Boxes,
  Sparkles,
  X,
  Plus
} from 'lucide-react';

export default function StaffProductCatalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: 1,
    brand_id: 1,
    regular_price: '',
    discount_price: '',
    initial_stock: 10,
    model_3d_url: '',
    image_url: '',
    short_description: '',
    description: '',
  });

  const [specs, setSpecs] = useState([
    { spec_key: 'Processor', spec_value: '', group_name: 'Performance' },
    { spec_key: 'Memory', spec_value: '', group_name: 'Memory & Storage' },
  ]);

  const fetchData = async () => {
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        api.get('/staff/products'),
        api.get('/store/categories'),
        api.get('/store/brands'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setBrands(brandRes.data);
    } catch (err) {
      console.error('Failed to load catalog data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSpec = () => {
    setSpecs([...specs, { spec_key: '', spec_value: '', group_name: 'General' }]);
  };

  const handleRemoveSpec = (index) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index, field, value) => {
    const updated = [...specs];
    updated[index][field] = value;
    setSpecs(updated);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku.toUpperCase(),
        category_id: parseInt(formData.category_id),
        brand_id: parseInt(formData.brand_id),
        regular_price: parseFloat(formData.regular_price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        initial_stock: parseInt(formData.initial_stock) || 5,
        model_3d_url: formData.model_3d_url || null,
        short_description: formData.short_description || null,
        description: formData.description,
        images: formData.image_url
          ? [{ image_url: formData.image_url, is_primary: true, sort_order: 0 }]
          : [
              {
                image_url:
                  'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
                is_primary: true,
                sort_order: 0,
              },
            ],
        specifications: specs.filter((s) => s.spec_key && s.spec_value),
      };

      await api.post('/staff/products', payload);
      setShowAddModal(false);
      setSuccessMsg(`Product '${formData.name}' created and submitted for Admin catalog approval!`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit product.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> PUBLISHED
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] flex items-center gap-1">
            <Clock className="w-3 h-3" /> PENDING APPROVAL
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px] flex items-center gap-1">
            <XCircle className="w-3 h-3" /> REJECTED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
            {status}
          </span>
        );
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1a263d]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            Product Catalog Workspace
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Create products, configure technical specifications, and submit for publishing review
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0c1424] border border-[#1a263d] text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0c1424] border border-[#1a263d] text-xs text-slate-200 focus:outline-none"
          >
            <option value="">All Publishing Statuses</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-[#0c1424] border border-[#1a263d] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#080d18] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1a263d]">
              <tr>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category & Brand</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Available Stock</th>
                <th className="px-6 py-4">Publishing Status</th>
                <th className="px-6 py-4 text-right">3D Asset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a263d]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500 font-mono">
                    Loading catalog items...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500 font-mono">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            p.images?.[0]?.image_url ||
                            'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=200&q=80'
                          }
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800"
                        />
                        <div>
                          <div className="font-semibold text-slate-200">{p.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                            {p.short_description || p.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-cyan-400">
                      {p.sku}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-slate-200">{p.category?.name || 'General'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.brand?.name || 'Standard'}</div>
                    </td>

                    <td className="px-6 py-4 font-mono">
                      <div className="text-emerald-400 font-bold">
                        ₹{(p.discount_price || p.regular_price).toLocaleString('en-IN')}
                      </div>
                      {p.discount_price && (
                        <div className="text-[10px] text-slate-500 line-through">
                          ₹{p.regular_price.toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          p.stock_quantity <= 3
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {p.stock_quantity} units
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(p.status)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {p.model_3d_url ? (
                        <span className="px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono text-[10px] inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> 3D GLB Ready
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">2D Standard</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0c1424] border border-emerald-500/30 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="font-bold text-white text-base font-display flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                Add New Enterprise Product
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                    placeholder="Razer Blade 18 Gaming Rig"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">SKU Number</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200 font-mono"
                    placeholder="RZ-BLD18-2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Brand</label>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Regular Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.regular_price}
                    onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200 font-mono"
                    placeholder="250000"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Discount Price (₹)</label>
                  <input
                    type="number"
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200 font-mono"
                    placeholder="230000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Initial Stock Units</label>
                  <input
                    type="number"
                    required
                    value={formData.initial_stock}
                    onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200 font-mono"
                    placeholder="10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 font-mono mb-1">3D Model Asset URL (.glb / .gltf)</label>
                  <input
                    type="url"
                    value={formData.model_3d_url}
                    onChange={(e) => setFormData({ ...formData, model_3d_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200 font-mono"
                    placeholder="https://.../model.glb (or leave blank for procedural fallback)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Product Showcase Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#080d18] border border-slate-700 text-slate-200"
                  placeholder="High-performance thermal architecture engineered for..."
                />
              </div>

              {/* Dynamic Specifications Editor */}
              <div className="p-4 rounded-xl bg-[#080d18] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono uppercase font-semibold text-slate-300 text-[11px]">
                    Technical Specifications
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Spec
                  </button>
                </div>

                {specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Key (e.g. GPU)"
                      value={spec.spec_key}
                      onChange={(e) => handleSpecChange(i, 'spec_key', e.target.value)}
                      className="w-1/3 px-2.5 py-1.5 rounded-lg bg-[#0c1424] border border-slate-700 text-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. RTX 4090 24GB)"
                      value={spec.spec_value}
                      onChange={(e) => handleSpecChange(i, 'spec_value', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0c1424] border border-slate-700 text-slate-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(i)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-950 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit for Admin Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
