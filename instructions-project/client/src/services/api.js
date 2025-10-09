import axios from 'axios';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === '192.168.2.16' ? 'http://192.168.2.16:5000/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para logging (desenvolvimento)
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.message);
    return Promise.reject(error);
  }
);

// ===== PROJECTS API =====
export const projectsAPI = {
  // GET /api/projects
  getAll: async (params = {}) => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  // GET /api/projects/stats
  getStats: async () => {
    const response = await api.get('/projects/stats');
    return response.data;
  },

  // GET /api/projects/:id
  getById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // POST /api/projects
  create: async (data) => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  // PUT /api/projects/:id
  update: async (id, data) => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  // DELETE /api/projects/:id
  delete: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // PATCH /api/projects/:id/status
  updateStatus: async (id, status) => {
    const response = await api.patch(`/projects/${id}/status`, { status });
    return response.data;
  },

  // PATCH /api/projects/:id/favorite
  toggleFavorite: async (id) => {
    const response = await api.patch(`/projects/${id}/favorite`);
    return response.data;
  },
};

// ===== DECORATIONS API =====
export const decorationsAPI = {
  // GET /api/decorations
  getAll: async (params = {}) => {
    const response = await api.get('/decorations', { params });
    return response.data;
  },

  // GET /api/decorations/search?q=query
  search: async (query) => {
    const response = await api.get('/decorations/search', { params: { q: query } });
    return response.data;
  },

  // GET /api/decorations/categories
  getCategories: async () => {
    const response = await api.get('/decorations/categories');
    return response.data;
  },

  // GET /api/decorations/:id
  getById: async (id) => {
    const response = await api.get(`/decorations/${id}`);
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const healthUrl = window.location.hostname === '192.168.2.16' ? 'http://192.168.2.16:5000/health' : 'http://localhost:5000/health';
    const response = await axios.get(healthUrl);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'ERROR', database: 'Disconnected' };
  }
};

export default api;

