import { apiService } from './api';
import type { AuthResponse, LoginCredentials, User } from '../types';

export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    if (response.access_token) {
      this.setToken(response.access_token);
      // Store user data for fallback on page refresh
      const userData = response.data?.user || response.user;
      if (userData) {
        this.setUser(userData);
      }
    }
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } finally {
      // Always clear token and user, even if logout request fails
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

  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    apiService.clearToken();
  }
}

export const authService = new AuthService();