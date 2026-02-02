import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';
import { MusicTrack } from './entities/music-track.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MusicTrack])],
  controllers: [MusicController],
  providers: [MusicService],
  exports: [MusicService],
})
export class MusicModule {}