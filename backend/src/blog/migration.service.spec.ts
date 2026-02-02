import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MigrationService } from './migration.service';
import { BlogPost } from './entities/blog-post.entity';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('MigrationService', () => {
  let service: MigrationService;
  let repository: jest.Mocked<Repository<BlogPost>>;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationService,
        {
          provide: getRepositoryToken(BlogPost),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MigrationService>(MigrationService);
    repository = module.get(getRepositoryToken(BlogPost));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('migrateMarkdownFiles', () => {
    it('should handle empty content directory', async () => {
      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue([]);

      const result = await service.migrateMarkdownFiles();

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(0);
      expect(result.message).toBe('No markdown files found to migrate');
    });

    it('should handle non-existent content directory', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await service.migrateMarkdownFiles();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Content directory not found');
    });

    it('should migrate markdown files successfully', async () => {
      const mockMarkdownContent = `---
title: Test Post
date: 2021-03-23T15:59:38.094Z
path: test-post
description: A test post
---
This is test content.`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['test-post.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(mockMarkdownContent);
      
      repository.findOne.mockResolvedValue(null); // No existing post
      repository.save.mockResolvedValue({
        id: '123',
        title: 'Test Post',
        content: 'This is test content.',
        slug: 'test-post',
      } as BlogPost);

      const result = await service.migrateMarkdownFiles();

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(1);
      expect(result.migratedFiles).toContain('test-post.md');
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Post',
          content: 'This is test content.',
          slug: 'test-post',
        })
      );
    });

    it('should skip existing posts', async () => {
      const mockMarkdownContent = `---
title: Existing Post
date: 2021-03-23T15:59:38.094Z
path: existing-post
---
Content`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['existing-post.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(mockMarkdownContent);
      
      repository.findOne.mockResolvedValue({
        id: '123',
        slug: 'existing-post',
      } as BlogPost);

      const result = await service.migrateMarkdownFiles();

      expect(result.success).toBe(true);
      expect(result.skippedCount).toBe(1);
      expect(result.migratedCount).toBe(0);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should handle music posts correctly', async () => {
      const mockMarkdownContent = `---
title: Music Post
isMusic: true
date: 2021-03-23T15:59:38.094Z
path: music-post
---
Music content`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['music-post.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(mockMarkdownContent);
      
      repository.findOne.mockResolvedValue(null);
      repository.save.mockResolvedValue({} as BlogPost);

      await service.migrateMarkdownFiles();

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Music Post',
          tags: ['music'],
          status: 'published',
        })
      );
    });

    it('should handle news posts correctly', async () => {
      const mockMarkdownContent = `---
title: News Post
isNews: true
date: 2021-03-23T15:59:38.094Z
path: news-post
---
News content`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['news-post.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(mockMarkdownContent);
      
      repository.findOne.mockResolvedValue(null);
      repository.save.mockResolvedValue({} as BlogPost);

      await service.migrateMarkdownFiles();

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'News Post',
          tags: ['news'],
          status: 'published',
        })
      );
    });

    it('should generate title from filename when not provided', async () => {
      const mockMarkdownContent = `---
date: 2021-03-23T15:59:38.094Z
path: test-post-without-title
---
Content without title`;

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['test-post-without-title.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue(mockMarkdownContent);
      
      repository.findOne.mockResolvedValue(null);
      repository.save.mockResolvedValue({} as BlogPost);

      await service.migrateMarkdownFiles();

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Post Without Title',
        })
      );
    });
  });

  describe('getMigrationStatus', () => {
    it('should return correct migration status', async () => {
      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['post1.md', 'post2.md']);
      (mockFs.readFileSync as jest.Mock).mockReturnValue('---\ntitle: Test\n---\nContent');
      
      repository.count.mockResolvedValue(5);
      repository.findOne
        .mockResolvedValueOnce({ id: '1' } as BlogPost) // post1 exists
        .mockResolvedValueOnce(null); // post2 doesn't exist

      const status = await service.getMigrationStatus();

      expect(status.totalMarkdownFiles).toBe(2);
      expect(status.totalBlogPosts).toBe(5);
      expect(status.unmigrated).toEqual(['post2.md']);
    });
  });
});