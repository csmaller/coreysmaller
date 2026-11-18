import { apiService } from './api';

export interface HomeCopy {
  about: string;
  writing: string;
}

export const defaultHomeCopy: HomeCopy = {
  about: 'Corey Smaller plays music, skis, and writes about both. He grew up in Massachusetts, lived in Utah from 2006, and moved to Edwards, Colorado in 2026.',
  writing: 'The essays on this site are the outlet. He writes them the same way he writes lyrics: to find out what he actually thinks. The subjects are the music, the mountains, and a life spent between the two.',
};

export function homeParagraphs(value: string): string[] {
  return value.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

export const homeService = {
  async get(): Promise<HomeCopy> {
    const response = await apiService.get<{ data: HomeCopy }>('/home');
    return response.data;
  },

  async save(copy: HomeCopy): Promise<HomeCopy> {
    const response = await apiService.put<{ data: HomeCopy }>('/home', copy);
    return response.data;
  },
};
