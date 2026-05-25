import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (refresh) {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh });
          localStorage.setItem('access_token', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        }
      } catch (err) {
        // Refresh token expired too, clear storage and redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: async (email, password) => {
    const res = await api.post('/auth/token/', { email, password });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data.user;
  },
  logout: () => {
    localStorage.clear();
    window.location.href = '/login';
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export const records = {
  getStats: async () => {
    const res = await api.get('/records/dashboard/stats/');
    return res.data;
  },
  getList: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.scope) params.append('scope', filters.scope);
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.location) params.append('location', filters.location);
    
    const res = await api.get(`/records/review/?${params.toString()}`);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.patch(`/records/review/${id}/`, data);
    return res.data;
  },
  approve: async (id) => {
    const res = await api.post(`/records/review/${id}/approve/`);
    return res.data;
  },
  reject: async (id, comments) => {
    const res = await api.post(`/records/review/${id}/reject/`, { comments });
    return res.data;
  },
  flag: async (id, reason) => {
    const res = await api.post(`/records/review/${id}/flag/`, { reason });
    return res.data;
  }
};

export const ingestion = {
  getSources: async () => {
    const res = await api.get('/ingest/sources/');
    return res.data;
  },
  createSource: async (data) => {
    const res = await api.post('/ingest/sources/', data);
    return res.data;
  },
  getUploads: async () => {
    const res = await api.get('/ingest/uploads/');
    return res.data;
  },
  uploadFile: async (dataSourceId, file) => {
    const formData = new FormData();
    formData.append('data_source', dataSourceId);
    formData.append('file', file);
    
    const res = await api.post('/ingest/ingest/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  }
};

export const audit = {
  getLogs: async () => {
    const res = await api.get('/audit/logs/');
    return res.data;
  }
};

export default api;
