
import axios from 'axios';

// Local development uses Vite proxy.
// Production uses the Render backend URL from VITE_API_URL.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('itflow_access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired access tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('itflow_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {
              refresh_token: refreshToken,
            }
          );

          const {
            access_token,
            refresh_token: newRefresh,
          } = res.data;

          localStorage.setItem('itflow_access_token', access_token);

          if (newRefresh) {
            localStorage.setItem('itflow_refresh_token', newRefresh);
          }

          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('itflow_access_token');
          localStorage.removeItem('itflow_refresh_token');
          localStorage.removeItem('itflow_user');

          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
