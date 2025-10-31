import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { refreshAccessToken } from "@/lib/api/auth";

const ACCESS_TOKEN_KEY = "myVOD_access_token";
const REFRESH_TOKEN_KEY = "myVOD_refresh_token";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Setup Axios interceptors for automatic token refresh.
 * This function should be called once during app initialization.
 */
export function setupAxiosInterceptors(
  axiosInstance: AxiosInstance,
  onLogout: () => void
) {
  // Request interceptor: Add access token to requests
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      
      // Don't add token to login, register, refresh, or public endpoints
      const isAuthEndpoint =
        config.url?.includes("/token/") ||
        config.url?.includes("/register/") ||
        config.url?.includes("/platforms/");

      if (token && !isAuthEndpoint) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor: Handle 401 errors and refresh token
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // If error is not 401 or request already retried, reject
      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      // Don't retry login or register requests
      if (
        originalRequest.url?.includes("/token/") ||
        originalRequest.url?.includes("/register/")
      ) {
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        isRefreshing = false;
        onLogout();
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the access token
        const { access: newAccessToken } = await refreshAccessToken(refreshToken);
        
        // Update localStorage and context
        localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
        
        // Update the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Process all queued requests
        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh token is invalid or expired - logout user
        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;
        onLogout();
        return Promise.reject(refreshError);
      }
    }
  );
}

