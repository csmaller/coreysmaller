import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AudioService } from './audio.service';
import { AudioContent } from './entities/audio-content.entity';
import { CreateAudioContentDto } from './dto/create-audio-content.dto';
import { UpdateAudioContentDto } from './dto/update-audio-content.dto';

describe('AudioService', () => {
  let service: AudioService;
  let repository: Repository<AudioContent>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
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
      providers: [
        AudioService,
        {
          provide: getRepositoryToken(AudioContent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AudioService>(AudioService);
    repository = module.get<Repository<AudioContent>>(getRepositoryToken(AudioContent));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateAudioContentDto = {
      title: 'Test Track',
      description: 'A test track',
      soundcloudUrl: 'https://soundcloud.com/artist/test-track',
    };

    it('should create audio content with valid SoundCloud URL', async () => {
      mockRepository.create.mockReturnValue(mockAudioContent);
      mockRepository.save.mockResolvedValue(mockAudioContent);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        soundcloudUrl: 'https://soundcloud.com/artist/test-track',
        soundcloudId: 'artist/test-track',
        artwork: undefined,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockAudioContent);
      expect(result).toEqual(mockAudioContent);
    });

    it('should throw BadRequestException for invalid SoundCloud URL', async () => {
      const invalidDto = {
        ...createDto,
        soundcloudUrl: 'https://youtube.com/watch?v=123',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty SoundCloud URL', async () => {
      const invalidDto = {
        ...createDto,
        soundcloudUrl: '',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all audio content ordered by creation date', async () => {
      const audioList = [mockAudioContent];
      mockRepository.find.mockResolvedValue(audioList);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(audioList);
    });
  });

  describe('findOne', () => {
    it('should return audio content by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockAudioContent);

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
      expect(result).toEqual(mockAudioContent);
    });

    it('should throw NotFoundException when audio content not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateAudioContentDto = {
      title: 'Updated Track',
      soundcloudUrl: 'https://soundcloud.com/artist/updated-track',
    };

    it('should update audio content with valid data', async () => {
      const updatedAudioContent = { ...mockAudioContent, ...updateDto };
      mockRepository.findOne.mockResolvedValue(mockAudioContent);
      mockRepository.save.mockResolvedValue(updatedAudioContent);

      const result = await service.update('123e4567-e89b-12d3-a456-426614174000', updateDto);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedAudioContent);
    });

    it('should validate SoundCloud URL when updating', async () => {
      const invalidUpdateDto = {
        ...updateDto,
        soundcloudUrl: 'https://youtube.com/watch?v=123',
      };
      mockRepository.findOne.mockResolvedValue(mockAudioContent);

      await expect(
        service.update('123e4567-e89b-12d3-a456-426614174000', invalidUpdateDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when audio content not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', updateDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove audio content by ID', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('123e4567-e89b-12d3-a456-426614174000');

      expect(mockRepository.delete).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw NotFoundException when audio content not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateAndExtractSoundCloudMetadata', () => {
    it('should return valid metadata for valid SoundCloud URL', async () => {
      const url = 'https://soundcloud.com/artist/track';
      const result = await service.validateAndExtractSoundCloudMetadata(url);

      expect(result.isValid).toBe(true);
      expect(result.soundcloudId).toBe('artist/track');
      expect(result.contentType).toBe('track');
      expect(result.normalizedUrl).toBe('https://soundcloud.com/artist/track');
    });

    it('should return error for invalid SoundCloud URL', async () => {
      const url = 'https://youtube.com/watch?v=123';
      const result = await service.validateAndExtractSoundCloudMetadata(url);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('findBySoundCloudId', () => {
    it('should find audio content by SoundCloud ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockAudioContent);

      const result = await service.findBySoundCloudId('artist/track');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { soundcloudId: 'artist/track' },
      });
      expect(result).toEqual(mockAudioContent);
    });

    it('should return null when not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findBySoundCloudId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findBySoundCloudUrl', () => {
    it('should find audio content by SoundCloud URL', async () => {
      mockRepository.findOne.mockResolvedValue(mockAudioContent);

      const result = await service.findBySoundCloudUrl('https://soundcloud.com/artist/track');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { soundcloudUrl: 'https://soundcloud.com/artist/track' },
      });
      expect(result).toEqual(mockAudioContent);
    });
  });

  describe('incrementPlayCount', () => {
    it('should increment play count', async () => {
      const audioWithIncrementedCount = { ...mockAudioContent, playCount: 1 };
      mockRepository.findOne.mockResolvedValue(mockAudioContent);
      mockRepository.save.mockResolvedValue(audioWithIncrementedCount);

      const result = await service.incrementPlayCount('123e4567-e89b-12d3-a456-426614174000');

      expect(result.playCount).toBe(1);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when audio content not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.incrementPlayCount('nonexistent-id')
      ).rejects.toThrow(NotFoundException);
    });
  });
});