/**
 * SoundCloud utility functions for URL validation and metadata extraction
 */

export interface SoundCloudTrackInfo {
  id: string;
  title?: string;
  description?: string;
  artwork?: string;
  duration?: number;
  permalink?: string;
}

/**
 * Extracts SoundCloud track information from various SoundCloud URL formats
 * Supports:
 * - https://soundcloud.com/user/track-name
 * - https://soundcloud.com/user/sets/playlist-name
 * - https://m.soundcloud.com/user/track-name
 * - https://api.soundcloud.com/tracks/TRACK_ID
 */
export function extractSoundCloudId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // For API URLs with direct track ID
  const apiMatch = url.match(/api\.soundcloud\.com\/tracks\/(\d+)/);
  if (apiMatch && apiMatch[1]) {
    return apiMatch[1];
  }

  // For regular SoundCloud URLs, we extract the permalink
  // The actual track ID would need to be resolved via SoundCloud API
  const patterns = [
    /(?:soundcloud\.com|m\.soundcloud\.com)\/([^\/]+)\/([^\/\?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[2]) {
      // Return permalink format: user/track
      return `${match[1]}/${match[2]}`;
    }
  }

  return null;
}

/**
 * Validates if a URL is a valid SoundCloud URL
 */
export function isValidSoundCloudUrl(url: string): boolean {
  return extractSoundCloudId(url) !== null;
}

/**
 * Generates SoundCloud embed URL from track URL
 */
export function getSoundCloudEmbedUrl(url: string): string {
  // SoundCloud embed URLs follow this pattern:
  // https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/TRACK_ID
  const encodedUrl = encodeURIComponent(url);
  return `https://w.soundcloud.com/player/?url=${encodedUrl}`;
}

/**
 * Extracts basic metadata from SoundCloud URL
 * Note: This is a basic implementation. For full metadata extraction,
 * you would typically use the SoundCloud API with a client ID
 */
export function extractBasicSoundCloudInfo(url: string): SoundCloudTrackInfo | null {
  const trackId = extractSoundCloudId(url);
  
  if (!trackId) {
    return null;
  }

  // For basic implementation, we return the permalink as ID
  // In a full implementation, you would resolve this via SoundCloud API
  return {
    id: trackId,
    permalink: trackId,
  };
}

/**
 * Validates SoundCloud URL format and throws descriptive errors
 */
export function validateSoundCloudUrl(url: string): void {
  if (!url) {
    throw new Error('SoundCloud URL is required');
  }

  if (typeof url !== 'string') {
    throw new Error('SoundCloud URL must be a string');
  }

  if (!url.includes('soundcloud.com')) {
    throw new Error('URL must be a valid SoundCloud URL (soundcloud.com)');
  }

  if (!isValidSoundCloudUrl(url)) {
    throw new Error('Invalid SoundCloud URL format. Please provide a valid SoundCloud track or playlist URL');
  }
}

/**
 * Determines if a SoundCloud URL is for a track or playlist
 */
export function getSoundCloudContentType(url: string): 'track' | 'playlist' | 'unknown' {
  if (!url || typeof url !== 'string') {
    return 'unknown';
  }

  if (url.includes('/sets/')) {
    return 'playlist';
  }

  // Check if it's a regular track URL pattern
  const trackPattern = /soundcloud\.com\/[^\/]+\/[^\/\?]+(?:\?|$)/;
  if (trackPattern.test(url)) {
    return 'track';
  }

  return 'unknown';
}

/**
 * Normalizes SoundCloud URL to a consistent format
 */
export function normalizeSoundCloudUrl(url: string): string {
  if (!url) {
    return url;
  }

  // Remove mobile prefix
  let normalized = url.replace('m.soundcloud.com', 'soundcloud.com');
  
  // Ensure https
  if (normalized.startsWith('http://')) {
    normalized = normalized.replace('http://', 'https://');
  }
  
  if (!normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  // Remove query parameters for cleaner URLs (optional)
  const urlObj = new URL(normalized);
  return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
}