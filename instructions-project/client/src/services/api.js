import axios from 'axios';

// Configuração base da API
// Preferimos caminho relativo para funcionar com o proxy do Vite
// e evitar CORS/portas diferentes (ex.: quando o Vite alterna 3003→3005).
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Attach Clerk session token to requests when available
api.interceptors.request.use(async (config) => {
  try {
    const clerk = window?.Clerk;
    const session = clerk?.session;
    if (session) {
      const token = await session.getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    // silent
  }
  return config;
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

  // PATCH /api/projects/:id/canvas - Atualizar dados do canvas
  updateCanvas: async (id, data) => {
    const response = await api.patch(`/projects/${id}/canvas`, data);
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

// ===== PRODUCTS API =====
export const productsAPI = {
  // GET /api/products
  getAll: async (params = {}) => {
    console.log('🌐 [API Client] productsAPI.getAll chamado com params:', params);
    try {
      const response = await api.get('/products', { params });
      console.log('🌐 [API Client] Response recebida:', {
        status: response.status,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
        firstItem: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null
      });
      return response.data;
    } catch (error) {
      console.error('❌ [API Client] Erro ao chamar productsAPI.getAll:', error);
      console.error('❌ [API Client] Erro detalhado:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // GET /api/products/:id
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // GET /api/products/source-images
  getSourceImages: async () => {
    const response = await api.get('/products/source-images');
    return response.data;
  },

  // GET /api/products/colors
  getAvailableColors: async () => {
    const response = await api.get('/products/colors');
    return response.data;
  },

  // GET /api/products/search?q=query
  search: async (query) => {
    const response = await api.get('/products/search', { params: { q: query } });
    return response.data;
  },

  // POST /api/products
  create: async (data) => {
    var formData = new FormData();
    
    // Adicionar campos de texto
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        // Ignorar campos de ficheiro (serão adicionados separadamente)
        if (key === 'dayImage' || key === 'nightImage' || key === 'animation' || key === 'thumbnail' || key === 'colorImages') {
          continue;
        }
        
        // Ignorar valores null ou undefined (não adicionar ao FormData)
        if (data[key] === null || data[key] === undefined) {
          continue;
        }
        
        // Adicionar campo ao FormData
        if (typeof data[key] === 'object' && data[key] !== null) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    }
    
    // Adicionar ficheiros se existirem
    if (data.dayImage) formData.append('dayImage', data.dayImage);
    if (data.nightImage) formData.append('nightImage', data.nightImage);
    if (data.animation) formData.append('animation', data.animation);
    if (data.thumbnail) formData.append('thumbnail', data.thumbnail);
    if (data.colorImages && Array.isArray(data.colorImages)) {
      for (var i = 0; i < data.colorImages.length; i++) {
        formData.append('colorImages', data.colorImages[i]);
      }
    }
    
    const response = await api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // PUT /api/products/:id
  update: async (id, data) => {
    var formData = new FormData();
    
    // Adicionar campos de texto
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        // Ignorar campos de ficheiro (serão adicionados separadamente)
        if (key === 'dayImage' || key === 'nightImage' || key === 'animation' || key === 'thumbnail' || key === 'colorImages') {
          continue;
        }
        
        // Ignorar valores null ou undefined (não adicionar ao FormData)
        if (data[key] === null || data[key] === undefined) {
          continue;
        }
        
        // Adicionar campo ao FormData
        if (typeof data[key] === 'object' && data[key] !== null) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    }
    
    // Adicionar ficheiros se existirem
    if (data.dayImage) formData.append('dayImage', data.dayImage);
    if (data.nightImage) formData.append('nightImage', data.nightImage);
    if (data.animation) formData.append('animation', data.animation);
    if (data.thumbnail) formData.append('thumbnail', data.thumbnail);
    if (data.colorImages && Array.isArray(data.colorImages)) {
      for (var i = 0; i < data.colorImages.length; i++) {
        formData.append('colorImages', data.colorImages[i]);
      }
    }
    
    const response = await api.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // DELETE /api/products/:id
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // PATCH /api/products/:id/archive
  archive: async (id) => {
    const response = await api.patch(`/products/${id}/archive`);
    return response.data;
  },

  // PATCH /api/products/:id/unarchive
  unarchive: async (id) => {
    const response = await api.patch(`/products/${id}/unarchive`);
    return response.data;
  },

  // POST /api/upload/product-images
  uploadImages: async (formData) => {
    const response = await api.post('/upload/product-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  try {
    // Usa proxy do Vite quando em dev; mantém possibilidade de override via VITE_API_URL
    const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
    const url = base ? `${base.replace(/\/api$/, '')}/health` : '/health';
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'ERROR', database: 'Disconnected' };
  }
};

export default api;

