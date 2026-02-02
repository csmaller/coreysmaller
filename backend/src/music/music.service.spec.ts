import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { MusicService } from './music.service';
import { MusicTrack } from './entities/music-track.entity';
import { CreateMusicTrackDto } from './dto/create-music-track.dto';
import { UpdateMusicTrackDto } from './dto/update-music-track.dto';

describe('MusicService', () => {
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

  describe('create', () => {
    it('should create a new music track', async () => {
      const createDto: CreateMusicTrackDto = {
        title: 'Test Song',
        description: 'A test song',
        audioUrl: 'https://example.com/song.mp3',
        genre: 'Rock',
        duration: 180,
      };

      const mockTrack = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...createDto,
        playCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        releaseDate: null,
      };

      mockRepository.create.mockReturnValue(mockTrack);
      mockRepository.save.mockResolvedValue(mockTrack);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockTrack);
      expect(result).toEqual(mockTrack);
    });
  });

  describe('findAll', () => {
    it('should return all music tracks ordered by creation date', async () => {
      const mockTracks = [
        {
          id: '1',
          title: 'Song 1',
          createdAt: new Date('2023-01-02'),
        },
        {
          id: '2',
          title: 'Song 2',
          createdAt: new Date('2023-01-01'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockTracks);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockTracks);
    });
  });

  describe('findOne', () => {
    it('should return a music track by id', async () => {
      const mockTrack = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Song',
        description: 'A test song',
      };

      mockRepository.findOne.mockResolvedValue(mockTrack);

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
      expect(result).toEqual(mockTrack);
    });

    it('should throw NotFoundException when track not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        new NotFoundException('Music track with ID nonexistent-id not found'),
      );
    });
  });

  describe('update', () => {
    it('should update a music track', async () => {
      const updateDto: UpdateMusicTrackDto = {
        title: 'Updated Song',
        genre: 'Jazz',
      };

      const existingTrack = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Original Song',
        genre: 'Rock',
        description: 'A test song',
      };

      const updatedTrack = {
        ...existingTrack,
        ...updateDto,
      };

      mockRepository.findOne.mockResolvedValue(existingTrack);
      mockRepository.save.mockResolvedValue(updatedTrack);

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedTrack);
      expect(result).toEqual(updatedTrack);
    });

    it('should throw NotFoundException when track not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', { title: 'Updated' }),
      ).rejects.toThrow(
        new NotFoundException('Music track with ID nonexistent-id not found'),
      );
    });
  });

  describe('remove', () => {
    it('should delete a music track', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('123e4567-e89b-12d3-a456-426614174000');

      expect(mockRepository.delete).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw NotFoundException when track not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        new NotFoundException('Music track with ID nonexistent-id not found'),
      );
    });
  });
});