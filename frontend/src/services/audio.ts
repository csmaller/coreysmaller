import { apiService } from './api';
import type { AudioContent, ApiResponse } from '../types';

export const audioService = {
  async getAllAudio(): Promise<ApiResponse<AudioContent[]>> {
    return apiService.get<ApiResponse<AudioContent[]>>('/audio');
  },

  async getAudioById(id: number | string): Promise<ApiResponse<AudioContent>> {
    return apiService.get<ApiResponse<AudioContent>>(`/audio/${id}`);
  },

  async createAudio(audioData: Omit<AudioContent, 'id' | 'createdAt' | 'updatedAt' | 'playCount' | 'soundcloudId' | 'artwork'>): Promise<ApiResponse<AudioContent>> {
    return apiService.post<ApiResponse<AudioContent>>('/audio', audioData);
  },

  async updateAudio(id: number | string, audioData: Partial<AudioContent>): Promise<ApiResponse<AudioContent>> {
    return apiService.patch<ApiResponse<AudioContent>>(`/audio/${id}`, audioData);
  },

  async deleteAudio(id: number | string): Promise<void> {
    await apiService.delete(`/audio/${id}`);
  },

  async incrementPlayCount(id: number | string): Promise<ApiResponse<AudioContent>> {
    return apiService.post<ApiResponse<AudioContent>>(`/audio/${id}/play`, {});
  },

  async validateSoundCloudUrl(url: string): Promise<ApiResponse<{
    isValid: boolean;
    soundcloudId?: string;
    contentType?: 'track' | 'playlist' | 'unknown';
    normalizedUrl?: string;
    error?: string;
  }>> {
    return apiService.get<ApiResponse<{
      isValid: boolean;
      soundcloudId?: string;
      contentType?: 'track' | 'playlist' | 'unknown';
      normalizedUrl?: string;
      error?: string;
    }>>(`/audio/validate-soundcloud?url=${encodeURIComponent(url)}`);
  },

  async findBySoundCloudId(soundcloudId: string): Promise<ApiResponse<AudioContent | null>> {
    return apiService.get<ApiResponse<AudioContent | null>>(`/audio/by-soundcloud-id/${soundcloudId}`);
  }
};