import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCart } from '../../store/cartSlice';
import { showToast } from '../../store/uiSlice';
import ProductViewer3D from '../../components/3d/ProductViewer3D';
import api from '../../services/api';
import {
  Sparkles,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Check,
  Plus,
  Minus,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

export default function ProductDetail3D() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMediaTab, setActiveMediaTab] = useState('3d'); // '3d' | 'gallery'
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // Review Form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/store/products/${slug}`);
      setProduct(res.data);
      if (res.data.images && res.data.images.length > 0) {
        setSelectedImage(res.data.images[0].image_url);
      }
    } catch (err) {
      console.error('Failed to load product detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [slug]);

  const handleAddToCart = async (redirectCheckout = false) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      const res = await api.post('/cart/items', {
        product_id: product.id,
        quantity: quantity,
      });
      dispatch(setCart(res.data));
      dispatch(showToast({ message: `Added ${quantity} × ${product.name} to cart.`, type: 'success' }));
      if (redirectCheckout) {
        navigate('/checkout');
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add product to cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        product_id: product.id,
        rating: reviewRating,
        title: reviewTitle || undefined,
        comment: reviewComment,
      });
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewComment('');
      dispatch(showToast({ message: 'Review submitted successfully!', type: 'success' }));
      fetchDetail();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-slate-400">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="font-mono text-xs">Loading Interactive 3D Model...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold text-white">Product Not Found</h2>
        <Link to="/store" className="text-xs text-cyan-400 font-mono mt-2 inline-block">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const effectivePrice = product.discount_price || product.regular_price;
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 font-sans">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link to="/" className="hover:text-cyan-400">Home</Link>
        <span>/</span>
        <Link to="/store" className="hover:text-cyan-400">Store</Link>
        <span>/</span>
        <span className="text-slate-200 truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Grid: 3D Canvas / Gallery on Left, Specs & Buy Box on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: 3D Viewer & Media Gallery */}
        <div className="lg:col-span-7 space-y-4">
          {/* Media Viewport */}
          <div className="h-[480px] sm:h-[540px] w-full relative">
            {activeMediaTab === '3d' ? (
              <ProductViewer3D
                modelUrl={product.model_3d_url}
                fallbackImage={product.images?.[0]?.image_url}
              />
            ) : (
              <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center p-6">
                <img
                  src={selectedImage || product.images?.[0]?.image_url}
                  alt={product.name}
                  className="max-h-[440px] object-contain rounded-xl shadow-2xl"
                />
              </div>
            )}
          </div>

          {/* Toggle Media Tabs & Thumbnails */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveMediaTab('3d')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                  activeMediaTab === '3d'
                    ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive 3D WebGL</span>
              </button>

              <button
                onClick={() => setActiveMediaTab('gallery')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                  activeMediaTab === 'gallery'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>HD Photo Gallery</span>
              </button>
            </div>

            {/* Image Thumbnails if in gallery mode */}
            {activeMediaTab === 'gallery' && product.images?.length > 1 && (
              <div className="flex items-center gap-2">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`w-10 h-10 rounded-lg overflow-hidden border transition-all ${
                      selectedImage === img.image_url ? 'border-cyan-400 scale-105' : 'border-slate-800 opacity-60'
                    }`}
                  >
                    <img src={img.image_url} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Product Info, Buy Controls & Specs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
                {product.brand?.name} • SKU: {product.sku}
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{product.rating || '4.9'} ({product.review_count || 12} reviews)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight leading-snug">
              {product.name}
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              {product.short_description || product.description}
            </p>
          </div>

          {/* Pricing Box */}
          <div className="p-5 rounded-2xl glass-card space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold font-mono text-white">
                ₹{effectivePrice.toLocaleString('en-IN')}
              </span>
              {product.discount_price && (
                <>
                  <span className="text-sm font-mono text-slate-500 line-through">
                    ₹{product.regular_price.toLocaleString('en-IN')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-xs font-mono font-bold">
                    Save ₹{(product.regular_price - product.discount_price).toLocaleString('en-IN')}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <span className="text-slate-400">Inventory Status:</span>
              {isOutOfStock ? (
                <span className="text-rose-400 font-bold">Out of Stock</span>
              ) : product.stock_quantity <= 3 ? (
                <span className="text-amber-400 font-bold">Low Stock ({product.stock_quantity} units remaining)</span>
              ) : (
                <span className="text-emerald-400 font-bold">In Stock ({product.stock_quantity} available)</span>
              )}
            </div>
          </div>

          {/* Quantity & Buy Action Buttons */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2 text-slate-400 hover:text-white disabled:opacity-30"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-mono font-bold text-xs text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={quantity >= product.stock_quantity || isOutOfStock}
                  className="p-2 text-slate-400 hover:text-white disabled:opacity-30"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => handleAddToCart(false)}
                disabled={adding || isOutOfStock}
                className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4 text-cyan-400" />
                <span>{adding ? 'Adding...' : 'Add to Shopping Cart'}</span>
              </button>
            </div>

            <button
              onClick={() => handleAddToCart(true)}
              disabled={isOutOfStock}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-xl shadow-indigo-950 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>Instant Express Checkout</span>
            </button>
          </div>

          {/* Guarantees & Shipping Strip */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-2 gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>2-Year Manufacturer Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Free Express Insured Air Shipping</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED TECHNICAL SPECIFICATIONS */}
      <section className="space-y-4 pt-6">
        <h2 className="text-xl font-bold text-white font-display tracking-tight border-b border-slate-800 pb-3">
          Technical Specifications
        </h2>

        {product.specifications && product.specifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.specifications.map((spec) => (
              <div
                key={spec.id}
                className="p-3.5 rounded-xl glass-card flex items-center justify-between text-xs"
              >
                <span className="text-slate-400 font-mono font-medium">{spec.spec_key}</span>
                <span className="text-slate-100 font-semibold text-right max-w-xs">{spec.spec_value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-mono">Full hardware specifications available on packaging.</p>
        )}
      </section>

      {/* VERIFIED REVIEWS & RATINGS */}
      <section className="space-y-6 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-display tracking-tight">
              Customer Reviews
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Verified customer feedback and real-world performance tests
            </p>
          </div>

          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Review Form Drawer */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="p-6 rounded-2xl glass-card space-y-4 text-xs max-w-xl">
            <h3 className="font-bold text-white text-sm font-display">Write Verified Product Review</h3>

            <div>
              <label className="block text-slate-400 font-mono mb-1">Rating (1 to 5 Stars)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-mono mb-1">Review Headline</label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Insane 4K performance, runs cool under load..."
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono mb-1">Detailed Feedback</label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="The build quality is outstanding. 3D viewer accurately represented the port layout..."
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
