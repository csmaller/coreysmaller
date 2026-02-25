import DOMPurify from 'dompurify';

/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify to remove malicious scripts and attributes
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'div', 'span'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Validate URL to prevent javascript: protocol and other dangerous schemes
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Remove whitespace
  url = url.trim();

  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = url.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return false;
    }
  }

  // Must start with http://, https://, or be a relative URL
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    return false;
  }

  // Try to parse as URL
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  url = url.trim();

  if (!isValidUrl(url)) {
    return '';
  }

  return url;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize text input (remove control characters)
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove control characters except newlines and tabs
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    return false;
  }

  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return youtubeRegex.test(url);
}

/**
 * Validate SoundCloud URL
 */
export function isValidSoundCloudUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    return false;
  }

  const soundcloudRegex = /^https:\/\/soundcloud\.com\/[^\/]+\/[^\/\?#]+(\?.*)?$/;
  return soundcloudRegex.test(url);
}

/**
 * Create safe HTML object for React dangerouslySetInnerHTML
 */
export function createSafeHtml(dirty: string): { __html: string } {
  return { __html: sanitizeHtml(dirty) };
}
