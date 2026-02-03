import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MusicService } from './music.service';
import { CreateMusicTrackDto } from './dto/create-music-track.dto';
import { UpdateMusicTrackDto } from './dto/update-music-track.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createMusicTrackDto: CreateMusicTrackDto) {
    return this.musicService.create(createMusicTrackDto);
  }

  @Get()
  findAll() {
    return this.musicService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.musicService.findOne(id);
  }

  @Patch(':id/play')
  incrementPlayCount(@Param('id') id: string) {
    return this.musicService.incrementPlayCount(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMusicTrackDto: UpdateMusicTrackDto) {
    return this.musicService.update(id, updateMusicTrackDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.musicService.remove(id);
  }
}