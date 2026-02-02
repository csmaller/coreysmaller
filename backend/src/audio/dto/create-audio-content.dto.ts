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
import { IsSoundCloudUrl } from '../../common/validators/custom-validators';

export class CreateAudioContentDto {
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

  @IsSoundCloudUrl()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  soundcloudUrl: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  soundcloudId?: string;

  @IsOptional()
  @IsUrl()
  @Transform(({ value }) => value?.trim())
  artwork?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(86400) // Max 24 hours
  @Transform(({ value }) => typeof value === 'number' ? Math.floor(value) : value)
  duration?: number;
}