import axios from "axios";
import { auth } from "../firebase/config";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

// Wait for Firebase to resolve current user, then get a fresh token
function waitForToken() {
  return new Promise((resolve) => {
    // If already signed in, get token immediately
    if (auth.currentUser) {
      resolve(auth.currentUser.getIdToken());
      return;
    }
    // Otherwise wait for auth state to settle (fires once on init)
    const unsub = auth.onAuthStateChanged(async (user) => {
      unsub();
      if (user) {
        resolve(await user.getIdToken());
      } else {
        resolve(null);
      }
    });
  });
}

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const token = await waitForToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, force-refresh token once and retry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && auth.currentUser) {
      original._retry = true;
      const token = await auth.currentUser.getIdToken(true);
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    }
    return Promise.reject(error);
  }
);

export const twoFaApi = {
  setup: () => api.post("/2fa/setup"),
  verify: (otp) => api.post("/2fa/verify", { otp }),
  validateLogin: (otp) => api.post("/2fa/validate-login", { otp }),
  disable: () => api.post("/2fa/disable"),
  status: () => api.get("/2fa/status"),
};

export const fileOpsApi = {
  encryptText: (text) => api.post("/fileops/encrypt-text", { text }),
  decryptText: (token) => api.post("/fileops/decrypt-text", { token }),
  applyEncryption: (id, original_text, encrypted_token) =>
    api.post(`/fileops/apply-encryption/${id}`, { original_text, encrypted_token }),
  applyDecryption: (id, token, plaintext) =>
    api.post(`/fileops/apply-decryption/${id}`, { original_text: token, encrypted_token: plaintext }),
  getContent: (id) => api.get(`/fileops/content/${id}`),
  lock: (id, password) => api.post(`/fileops/lock/${id}`, { password }),
  unlock: (id, password) => api.post(`/fileops/unlock/${id}`, { password }),
  convert: (id, target_format) =>
    api.post(`/fileops/convert/${id}`, { target_format }, { responseType: "blob" }),
  downloadProtected: (id, password) =>
    api.post(`/fileops/download-protected/${id}`, { password }, { responseType: "blob" }),
  downloadZip: (doc_ids, password = "") =>
    api.post("/fileops/download-zip", { doc_ids, password }, { responseType: "blob" }),
};

export const documentsApi = {
  upload: (formData) => api.post("/documents/upload", formData),
  list: () => api.get("/documents"),
  get: (id) => api.get(`/documents/${id}`),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: "blob" }),
  delete: (id) => api.delete(`/documents/${id}`),
};

export const queryApi = {
  query: (data) => api.post("/query/query", data),
  summarize: (data) => api.post("/query/summarize", data),
};

export const analyticsApi = {
  summary: () => api.get("/analytics/summary"),
  trending: () => api.get("/analytics/trending"),
};

export default api;
