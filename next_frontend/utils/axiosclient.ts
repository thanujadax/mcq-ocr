import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!BACKEND_URL) {
  throw new Error(
    "NEXT_PUBLIC_BACKEND_URL is not set. It must be defined at build time."
  );
}

const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if this is a 401 error and not already a retry attempt
    // Also exclude auth endpoints (login, register, refresh) to prevent infinite loops
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/api/auth/refresh") &&
      !originalRequest?.url?.includes("/api/auth/login") &&
      !originalRequest?.url?.includes("/api/auth/register")
    ) {
      originalRequest._retry = true;

      try {
        // Make the refresh request with a flag to prevent interceptor loops
        await axios.post(
          `${BACKEND_URL}/api/auth/refresh`,
          {},
          {
            withCredentials: true,
          }
        );

        // If refresh was successful, retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to signin
        if (
          typeof window !== "undefined" &&
          !window.location.href.includes("/auth")
        ) {
          window.location.href = "/auth/signin";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
