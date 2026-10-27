import { apiService } from './api';

export interface SiteUser {
  id: number;
  email: string;
  role: string;
  createdAt?: string;
}

export const userService = {
  async list(): Promise<SiteUser[]> {
    const response = await apiService.get<{ data: SiteUser[] }>('/auth/users');
    return response.data;
  },

  async create(input: { email: string; password: string; role: 'guest' | 'admin' }): Promise<SiteUser> {
    const response = await apiService.post<{ data: SiteUser }>('/auth/users', input);
    return response.data;
  },
};
