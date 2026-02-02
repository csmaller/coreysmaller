import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoContent } from './entities/video-content.entity';
import { CreateVideoContentDto } from './dto/create-video-content.dto';
import { UpdateVideoContentDto } from './dto/update-video-content.dto';

describe('VideoService', () => {
  let service: VideoService;
  let repository: Repository<VideoContent>;

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
        VideoService,
        {
          provide: getRepositoryToken(VideoContent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
    repository = module.get<Repository<VideoContent>>(getRepositoryToken(VideoContent));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createVideoDto: CreateVideoContentDto = {
      title: 'Test Video',
      description: 'Test Description',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };

    it('should create a video with valid YouTube URL', async () => {
      const expectedVideo = {
        id: '1',
        ...createVideoDto,
        youtubeId: 'dQw4w9WgXcQ',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
      };

      mockRepository.create.mockReturnValue(expectedVideo);
      mockRepository.save.mockResolvedValue(expectedVideo);

      const result = await service.create(createVideoDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createVideoDto,
        youtubeId: 'dQw4w9WgXcQ',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedVideo);
      expect(result).toEqual(expectedVideo);
    });

    it('should use provided thumbnail over extracted one', async () => {
      const dtoWithThumbnail = {
        ...createVideoDto,
        thumbnail: 'https://example.com/custom-thumbnail.jpg',
      };

      const expectedVideo = {
        id: '1',
        ...dtoWithThumbnail,
        youtubeId: 'dQw4w9WgXcQ',
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
      };

      mockRepository.create.mockReturnValue(expectedVideo);
      mockRepository.save.mockResolvedValue(expectedVideo);

      const result = await service.create(dtoWithThumbnail);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dtoWithThumbnail,
        youtubeId: 'dQw4w9WgXcQ',
        thumbnail: 'https://example.com/custom-thumbnail.jpg',
      });
      expect(result.thumbnail).toBe('https://example.com/custom-thumbnail.jpg');
    });

    it('should throw BadRequestException for invalid YouTube URL', async () => {
      const invalidDto = {
        ...createVideoDto,
        youtubeUrl: 'https://example.com/not-youtube',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty YouTube URL', async () => {
      const invalidDto = {
        ...createVideoDto,
        youtubeUrl: '',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all videos ordered by creation date', async () => {
      const videos = [
        { id: '1', title: 'Video 1', createdAt: new Date('2023-01-02') },
        { id: '2', title: 'Video 2', createdAt: new Date('2023-01-01') },
      ];

      mockRepository.find.mockResolvedValue(videos);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(videos);
    });
  });

  describe('findOne', () => {
    it('should return a video by ID', async () => {
      const video = { id: '1', title: 'Test Video' };
      mockRepository.findOne.mockResolvedValue(video);

      const result = await service.findOne('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(video);
    });

    it('should throw NotFoundException when video not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const existingVideo = {
      id: '1',
      title: 'Existing Video',
      youtubeUrl: 'https://www.youtube.com/watch?v=oldVideoId',
      youtubeId: 'oldVideoId',
    };

    beforeEach(() => {
      mockRepository.findOne.mockResolvedValue(existingVideo);
    });

    it('should update video without YouTube URL change', async () => {
      const updateDto: UpdateVideoContentDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const updatedVideo = { ...existingVideo, ...updateDto };
      mockRepository.save.mockResolvedValue(updatedVideo);

      const result = await service.update('1', updateDto);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedVideo);
      expect(result).toEqual(updatedVideo);
    });

    it('should update video with new YouTube URL and extract metadata', async () => {
      const updateDto: UpdateVideoContentDto = {
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };

      const updatedVideo = {
        ...existingVideo,
        ...updateDto,
        youtubeId: 'dQw4w9WgXcQ',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      };
      mockRepository.save.mockResolvedValue(updatedVideo);

      const result = await service.update('1', updateDto);

      expect(result.youtubeId).toBe('dQw4w9WgXcQ');
      expect(result.thumbnail).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    });

    it('should throw BadRequestException for invalid YouTube URL in update', async () => {
      const updateDto: UpdateVideoContentDto = {
        youtubeUrl: 'https://example.com/not-youtube',
      };

      await expect(service.update('1', updateDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when updating non-existent video', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const updateDto: UpdateVideoContentDto = {
        title: 'Updated Title',
      };

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a video successfully', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when removing non-existent video', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateAndExtractYouTubeMetadata', () => {
    it('should return valid metadata for valid YouTube URL', async () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      
      const result = await service.validateAndExtractYouTubeMetadata(url);

      expect(result).toEqual({
        isValid: true,
        youtubeId: 'dQw4w9WgXcQ',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      });
    });

    it('should return error for invalid YouTube URL', async () => {
      const url = 'https://example.com/not-youtube';
      
      const result = await service.validateAndExtractYouTubeMetadata(url);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('findByYouTubeId', () => {
    it('should find video by YouTube ID', async () => {
      const video = { id: '1', youtubeId: 'dQw4w9WgXcQ' };
      mockRepository.findOne.mockResolvedValue(video);

      const result = await service.findByYouTubeId('dQw4w9WgXcQ');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { youtubeId: 'dQw4w9WgXcQ' } });
      expect(result).toEqual(video);
    });

    it('should return null when video not found by YouTube ID', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByYouTubeId('nonexistent');

      expect(result).toBeNull();
    });
  });
});