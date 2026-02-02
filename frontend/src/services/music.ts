import { apiService } from './api';
import type { MusicTrack } from '../types';

export const musicService = {
  async getAllTracks(): Promise<MusicTrack[]> {
    return apiService.get<MusicTrack[]>('/music');
  },

  async getTrackById(id: string): Promise<MusicTrack> {
    return apiService.get<MusicTrack>(`/music/${id}`);
  },

  async createTrack(trackData: Omit<MusicTrack, 'id' | 'createdAt' | 'updatedAt' | 'playCount'>): Promise<MusicTrack> {
    return apiService.post<MusicTrack>('/music', trackData);
  },

  async updateTrack(id: string, trackData: Partial<MusicTrack>): Promise<MusicTrack> {
    return apiService.patch<MusicTrack>(`/music/${id}`, trackData);
  },

  async deleteTrack(id: string): Promise<void> {
    await apiService.delete(`/music/${id}`);
  },

  async incrementPlayCount(id: string): Promise<void> {
    // This would typically be a separate endpoint, but for now we'll use the update endpoint
    const track = await this.getTrackById(id);
    await this.updateTrack(id, { playCount: track.playCount + 1 });
  }
};