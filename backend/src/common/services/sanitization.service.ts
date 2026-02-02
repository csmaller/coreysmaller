import { Injectable } from '@nestjs/common';

@Injectable()
export class SanitizationService {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHtml(content: string): string {
    if (!content) return content;

    // Remove script tags and their content
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove dangerous attributes
    content = content.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, ''); // onclick, onload, etc.
    content = content.replace(/\s*javascript\s*:/gi, ''); // javascript: protocol
    content = content.replace(/\s*vbscript\s*:/gi, ''); // vbscript: protocol
    content = content.replace(/\s*data\s*:/gi, ''); // data: protocol (except images)
    
    // Allow data: protocol only for images
    content = content.replace(/(<img[^>]+src\s*=\s*["'])([^"']*)(["'][^>]*>)/gi, (match, prefix, src, suffix) => {
      if (src.startsWith('data:image/')) {
        return match; // Keep data URLs for images
      }
      return prefix + this.sanitizeUrl(src) + suffix;
    });

    return content;
  }

  /**
   * Sanitize URLs to prevent malicious redirects
   */
  sanitizeUrl(url: string): string {
    if (!url) return url;

    // Remove dangerous protocols
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:', 'ftp:'];
    const lowerUrl = url.toLowerCase().trim();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return '#'; // Replace with safe anchor
      }
    }

    // Ensure URLs are properly encoded
    try {
      const urlObj = new URL(url);
      return urlObj.toString();
    } catch {
      // If URL is invalid, return a safe default
      return '#';
    }
  }

  /**
   * Sanitize text input to prevent injection attacks
   */
  sanitizeText(text: string): string {
    if (!text) return text;

    // Remove null bytes and control characters
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  /**
   * Sanitize slug to ensure URL safety
   */
  sanitizeSlug(slug: string): string {
    if (!slug) return slug;

    return slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Sanitize tags array
   */
  sanitizeTags(tags: string[]): string[] {
    if (!Array.isArray(tags)) return [];

    return tags
      .map(tag => this.sanitizeText(tag))
      .filter(tag => tag && tag.length > 0)
      .map(tag => tag.toLowerCase())
      .slice(0, 10); // Limit to 10 tags
  }

  /**
   * Extract and validate YouTube ID from URL
   */
  extractYouTubeId(url: string): string | null {
    if (!url) return null;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
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
   * Extract and validate SoundCloud ID from URL
   */
  extractSoundCloudId(url: string): string | null {
    if (!url) return null;

    // SoundCloud URLs typically need to be resolved via their API
    // For now, we'll extract the track identifier from the URL
    const match = url.match(/soundcloud\.com\/([^\/]+)\/([^\/\?]+)/);
    if (match && match[1] && match[2]) {
      return `${match[1]}/${match[2]}`;
    }

    return null;
  }

  /**
   * Validate and sanitize duration (in seconds)
   */
  sanitizeDuration(duration: number): number | null {
    if (typeof duration !== 'number' || isNaN(duration) || duration < 0) {
      return null;
    }

    // Cap duration at 24 hours (86400 seconds)
    return Math.min(Math.floor(duration), 86400);
  }

  /**
   * Validate and sanitize play count
   */
  sanitizePlayCount(count: number): number {
    if (typeof count !== 'number' || isNaN(count) || count < 0) {
      return 0;
    }

    return Math.floor(count);
  }
}