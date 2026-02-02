import { Test, TestingModule } from '@nestjs/testing';
import { AudioController } from './audio.controller';
import { AudioService } from './audio.service';
import { CreateAudioContentDto } from './dto/create-audio-content.dto';
import { UpdateAudioContentDto } from './dto/update-audio-content.dto';
import { AudioContent } from './entities/audio-content.entity';

describe('AudioController', () => {
  let controller: AudioController;
  let service: AudioService;

  const mockAudioService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    validateAndExtractSoundCloudMetadata: jest.fn(),
    findBySoundCloudId: jest.fn(),
    incrementPlayCount: jest.fn(),
  };

  const mockAudioContent: AudioContent = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Track',
    description: 'A test track',
    soundcloudUrl: 'https://soundcloud.com/artist/test-track',
    soundcloudId: 'artist/test-track',
    artwork: null,
    duration: null,
    playCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AudioController],
      providers: [
        {
          provide: AudioService,
          useValue: mockAudioService,
        },
      ],
    }).compile();

    controller = module.get<AudioController>(AudioController);
    service = module.get<AudioService>(AudioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create audio content', async () => {
      const createDto: CreateAudioContentDto = {
        title: 'Test Track',
        description: 'A test track',
        soundcloudUrl: 'https://soundcloud.com/artist/test-track',
      };

      mockAudioService.create.mockResolvedValue(mockAudioContent);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockAudioContent);
    });
  });

  describe('findAll', () => {
    it('should return all audio content', async () => {
      const audioList = [mockAudioContent];
      mockAudioService.findAll.mockResolvedValue(audioList);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(audioList);
    });
  });

  describe('findOne', () => {
    it('should return audio content by ID', async () => {
      mockAudioService.findOne.mockResolvedValue(mockAudioContent);

      const result = await controller.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(service.findOne).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual(mockAudioContent);
    });
  });

  describe('update', () => {
    it('should update audio content', async () => {
      const updateDto: UpdateAudioContentDto = {
        title: 'Updated Track',
      };
      const updatedAudioContent = { ...mockAudioContent, ...updateDto };

      mockAudioService.update.mockResolvedValue(updatedAudioContent);

      const result = await controller.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(service.update).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', updateDto);
      expect(result).toEqual(updatedAudioContent);
    });
  });

  describe('remove', () => {
    it('should remove audio content', async () => {
      mockAudioService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('123e4567-e89b-12d3-a456-426614174000');

      expect(service.remove).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toBeUndefined();
    });
  });

  describe('validateSoundCloudUrl', () => {
    it('should validate SoundCloud URL', async () => {
      const validationResult = {
        isValid: true,
        soundcloudId: 'artist/track',
        contentType: 'track' as const,
        normalizedUrl: 'https://soundcloud.com/artist/track',
      };

      mockAudioService.validateAndExtractSoundCloudMetadata.mockResolvedValue(validationResult);

      const result = await controller.validateSoundCloudUrl('https://soundcloud.com/artist/track');

      expect(service.validateAndExtractSoundCloudMetadata).toHaveBeenCalledWith('https://soundcloud.com/artist/track');
      expect(result).toEqual(validationResult);
    });
  });

  describe('findBySoundCloudId', () => {
    it('should find audio content by SoundCloud ID', async () => {
      mockAudioService.findBySoundCloudId.mockResolvedValue(mockAudioContent);

      const result = await controller.findBySoundCloudId('artist/track');

      expect(service.findBySoundCloudId).toHaveBeenCalledWith('artist/track');
      expect(result).toEqual(mockAudioContent);
    });
  });

  describe('incrementPlayCount', () => {
    it('should increment play count', async () => {
      const audioWithIncrementedCount = { ...mockAudioContent, playCount: 1 };
      mockAudioService.incrementPlayCount.mockResolvedValue(audioWithIncrementedCount);

      const result = await controller.incrementPlayCount('123e4567-e89b-12d3-a456-426614174000');

      expect(service.incrementPlayCount).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual(audioWithIncrementedCount);
    });
  });
});