import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';

export const API_BASE_URL = import.meta.env.VITE_API_URL;
export const API_REFRESH_URL = import.meta.env.VITE_API_REFRESH_URL;

if (!API_BASE_URL) {
  throw new Error(
    'Missing required environment variable: VITE_API_URL. Please define VITE_API_URL in your environment configuration.'
  );
}

if (!API_REFRESH_URL) {
  throw new Error(
    'Missing required environment variable: VITE_API_REFRESH_URL. Please define VITE_API_REFRESH_URL in your environment configuration.'
  );
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('atelier_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Keep track of refresh state to avoid multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle Token Expiration & Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if error is due to expired access token
    if (
      error.response?.status === 401 &&
      error.response?.data?.errorCode === 'ERR_TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem('atelier_refresh_token');
        const refreshResponse = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          API_REFRESH_URL,
          storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.data.accessToken;
        const newRefreshToken = refreshResponse.data.data.refreshToken;

        localStorage.setItem('atelier_token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('atelier_refresh_token', newRefreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('atelier_token');
        localStorage.removeItem('atelier_refresh_token');
        localStorage.removeItem('atelier_user');
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
