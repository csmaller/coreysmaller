import { apiService } from './api';
import type { AudioContent } from '../types';

export const audioService = {
  async getAllAudio(): Promise<AudioContent[]> {
    return apiService.get<AudioContent[]>('/audio');
  },

  async getAudioById(id: number | string): Promise<AudioContent> {
    return apiService.get<AudioContent>(`/audio/${id}`);
  },

  async createAudio(audioData: Omit<AudioContent, 'id' | 'createdAt' | 'updatedAt' | 'playCount' | 'soundcloudId' | 'artwork'>): Promise<AudioContent> {
    return apiService.post<AudioContent>('/audio', audioData);
  },

  async updateAudio(id: number | string, audioData: Partial<AudioContent>): Promise<AudioContent> {
    return apiService.patch<AudioContent>(`/audio/${id}`, audioData);
  },

  async deleteAudio(id: number | string): Promise<void> {
    await apiService.delete(`/audio/${id}`);
  },

  async incrementPlayCount(id: number | string): Promise<AudioContent> {
    return apiService.post<AudioContent>(`/audio/${id}/play`, {});
  },

  async validateSoundCloudUrl(url: string): Promise<{
    isValid: boolean;
    soundcloudId?: string;
    contentType?: 'track' | 'playlist' | 'unknown';
    normalizedUrl?: string;
    error?: string;
  }> {
    return apiService.get<{
      isValid: boolean;
      soundcloudId?: string;
      contentType?: 'track' | 'playlist' | 'unknown';
      normalizedUrl?: string;
      error?: string;
    }>(`/audio/validate-soundcloud?url=${encodeURIComponent(url)}`);
  },

  async findBySoundCloudId(soundcloudId: string): Promise<AudioContent | null> {
    return apiService.get<AudioContent | null>(`/audio/by-soundcloud-id/${soundcloudId}`);
  }
};