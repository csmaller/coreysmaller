import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { plainToInstance, instanceToPlain } from 'class-transformer';
import { validate } from 'class-validator';
import { BlogPostResponseDto } from '../blog/dto/blog-post-response.dto';
import { MusicTrackResponseDto } from '../music/dto/music-track-response.dto';
import { VideoContentResponseDto } from '../video/dto/video-content-response.dto';
import { AudioContentResponseDto } from '../audio/dto/audio-content-response.dto';
import { CreateBlogPostDto } from '../blog/dto/create-blog-post.dto';
import { CreateMusicTrackDto } from '../music/dto/create-music-track.dto';
import { CreateVideoContentDto } from '../video/dto/create-video-content.dto';
import { CreateAudioContentDto } from '../audio/dto/create-audio-content.dto';
import { BlogPost } from '../blog/entities/blog-post.entity';
import { MusicTrack } from '../music/entities/music-track.entity';
import { VideoContent } from '../video/entities/video-content.entity';
import { AudioContent } from '../audio/entities/audio-content.entity';

describe('API Serialization Properties', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  // Generators for test data
  const blogPostGenerator = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    content: fc.string({ minLength: 1, maxLength: 5000 }),
    excerpt: fc.option(fc.string({ maxLength: 500 })),
    featuredImage: fc.option(fc.webUrl()),
    tags: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
    status: fc.constantFrom('draft', 'published', 'archived'),
    slug: fc.option(fc.string({ minLength: 1, maxLength: 100 }).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-'))),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    publishedAt: fc.option(fc.date()),
  });

  const musicTrackGenerator = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    description: fc.option(fc.string({ maxLength: 1000 })),
    audioUrl: fc.option(fc.webUrl()),
    coverArt: fc.option(fc.webUrl()),
    genre: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    duration: fc.option(fc.integer({ min: 1, max: 86400 })),
    playCount: fc.integer({ min: 0, max: 1000000 }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    releaseDate: fc.option(fc.date()),
  });

  const videoContentGenerator = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    description: fc.option(fc.string({ maxLength: 1000 })),
    youtubeUrl: fc.constant('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    youtubeId: fc.option(fc.string({ minLength: 11, maxLength: 11 })),
    thumbnail: fc.option(fc.webUrl()),
    duration: fc.option(fc.integer({ min: 1, max: 86400 })),
    viewCount: fc.integer({ min: 0, max: 1000000 }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
  });

  const audioContentGenerator = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    description: fc.option(fc.string({ maxLength: 1000 })),
    soundcloudUrl: fc.constant('https://soundcloud.com/user/track'),
    soundcloudId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    artwork: fc.option(fc.webUrl()),
    duration: fc.option(fc.integer({ min: 1, max: 86400 })),
    playCount: fc.integer({ min: 0, max: 1000000 }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
  });

  /**
   * **Feature: coreysmaller-website, Property 17: API serialization round-trip**
   * For any data model, serializing to JSON and deserializing back should produce equivalent objects
   * **Validates: Requirements 9.4**
   */
  describe('Property 17: API serialization round-trip', () => {
    it('should maintain data integrity for BlogPost serialization round-trip', () => {
      fc.assert(
        fc.property(blogPostGenerator, (blogPostData) => {
          // Create entity instance
          const entity = Object.assign(new BlogPost(), blogPostData);
          
          // Transform to response DTO
          const responseDto = plainToInstance(BlogPostResponseDto, entity, {
            excludeExtraneousValues: true,
            enableImplicitConversion: true,
          });
          
          // Serialize to JSON and back
          const json = JSON.stringify(instanceToPlain(responseDto));
          const deserialized = JSON.parse(json);
          const reconstructed = plainToInstance(BlogPostResponseDto, deserialized, {
            excludeExtraneousValues: true,
            enableImplicitConversion: true,
          });
          
          // Verify essential fields are preserved
          expect(reconstructed.id).toBe(entity.id);
          expect(reconstructed.title).toBe(entity.title);
          expect(reconstructed.content).toBe(entity.content);
          expect(reconstructed.status).toBe(entity.status);
          
          // Verify computed fields are consistent
          if (entity.content) {
            const expectedWordCount = entity.content.split(/\s+/).length;
            expect(reconstructed.wordCount).toBe(expectedWordCount);
            expect(reconstructed.readingTimeMinutes).toBe(Math.ceil(expectedWordCount / 200));
          }
          
          expect(reconstructed.isPublished).toBe(entity.status === 'published');
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain data integrity for MusicTrack serialization round-trip', () => {
      fc.assert(
        fc.property(musicTrackGenerator, (musicTrackData) => {
          // Create entity instance
          const entity = Object.assign(new MusicTrack(), musicTrackData);
          
          // Transform to response DTO
          const responseDto = plainToInstance(MusicTrackResponseDto, entity, {
            excludeExtraneousValues: true,
            enableImplicitConversion: true,
          });
          
          // Serialize to JSON and back
          const json = JSON.stringify(instanceToPlain(responseDto));
          const deserialized = JSON.parse(json);
          const reconstructed = plainToInstance(MusicTrackResponseDto, deserialized, {
            excludeExtraneousValues: true,
            enableImplicitConversion: true,
          });
          
          // Verify essential fields are preserved
          expect(reconstructed.id).toBe(entity.id);
          expect(reconstructed.title).toBe(entity.title);
          expect(reconstructed.playCount).toBe(entity.playCount);
          
          // Verify computed fields are consistent
          expect(reconstructed.hasAudio).toBe(!!entity.audioUrl);
          expect(reconstructed.hasCoverArt).toBe(!!entity.coverArt);
          
          if (entity.duration) {
            const minutes = Math.floor(entity.duration / 60);
            const seconds = entity.duration % 60;
            const expectedFormat = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            expect(reconstructed.formattedDuration).toBe(expectedFormat);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain data integrity for VideoContent serialization round-trip', () => {
      fc.assert(
        fc.property(videoContentGenerator, (videoContentData) => {
          // Create entity instance
          const entity = Object.assign(new VideoContent(), videoContentData);
          
          // Transform to response DTO
          const responseDto = plainToInstance(VideoContentResponseDto, entity, {
            excludeExtraneousValues: true,
            enableImplicitConversion: true,
          });
          
          // Serialize to JSON and back
          const json = JSON.stringify(instanceToPlain(responseDto));
          const deserialized = JSON.parse(json);
          const reconstructed = plainToInstance(VideoContentResponseDto, deserialized, {
            excludeExtraneousValues: true,
            enableImplicitConversion: true,
          });
          
          // Verify essential fields are preserved
          expect(reconstructed.id).toBe(entity.id);
          expect(reconstructed.title).toBe(entity.title);
          expect(reconstructed.youtubeUrl).toBe(entity.youtubeUrl);
          
          // Verify computed fields are consistent
          expect(reconstructed.isValid).toBe(!!entity.youtubeId);
          
          if (entity.youtubeId) {
            expect(reconstructed.embedUrl).toBe(`https://www.youtube.com/embed/${entity.youtubeId}`);
            expect(reconstructed.thumbnailUrl).toBe(`https://img.youtube.com/vi/${entity.youtubeId}/maxresdefault.jpg`);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain data integrity for AudioContent serialization round-trip', () => {
      fc.assert(
        fc.property(audioContentGenerator, (audioContentData) => {
          // Create entity instance
          const entity = Object.assign(new AudioContent(), audioContentData);
          
          // Transform to response DTO
          const responseDto = plainToInstance(AudioContentResponseDto, entity, {
            excludeExtraneousValues: true,
            enableImplicitConversion: true,
          });
          
          // Serialize to JSON and back
          const json = JSON.stringify(instanceToPlain(responseDto));
          const deserialized = JSON.parse(json);
          const reconstructed = plainToInstance(AudioContentResponseDto, deserialized, {
            excludeExtraneousValues: true,
            enableImplicitConversion: true,
          });
          
          // Verify essential fields are preserved
          expect(reconstructed.id).toBe(entity.id);
          expect(reconstructed.title).toBe(entity.title);
          expect(reconstructed.soundcloudUrl).toBe(entity.soundcloudUrl);
          
          // Verify computed fields are consistent
          expect(reconstructed.isValid).toBe(!!entity.soundcloudId);
          expect(reconstructed.hasArtwork).toBe(!!entity.artwork);
          
          if (entity.soundcloudId) {
            expect(reconstructed.embedUrl).toBe(`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${entity.soundcloudId}`);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle arrays of entities consistently', () => {
      fc.assert(
        fc.property(fc.array(blogPostGenerator, { minLength: 1, maxLength: 10 }), (blogPostsData) => {
          // Create entity instances
          const entities = blogPostsData.map(data => Object.assign(new BlogPost(), data));
          
          // Transform to response DTOs
          const responseDtos = entities.map(entity => 
            plainToInstance(BlogPostResponseDto, entity, {
              excludeExtraneousValues: true,
              enableImplicitConversion: true,
            })
          );
          
          // Serialize to JSON and back
          const json = JSON.stringify(responseDtos.map(dto => instanceToPlain(dto)));
          const deserialized = JSON.parse(json);
          const reconstructed = deserialized.map(item => 
            plainToInstance(BlogPostResponseDto, item, {
              excludeExtraneousValues: true,
              enableImplicitConversion: true,
            })
          );
          
          // Verify array length is preserved
          expect(reconstructed.length).toBe(entities.length);
          
          // Verify each item maintains integrity
          for (let i = 0; i < entities.length; i++) {
            expect(reconstructed[i].id).toBe(entities[i].id);
            expect(reconstructed[i].title).toBe(entities[i].title);
            expect(reconstructed[i].isPublished).toBe(entities[i].status === 'published');
          }
        }),
        { numRuns: 50 }
      );
    });

    it('should handle null and undefined values gracefully', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 200 }),
            content: fc.string({ minLength: 1, maxLength: 5000 }),
            excerpt: fc.constantFrom(null, undefined, ''),
            featuredImage: fc.constantFrom(null, undefined, ''),
            tags: fc.constantFrom(null, undefined, []),
            status: fc.constantFrom('draft', 'published', 'archived'),
            slug: fc.constantFrom(null, undefined, ''),
            createdAt: fc.date(),
            updatedAt: fc.date(),
            publishedAt: fc.constantFrom(null, undefined),
          }),
          (blogPostData) => {
            // Create entity instance
            const entity = Object.assign(new BlogPost(), blogPostData);
            
            // Transform to response DTO
            const responseDto = plainToInstance(BlogPostResponseDto, entity, {
              excludeExtraneousValues: true,
              enableImplicitConversion: true,
            });
            
            // Serialize to JSON and back
            const json = JSON.stringify(instanceToPlain(responseDto));
            const deserialized = JSON.parse(json);
            const reconstructed = plainToInstance(BlogPostResponseDto, deserialized, {
              excludeExtraneousValues: true,
              enableImplicitConversion: true,
            });
            
            // Verify essential fields are preserved
            expect(reconstructed.id).toBe(entity.id);
            expect(reconstructed.title).toBe(entity.title);
            expect(reconstructed.content).toBe(entity.content);
            
            // Verify null/undefined handling doesn't break serialization
            expect(typeof reconstructed.id).toBe('string');
            expect(typeof reconstructed.title).toBe('string');
            expect(typeof reconstructed.isPublished).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});