import { apiService } from './api';
import type { AuthResponse, LoginCredentials, User } from '../types';

export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<any>('/auth/login', credentials);
    
    // Laravel returns: { data: { access_token, user, session_id }, success, statusCode, timestamp }
    const token = response.data?.access_token || response.access_token;
    const userData = response.data?.user || response.user;
    
    if (token) {
      this.setToken(token);
      if (userData) {
        this.setUser(userData);
      }
    }
    
    // Return normalized response
    return {
      access_token: token,
      user: userData,
      data: response.data
    };
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
    const response = await apiService.get<{ data?: User } & Partial<User>>('/auth/profile');
    const user: User = response?.data?.email ? response.data : response as User;
    this.setUser(user);
    return user;
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