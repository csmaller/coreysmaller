import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { CreateVideoContentDto } from './dto/create-video-content.dto';
import { UpdateVideoContentDto } from './dto/update-video-content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createVideoContentDto: CreateVideoContentDto) {
    return this.videoService.create(createVideoContentDto);
  }

  @Get()
  findAll() {
    return this.videoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.videoService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVideoContentDto: UpdateVideoContentDto) {
    return this.videoService.update(id, updateVideoContentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.videoService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate-youtube')
  async validateYouTubeUrl(@Query('url') url: string) {
    if (!url) {
      return {
        isValid: false,
        error: 'URL parameter is required',
      };
    }
    
    return this.videoService.validateAndExtractYouTubeMetadata(url);
  }

  @Get('by-youtube-id/:youtubeId')
  async findByYouTubeId(@Param('youtubeId') youtubeId: string) {
    return this.videoService.findByYouTubeId(youtubeId);
  }
}