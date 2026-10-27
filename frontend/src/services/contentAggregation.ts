import { blogService } from './blog';
import { musicService } from './music';
import { videoService } from './video';
import { audioService } from './audio';
import type { BlogPost, MusicTrack, VideoContent, AudioContent } from '../types';
import { blogEntryHref } from '../utils/blogHref';

export interface RecentContent {
  recentPosts: BlogPost[];
  featuredMusic: MusicTrack[];
  latestVideos: VideoContent[];
  latestAudio: AudioContent[];
}

export interface ContentPreview {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  publishDate: Date;
  contentType: 'blog' | 'music' | 'video' | 'audio';
  url: string;
}

export class ContentAggregationService {
  /**
   * Fetches recent content from all content types for the home page
   * @param limit Number of items to fetch per content type (default: 3)
   */
  async getRecentContent(limit: number = 3): Promise<RecentContent> {
    try {
      const [postsResponse, tracksResponse, videosResponse, audioResponse] = await Promise.all([
        blogService.getAllPosts(1, limit).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 }, success: true })),
        musicService.getAllTracks().catch(() => ({ data: [], success: true })),
        videoService.getAllVideos().catch(() => ({ data: [], success: true })),
        audioService.getAllAudio().catch(() => ({ data: [], success: true }))
      ]);

      // Extract data from API responses
      const posts = postsResponse.data || [];
      const tracks = tracksResponse.data || [];
      const videos = videosResponse.data || [];
      const audio = audioResponse.data || [];

      // Sort and limit music, video, and audio by creation date
      const sortedTracks = Array.isArray(tracks) ? tracks
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit) : [];

      const sortedVideos = Array.isArray(videos) ? videos
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit) : [];

      const sortedAudio = Array.isArray(audio) ? audio
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit) : [];

      return {
        recentPosts: posts,
        featuredMusic: sortedTracks,
        latestVideos: sortedVideos,
        latestAudio: sortedAudio
      };
    } catch (error) {
      console.error('Error fetching recent content:', error);
      return {
        recentPosts: [],
        featuredMusic: [],
        latestVideos: [],
        latestAudio: []
      };
    }
  }

  /**
   * Converts content items to a unified preview format
   */
  convertToContentPreviews(content: RecentContent): ContentPreview[] {
    const previews: ContentPreview[] = [];

    // Add blog posts
    if (Array.isArray(content.recentPosts)) {
      content.recentPosts.forEach(post => {
        previews.push({
          id: String(post.id),
          title: post.title,
          description: post.excerpt || this.truncateContent(post.content, 150),
          imageUrl: post.featuredImage,
          publishDate: new Date(post.publishedAt || post.createdAt),
          contentType: 'blog',
          url: blogEntryHref(post)
        });
      });
    }

    // Add music tracks
    if (Array.isArray(content.featuredMusic)) {
      content.featuredMusic.forEach(track => {
        previews.push({
          id: String(track.id),
          title: track.title,
          description: track.description || `${track.genre ? `${track.genre} • ` : ''}${track.duration ? this.formatDuration(track.duration) : 'Music track'}`,
          imageUrl: track.coverArt,
          publishDate: new Date(track.releaseDate || track.createdAt),
          contentType: 'music',
          url: `/music#${track.id}`
        });
      });
    }

    // Add videos
    if (Array.isArray(content.latestVideos)) {
      content.latestVideos.forEach(video => {
        previews.push({
          id: String(video.id),
          title: video.title,
          description: video.description || `${video.duration ? this.formatDuration(video.duration) : 'Video content'}`,
          imageUrl: video.thumbnail,
          publishDate: new Date(video.createdAt),
          contentType: 'video',
          url: `/video#${video.id}`
        });
      });
    }

    // Add audio content
    if (Array.isArray(content.latestAudio)) {
      content.latestAudio.forEach(audio => {
        previews.push({
          id: String(audio.id),
          title: audio.title,
          description: audio.description || `${audio.duration ? this.formatDuration(audio.duration) : 'Audio content'}`,
          imageUrl: audio.artwork,
          publishDate: new Date(audio.createdAt),
          contentType: 'audio',
          url: `/audio#${audio.id}`
        });
      });
    }

    // Sort by publish date (newest first)
    return previews.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
  }

  /**
   * Truncates content to specified length with ellipsis
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    
    // Remove HTML tags for plain text preview
    const plainText = content.replace(/<[^>]*>/g, '');
    
    if (plainText.length <= maxLength) return plainText;
    
    return plainText.substring(0, maxLength).trim() + '...';
  }

  /**
   * Formats duration from seconds to MM:SS format
   */
  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Gets content statistics for the home page
   */
  async getContentStats(): Promise<{
    totalPosts: number;
    totalTracks: number;
    totalVideos: number;
    totalAudio: number;
  }> {
    try {
      const [postsResponse, tracksResponse, videosResponse, audio] = await Promise.all([
        blogService.getAllPosts(1, 1).catch(() => ({ data: { data: [] }, pagination: { total: 0, page: 1, limit: 1, totalPages: 0 }, success: true })),
        musicService.getAllTracks().catch(() => ({ data: [], success: true })),
        videoService.getAllVideos().catch(() => ({ data: [], success: true })),
        audioService.getAllAudio().catch(() => [])
      ]);

      const tracks = tracksResponse.data || [];
      const videos = videosResponse.data || [];

      return {
        totalPosts: postsResponse.pagination?.total || 0,
        totalTracks: Array.isArray(tracks) ? tracks.length : 0,
        totalVideos: Array.isArray(videos) ? videos.length : 0,
        totalAudio: Array.isArray(audio) ? audio.length : 0
      };
    } catch (error) {
      console.error('Error fetching content stats:', error);
      return {
        totalPosts: 0,
        totalTracks: 0,
        totalVideos: 0,
        totalAudio: 0
      };
    }
  }
}

export const contentAggregationService = new ContentAggregationService();