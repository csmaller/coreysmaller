/**
 * YouTube utility functions for URL validation and metadata extraction
 */

export interface YouTubeVideoInfo {
  id: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Regular expression to match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validates if a URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Generates YouTube thumbnail URL from video ID
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default.jpg',
    medium: 'mqdefault.jpg',
    high: 'hqdefault.jpg',
    standard: 'sddefault.jpg',
    maxres: 'maxresdefault.jpg',
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
}

/**
 * Extracts basic metadata from YouTube URL
 * Note: This is a basic implementation. For full metadata extraction,
 * you would typically use the YouTube Data API v3
 */
export function extractBasicYouTubeInfo(url: string): YouTubeVideoInfo | null {
  const videoId = extractYouTubeId(url);
  
  if (!videoId) {
    return null;
  }

  return {
    id: videoId,
    thumbnail: getYouTubeThumbnail(videoId),
  };
}

/**
 * Validates YouTube URL format and throws descriptive errors
 */
export function validateYouTubeUrl(url: string): void {
  if (!url) {
    throw new Error('YouTube URL is required');
  }

  if (typeof url !== 'string') {
    throw new Error('YouTube URL must be a string');
  }

  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    throw new Error('URL must be a valid YouTube URL (youtube.com or youtu.be)');
  }

  if (!isValidYouTubeUrl(url)) {
    throw new Error('Invalid YouTube URL format. Please provide a valid YouTube video URL');
  }
}