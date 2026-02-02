import { PartialType } from '@nestjs/mapped-types';
import { CreateMusicTrackDto } from './create-music-track.dto';

export class UpdateMusicTrackDto extends PartialType(CreateMusicTrackDto) {}