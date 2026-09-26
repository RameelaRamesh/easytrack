import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const sessionKey = sessionStorage.getItem('session_key');
    if (sessionKey) {
      config.headers['X-Session-Key'] = sessionKey;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle 401s and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = sessionStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${baseURL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newToken = res.data.access;
          sessionStorage.setItem('access_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          sessionStorage.clear();
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
