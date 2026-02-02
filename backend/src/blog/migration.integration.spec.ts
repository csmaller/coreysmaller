import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MigrationService } from './migration.service';
import { BlogPost } from './entities/blog-post.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('MigrationService Integration', () => {
  let service: MigrationService;
  let repository: Repository<BlogPost>;
  let module: TestingModule;
  let tempDir: string;

  beforeAll(async () => {
    // Create temporary directory for test markdown files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-test-'));
    
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [BlogPost],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([BlogPost]),
      ],
      providers: [MigrationService],
    }).compile();

    service = module.get<MigrationService>(MigrationService);
    repository = module.get<Repository<BlogPost>>(getRepositoryToken(BlogPost));
  });

  afterAll(async () => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    await module.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await repository.query('DELETE FROM blog');
    
    // Clean up any existing temp files
    if (fs.existsSync(tempDir)) {
      const contentDir = path.join(tempDir, 'content');
      if (fs.existsSync(contentDir)) {
        fs.rmSync(contentDir, { recursive: true, force: true });
      }
    }
  });

  it('should migrate real markdown files with frontmatter', async () => {
    // Create test markdown files
    const testFiles = [
      {
        filename: 'test-blog-post.md',
        content: `---
title: Test Blog Post
date: 2021-03-23T15:59:38.094Z
path: test-blog-post
description: A test blog post for migration
tags: [test, migration]
---
# Test Blog Post

This is a test blog post with **markdown** content.

## Features

- Frontmatter parsing
- Content extraction
- Database insertion`
      },
      {
        filename: 'music-post.md',
        content: `---
title: My Song
isMusic: true
date: 2021-04-15T10:30:00.000Z
path: music/my-song
description: A beautiful song
---
Verse 1:
This is my song
It's very long

Chorus:
La la la la`
      },
      {
        filename: 'news-update.md',
        content: `---
title: Important News
isNews: true
date: 2021-05-01T12:00:00.000Z
path: news/important-update
---
This is an important news update about recent events.`
      }
    ];

    // Write test files to temp directory
    const contentBlogDir = path.join(tempDir, 'content', 'blog');
    fs.mkdirSync(contentBlogDir, { recursive: true });
    
    for (const file of testFiles) {
      fs.writeFileSync(path.join(contentBlogDir, file.filename), file.content);
    }

    // Mock the content directory path in the service
    const originalContentDir = (service as any).contentDir;
    (service as any).contentDir = contentBlogDir;

    try {
      // Run migration
      const result = await service.migrateMarkdownFiles();

      // Verify results
      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(3);
      expect(result.skippedCount).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.migratedFiles).toHaveLength(3);
      expect(result.migratedFiles).toContain('test-blog-post.md');
      expect(result.migratedFiles).toContain('music-post.md');
      expect(result.migratedFiles).toContain('news-update.md');

      // Verify database content
      const posts = await repository.find({ order: { createdAt: 'ASC' } });
      expect(posts).toHaveLength(3);

      // Check first post (regular blog post)
      const blogPost = posts.find(p => p.slug === 'test-blog-post');
      expect(blogPost).toBeDefined();
      expect(blogPost.title).toBe('Test Blog Post');
      expect(blogPost.content).toContain('This is a test blog post with **markdown** content');
      expect(blogPost.excerpt).toBe('A test blog post for migration');
      expect(blogPost.status).toBe('published');
      expect(blogPost.publishedAt).toEqual(new Date('2021-03-23T15:59:38.094Z'));

      // Check music post
      const musicPost = posts.find(p => p.slug === 'music/my-song');
      expect(musicPost).toBeDefined();
      expect(musicPost.title).toBe('My Song');
      expect(musicPost.tags).toContain('music');
      expect(musicPost.content).toContain('Verse 1:');

      // Check news post
      const newsPost = posts.find(p => p.slug === 'news/important-update');
      expect(newsPost).toBeDefined();
      expect(newsPost.title).toBe('Important News');
      expect(newsPost.tags).toContain('news');

      // Test migration status
      const status = await service.getMigrationStatus();
      expect(status.totalMarkdownFiles).toBe(3);
      expect(status.totalBlogPosts).toBe(3);
      expect(status.unmigrated).toHaveLength(0);

      // Test running migration again (should skip existing)
      const secondResult = await service.migrateMarkdownFiles();
      expect(secondResult.success).toBe(true);
      expect(secondResult.migratedCount).toBe(0);
      expect(secondResult.skippedCount).toBe(3);

    } finally {
      // Restore original content directory
      (service as any).contentDir = originalContentDir;
    }
  });

  it('should handle posts without titles by generating from filename', async () => {
    const contentBlogDir = path.join(tempDir, 'content', 'blog');
    fs.mkdirSync(contentBlogDir, { recursive: true });
    
    const testFile = `---
date: 2021-03-23T15:59:38.094Z
path: post-without-title
---
Content without a title in frontmatter.`;

    fs.writeFileSync(path.join(contentBlogDir, 'post-without-title.md'), testFile);

    const originalContentDir = (service as any).contentDir;
    (service as any).contentDir = contentBlogDir;

    try {
      const result = await service.migrateMarkdownFiles();
      
      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(1);

      const posts = await repository.find();
      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe('Post Without Title');
      expect(posts[0].slug).toBe('post-without-title');

    } finally {
      (service as any).contentDir = originalContentDir;
    }
  });
});