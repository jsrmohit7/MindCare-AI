import axios from "axios";
import { ApiErrorResponse } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // watsonx inference may take up to 30s + extra buffers
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token if present in localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to clean up error structure and raise consistent errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "An unexpected network or server error occurred. Please try again.";
    let code = "UNKNOWN_ERROR";
    let details: unknown = null;

    if (error.response) {
      // Server returned a response outside 2xx status
      const errorData = error.response.data as ApiErrorResponse;
      if (errorData && errorData.error) {
        message = errorData.error.message || message;
        code = errorData.error.code || code;
        details = errorData.error.details || details;
      } else if (error.response.data && typeof error.response.data === "object") {
        // Fallback for standard FastAPI validation errors if interceptor failed
        const data = error.response.data as Record<string, unknown>;
        message = (data.detail as string) || message;
      }
    } else if (error.request) {
      // Request was sent but no reply was received
      message = "Unable to reach the MindCare server. Please check your connection.";
      code = "NETWORK_ERROR";
    }

    // Reject with a structured custom error object
    return Promise.reject({
      message,
      code,
      details,
      status: error.response?.status,
    });
  }
);
