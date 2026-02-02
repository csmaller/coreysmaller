import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from './entities/blog-post.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as matter from 'gray-matter';

export interface MigrationResult {
  success: boolean;
  message: string;
  migratedCount: number;
  skippedCount: number;
  errors: string[];
  migratedFiles: string[];
  duration: number;
  startTime: Date;
  endTime: Date;
}

export interface MigrationProgress {
  currentFile: string;
  processedCount: number;
  totalCount: number;
  percentage: number;
  status: 'processing' | 'completed' | 'error';
}

export interface MarkdownFile {
  filename: string;
  frontmatter: any;
  content: string;
  fullPath: string;
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);
  private readonly contentDir = path.join(process.cwd(), '..', 'content', 'blog');

  constructor(
    @InjectRepository(BlogPost)
    private blogPostRepository: Repository<BlogPost>,
  ) {}

  /**
   * Main migration method that orchestrates the entire process
   */
  async migrateMarkdownFiles(): Promise<MigrationResult> {
    const startTime = new Date();
    const result: MigrationResult = {
      success: false,
      message: '',
      migratedCount: 0,
      skippedCount: 0,
      errors: [],
      migratedFiles: [],
      duration: 0,
      startTime,
      endTime: new Date(),
    };

    try {
      this.logger.log('🚀 Starting markdown file migration...');
      
      // Check if content directory exists
      if (!fs.existsSync(this.contentDir)) {
        throw new Error(`Content directory not found: ${this.contentDir}`);
      }

      // Read all markdown files
      const markdownFiles = await this.readMarkdownFiles();
      this.logger.log(`📄 Found ${markdownFiles.length} markdown files to process`);

      if (markdownFiles.length === 0) {
        result.message = 'No markdown files found to migrate';
        result.success = true;
        result.endTime = new Date();
        result.duration = result.endTime.getTime() - startTime.getTime();
        return result;
      }

      // Process each file with progress tracking
      for (let i = 0; i < markdownFiles.length; i++) {
        const file = markdownFiles[i];
        const progress = {
          currentFile: file.filename,
          processedCount: i + 1,
          totalCount: markdownFiles.length,
          percentage: Math.round(((i + 1) / markdownFiles.length) * 100),
          status: 'processing' as const,
        };

        this.logger.log(`📝 Processing ${progress.currentFile} (${progress.processedCount}/${progress.totalCount} - ${progress.percentage}%)`);

        try {
          const existingPost = await this.findExistingPost(file);
          
          if (existingPost) {
            this.logger.log(`⏭️  Skipping existing post: ${file.filename}`);
            result.skippedCount++;
            continue;
          }

          await this.createBlogPostFromMarkdown(file);
          result.migratedCount++;
          result.migratedFiles.push(file.filename);
          this.logger.log(`✅ Successfully migrated: ${file.filename}`);
          
        } catch (error) {
          const errorMsg = `Failed to migrate ${file.filename}: ${error.message}`;
          this.logger.error(`❌ ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }

      // Verify migration completeness
      this.logger.log('🔍 Running post-migration verification...');
      const verificationResult = await this.verifyMigration(markdownFiles);
      
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - startTime.getTime();
      result.success = result.errors.length === 0;
      
      if (result.success) {
        result.message = `✅ Migration completed successfully in ${(result.duration / 1000).toFixed(2)}s. Migrated ${result.migratedCount} files, skipped ${result.skippedCount} existing files.`;
      } else {
        result.message = `⚠️  Migration completed with ${result.errors.length} errors in ${(result.duration / 1000).toFixed(2)}s. Migrated ${result.migratedCount} files, skipped ${result.skippedCount} existing files.`;
      }

      this.logger.log(result.message);
      return result;

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const errorMsg = `💥 Migration failed after ${(duration / 1000).toFixed(2)}s: ${error.message}`;
      
      this.logger.error(errorMsg);
      result.errors.push(errorMsg);
      result.message = errorMsg;
      result.endTime = endTime;
      result.duration = duration;
      return result;
    }
  }

  /**
   * Read and parse all markdown files from the content directory
   */
  private async readMarkdownFiles(): Promise<MarkdownFile[]> {
    const files = fs.readdirSync(this.contentDir);
    const markdownFiles: MarkdownFile[] = [];

    for (const filename of files) {
      if (!filename.endsWith('.md')) {
        continue;
      }

      const fullPath = path.join(this.contentDir, filename);
      
      try {
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        const parsed = matter(fileContent);
        
        markdownFiles.push({
          filename,
          frontmatter: parsed.data,
          content: parsed.content,
          fullPath,
        });
      } catch (error) {
        this.logger.error(`Failed to read file ${filename}: ${error.message}`);
        throw new Error(`Failed to read file ${filename}: ${error.message}`);
      }
    }

    return markdownFiles;
  }

  /**
   * Check if a blog post already exists for this markdown file
   */
  private async findExistingPost(file: MarkdownFile): Promise<BlogPost | null> {
    // Try to find by slug first (from frontmatter path)
    if (file.frontmatter.path) {
      const existingBySlug = await this.blogPostRepository.findOne({
        where: { slug: file.frontmatter.path }
      });
      if (existingBySlug) return existingBySlug;
    }

    // Try to find by title
    if (file.frontmatter.title) {
      const existingByTitle = await this.blogPostRepository.findOne({
        where: { title: file.frontmatter.title }
      });
      if (existingByTitle) return existingByTitle;
    }

    // Try to find by filename (without extension)
    const filenameSlug = path.basename(file.filename, '.md');
    const existingByFilename = await this.blogPostRepository.findOne({
      where: { slug: filenameSlug }
    });
    
    return existingByFilename;
  }

  /**
   * Create a new blog post from markdown file data
   */
  private async createBlogPostFromMarkdown(file: MarkdownFile): Promise<BlogPost> {
    const blogPost = new BlogPost();
    
    // Extract and set basic fields
    blogPost.title = file.frontmatter.title || this.generateTitleFromFilename(file.filename);
    blogPost.content = file.content.trim();
    blogPost.slug = file.frontmatter.path || path.basename(file.filename, '.md');
    
    // Set description as excerpt if available
    if (file.frontmatter.description) {
      blogPost.excerpt = file.frontmatter.description;
    }

    // Handle dates
    if (file.frontmatter.date) {
      const publishDate = new Date(file.frontmatter.date);
      if (!isNaN(publishDate.getTime())) {
        blogPost.publishedAt = publishDate;
        // Set createdAt to the same date for migrated posts
        blogPost.createdAt = publishDate;
      }
    }

    // Handle status - determine if it's a music post, news, or regular blog
    if (file.frontmatter.isMusic === true) {
      blogPost.status = 'published'; // Music posts are published
      blogPost.tags = ['music'];
    } else if (file.frontmatter.isNews === true) {
      blogPost.status = 'published'; // News posts are published
      blogPost.tags = ['news'];
    } else {
      blogPost.status = 'published'; // Default to published for migration
    }

    // Handle tags - combine existing tags with inferred ones
    const existingTags = blogPost.tags || [];
    if (file.frontmatter.tags && Array.isArray(file.frontmatter.tags)) {
      blogPost.tags = [...new Set([...existingTags, ...file.frontmatter.tags])];
    }

    // Save the blog post
    return await this.blogPostRepository.save(blogPost);
  }

  /**
   * Generate a title from filename if not provided in frontmatter
   */
  private generateTitleFromFilename(filename: string): string {
    const baseName = path.basename(filename, '.md');
    // Convert kebab-case or snake_case to Title Case
    return baseName
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Verify that all markdown files have been successfully migrated
   */
  private async verifyMigration(markdownFiles: MarkdownFile[]): Promise<boolean> {
    let allMigrated = true;

    for (const file of markdownFiles) {
      const existingPost = await this.findExistingPost(file);
      if (!existingPost) {
        this.logger.warn(`Verification failed: ${file.filename} was not migrated`);
        allMigrated = false;
      }
    }

    this.logger.log(`Migration verification: ${allMigrated ? 'PASSED' : 'FAILED'}`);
    return allMigrated;
  }

  /**
   * Get migration status and statistics
   */
  async getMigrationStatus(): Promise<{
    totalMarkdownFiles: number;
    totalBlogPosts: number;
    unmigrated: string[];
  }> {
    try {
      const markdownFiles = await this.readMarkdownFiles();
      const totalBlogPosts = await this.blogPostRepository.count();
      const unmigrated: string[] = [];

      for (const file of markdownFiles) {
        const existingPost = await this.findExistingPost(file);
        if (!existingPost) {
          unmigrated.push(file.filename);
        }
      }

      return {
        totalMarkdownFiles: markdownFiles.length,
        totalBlogPosts,
        unmigrated,
      };
    } catch (error) {
      this.logger.error(`Failed to get migration status: ${error.message}`);
      throw error;
    }
  }
}