import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAudioContentDto } from './dto/create-audio-content.dto';
import { UpdateAudioContentDto } from './dto/update-audio-content.dto';
import { AudioContent } from './entities/audio-content.entity';
import { 
  validateSoundCloudUrl, 
  extractBasicSoundCloudInfo, 
  normalizeSoundCloudUrl,
  getSoundCloudContentType 
} from './utils/soundcloud.utils';

@Injectable()
export class AudioService {
  constructor(
    @InjectRepository(AudioContent)
    private audioContentRepository: Repository<AudioContent>,
  ) {}

  async create(createAudioContentDto: CreateAudioContentDto): Promise<AudioContent> {
    // Validate SoundCloud URL
    try {
      validateSoundCloudUrl(createAudioContentDto.soundcloudUrl);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    // Normalize the URL
    const normalizedUrl = normalizeSoundCloudUrl(createAudioContentDto.soundcloudUrl);

    // Extract SoundCloud metadata
    const soundcloudInfo = extractBasicSoundCloudInfo(normalizedUrl);
    if (!soundcloudInfo) {
      throw new BadRequestException('Failed to extract SoundCloud track information');
    }

    // Create audio content with extracted metadata
    const audioContentData = {
      ...createAudioContentDto,
      soundcloudUrl: normalizedUrl,
      soundcloudId: soundcloudInfo.id,
      artwork: createAudioContentDto.artwork || soundcloudInfo.artwork,
    };

    const audioContent = this.audioContentRepository.create(audioContentData);
    return this.audioContentRepository.save(audioContent);
  }

  async findAll(): Promise<AudioContent[]> {
    return this.audioContentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AudioContent> {
    const audioContent = await this.audioContentRepository.findOne({ where: { id } });
    if (!audioContent) {
      throw new NotFoundException(`Audio content with ID ${id} not found`);
    }
    return audioContent;
  }

  async update(id: string, updateAudioContentDto: UpdateAudioContentDto): Promise<AudioContent> {
    const audioContent = await this.findOne(id);

    // If SoundCloud URL is being updated, validate and extract metadata
    if (updateAudioContentDto.soundcloudUrl) {
      try {
        validateSoundCloudUrl(updateAudioContentDto.soundcloudUrl);
      } catch (error) {
        throw new BadRequestException(error.message);
      }

      // Normalize the URL
      const normalizedUrl = normalizeSoundCloudUrl(updateAudioContentDto.soundcloudUrl);

      const soundcloudInfo = extractBasicSoundCloudInfo(normalizedUrl);
      if (!soundcloudInfo) {
        throw new BadRequestException('Failed to extract SoundCloud track information');
      }

      // Update with extracted metadata
      updateAudioContentDto.soundcloudUrl = normalizedUrl;
      updateAudioContentDto.soundcloudId = soundcloudInfo.id;
      if (!updateAudioContentDto.artwork) {
        updateAudioContentDto.artwork = soundcloudInfo.artwork;
      }
    }

    Object.assign(audioContent, updateAudioContentDto);
    return this.audioContentRepository.save(audioContent);
  }

  async remove(id: string): Promise<void> {
    const result = await this.audioContentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Audio content with ID ${id} not found`);
    }
  }

  /**
   * Validates a SoundCloud URL and returns extracted metadata
   */
  async validateAndExtractSoundCloudMetadata(url: string): Promise<{
    isValid: boolean;
    soundcloudId?: string;
    contentType?: 'track' | 'playlist' | 'unknown';
    normalizedUrl?: string;
    error?: string;
  }> {
    try {
      validateSoundCloudUrl(url);
      const normalizedUrl = normalizeSoundCloudUrl(url);
      const soundcloudInfo = extractBasicSoundCloudInfo(normalizedUrl);
      
      if (!soundcloudInfo) {
        return {
          isValid: false,
          error: 'Failed to extract SoundCloud track information',
        };
      }

      return {
        isValid: true,
        soundcloudId: soundcloudInfo.id,
        contentType: getSoundCloudContentType(normalizedUrl),
        normalizedUrl,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Finds audio content by SoundCloud ID
   */
  async findBySoundCloudId(soundcloudId: string): Promise<AudioContent | null> {
    return this.audioContentRepository.findOne({ where: { soundcloudId } });
  }

  /**
   * Finds audio content by SoundCloud URL
   */
  async findBySoundCloudUrl(soundcloudUrl: string): Promise<AudioContent | null> {
    const normalizedUrl = normalizeSoundCloudUrl(soundcloudUrl);
    return this.audioContentRepository.findOne({ where: { soundcloudUrl: normalizedUrl } });
  }

  /**
   * Increments play count for audio content
   */
  async incrementPlayCount(id: string): Promise<AudioContent> {
    const audioContent = await this.findOne(id);
    audioContent.playCount += 1;
    return this.audioContentRepository.save(audioContent);
  }
}