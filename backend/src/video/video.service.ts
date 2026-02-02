import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVideoContentDto } from './dto/create-video-content.dto';
import { UpdateVideoContentDto } from './dto/update-video-content.dto';
import { VideoContent } from './entities/video-content.entity';
import { 
  validateYouTubeUrl, 
  extractBasicYouTubeInfo, 
  extractYouTubeId 
} from './utils/youtube.utils';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(VideoContent)
    private videoContentRepository: Repository<VideoContent>,
  ) {}

  async create(createVideoContentDto: CreateVideoContentDto): Promise<VideoContent> {
    // Validate YouTube URL
    try {
      validateYouTubeUrl(createVideoContentDto.youtubeUrl);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    // Extract YouTube metadata
    const youtubeInfo = extractBasicYouTubeInfo(createVideoContentDto.youtubeUrl);
    if (!youtubeInfo) {
      throw new BadRequestException('Failed to extract YouTube video information');
    }

    // Create video content with extracted metadata
    const videoContentData = {
      ...createVideoContentDto,
      youtubeId: youtubeInfo.id,
      thumbnail: createVideoContentDto.thumbnail || youtubeInfo.thumbnail,
    };

    const videoContent = this.videoContentRepository.create(videoContentData);
    return this.videoContentRepository.save(videoContent);
  }

  async findAll(): Promise<VideoContent[]> {
    return this.videoContentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<VideoContent> {
    const videoContent = await this.videoContentRepository.findOne({ where: { id } });
    if (!videoContent) {
      throw new NotFoundException(`Video content with ID ${id} not found`);
    }
    return videoContent;
  }

  async update(id: string, updateVideoContentDto: UpdateVideoContentDto): Promise<VideoContent> {
    const videoContent = await this.findOne(id);

    // If YouTube URL is being updated, validate and extract metadata
    if (updateVideoContentDto.youtubeUrl) {
      try {
        validateYouTubeUrl(updateVideoContentDto.youtubeUrl);
      } catch (error) {
        throw new BadRequestException(error.message);
      }

      const youtubeInfo = extractBasicYouTubeInfo(updateVideoContentDto.youtubeUrl);
      if (!youtubeInfo) {
        throw new BadRequestException('Failed to extract YouTube video information');
      }

      // Update with extracted metadata
      updateVideoContentDto.youtubeId = youtubeInfo.id;
      if (!updateVideoContentDto.thumbnail) {
        updateVideoContentDto.thumbnail = youtubeInfo.thumbnail;
      }
    }

    Object.assign(videoContent, updateVideoContentDto);
    return this.videoContentRepository.save(videoContent);
  }

  async remove(id: string): Promise<void> {
    const result = await this.videoContentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Video content with ID ${id} not found`);
    }
  }

  /**
   * Validates a YouTube URL and returns extracted metadata
   */
  async validateAndExtractYouTubeMetadata(url: string): Promise<{
    isValid: boolean;
    youtubeId?: string;
    thumbnail?: string;
    error?: string;
  }> {
    try {
      validateYouTubeUrl(url);
      const youtubeInfo = extractBasicYouTubeInfo(url);
      
      if (!youtubeInfo) {
        return {
          isValid: false,
          error: 'Failed to extract YouTube video information',
        };
      }

      return {
        isValid: true,
        youtubeId: youtubeInfo.id,
        thumbnail: youtubeInfo.thumbnail,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Finds videos by YouTube ID
   */
  async findByYouTubeId(youtubeId: string): Promise<VideoContent | null> {
    return this.videoContentRepository.findOne({ where: { youtubeId } });
  }
}