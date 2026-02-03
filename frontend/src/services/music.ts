import { apiService } from './api';
import type { MusicApiResponse, MusicTrack } from '../types';

export const musicService = {
  async getAllTracks(): Promise<MusicApiResponse> {
    return apiService.get<MusicApiResponse>('/music');
  },

  async getTrackById(id: string | number): Promise<MusicTrack> {
    return apiService.get<MusicTrack>(`/music/${id}`);
  },

  async createTrack(trackData: Omit<MusicTrack, 'id' | 'createdAt' | 'updatedAt' | 'playCount'>): Promise<MusicTrack> {
    return apiService.post<MusicTrack>('/music', trackData);
  },

  async updateTrack(id: string | number, trackData: Partial<MusicTrack>): Promise<MusicTrack> {
    return apiService.patch<MusicTrack>(`/music/${id}`, trackData);
  },

  async deleteTrack(id: string | number): Promise<void> {
    await apiService.delete(`/music/${id}`);
  },

  async incrementPlayCount(id: string | number): Promise<void> {
    await apiService.patch(`/music/${id}/play`);
  }
};