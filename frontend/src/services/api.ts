// Base API service configuration
import { errorLogger } from '../utils/errorLogger';
import { apiErrorFromResponse } from './apiError';

const getApiBaseUrl = (): string => {
  // In test environment, use process.env or fallback
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return process.env.VITE_API_URL || 'http://localhost:3000/api';
  }
  
  // In browser environment, use import.meta.env
  if (typeof window !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  }
  
  // Fallback for other environments
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();
const TOKEN_KEY = 'auth_token';

export class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Always check localStorage for the latest token
    const currentToken = this.token || localStorage.getItem(TOKEN_KEY);
    
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          this.clearToken();
          const error = new Error('Authentication failed. Please log in again.');
          errorLogger.logApiError(endpoint, config.method || 'GET', response.status, error.message);
          throw error;
        }
        
        const apiError = await apiErrorFromResponse(response);

        // Log API error
        errorLogger.logApiError(endpoint, config.method || 'GET', response.status, apiError.message);

        throw apiError;
      }

      return response.json();
    } catch (error) {
      // Log network errors and other exceptions
      if (error instanceof Error) {
        if (!error.message.includes('API Error')) {
          errorLogger.logError(error, {
            type: 'network',
            endpoint,
            method: config.method || 'GET',
          });
        }
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();