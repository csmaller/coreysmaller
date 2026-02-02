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
import { AudioService } from './audio.service';
import { CreateAudioContentDto } from './dto/create-audio-content.dto';
import { UpdateAudioContentDto } from './dto/update-audio-content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createAudioContentDto: CreateAudioContentDto) {
    return this.audioService.create(createAudioContentDto);
  }

  @Get()
  findAll() {
    return this.audioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.audioService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAudioContentDto: UpdateAudioContentDto) {
    return this.audioService.update(id, updateAudioContentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.audioService.remove(id);
  }

  @Get('validate-soundcloud')
  validateSoundCloudUrl(@Query('url') url: string) {
    return this.audioService.validateAndExtractSoundCloudMetadata(url);
  }

  @Get('by-soundcloud-id/:soundcloudId')
  findBySoundCloudId(@Param('soundcloudId') soundcloudId: string) {
    return this.audioService.findBySoundCloudId(soundcloudId);
  }

  @Post(':id/play')
  incrementPlayCount(@Param('id') id: string) {
    return this.audioService.incrementPlayCount(id);
  }
}