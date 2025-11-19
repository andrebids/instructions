import axios from 'axios';

// Configuração base da API
// Preferimos caminho relativo para funcionar com o proxy do Vite
// e evitar CORS/portas diferentes (ex.: quando o Vite alterna 3003→3005).
// IMPORTANTE: Em produção, sempre usar caminho relativo para evitar problemas de CSP
const isDev = import.meta.env.DEV;
let API_BASE_URL;

if (isDev) {
  // Em desenvolvimento, usar VITE_API_URL se disponível, senão usar caminho relativo
  API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  // Garantir que baseURL sempre termina sem barra e começa com /api se não especificado
  if (!API_BASE_URL) {
    API_BASE_URL = '/api';
  } else {
    // Remover barra final se existir
    API_BASE_URL = API_BASE_URL.replace(/\/$/, '');
    // Se não começar com /api e for um caminho relativo, adicionar /api
    if (!API_BASE_URL.startsWith('http') && !API_BASE_URL.startsWith('/api')) {
      API_BASE_URL = '/api';
    }
  }
} else {
  // Em produção, SEMPRE usar caminho relativo para evitar problemas de CSP
  // Isso garante que funcione com a mesma origem (https://thecore.dsproject.pt)
  API_BASE_URL = '/api';
}

// Debug: Log da configuração da API (temporário para debug)
if (typeof window !== 'undefined') {
  console.log('🔧 [API Config]', {
    DEV: import.meta.env.DEV,
    MODE: import.meta.env.MODE,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    API_BASE_URL: API_BASE_URL,
    location: window.location.origin
  });
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
  withCredentials: true, // IMPORTANTE: Enviar cookies para Auth.js funcionar
});

// Função auxiliar para validar AbortSignal
const isValidAbortSignal = (signal) => {
  return signal &&
    typeof signal === 'object' &&
    typeof signal.addEventListener === 'function' &&
    typeof signal.abort === 'function';
};

// Attach authentication token to requests (Auth.js)
api.interceptors.request.use(async (config) => {
  try {
    // Usar caminho relativo em produção para evitar problemas de CSP
    // Em dev, usar VITE_API_URL se disponível, senão usar caminho relativo
    const isDev = import.meta.env.DEV;
    let sessionUrl;

    if (isDev && import.meta.env.VITE_API_URL) {
      // Em desenvolvimento, usar VITE_API_URL se configurado
      const apiUrl = import.meta.env.VITE_API_URL;
      const baseUrl = apiUrl.replace('/api', ''); // Remover /api para obter base URL
      sessionUrl = `${baseUrl}/auth/session`;
    } else {
      // Em produção ou quando VITE_API_URL não está definido, usar caminho relativo
      // Isso garante que funcione com a mesma origem (evita problemas de CSP)
      sessionUrl = '/auth/session';
    }

    const response = await fetch(sessionUrl, {
      credentials: 'include',
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const session = await response.json();
        // Auth.js usa cookies para sessão, não precisa de token Bearer
        // Mas podemos adicionar headers customizados se necessário
        if (session?.user) {
          config.headers = config.headers || {};
          // Auth.js gerencia autenticação via cookies automaticamente
        }
      } else {
        // Se não for JSON, pode ser HTML (erro 404 ou página de erro)
        console.debug('Resposta Auth.js não é JSON');
      }
    }
  } catch (e) {
    // silent
  }

  // Validar signal antes de fazer a requisição
  if (config.signal && !isValidAbortSignal(config.signal)) {
    console.warn('⚠️ Invalid AbortSignal detected, removing from config:', config.signal);
    delete config.signal;
  }

  // Debug: Log da URL final para verificar se baseURL está sendo aplicado
  const finalURL = config.baseURL && config.url
    ? `${config.baseURL}${config.url.startsWith('/') ? '' : '/'}${config.url}`
    : config.url;
  if (config.url?.includes('/users')) {
    console.log('🔍 [API Debug] Request URL:', {
      baseURL: config.baseURL,
      url: config.url,
      finalURL: finalURL,
      method: config.method
    });
  }

  return config;
});

// Interceptor para logging (apenas erros)
api.interceptors.response.use(
  (response) => {
    // Logs removidos - apenas erros são logados
    return response;
  },
  (error) => {
    // Ignorar logs de requisições abortadas/canceladas (não são erros reais)
    const isCanceled =
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_CANCELED' ||
      error.name === 'AbortError' ||
      error.name === 'CanceledError' ||
      error.message === 'Request aborted' ||
      error.message === 'canceled' ||
      error.message?.includes('aborted') ||
      error.message?.includes('canceled');

    if (!isCanceled) {
      const status = error.response?.status;
      const url = error.config?.url;
      const method = error.config?.method?.toUpperCase();

      // Tratamento especial para erro 403 (Forbidden)
      if (status === 403) {
        const errorData = error.response?.data;
        console.warn(`⚠️  ${method} ${url}: Acesso negado (403)`, {
          message: errorData?.message || error.message,
          error: errorData?.error,
          path: url
        });

        // Se for erro de autenticação, adicionar informação útil
        if (errorData?.message?.includes('autenticado') || errorData?.error === 'Não autenticado') {
          console.warn('💡 Dica: Verifique se está autenticado e se os cookies estão sendo enviados');
        }
      } else {
        console.error(`❌ ${method} ${url}:`, error.message);
      }
    }
    return Promise.reject(error);
  }
);

