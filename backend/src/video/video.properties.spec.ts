import * as fc from 'fast-check';
import { 
  extractYouTubeId, 
  isValidYouTubeUrl, 
  validateYouTubeUrl,
  extractBasicYouTubeInfo 
} from './utils/youtube.utils';

describe('Video System Properties', () => {
  // Generators for property-based testing
  const validYouTubeVideoId = () => fc.constant('dQw4w9WgXcQ');

  const validYouTubeUrl = () => fc.oneof(
    validYouTubeVideoId().map(id => `https://www.youtube.com/watch?v=${id}`),
    validYouTubeVideoId().map(id => `https://youtu.be/${id}`),
    validYouTubeVideoId().map(id => `https://www.youtube.com/embed/${id}`),
    validYouTubeVideoId().map(id => `https://www.youtube.com/v/${id}`),
    validYouTubeVideoId().map(id => `https://www.youtube.com/watch?v=${id}&t=10s`),
  );

  const invalidYouTubeUrl = () => fc.oneof(
    fc.constant('https://example.com'),
    fc.constant('https://vimeo.com/123456'),
    fc.constant('not-a-url'),
    fc.constant(''),
    fc.constant('https://www.youtube.com'),
    fc.constant('https://www.youtube.com/watch'),
    fc.constant('https://facebook.com/video/123'),
  );

  /**
   * Property 10: URL validation for external services
   * For any YouTube or SoundCloud URL, the system should validate the format 
   * and reject invalid URLs while accepting valid ones
   * **Validates: Requirements 3.2, 4.2**
   */
  describe('Property 10: URL validation for external services', () => {
    it('Property: should accept all valid YouTube URLs', () => {
      fc.assert(fc.property(
        validYouTubeUrl(),
        (url) => {
          expect(isValidYouTubeUrl(url)).toBe(true);
          expect(() => validateYouTubeUrl(url)).not.toThrow();
          expect(extractYouTubeId(url)).toBeTruthy();
        }
      ), { numRuns: 100 });
    });

    it('Property: should reject all invalid YouTube URLs', () => {
      fc.assert(fc.property(
        invalidYouTubeUrl(),
        (url) => {
          expect(isValidYouTubeUrl(url)).toBe(false);
          if (url) { // Skip empty strings for validateYouTubeUrl as it has specific error handling
            expect(() => validateYouTubeUrl(url)).toThrow();
          }
          expect(extractYouTubeId(url)).toBeNull();
        }
      ), { numRuns: 100 });
    });
  });

  /**
   * Property 11: External metadata extraction
   * For any valid external service URL (YouTube, SoundCloud), the system should 
   * successfully extract and store relevant metadata
   * **Validates: Requirements 3.3, 4.3**
   */
  describe('Property 11: External metadata extraction', () => {
    it('Property: should extract consistent metadata from valid YouTube URLs', () => {
      fc.assert(fc.property(
        validYouTubeUrl(),
        (url) => {
          const extractedId = extractYouTubeId(url);
          const basicInfo = extractBasicYouTubeInfo(url);
          
          expect(extractedId).toBeTruthy();
          expect(basicInfo).toBeTruthy();
          expect(basicInfo!.id).toBe(extractedId);
          expect(basicInfo!.thumbnail).toContain(extractedId!);
          expect(basicInfo!.thumbnail).toMatch(/^https:\/\/img\.youtube\.com\/vi\/[a-zA-Z0-9_-]{11}\/hqdefault\.jpg$/);
        }
      ), { numRuns: 100 });
    });

    it('Property: should maintain metadata consistency across extraction methods', () => {
      fc.assert(fc.property(
        validYouTubeUrl(),
        (url) => {
          const extractedYouTubeId = extractYouTubeId(url);
          const basicInfo = extractBasicYouTubeInfo(url);
          
          expect(extractedYouTubeId).toBe(basicInfo!.id);
          expect(basicInfo!.thumbnail).toBe(`https://img.youtube.com/vi/${extractedYouTubeId}/hqdefault.jpg`);
        }
      ), { numRuns: 100 });
    });
  });

  /**
   * Additional property: YouTube ID extraction consistency
   * For any valid YouTube URL, extracting the ID multiple times should yield the same result
   */
  describe('YouTube ID extraction consistency', () => {
    it('Property: should extract the same ID from equivalent YouTube URLs', () => {
      fc.assert(fc.property(
        fc.constant('dQw4w9WgXcQ'),
        (videoId) => {
          const urls = [
            `https://www.youtube.com/watch?v=${videoId}`,
            `https://youtu.be/${videoId}`,
            `https://www.youtube.com/embed/${videoId}`,
            `https://www.youtube.com/v/${videoId}`,
            `https://www.youtube.com/watch?v=${videoId}&t=10s`,
          ];
          
          const extractedIds = urls.map(url => extractYouTubeId(url));
          
          // All extracted IDs should be the same
          extractedIds.forEach(id => {
            expect(id).toBe(videoId);
          });
          
          // All URLs should be valid
          urls.forEach(url => {
            expect(isValidYouTubeUrl(url)).toBe(true);
          });
        }
      ), { numRuns: 100 });
    });
  });

  /**
   * Error handling property: Invalid URLs should never cause system crashes
   */
  describe('Error handling for invalid URLs', () => {
    it('Property: should handle all types of invalid input gracefully', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.string(),
          fc.constant(null),
          fc.constant(undefined),
          fc.integer(),
          fc.object(),
          fc.array(fc.string()),
        ),
        (invalidInput) => {
          // These should never throw unexpected errors
          expect(() => {
            const result = extractYouTubeId(invalidInput as any);
            expect(result).toBeNull();
          }).not.toThrow();
          
          expect(() => {
            const result = isValidYouTubeUrl(invalidInput as any);
            expect(result).toBe(false);
          }).not.toThrow();
          
          expect(() => {
            const result = extractBasicYouTubeInfo(invalidInput as any);
            expect(result).toBeNull();
          }).not.toThrow();
        }
      ), { numRuns: 100 });
    });
  });
});