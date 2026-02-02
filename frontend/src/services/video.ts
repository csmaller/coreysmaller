import { apiService } from './api';
import type { VideoContent } from '../types';

export const videoService = {
  async getAllVideos(): Promise<VideoContent[]> {
    return apiService.get<VideoContent[]>('/video');
  },

  async getVideoById(id: string): Promise<VideoContent> {
    return apiService.get<VideoContent>(`/video/${id}`);
  },

  async createVideo(videoData: Omit<VideoContent, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'youtubeId' | 'thumbnail'>): Promise<VideoContent> {
    return apiService.post<VideoContent>('/video', videoData);
  },

  async updateVideo(id: string, videoData: Partial<VideoContent>): Promise<VideoContent> {
    return apiService.patch<VideoContent>(`/video/${id}`, videoData);
  },

  async deleteVideo(id: string): Promise<void> {
    await apiService.delete(`/video/${id}`);
  },

  async incrementViewCount(id: string): Promise<void> {
    // This would typically be a separate endpoint, but for now we'll use the update endpoint
    const video = await this.getVideoById(id);
    await this.updateVideo(id, { viewCount: video.viewCount + 1 });
  },

  async validateYouTubeUrl(url: string): Promise<{
    isValid: boolean;
    youtubeId?: string;
    thumbnail?: string;
    error?: string;
  }> {
    return apiService.get<{
      isValid: boolean;
      youtubeId?: string;
      thumbnail?: string;
      error?: string;
    }>(`/video/validate-youtube?url=${encodeURIComponent(url)}`);
  },

  async findByYouTubeId(youtubeId: string): Promise<VideoContent | null> {
    return apiService.get<VideoContent | null>(`/video/by-youtube-id/${youtubeId}`);
  }
};