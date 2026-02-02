import { Test, TestingModule } from '@nestjs/testing';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { CreateVideoContentDto } from './dto/create-video-content.dto';
import { UpdateVideoContentDto } from './dto/update-video-content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('VideoController', () => {
  let controller: VideoController;
  let service: VideoService;

  const mockVideoService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    validateAndExtractYouTubeMetadata: jest.fn(),
    findByYouTubeId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [
        {
          provide: VideoService,
          useValue: mockVideoService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VideoController>(VideoController);
    service = module.get<VideoService>(VideoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a video', async () => {
      const createDto: CreateVideoContentDto = {
        title: 'Test Video',
        description: 'Test Description',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };

      const expectedResult = {
        id: '1',
        ...createDto,
        youtubeId: 'dQw4w9WgXcQ',
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
      };

      mockVideoService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return all videos', async () => {
      const expectedVideos = [
        { id: '1', title: 'Video 1' },
        { id: '2', title: 'Video 2' },
      ];

      mockVideoService.findAll.mockResolvedValue(expectedVideos);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedVideos);
    });
  });

  describe('findOne', () => {
    it('should return a video by ID', async () => {
      const expectedVideo = { id: '1', title: 'Test Video' };
      mockVideoService.findOne.mockResolvedValue(expectedVideo);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(expectedVideo);
    });
  });

  describe('update', () => {
    it('should update a video', async () => {
      const updateDto: UpdateVideoContentDto = {
        title: 'Updated Title',
      };

      const expectedResult = {
        id: '1',
        title: 'Updated Title',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };

      mockVideoService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove a video', async () => {
      mockVideoService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toBeUndefined();
    });
  });

  describe('validateYouTubeUrl', () => {
    it('should validate a YouTube URL', async () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const expectedResult = {
        isValid: true,
        youtubeId: 'dQw4w9WgXcQ',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      };

      mockVideoService.validateAndExtractYouTubeMetadata.mockResolvedValue(expectedResult);

      const result = await controller.validateYouTubeUrl(url);

      expect(service.validateAndExtractYouTubeMetadata).toHaveBeenCalledWith(url);
      expect(result).toEqual(expectedResult);
    });

    it('should return error when URL parameter is missing', async () => {
      const result = await controller.validateYouTubeUrl('');

      expect(result).toEqual({
        isValid: false,
        error: 'URL parameter is required',
      });
      expect(service.validateAndExtractYouTubeMetadata).not.toHaveBeenCalled();
    });
  });

  describe('findByYouTubeId', () => {
    it('should find video by YouTube ID', async () => {
      const expectedVideo = { id: '1', youtubeId: 'dQw4w9WgXcQ' };
      mockVideoService.findByYouTubeId.mockResolvedValue(expectedVideo);

      const result = await controller.findByYouTubeId('dQw4w9WgXcQ');

      expect(service.findByYouTubeId).toHaveBeenCalledWith('dQw4w9WgXcQ');
      expect(result).toEqual(expectedVideo);
    });
  });
});