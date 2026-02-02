import { Expose, Transform } from 'class-transformer';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

const dateTransform = ({ value }) => {
  if (!value) return null;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  }
  return null;
};

export class MusicTrackResponseDto extends BaseResponseDto {
  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  audioUrl: string;

  @Expose()
  coverArt: string;

  @Expose()
  genre: string;

  @Expose()
  duration: number;

  @Expose()
  playCount: number;

  @Expose()
  @Transform(dateTransform)
  releaseDate: Date;

  // Computed fields
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.duration) return null;
    const minutes = Math.floor(obj.duration / 60);
    const seconds = obj.duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  })
  formattedDuration: string;

  @Expose()
  @Transform(({ obj }) => {
    return !!obj.audioUrl;
  })
  hasAudio: boolean;

  @Expose()
  @Transform(({ obj }) => {
    return !!obj.coverArt;
  })
  hasCoverArt: boolean;
}

export class MusicTrackSummaryDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  genre: string;

  @Expose()
  duration: number;

  @Expose()
  playCount: number;

  @Expose()
  coverArt: string;

  @Expose()
  @Transform(dateTransform)
  releaseDate: Date;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.duration) return null;
    const minutes = Math.floor(obj.duration / 60);
    const seconds = obj.duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  })
  formattedDuration: string;
}