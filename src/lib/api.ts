import axios from "axios";

export const SESSION_TOKEN_KEY = "willow_admin_access_token";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3005/api/admin",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export default api;
