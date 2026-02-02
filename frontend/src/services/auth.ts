import { apiService } from './api';
import type { AuthResponse, LoginCredentials, User } from '../types';

export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } finally {
      // Always clear token, even if logout request fails
      this.clearToken();
    }
  }

  async getProfile(): Promise<User> {
    return apiService.get<User>('/auth/profile');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && token.length > 0;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    apiService.setToken(token);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    apiService.clearToken();
  }
}

export const authService = new AuthService();