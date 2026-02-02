import {
  extractYouTubeId,
  isValidYouTubeUrl,
  getYouTubeThumbnail,
  extractBasicYouTubeInfo,
  validateYouTubeUrl,
} from './youtube.utils';

describe('YouTube Utils', () => {
  describe('extractYouTubeId', () => {
    it('should extract ID from standard YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from short YouTube URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from v/ URL', () => {
      const url = 'https://www.youtube.com/v/dQw4w9WgXcQ';
      expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from URL with additional parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s';
      expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URLs', () => {
      expect(extractYouTubeId('https://example.com')).toBeNull();
      expect(extractYouTubeId('not-a-url')).toBeNull();
      expect(extractYouTubeId('')).toBeNull();
      expect(extractYouTubeId(null as any)).toBeNull();
    });

    it('should return null for YouTube URLs without video ID', () => {
      expect(extractYouTubeId('https://www.youtube.com')).toBeNull();
      expect(extractYouTubeId('https://www.youtube.com/watch')).toBeNull();
    });
  });

  describe('isValidYouTubeUrl', () => {
    it('should return true for valid YouTube URLs', () => {
      const validUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'https://www.youtube.com/v/dQw4w9WgXcQ',
      ];

      validUrls.forEach(url => {
        expect(isValidYouTubeUrl(url)).toBe(true);
      });
    });

    it('should return false for invalid URLs', () => {
      const invalidUrls = [
        'https://example.com',
        'not-a-url',
        '',
        'https://www.youtube.com',
        'https://vimeo.com/123456',
      ];

      invalidUrls.forEach(url => {
        expect(isValidYouTubeUrl(url)).toBe(false);
      });
    });
  });

  describe('getYouTubeThumbnail', () => {
    const videoId = 'dQw4w9WgXcQ';

    it('should generate correct thumbnail URL for default quality', () => {
      const thumbnail = getYouTubeThumbnail(videoId, 'default');
      expect(thumbnail).toBe(`https://img.youtube.com/vi/${videoId}/default.jpg`);
    });

    it('should generate correct thumbnail URL for high quality', () => {
      const thumbnail = getYouTubeThumbnail(videoId, 'high');
      expect(thumbnail).toBe(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    });

    it('should use high quality as default', () => {
      const thumbnail = getYouTubeThumbnail(videoId);
      expect(thumbnail).toBe(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    });

    it('should generate correct thumbnail URL for all quality options', () => {
      const qualities = ['default', 'medium', 'high', 'standard', 'maxres'] as const;
      const expectedSuffixes = ['default.jpg', 'mqdefault.jpg', 'hqdefault.jpg', 'sddefault.jpg', 'maxresdefault.jpg'];

      qualities.forEach((quality, index) => {
        const thumbnail = getYouTubeThumbnail(videoId, quality);
        expect(thumbnail).toBe(`https://img.youtube.com/vi/${videoId}/${expectedSuffixes[index]}`);
      });
    });
  });

  describe('extractBasicYouTubeInfo', () => {
    it('should extract basic info from valid YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const info = extractBasicYouTubeInfo(url);

      expect(info).toEqual({
        id: 'dQw4w9WgXcQ',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      });
    });

    it('should return null for invalid URLs', () => {
      expect(extractBasicYouTubeInfo('https://example.com')).toBeNull();
      expect(extractBasicYouTubeInfo('not-a-url')).toBeNull();
      expect(extractBasicYouTubeInfo('')).toBeNull();
    });
  });

  describe('validateYouTubeUrl', () => {
    it('should not throw for valid YouTube URLs', () => {
      const validUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
      ];

      validUrls.forEach(url => {
        expect(() => validateYouTubeUrl(url)).not.toThrow();
      });
    });

    it('should throw for empty URL', () => {
      expect(() => validateYouTubeUrl('')).toThrow('YouTube URL is required');
      expect(() => validateYouTubeUrl(null as any)).toThrow('YouTube URL is required');
      expect(() => validateYouTubeUrl(undefined as any)).toThrow('YouTube URL is required');
    });

    it('should throw for non-string URL', () => {
      expect(() => validateYouTubeUrl(123 as any)).toThrow('YouTube URL must be a string');
      expect(() => validateYouTubeUrl({} as any)).toThrow('YouTube URL must be a string');
    });

    it('should throw for non-YouTube URLs', () => {
      expect(() => validateYouTubeUrl('https://example.com')).toThrow('URL must be a valid YouTube URL');
      expect(() => validateYouTubeUrl('https://vimeo.com/123456')).toThrow('URL must be a valid YouTube URL');
    });

    it('should throw for invalid YouTube URL format', () => {
      expect(() => validateYouTubeUrl('https://www.youtube.com')).toThrow('Invalid YouTube URL format');
      expect(() => validateYouTubeUrl('https://www.youtube.com/watch')).toThrow('Invalid YouTube URL format');
    });
  });
});