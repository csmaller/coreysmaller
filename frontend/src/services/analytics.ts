import { apiService } from './api';

export interface AnalyticsSummary {
  totalViews: number;
  lastSevenDays: { date: string; views: number }[];
  topPages: { path: string; views: number }[];
  content: {
    blogPosts: number;
    publishedPosts: number;
    draftPosts: number;
    videoViews: number;
    audioPlays: number;
    musicPlays: number;
  };
  recordedSince: string | null;
}

export const analyticsService = {
  async recordPageView(path: string): Promise<void> {
    await apiService.post('/analytics/views', { path });
  },

  async getSummary(): Promise<AnalyticsSummary> {
    const response = await apiService.get<{ data: AnalyticsSummary }>('/analytics');
    return response.data;
  },
};
