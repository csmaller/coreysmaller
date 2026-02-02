import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsSlug } from '../../common/validators/custom-validators';

export class CreateBlogPostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  excerpt?: string;

  @IsOptional()
  @IsUrl()
  @Transform(({ value }) => value?.trim())
  featuredImage?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => Array.isArray(value) ? value.map(tag => tag?.trim().toLowerCase()).filter(Boolean) : [])
  tags?: string[];

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';

  @IsOptional()
  @IsString()
  @IsSlug()
  @Transform(({ value }) => value?.toLowerCase().trim())
  slug?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: Date;
}