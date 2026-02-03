import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { BlogPost } from './entities/blog-post.entity';
import { MigrationService, MigrationResult } from './migration.service';
import { CacheService } from '../common/cache.service';
import { SanitizationService } from '../common/services/sanitization.service';
import { ValidationService } from '../common/services/validation.service';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private blogPostRepository: Repository<BlogPost>,
    private migrationService: MigrationService,
    private cacheService: CacheService,
    private sanitizationService: SanitizationService,
    private validationService: ValidationService,
  ) {}

  async create(createBlogPostDto: CreateBlogPostDto): Promise<BlogPost> {
    // Validate and sanitize input data
    const validationResult = await this.validationService.validateAndSanitize(
      CreateBlogPostDto,
      createBlogPostDto
    );

    // Validate business rules
    const businessRulesResult = this.validationService.validateBusinessRules(
      'blog',
      validationResult.sanitizedData
    );

    if (!businessRulesResult.isValid) {
      throw new BadRequestException({
        message: 'Business rule validation failed',
        errors: businessRulesResult.errors,
      });
    }

    // Validate referential integrity
    const integrityResult = await this.validationService.validateReferentialIntegrity(
      'blog',
      validationResult.sanitizedData
    );

    if (!integrityResult.isValid) {
      throw new BadRequestException({
        message: 'Referential integrity validation failed',
        errors: integrityResult.errors,
      });
    }

    const blogPost = this.blogPostRepository.create(validationResult.sanitizedData);
    const savedPosts = await this.blogPostRepository.save(blogPost);
    const savedPost = Array.isArray(savedPosts) ? savedPosts[0] : savedPosts;
    
    // Invalidate related caches
    await this.invalidateBlogCaches();
    
    return savedPost;
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    data: BlogPost[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.blogPostRepository.findAndCount({
      where: { status: 'published' },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<BlogPost> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new NotFoundException(`Invalid blog post ID: ${id}`);
    }
    
    const cacheKey = this.cacheService.generateItemKey('blog', id);
    
    return this.cacheService.cacheOrExecute(
      cacheKey,
      async () => {
        const blogPost = await this.blogPostRepository.findOne({ where: { id: numericId } });
        if (!blogPost) {
          throw new NotFoundException(`Blog post with ID ${id} not found`);
        }
        return blogPost;
      },
      { ttl: 600 } // Cache individual posts for 10 minutes
    );
  }

  async update(id: string, updateBlogPostDto: UpdateBlogPostDto): Promise<BlogPost> {
    const blogPost = await this.findOne(id);
    Object.assign(blogPost, updateBlogPostDto);
    const updatedPost = await this.blogPostRepository.save(blogPost);
    
    // Invalidate caches for this post and lists
    await this.invalidateBlogCaches(id);
    
    return updatedPost;
  }

  async remove(id: string): Promise<void> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new NotFoundException(`Invalid blog post ID: ${id}`);
    }
    
    const result = await this.blogPostRepository.delete(numericId);
    if (result.affected === 0) {
      throw new NotFoundException(`Blog post with ID ${id} not found`);
    }
    
    // Invalidate caches
    await this.invalidateBlogCaches(id);
  }

  async migrateMarkdownFiles(): Promise<MigrationResult> {
    const result = await this.migrationService.migrateMarkdownFiles();
    
    // Clear all blog caches after migration
    await this.invalidateBlogCaches();
    
    return result;
  }

  async getMigrationStatus(): Promise<{
    totalMarkdownFiles: number;
    totalBlogPosts: number;
    unmigrated: string[];
  }> {
    const cacheKey = 'blog:migration:status';
    
    return this.cacheService.cacheOrExecute(
      cacheKey,
      async () => this.migrationService.getMigrationStatus(),
      { ttl: 60 } // Cache migration status for 1 minute
    );
  }

  /**
   * Get blog post statistics
   */
  async getStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    archived: number;
  }> {
    const cacheKey = this.cacheService.generateStatsKey('blog');
    
    return this.cacheService.cacheOrExecute(
      cacheKey,
      async () => {
        const [total, published, draft, archived] = await Promise.all([
          this.blogPostRepository.count(),
          this.blogPostRepository.count({ where: { status: 'published' } }),
          this.blogPostRepository.count({ where: { status: 'draft' } }),
          this.blogPostRepository.count({ where: { status: 'archived' } }),
        ]);

        return { total, published, draft, archived };
      },
      { ttl: 300 } // Cache stats for 5 minutes
    );
  }

  /**
   * Get recent blog posts for home page
   */
  async getRecentPosts(limit: number = 5): Promise<BlogPost[]> {
    const cacheKey = `blog:recent:${limit}`;
    
    return this.cacheService.cacheOrExecute(
      cacheKey,
      async () => {
        return this.blogPostRepository.find({
          where: { status: 'published' },
          order: { createdAt: 'DESC' },
          take: limit,
          select: ['id', 'title', 'excerpt', 'featuredImage', 'createdAt', 'slug'],
        });
      },
      { ttl: 180 } // Cache recent posts for 3 minutes
    );
  }

  /**
   * Invalidate blog-related caches
   */
  private async invalidateBlogCaches(postId?: string): Promise<void> {
    const promises: Promise<void>[] = [];
    
    // Invalidate specific post cache
    if (postId) {
      promises.push(this.cacheService.del(this.cacheService.generateItemKey('blog', postId)));
    }
    
    // Invalidate list caches (this is simplified - in production you might want to track cache keys)
    promises.push(
      this.cacheService.invalidatePattern('blog:list:*'),
      this.cacheService.del(this.cacheService.generateStatsKey('blog')),
      this.cacheService.invalidatePattern('blog:recent:*'),
    );
    
    await Promise.all(promises);
  }
}