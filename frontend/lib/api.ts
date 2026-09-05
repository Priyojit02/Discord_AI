import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
    if (!token) {
      try {
        const stored = localStorage.getItem('discord-auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          token = parsed?.state?.token || null;
          if (token) localStorage.setItem('token', token);
        }
      } catch {}
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isAuthPage = path.startsWith('/login') || path.startsWith('/register');
      // Only redirect if user was performing an authenticated action and is not on auth pages
      if (!isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('discord-auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
