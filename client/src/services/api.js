import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    
    if (config.url.startsWith('/api/admin') && adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const message = error.response?.data?.message || error.message;
    
    console.error(`🌐 API ERROR [${status || 'NETWORK'}]:`, {
        url,
        message,
        data: error.response?.data
    });

    // Handle session expiry
    if (status === 401) {
      if (url?.startsWith('/api/admin')) {
        localStorage.removeItem('adminToken');
      } else {
        localStorage.removeItem('token');
      }
      
      // Only redirect if not already on login and not a background fetch
      if (!window.location.pathname.includes('/login') && !error.config?._isRetry) {
          window.location.href = '/login?expired=true';
      }
    }

    // Handle Server Crashes (500)
    if (status === 500) {
        console.error("CRITICAL: Server-side failure detected at", url);
    }

    return Promise.reject({
        ...error,
        userMessage: message || "A network error occurred. Please check your connection."
    });
  }
);

export default api;
