import axios from 'axios';

// ══════════════════════════════════════════════════════
// CHANGE THIS ONE LINE for each environment:
//
// Local dev:    'https://web-production-e6e97.up.railway.app/api'
// ngrok (PFE):  'https://xxxx.ngrok-free.app/api'
// ══════════════════════════════════════════════════════
const BASE_URL = 'https://web-production-e6e97.up.railway.app/api';
const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
