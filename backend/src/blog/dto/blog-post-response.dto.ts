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

export class BlogPostResponseDto extends BaseResponseDto {
  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  excerpt: string;

  @Expose()
  featuredImage: string;

  @Expose()
  tags: string[];

  @Expose()
  status: 'draft' | 'published' | 'archived';

  @Expose()
  slug: string;

  @Expose()
  @Transform(dateTransform)
  publishedAt: Date;

  // Computed fields
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.content) return 0;
    // Estimate reading time based on average reading speed of 200 words per minute
    const wordCount = obj.content.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  })
  readingTimeMinutes: number;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.content) return 0;
    return obj.content.split(/\s+/).length;
  })
  wordCount: number;

  @Expose()
  @Transform(({ obj }) => {
    return obj.status === 'published';
  })
  isPublished: boolean;
}

export class BlogPostSummaryDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  excerpt: string;

  @Expose()
  featuredImage: string;

  @Expose()
  tags: string[];

  @Expose()
  status: 'draft' | 'published' | 'archived';

  @Expose()
  slug: string;

  @Expose()
  @Transform(dateTransform)
  publishedAt: Date;

  @Expose()
  @Transform(dateTransform)
  createdAt: Date;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.content) return 0;
    const wordCount = obj.content.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  })
  readingTimeMinutes: number;
}