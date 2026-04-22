import axios from 'axios';

const api = axios.create({ 
  baseURL: `${import.meta.env.VITE_API_URL || 'https://fraud-backend-lb7d.onrender.com'}/api`,
  timeout: 10000 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  getSummary: () => api.get('/transactions/stats/summary'),
  ingest: (data) => api.post('/transactions/ingest', data),
  review: (id, data) => api.patch(`/transactions/${id}/review`, data),
};
export const fraudAPI = {
  getHighRiskUsers: (params) => api.get('/fraud/high-risk-users', { params }),
  getTrend: (params) => api.get('/fraud/trend', { params }),
  getDistribution: () => api.get('/fraud/distribution'),
};
export const caseAPI = {
  getAll: (params) => api.get('/cases', { params }),
  getById: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  update: (id, data) => api.patch(`/cases/${id}`, data),
};
export const graphAPI = {
  getUserGraph: (userId, depth) => api.get(`/graph/user/${userId}`, { params: { depth } }),
  getFraudRings: () => api.get('/graph/fraud-rings'),
};
export default api;