// ===== PROJECTS API =====
export const projectsAPI = {
  // GET /api/projects
  getAll: async (options = {}) => {
    const { signal, ...params } = options;
    const config = { params };
    if (signal && isValidAbortSignal(signal)) {
      config.signal = signal;
    }
    const response = await api.get('/projects', config);
    return response.data;
  },

  // GET /api/projects/stats
  getStats: async (options = {}) => {
    const { signal } = options;
    const config = {};
    if (signal && isValidAbortSignal(signal)) {
      config.signal = signal;
    }
    const response = await api.get('/projects/stats', config);
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

  // POST /api/projects/:id/images/upload - Upload de imagens para projeto
  uploadImages: async (projectId, files, cartoucheData = null) => {
    const formData = new FormData();

    // Adicionar arquivos
    if (Array.isArray(files)) {
      files.forEach((file) => {
        formData.append('images', file);
      });
    } else {
      formData.append('images', files);
    }

    // Adicionar metadados do cartouche se fornecidos
    if (cartoucheData) {
      formData.append('cartouche', JSON.stringify(cartoucheData));
    }

    const response = await api.post(`/projects/${projectId}/images/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      maxContentLength: 20 * 1024 * 1024, // 20MB (maior que 15MB para evitar erro 413)
      maxBodyLength: 20 * 1024 * 1024, // 20MB
      timeout: 60000, // 60 segundos para uploads grandes
    });
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

  // GET /api/decorations/search com suporte a filtros e paginação
  search: async (params = {}) => {
    const response = await api.get('/decorations/search', { params });
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
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      console.error('❌ [API Client] Erro ao chamar productsAPI.getAll:', error);
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

  // GET /api/products/categories
  getCategories: async () => {
    const response = await api.get('/products/categories');
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
        if (key === 'dayImage' || key === 'nightImage' || key === 'animation' || key === 'animationSimulation' || key === 'thumbnail' || key === 'colorImages') {
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
    if (data.animationSimulation) formData.append('animationSimulation', data.animationSimulation);
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
        if (key === 'dayImage' || key === 'nightImage' || key === 'animation' || key === 'animationSimulation' || key === 'thumbnail' || key === 'colorImages') {
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
    if (data.animationSimulation) formData.append('animationSimulation', data.animationSimulation);
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

// ===== EDITOR API =====
export const editorAPI = {
  // POST /api/upload/editor-image - Upload image for editor
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/editor-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      maxContentLength: 20 * 1024 * 1024, // 20MB (maior que 15MB para evitar erro 413)
      maxBodyLength: 20 * 1024 * 1024, // 20MB
      timeout: 60000, // 60 segundos para uploads grandes
    });
    return response.data;
  },
};

// ===== USERS API =====
export const usersAPI = {
  // GET /api/users
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // GET /api/users/:id
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // POST /api/users
  create: async (data) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  // POST /api/users/invite
  sendInvitation: async (email, role = 'comercial') => {
    const response = await api.post('/users/invite', { email, role });
    return response.data;
  },

  // PUT /api/users/:id/role
  updateRole: async (id, role) => {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  },

  // PUT /api/users/:id - Atualização geral de usuário
  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  // PUT /api/users/:id/password - Atualizar senha
  updatePassword: async (id, password) => {
    const response = await api.put(`/users/${id}/password`, { password });
    return response.data;
  },

  // PUT /api/users/:id/email - Atualizar email
  updateEmail: async (id, email) => {
    const response = await api.put(`/users/${id}/email`, { email });
    return response.data;
  },

  // PUT /api/users/:id/profile - Atualizar perfil (admin)
  updateUserProfile: async (id, profileData) => {
    const response = await api.put(`/users/${id}/profile`, profileData);
    return response.data;
  },

  // DELETE /api/users/:id
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // PUT /api/users/profile - Atualizar perfil do usuário
  updateProfile: async (name, image) => {
    const response = await api.put('/users/profile', { name, image });
    return response.data;
  },

  // POST /api/users/profile/avatar - Upload de imagem de perfil
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/users/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // POST /api/users/:id/avatar - Upload de avatar de usuário (admin)
  uploadUserAvatar: async (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post(`/users/${id}/avatar`, formData, {
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

