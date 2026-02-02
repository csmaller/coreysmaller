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

export class AudioContentResponseDto extends BaseResponseDto {
  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  soundcloudUrl: string;

  @Expose()
  soundcloudId: string;

  @Expose()
  artwork: string;

  @Expose()
  duration: number;

  @Expose()
  playCount: number;

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
    return obj.soundcloudId ? `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${obj.soundcloudId}` : null;
  })
  embedUrl: string;

  @Expose()
  @Transform(({ obj }) => {
    return !!obj.soundcloudId;
  })
  isValid: boolean;

  @Expose()
  @Transform(({ obj }) => {
    return !!obj.artwork;
  })
  hasArtwork: boolean;
}

export class AudioContentSummaryDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  soundcloudId: string;

  @Expose()
  artwork: string;

  @Expose()
  duration: number;

  @Expose()
  playCount: number;

  @Expose()
  @Transform(dateTransform)
  createdAt: Date;

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
    return !!obj.artwork;
  })
  hasArtwork: boolean;
}