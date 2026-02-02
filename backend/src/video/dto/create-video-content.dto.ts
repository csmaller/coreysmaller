import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsNumber,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsYouTubeUrl } from '../../common/validators/custom-validators';

export class CreateVideoContentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsYouTubeUrl()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  youtubeUrl: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  youtubeId?: string;

  @IsOptional()
  @IsUrl()
  @Transform(({ value }) => value?.trim())
  thumbnail?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(86400) // Max 24 hours
  @Transform(({ value }) => typeof value === 'number' ? Math.floor(value) : value)
  duration?: number;
}