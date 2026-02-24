import { apiService } from './api';
import type { MusicApiResponse, MusicTrack } from '../types';

export const musicService = {
  async getAllTracks(): Promise<MusicApiResponse> {
    return apiService.get<MusicApiResponse>('/music');
  },

  async getTrackById(id: string | number): Promise<MusicTrack> {
    const response = await apiService.get<{ data: MusicTrack }>(`/music/${id}`);
    return response.data;
  },

  async createTrack(trackData: Omit<MusicTrack, 'id' | 'createdAt' | 'updatedAt' | 'playCount'>): Promise<MusicTrack> {
    const response = await apiService.post<{ data: MusicTrack }>('/music', trackData);
    return response.data;
  },

  async updateTrack(id: string | number, trackData: Partial<MusicTrack>): Promise<MusicTrack> {
    const response = await apiService.patch<{ data: MusicTrack }>(`/music/${id}`, trackData);
    return response.data;
  },

  async deleteTrack(id: string | number): Promise<void> {
    await apiService.delete(`/music/${id}`);
  },

  async incrementPlayCount(id: string | number): Promise<void> {
    await apiService.patch(`/music/${id}/play`);
  }
};