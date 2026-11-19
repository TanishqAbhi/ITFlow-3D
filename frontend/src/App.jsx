import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import { wsService } from './services/websocket';
import { setNotifications } from './store/uiSlice';
import { setCart } from './store/cartSlice';
import api from './services/api';

export default function App() {
  const dispatch = useDispatch();
  const { token, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect to WebSocket notification bus
      wsService.connect(token);

      // Fetch user notifications
      api.get('/notifications')
        .then((res) => dispatch(setNotifications(res.data)))
        .catch(() => {});

      // If customer, fetch cart
      if (user?.role === 'CUSTOMER') {
        api.get('/cart')
          .then((res) => dispatch(setCart(res.data)))
          .catch(() => {});
      }
    } else {
      wsService.disconnect();
    }

    return () => {
      wsService.disconnect();
    };
  }, [isAuthenticated, token, user, dispatch]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
