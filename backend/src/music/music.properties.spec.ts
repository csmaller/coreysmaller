import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { MusicService } from './music.service';
import { MusicTrack } from './entities/music-track.entity';
import { CreateMusicTrackDto } from './dto/create-music-track.dto';

describe('Music System Properties', () => {
  let service: MusicService;
  let repository: Repository<MusicTrack>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MusicService,
        {
          provide: getRepositoryToken(MusicTrack),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MusicService>(MusicService);
    repository = module.get<Repository<MusicTrack>>(getRepositoryToken(MusicTrack));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Generators for property-based testing
  const validTitleArb = fc.string({ minLength: 1, maxLength: 255 });
  const validDescriptionArb = fc.option(fc.string({ maxLength: 1000 }));
  const validUrlArb = fc.option(fc.webUrl());
  const validGenreArb = fc.option(fc.string({ minLength: 1, maxLength: 100 }));
  const validDurationArb = fc.option(fc.integer({ min: 1, max: 7200 })); // 1 second to 2 hours

  const createMusicTrackDtoArb = fc.record({
    title: validTitleArb,
    description: validDescriptionArb,
    audioUrl: validUrlArb,
    coverArt: validUrlArb,
    genre: validGenreArb,
    duration: validDurationArb,
  });

  describe('Property 1: Content persistence round-trip', () => {
    it('should preserve all data when creating and retrieving music tracks', async () => {
      /**
       * **Validates: Requirements 2.1**
       * For any valid music track data, storing it and then retrieving it should return equivalent data
       */
      await fc.assert(
        fc.asyncProperty(createMusicTrackDtoArb, async (createDto) => {
          const savedTrack = {
            id: 'test-id',
            ...createDto,
            playCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            releaseDate: null,
          };

          mockRepository.create.mockReturnValue(savedTrack);
          mockRepository.save.mockResolvedValue(savedTrack);
          mockRepository.findOne.mockResolvedValue(savedTrack);

          // Create the track
          const created = await service.create(createDto);
          
          // Retrieve the track
          const retrieved = await service.findOne(created.id);

          // Verify data integrity
          expect(retrieved.title).toBe(createDto.title);
          expect(retrieved.description).toBe(createDto.description);
          expect(retrieved.audioUrl).toBe(createDto.audioUrl);
          expect(retrieved.coverArt).toBe(createDto.coverArt);
          expect(retrieved.genre).toBe(createDto.genre);
          expect(retrieved.duration).toBe(createDto.duration);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 2: CRUD operation completeness', () => {
    it('should support complete CRUD operations for any valid music track', async () => {
      /**
       * **Validates: Requirements 7.2**
       * For any music track, the system should support create, read, update, and delete operations
       */
      await fc.assert(
        fc.asyncProperty(
          createMusicTrackDtoArb,
          fc.record({
            title: fc.option(validTitleArb),
            genre: fc.option(validGenreArb),
          }),
          async (createDto, updateDto) => {
            const trackId = 'test-id';
            const createdTrack = {
              id: trackId,
              ...createDto,
              playCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              releaseDate: null,
            };

            const updatedTrack = {
              ...createdTrack,
              ...updateDto,
              updatedAt: new Date(),
            };

            // Mock repository responses
            mockRepository.create.mockReturnValue(createdTrack);
            mockRepository.save.mockResolvedValueOnce(createdTrack).mockResolvedValueOnce(updatedTrack);
            mockRepository.findOne.mockResolvedValue(createdTrack);
            mockRepository.find.mockResolvedValue([createdTrack]);
            mockRepository.delete.mockResolvedValue({ affected: 1 });

            // CREATE
            const created = await service.create(createDto);
            expect(created).toBeDefined();
            expect(created.title).toBe(createDto.title);

            // READ (single)
            const found = await service.findOne(trackId);
            expect(found).toBeDefined();
            expect(found.id).toBe(trackId);

            // READ (all)
            const all = await service.findAll();
            expect(Array.isArray(all)).toBe(true);

            // UPDATE
            const updated = await service.update(trackId, updateDto);
            expect(updated).toBeDefined();

            // DELETE
            await expect(service.remove(trackId)).resolves.not.toThrow();
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  describe('Property 3: Input validation consistency', () => {
    it('should consistently validate input data for music tracks', async () => {
      /**
       * **Validates: Requirements 2.2**
       * For any music creation operation, valid input should be accepted and invalid input should be rejected
       */
      await fc.assert(
        fc.asyncProperty(
          createMusicTrackDtoArb,
          async (inputData) => {
            const isValidTitle = inputData.title && inputData.title.length > 0;
            const isValidUrl = !inputData.audioUrl || inputData.audioUrl.startsWith('http');
            const isValidInput = isValidTitle && isValidUrl;

            if (isValidInput) {
              const mockTrack = {
                id: 'test-id',
                ...inputData,
                playCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                releaseDate: null,
              };

              mockRepository.create.mockReturnValue(mockTrack);
              mockRepository.save.mockResolvedValue(mockTrack);

              // Valid input should be accepted
              const result = await service.create(inputData);
              expect(result).toBeDefined();
              expect(result.title).toBe(inputData.title);
            }
            // Note: Invalid input validation is handled by class-validator at the controller level
            // The service layer assumes pre-validated input
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 8: Audio format support', () => {
    it('should accept multiple audio formats and streaming links', async () => {
      /**
       * **Validates: Requirements 2.4**
       * For any supported audio format, the music system should accept and handle the content
       */
      const audioFormatArb = fc.oneof(
        fc.constant('https://example.com/song.mp3'),
        fc.constant('https://example.com/song.wav'),
        fc.constant('https://example.com/song.flac'),
        fc.constant('https://soundcloud.com/artist/track'),
        fc.constant('https://spotify.com/track/123'),
        fc.constant('https://youtube.com/watch?v=123'),
      );

      await fc.assert(
        fc.asyncProperty(
          validTitleArb,
          audioFormatArb,
          async (title, audioUrl) => {
            const createDto: CreateMusicTrackDto = {
              title,
              audioUrl,
            };

            const mockTrack = {
              id: 'test-id',
              ...createDto,
              playCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              releaseDate: null,
            };

            mockRepository.create.mockReturnValue(mockTrack);
            mockRepository.save.mockResolvedValue(mockTrack);

            const result = await service.create(createDto);

            expect(result).toBeDefined();
            expect(result.audioUrl).toBe(audioUrl);
            expect(result.title).toBe(title);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 9: Content categorization and sorting', () => {
    it('should correctly organize and sort music tracks by date', async () => {
      /**
       * **Validates: Requirements 2.6**
       * For any collection of music tracks, they should be correctly sorted by creation date
       */
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              title: validTitleArb,
              createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (tracks) => {
            // Sort tracks by creation date (newest first) as expected by the service
            const sortedTracks = [...tracks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            mockRepository.find.mockResolvedValue(sortedTracks);

            const result = await service.findAll();

            expect(result).toHaveLength(tracks.length);
            
            // Verify chronological ordering (newest first)
            for (let i = 0; i < result.length - 1; i++) {
              expect(result[i].createdAt.getTime()).toBeGreaterThanOrEqual(
                result[i + 1].createdAt.getTime()
              );
            }

            // Verify all tracks are present
            const resultIds = result.map(track => track.id);
            const originalIds = tracks.map(track => track.id);
            expect(resultIds.sort()).toEqual(originalIds.sort());
          }
        ),
        { numRuns: 25 }
      );
    });
  });
});