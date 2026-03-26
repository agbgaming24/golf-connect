import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5000/api';

const API_BASE_URL = (() => {
  const normalized = rawBaseUrl.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
})();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => {
    if (response?.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      if (window.location.pathname !== '/') {
        window.location.replace('/');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
