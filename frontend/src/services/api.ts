import axios from "axios";

import { getStoredAuthToken } from "../utils/auth-storage";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";

export const api = axios.create({
  baseURL
});

api.interceptors.request.use((config) => {
  const token = getStoredAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
