import {
  extractSoundCloudId,
  isValidSoundCloudUrl,
  getSoundCloudEmbedUrl,
  extractBasicSoundCloudInfo,
  validateSoundCloudUrl,
  getSoundCloudContentType,
  normalizeSoundCloudUrl,
} from './soundcloud.utils';

describe('SoundCloud Utils', () => {
  describe('extractSoundCloudId', () => {
    it('should extract ID from regular SoundCloud track URL', () => {
      const url = 'https://soundcloud.com/artist-name/track-name';
      const result = extractSoundCloudId(url);
      expect(result).toBe('artist-name/track-name');
    });

    it('should extract ID from mobile SoundCloud URL', () => {
      const url = 'https://m.soundcloud.com/artist-name/track-name';
      const result = extractSoundCloudId(url);
      expect(result).toBe('artist-name/track-name');
    });

    it('should extract ID from API URL', () => {
      const url = 'https://api.soundcloud.com/tracks/123456789';
      const result = extractSoundCloudId(url);
      expect(result).toBe('123456789');
    });

    it('should return null for invalid URLs', () => {
      expect(extractSoundCloudId('')).toBeNull();
      expect(extractSoundCloudId('not-a-url')).toBeNull();
      expect(extractSoundCloudId('https://youtube.com/watch?v=123')).toBeNull();
      expect(extractSoundCloudId(null as any)).toBeNull();
    });

    it('should handle URLs with query parameters', () => {
      const url = 'https://soundcloud.com/artist-name/track-name?utm_source=test';
      const result = extractSoundCloudId(url);
      expect(result).toBe('artist-name/track-name');
    });
  });

  describe('isValidSoundCloudUrl', () => {
    it('should return true for valid SoundCloud URLs', () => {
      expect(isValidSoundCloudUrl('https://soundcloud.com/artist/track')).toBe(true);
      expect(isValidSoundCloudUrl('https://m.soundcloud.com/artist/track')).toBe(true);
      expect(isValidSoundCloudUrl('https://api.soundcloud.com/tracks/123')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidSoundCloudUrl('')).toBe(false);
      expect(isValidSoundCloudUrl('https://youtube.com/watch?v=123')).toBe(false);
      expect(isValidSoundCloudUrl('not-a-url')).toBe(false);
    });
  });

  describe('getSoundCloudEmbedUrl', () => {
    it('should generate correct embed URL', () => {
      const url = 'https://soundcloud.com/artist/track';
      const result = getSoundCloudEmbedUrl(url);
      const expectedUrl = 'https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fartist%2Ftrack';
      expect(result).toBe(expectedUrl);
    });
  });

  describe('extractBasicSoundCloudInfo', () => {
    it('should extract basic info from valid URL', () => {
      const url = 'https://soundcloud.com/artist-name/track-name';
      const result = extractBasicSoundCloudInfo(url);
      
      expect(result).toEqual({
        id: 'artist-name/track-name',
        permalink: 'artist-name/track-name',
      });
    });

    it('should return null for invalid URL', () => {
      const result = extractBasicSoundCloudInfo('invalid-url');
      expect(result).toBeNull();
    });
  });

  describe('validateSoundCloudUrl', () => {
    it('should not throw for valid URLs', () => {
      expect(() => {
        validateSoundCloudUrl('https://soundcloud.com/artist/track');
      }).not.toThrow();
    });

    it('should throw for empty URL', () => {
      expect(() => {
        validateSoundCloudUrl('');
      }).toThrow('SoundCloud URL is required');
    });

    it('should throw for non-string URL', () => {
      expect(() => {
        validateSoundCloudUrl(123 as any);
      }).toThrow('SoundCloud URL must be a string');
    });

    it('should throw for non-SoundCloud URL', () => {
      expect(() => {
        validateSoundCloudUrl('https://youtube.com/watch?v=123');
      }).toThrow('URL must be a valid SoundCloud URL (soundcloud.com)');
    });

    it('should throw for invalid SoundCloud URL format', () => {
      expect(() => {
        validateSoundCloudUrl('https://soundcloud.com/');
      }).toThrow('Invalid SoundCloud URL format. Please provide a valid SoundCloud track or playlist URL');
    });
  });

  describe('getSoundCloudContentType', () => {
    it('should identify track URLs', () => {
      const url = 'https://soundcloud.com/artist/track-name';
      expect(getSoundCloudContentType(url)).toBe('track');
    });

    it('should identify playlist URLs', () => {
      const url = 'https://soundcloud.com/artist/sets/playlist-name';
      expect(getSoundCloudContentType(url)).toBe('playlist');
    });

    it('should return unknown for invalid URLs', () => {
      expect(getSoundCloudContentType('')).toBe('unknown');
      expect(getSoundCloudContentType('invalid-url')).toBe('unknown');
      expect(getSoundCloudContentType(null as any)).toBe('unknown');
    });
  });

  describe('normalizeSoundCloudUrl', () => {
    it('should convert mobile URL to regular URL', () => {
      const url = 'https://m.soundcloud.com/artist/track';
      const result = normalizeSoundCloudUrl(url);
      expect(result).toBe('https://soundcloud.com/artist/track');
    });

    it('should convert http to https', () => {
      const url = 'http://soundcloud.com/artist/track';
      const result = normalizeSoundCloudUrl(url);
      expect(result).toBe('https://soundcloud.com/artist/track');
    });

    it('should add https if missing', () => {
      const url = 'soundcloud.com/artist/track';
      const result = normalizeSoundCloudUrl(url);
      expect(result).toBe('https://soundcloud.com/artist/track');
    });

    it('should remove query parameters', () => {
      const url = 'https://soundcloud.com/artist/track?utm_source=test&ref=share';
      const result = normalizeSoundCloudUrl(url);
      expect(result).toBe('https://soundcloud.com/artist/track');
    });

    it('should handle empty URL', () => {
      expect(normalizeSoundCloudUrl('')).toBe('');
      expect(normalizeSoundCloudUrl(null as any)).toBe(null);
    });
  });
});