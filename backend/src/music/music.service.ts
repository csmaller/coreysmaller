import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMusicTrackDto } from './dto/create-music-track.dto';
import { UpdateMusicTrackDto } from './dto/update-music-track.dto';
import { MusicTrack } from './entities/music-track.entity';

@Injectable()
export class MusicService {
  constructor(
    @InjectRepository(MusicTrack)
    private musicTrackRepository: Repository<MusicTrack>,
  ) {}

  async create(createMusicTrackDto: CreateMusicTrackDto): Promise<MusicTrack> {
    const musicTrack = this.musicTrackRepository.create(createMusicTrackDto);
    return this.musicTrackRepository.save(musicTrack);
  }

  async findAll(): Promise<MusicTrack[]> {
    return this.musicTrackRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MusicTrack> {
    const musicTrack = await this.musicTrackRepository.findOne({ where: { id } });
    if (!musicTrack) {
      throw new NotFoundException(`Music track with ID ${id} not found`);
    }
    return musicTrack;
  }

  async update(id: string, updateMusicTrackDto: UpdateMusicTrackDto): Promise<MusicTrack> {
    const musicTrack = await this.findOne(id);
    Object.assign(musicTrack, updateMusicTrackDto);
    return this.musicTrackRepository.save(musicTrack);
  }

  async remove(id: string): Promise<void> {
    const result = await this.musicTrackRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Music track with ID ${id} not found`);
    }
  }
}