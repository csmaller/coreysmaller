import { apiService } from './api';
import type { VideoApiResponse, VideoContent } from '../types';

export const videoService = {
  async getAllVideos(): Promise<VideoApiResponse> {
    return apiService.get<VideoApiResponse>('/video');
  },

  async getVideoById(id: string|number): Promise<VideoContent> {
    const response = await apiService.get<{ data: VideoContent }>(`/video/${id}`);
    return response.data;
  },

  async createVideo(videoData: Omit<VideoContent, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'youtubeId' | 'thumbnail'>): Promise<VideoContent> {
    const response = await apiService.post<{ data: VideoContent }>('/video', videoData);
    return response.data;
  },

  async updateVideo(id: string|number, videoData: Partial<VideoContent>): Promise<VideoContent> {
    const response = await apiService.patch<{ data: VideoContent }>(`/video/${id}`, videoData);
    return response.data;
  },

  async deleteVideo(id: string|number): Promise<void> {
    await apiService.delete(`/video/${id}`);
  },

  async incrementViewCount(id: string|number): Promise<void> {
    await apiService.post(`/video/${id}/view`, {});
  },

  async validateYouTubeUrl(url: string): Promise<{
    isValid: boolean;
    provider?: 'youtube' | 'instagram';
    youtubeId?: string;
    videoId?: string;
    thumbnail?: string;
    error?: string;
  }> {
    const response = await apiService.get<{ data: {
      isValid: boolean;
      provider?: 'youtube' | 'instagram';
      youtubeId?: string;
      videoId?: string;
      thumbnail?: string;
      error?: string;
    } }>(`/video/validate-youtube?url=${encodeURIComponent(url)}`);
    const data = response.data;
    return {
      ...data,
      youtubeId: data.youtubeId ?? (data.provider === 'instagram' ? undefined : data.videoId),
    };
  },

  async findByYouTubeId(youtubeId: string): Promise<VideoContent | null> {
    const response = await apiService.get<{ data: VideoContent | null }>(`/video/by-youtube-id/${youtubeId}`);
    return response.data;
  }
};