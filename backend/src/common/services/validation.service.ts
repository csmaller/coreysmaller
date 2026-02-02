import { Injectable, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { SanitizationService } from './sanitization.service';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

@Injectable()
export class ValidationService {
  constructor(private sanitizationService: SanitizationService) {}

  /**
   * Validate and sanitize DTO data
   */
  async validateAndSanitize<T extends object>(
    dtoClass: new () => T,
    data: any,
    options: {
      sanitize?: boolean;
      throwOnError?: boolean;
    } = {}
  ): Promise<ValidationResult> {
    const { sanitize = true, throwOnError = true } = options;

    // Create DTO instance
    const dto = Object.assign(new dtoClass(), data);

    // Sanitize data if requested
    let sanitizedData = dto;
    if (sanitize) {
      sanitizedData = this.sanitizeDto(dto);
    }

    // Validate the DTO
    const validationErrors = await validate(sanitizedData, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    const errors = this.formatValidationErrors(validationErrors);
    const isValid = errors.length === 0;

    if (!isValid && throwOnError) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    return {
      isValid,
      errors,
      sanitizedData: isValid ? sanitizedData : undefined,
    };
  }

  /**
   * Sanitize DTO based on its type and properties
   */
  private sanitizeDto(dto: any): any {
    const sanitized = { ...dto };

    // Handle common fields
    if (sanitized.title) {
      sanitized.title = this.sanitizationService.sanitizeText(sanitized.title);
    }

    if (sanitized.content) {
      sanitized.content = this.sanitizationService.sanitizeHtml(sanitized.content);
    }

    if (sanitized.description) {
      sanitized.description = this.sanitizationService.sanitizeText(sanitized.description);
    }

    if (sanitized.excerpt) {
      sanitized.excerpt = this.sanitizationService.sanitizeText(sanitized.excerpt);
    }

    if (sanitized.slug) {
      sanitized.slug = this.sanitizationService.sanitizeSlug(sanitized.slug);
    }

    if (sanitized.tags && Array.isArray(sanitized.tags)) {
      sanitized.tags = this.sanitizationService.sanitizeTags(sanitized.tags);
    }

    if (sanitized.genre) {
      sanitized.genre = this.sanitizationService.sanitizeText(sanitized.genre);
    }

    // Handle URLs
    if (sanitized.featuredImage) {
      sanitized.featuredImage = this.sanitizationService.sanitizeUrl(sanitized.featuredImage);
    }

    if (sanitized.audioUrl) {
      sanitized.audioUrl = this.sanitizationService.sanitizeUrl(sanitized.audioUrl);
    }

    if (sanitized.coverArt) {
      sanitized.coverArt = this.sanitizationService.sanitizeUrl(sanitized.coverArt);
    }

    if (sanitized.youtubeUrl) {
      sanitized.youtubeUrl = this.sanitizationService.sanitizeUrl(sanitized.youtubeUrl);
      // Extract YouTube ID
      const youtubeId = this.sanitizationService.extractYouTubeId(sanitized.youtubeUrl);
      if (youtubeId) {
        sanitized.youtubeId = youtubeId;
      }
    }

    if (sanitized.soundcloudUrl) {
      sanitized.soundcloudUrl = this.sanitizationService.sanitizeUrl(sanitized.soundcloudUrl);
      // Extract SoundCloud ID
      const soundcloudId = this.sanitizationService.extractSoundCloudId(sanitized.soundcloudUrl);
      if (soundcloudId) {
        sanitized.soundcloudId = soundcloudId;
      }
    }

    if (sanitized.thumbnail) {
      sanitized.thumbnail = this.sanitizationService.sanitizeUrl(sanitized.thumbnail);
    }

    if (sanitized.artwork) {
      sanitized.artwork = this.sanitizationService.sanitizeUrl(sanitized.artwork);
    }

    // Handle numeric fields
    if (typeof sanitized.duration === 'number') {
      sanitized.duration = this.sanitizationService.sanitizeDuration(sanitized.duration);
    }

    if (typeof sanitized.playCount === 'number') {
      sanitized.playCount = this.sanitizationService.sanitizePlayCount(sanitized.playCount);
    }

    if (typeof sanitized.viewCount === 'number') {
      sanitized.viewCount = this.sanitizationService.sanitizePlayCount(sanitized.viewCount);
    }

    return sanitized;
  }

  /**
   * Format validation errors into readable messages
   */
  private formatValidationErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    for (const error of errors) {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }

      if (error.children && error.children.length > 0) {
        messages.push(...this.formatValidationErrors(error.children));
      }
    }

    return messages;
  }

  /**
   * Validate business rules for content
   */
  validateBusinessRules(entityType: string, data: any): ValidationResult {
    const errors: string[] = [];

    switch (entityType) {
      case 'blog':
        errors.push(...this.validateBlogBusinessRules(data));
        break;
      case 'music':
        errors.push(...this.validateMusicBusinessRules(data));
        break;
      case 'video':
        errors.push(...this.validateVideoBusinessRules(data));
        break;
      case 'audio':
        errors.push(...this.validateAudioBusinessRules(data));
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateBlogBusinessRules(data: any): string[] {
    const errors: string[] = [];

    // Published posts must have a publication date
    if (data.status === 'published' && !data.publishedAt) {
      errors.push('Published posts must have a publication date');
    }

    // Slug must be unique (this would be checked at service level with database)
    if (data.slug && data.slug.length < 3) {
      errors.push('Slug must be at least 3 characters long');
    }

    // Content length validation
    if (data.content && data.content.length < 10) {
      errors.push('Content must be at least 10 characters long');
    }

    return errors;
  }

  private validateMusicBusinessRules(data: any): string[] {
    const errors: string[] = [];

    // Duration validation
    if (data.duration && (data.duration < 1 || data.duration > 86400)) {
      errors.push('Duration must be between 1 second and 24 hours');
    }

    // Release date cannot be in the future
    if (data.releaseDate && new Date(data.releaseDate) > new Date()) {
      errors.push('Release date cannot be in the future');
    }

    return errors;
  }

  private validateVideoBusinessRules(data: any): string[] {
    const errors: string[] = [];

    // YouTube URL validation
    if (data.youtubeUrl && !this.isValidYouTubeUrl(data.youtubeUrl)) {
      errors.push('Invalid YouTube URL format');
    }

    // Duration validation
    if (data.duration && (data.duration < 1 || data.duration > 86400)) {
      errors.push('Duration must be between 1 second and 24 hours');
    }

    return errors;
  }

  private validateAudioBusinessRules(data: any): string[] {
    const errors: string[] = [];

    // SoundCloud URL validation
    if (data.soundcloudUrl && !this.isValidSoundCloudUrl(data.soundcloudUrl)) {
      errors.push('Invalid SoundCloud URL format');
    }

    // Duration validation
    if (data.duration && (data.duration < 1 || data.duration > 86400)) {
      errors.push('Duration must be between 1 second and 24 hours');
    }

    return errors;
  }

  private isValidYouTubeUrl(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+(&[\w=]*)?$/;
    return youtubeRegex.test(url);
  }

  private isValidSoundCloudUrl(url: string): boolean {
    const soundcloudRegex = /^https:\/\/(www\.)?soundcloud\.com\/[\w-]+\/[\w-]+(\?.*)?$/;
    return soundcloudRegex.test(url);
  }

  /**
   * Validate referential integrity constraints
   */
  async validateReferentialIntegrity(
    entityType: string,
    data: any,
    existingEntity?: any
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check for unique constraints
    if (entityType === 'blog' && data.slug && existingEntity?.slug !== data.slug) {
      // This would typically involve a database query to check uniqueness
      // For now, we'll just validate the format
      if (!/^[a-z0-9-]+$/.test(data.slug)) {
        errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
      }
    }

    if (entityType === 'video' && data.youtubeId && existingEntity?.youtubeId !== data.youtubeId) {
      // Validate YouTube ID format
      if (!/^[\w-]{11}$/.test(data.youtubeId)) {
        errors.push('Invalid YouTube ID format');
      }
    }

    if (entityType === 'audio' && data.soundcloudId && existingEntity?.soundcloudId !== data.soundcloudId) {
      // Validate SoundCloud ID format
      if (!/^[\w-\/]+$/.test(data.soundcloudId)) {
        errors.push('Invalid SoundCloud ID format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}