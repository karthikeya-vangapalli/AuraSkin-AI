import axios from 'axios';

// Microservice Base URLs with development fallbacks
export const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8001';
export const PROFILE_SERVICE_URL = import.meta.env.VITE_PROFILE_SERVICE_URL || 'http://localhost:8002';
export const AI_SKIN_SERVICE_URL = import.meta.env.VITE_AI_SKIN_SERVICE_URL || 'https://auraskin-ai-skin-service.onrender.com';

export const getServiceBaseUrl = (url = '') => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return '';
  }
  if (
    url.startsWith('/api/v1/profile') || 
    url.startsWith('/api/v1/lifestyle') || 
    url.startsWith('/api/v1/progress')
  ) {
    return PROFILE_SERVICE_URL;
  }
  if (
    url.startsWith('/api/v1/skin') || 
    url.startsWith('/api/v1/ingredients') || 
    url.startsWith('/api/v1/products')
  ) {
    return AI_SKIN_SERVICE_URL;
  }
  if (
    url.startsWith('/api/v1/auth') || 
    url.startsWith('/api/v1/users') || 
    url.startsWith('/api/v1/clinical') || 
    url.startsWith('/api/v1/admin')
  ) {
    return USER_SERVICE_URL;
  }
  return USER_SERVICE_URL;
};

const API = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to auto-inject JWT Bearer token and route microservice base URL
API.interceptors.request.use(
  (config) => {
    if (config.url && !config.url.startsWith('http://') && !config.url.startsWith('https://')) {
      const serviceBase = getServiceBaseUrl(config.url);
      if (serviceBase) {
        config.baseURL = serviceBase;
      }
    }
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration (401)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      // Only purge credentials and redirect to login if 401 originates from auth verification
      const isAuthRoute = url.includes('/api/v1/auth/me') || url.includes('/api/v1/auth/refresh');
      if (isAuthRoute) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service Endpoints (User-Service)
export const authService = {
  login: async (credentials) => {
    const params = new URLSearchParams();
    params.append('username', credentials.email || credentials.username || '');
    params.append('password', credentials.password || '');

    const response = await API.post('/api/v1/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  register: async (userData) => {
    const response = await API.post('/api/v1/auth/register', userData);
    return response.data;
  },
  getMe: async () => {
    const response = await API.get('/api/v1/auth/me');
    return response.data;
  },
};

// User Management Service Endpoints (User-Service :8000)
export const userService = {
  getUsers: async (params = {}) => {
    const response = await API.get('/api/v1/users/', { params });
    return response.data;
  },
  getStatsSummary: async () => {
    const response = await API.get('/api/v1/users/stats/summary');
    return response.data;
  },
  updateRole: async (userId, role) => {
    const response = await API.patch(`/api/v1/users/${userId}/role`, { role });
    return response.data;
  },
  updateStatus: async (userId, isActive) => {
    const response = await API.put(`/api/v1/users/${userId}`, { is_active: isActive });
    return response.data;
  },
};

// Admin Assignment Service Endpoints (User-Service :8000)
export const assignmentService = {
  getAssignments: async (status = "active") => {
    const response = await API.get('/api/v1/admin/assignments/', { params: { status } });
    return response.data;
  },
  assignPatient: async (patientId, professionalId) => {
    const response = await API.post('/api/v1/admin/assignments/', {
      patient_id: patientId,
      professional_id: professionalId,
    });
    return response.data;
  },
  revokeAssignment: async (patientId, professionalId) => {
    const url = `/api/v1/admin/assignments/${patientId}`;
    const response = await API.delete(url);
    return response.data;
  },
};

// Skin Profile Service Endpoints (Profile-Service)
export const profileService = {
  getProfile: async (userId, customConfig = {}) => {
    const response = await API.get(`/api/v1/profile/${userId}`, customConfig);
    return response.data;
  },
  saveProfile: async (profileData, customConfig = {}) => {
    const config = { redirectOn401: true, ...customConfig };
    if (customConfig.headers) {
      config.headers = { ...customConfig.headers };
    }
    const response = await API.post('/api/v1/profile', profileData, config);
    return response.data;
  },
};

// Lifestyle Tracking Endpoints (Profile-Service)
export const lifestyleService = {
  logMetrics: async (metricsData, customConfig = {}) => {
    const config = { redirectOn401: true, ...customConfig };
    if (customConfig.headers) {
      config.headers = { ...customConfig.headers };
    }
    const response = await API.post('/api/v1/lifestyle', metricsData, config);
    return response.data;
  },
  getHistory: async (userId, startDate, endDate, limit = 30, customConfig = {}) => {
    const params = { limit };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const config = { params, ...customConfig };
    if (customConfig.headers) {
      config.headers = { ...customConfig.headers };
    }
    const response = await API.get(`/api/v1/lifestyle/${userId}/history`, config);
    return response.data;
  },
};

// Ingredient Intelligence Service Endpoints (ai-skin-service)
export const ingredientService = {
  analyze: async (ingredients, userAllergies = []) => {
    const response = await API.post('/api/v1/ingredients/analyze', {
      ingredients,
      user_allergies: userAllergies,
    });
    return response.data;
  },
};

// Product Recommendation Engine Endpoints (ai-skin-service)
export const recommendationService = {
  getRecommendations: async (skinProfile, budgetMax = 0, preferences = [], currentRoutineSteps = []) => {
    const response = await API.post('/api/v1/products/recommend', {
      skin_profile: skinProfile,
      budget_max: budgetMax,
      preferences: preferences,
      current_routine_steps: currentRoutineSteps,
    });
    return response.data;
  },
};

// Progress Tracking & Analytics Service Endpoints (profile-service :8002)
export const progressService = {
  logDailyProgress: async (progressData) => {
    const response = await API.post('/api/v1/progress/log', progressData);
    return response.data;
  },
  getTodayProgress: async () => {
    const response = await API.get('/api/v1/progress/today');
    return response.data;
  },
  getHistory: async (limit = 30) => {
    const response = await API.get(`/api/v1/progress/history?limit=${limit}`);
    return response.data;
  },
  getAnalytics: async () => {
    const response = await API.get('/api/v1/progress/analytics');
    return response.data;
  },
  uploadPhoto: async (photoData) => {
    const response = await API.post('/api/v1/progress/photo', photoData);
    return response.data;
  },
  getPhotos: async () => {
    const response = await API.get('/api/v1/progress/photos');
    return response.data;
  },
};

export default API;
export const aiSkinService = {
  assessTextual: async (data) => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token && token !== 'undefined' && token !== 'null') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await API.post('/api/v1/skin/assess-textual', data, { headers });
    return response.data;
  }
};
