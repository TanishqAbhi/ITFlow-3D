import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  subtotal: 0.0,
  tax: 0.0,
  shipping: 0.0,
  discount: 0.0,
  total: 0.0,
  coupon: null,
  loading: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action) => {
      const data = action.payload;
      state.items = data.items || [];
      state.subtotal = data.subtotal || 0.0;
      state.tax = data.tax || 0.0;
      state.shipping = data.shipping || 0.0;
      state.discount = data.discount || 0.0;
      state.total = data.total || 0.0;
    },
    setCoupon: (state, action) => {
      state.coupon = action.payload;
      if (action.payload) {
        state.discount = action.payload.discount_amount || 0.0;
        state.total = Math.max(0, state.subtotal - state.discount + state.tax + state.shipping);
      }
    },
    removeCoupon: (state) => {
      state.coupon = null;
      state.discount = 0.0;
      state.total = state.subtotal + state.tax + state.shipping;
    },
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0.0;
      state.tax = 0.0;
      state.shipping = 0.0;
      state.discount = 0.0;
      state.total = 0.0;
      state.coupon = null;
    },
    setCartLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setCart, setCoupon, removeCoupon, clearCart, setCartLoading } = cartSlice.actions;
export default cartSlice.reducer;
