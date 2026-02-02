import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsAudioUrl } from '../../common/validators/custom-validators';

export class CreateMusicTrackDto {
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

  @IsOptional()
  @IsAudioUrl()
  @Transform(({ value }) => value?.trim())
  audioUrl?: string;

  @IsOptional()
  @IsUrl()
  @Transform(({ value }) => value?.trim())
  coverArt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim().toLowerCase())
  genre?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(86400) // Max 24 hours
  @Transform(({ value }) => typeof value === 'number' ? Math.floor(value) : value)
  duration?: number;

  @IsOptional()
  @IsDateString()
  releaseDate?: Date;
}