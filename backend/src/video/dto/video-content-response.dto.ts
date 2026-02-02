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

export class VideoContentResponseDto extends BaseResponseDto {
  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  youtubeUrl: string;

  @Expose()
  youtubeId: string;

  @Expose()
  thumbnail: string;

  @Expose()
  duration: number;

  @Expose()
  viewCount: number;

  // Computed fields
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.duration) return null;
    const hours = Math.floor(obj.duration / 3600);
    const minutes = Math.floor((obj.duration % 3600) / 60);
    const seconds = obj.duration % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  })
  formattedDuration: string;

  @Expose()
  @Transform(({ obj }) => {
    return obj.youtubeId ? `https://www.youtube.com/embed/${obj.youtubeId}` : null;
  })
  embedUrl: string;

  @Expose()
  @Transform(({ obj }) => {
    return obj.youtubeId ? `https://img.youtube.com/vi/${obj.youtubeId}/maxresdefault.jpg` : obj.thumbnail;
  })
  thumbnailUrl: string;

  @Expose()
  @Transform(({ obj }) => {
    return !!obj.youtubeId;
  })
  isValid: boolean;
}

export class VideoContentSummaryDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  youtubeId: string;

  @Expose()
  thumbnail: string;

  @Expose()
  duration: number;

  @Expose()
  viewCount: number;

  @Expose()
  @Transform(dateTransform)
  createdAt: Date;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.duration) return null;
    const hours = Math.floor(obj.duration / 3600);
    const minutes = Math.floor((obj.duration % 3600) / 60);
    const seconds = obj.duration % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  })
  formattedDuration: string;

  @Expose()
  @Transform(({ obj }) => {
    return obj.youtubeId ? `https://img.youtube.com/vi/${obj.youtubeId}/maxresdefault.jpg` : obj.thumbnail;
  })
  thumbnailUrl: string;
}