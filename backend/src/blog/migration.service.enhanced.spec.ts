import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MigrationService, MigrationResult } from './migration.service';
import { BlogPost } from './entities/blog-post.entity';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('MigrationService - Enhanced Features', () => {
  let service: MigrationService;
  let repository: jest.Mocked<Repository<BlogPost>>;

  const mockBlogPost = {
    id: '1',
    title: 'Test Post',
    content: 'Test content',
    slug: 'test-post',
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as BlogPost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationService,
        {
          provide: getRepositoryToken(BlogPost),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MigrationService>(MigrationService);
    repository = module.get(getRepositoryToken(BlogPost));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Enhanced Migration Results', () => {
    it('should include timing information in migration results', async () => {
      // Mock file system
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['test.md'] as any);
      mockFs.readFileSync.mockReturnValue(`---
title: Test Post
date: 2021-01-01
---
Test content`);

      // Mock repository methods
      repository.findOne.mockResolvedValue(null);
      repository.save.mockResolvedValue(mockBlogPost);

      const startTime = Date.now();
      const result = await service.migrateMarkdownFiles();
      const endTime = Date.now();

      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(new Date(result.startTime).getTime()).toBeLessThanOrEqual(startTime);
      expect(new Date(result.endTime).getTime()).toBeGreaterThanOrEqual(endTime - 1000);
    });

    it('should track migration progress correctly', async () => {
      const testFiles = ['post1.md', 'post2.md', 'post3.md'];
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(testFiles as any);
      mockFs.readFileSync.mockReturnValue(`---
title: Test Post
date: 2021-01-01
---
Test content`);

      repository.findOne.mockResolvedValue(null);
      repository.save.mockResolvedValue(mockBlogPost);

      const result = await service.migrateMarkdownFiles();

      expect(result.migratedCount).toBe(3);
      expect(result.migratedFiles).toHaveLength(3);
      expect(result.migratedFiles).toEqual(testFiles);
      expect(result.success).toBe(true);
    });

    it('should handle mixed success and failure scenarios', async () => {
      const testFiles = ['success.md', 'failure.md'];
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(testFiles as any);
      mockFs.readFileSync
        .mockReturnValueOnce(`---
title: Success Post
date: 2021-01-01
---
Success content`)
        .mockReturnValueOnce(`---
title: Failure Post
date: invalid-date
---
Failure content`);

      repository.findOne.mockResolvedValue(null);
      repository.save
        .mockResolvedValueOnce(mockBlogPost)
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await service.migrateMarkdownFiles();

      expect(result.migratedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.migratedFiles).toEqual(['success.md']);
      expect(result.errors[0]).toContain('failure.md');
      expect(result.success).toBe(false);
    });

    it('should provide detailed error messages', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['error.md'] as any);
      mockFs.readFileSync.mockReturnValue(`---
title: Error Post
---
Content`);

      repository.findOne.mockResolvedValue(null);
      repository.save.mockRejectedValue(new Error('Specific database error'));

      const result = await service.migrateMarkdownFiles();

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('error.md');
      expect(result.errors[0]).toContain('Specific database error');
      expect(result.success).toBe(false);
    });
  });

  describe('Migration Status Tracking', () => {
    it('should provide comprehensive migration status', async () => {
      const testFiles = ['migrated.md', 'unmigrated.md'];
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(testFiles as any);
      mockFs.readFileSync.mockReturnValue(`---
title: Test Post
---
Content`);

      // Mock that first file is already migrated
      repository.findOne
        .mockResolvedValueOnce(mockBlogPost) // migrated.md exists
        .mockResolvedValueOnce(null);        // unmigrated.md doesn't exist

      repository.count.mockResolvedValue(5);

      const status = await service.getMigrationStatus();

      expect(status.totalMarkdownFiles).toBe(2);
      expect(status.totalBlogPosts).toBe(5);
      expect(status.unmigrated).toEqual(['unmigrated.md']);
    });

    it('should handle empty content directory', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([]);
      repository.count.mockResolvedValue(0);

      const status = await service.getMigrationStatus();

      expect(status.totalMarkdownFiles).toBe(0);
      expect(status.totalBlogPosts).toBe(0);
      expect(status.unmigrated).toEqual([]);
    });

    it('should handle missing content directory', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await service.getMigrationStatus();
      
      // Should return empty status when directory doesn't exist
      expect(result.totalMarkdownFiles).toBe(0);
      expect(result.unmigrated).toEqual([]);
    });
  });

  describe('Progress Tracking', () => {
    it('should log progress for each file processed', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      const testFiles = ['file1.md', 'file2.md'];
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(testFiles as any);
      mockFs.readFileSync.mockReturnValue(`---
title: Test Post
---
Content`);

      repository.findOne.mockResolvedValue(null);
      repository.save.mockResolvedValue(mockBlogPost);

      await service.migrateMarkdownFiles();

      // Check that progress was logged for each file
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Processing file1.md (1/2 - 50%)'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Processing file2.md (2/2 - 100%)'));
    });

    it('should include verification step in migration process', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['test.md'] as any);
      mockFs.readFileSync.mockReturnValue(`---
title: Test Post
---
Content`);

      repository.findOne.mockResolvedValue(null);
      repository.save.mockResolvedValue(mockBlogPost);

      await service.migrateMarkdownFiles();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Running post-migration verification'));
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should continue processing after individual file errors', async () => {
      const testFiles = ['good1.md', 'bad.md', 'good2.md'];
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(testFiles as any);
      mockFs.readFileSync.mockReturnValue(`---
title: Test Post
---
Content`);

      repository.findOne.mockResolvedValue(null);
      repository.save
        .mockResolvedValueOnce(mockBlogPost)  // good1.md succeeds
        .mockRejectedValueOnce(new Error('Database error'))  // bad.md fails
        .mockResolvedValueOnce(mockBlogPost); // good2.md succeeds

      const result = await service.migrateMarkdownFiles();

      expect(result.migratedCount).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.migratedFiles).toEqual(['good1.md', 'good2.md']);
      expect(result.errors[0]).toContain('bad.md');
    });

    it('should handle file system errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['test.md'] as any);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const result = await service.migrateMarkdownFiles();
      
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('File read error');
      expect(result.migratedCount).toBe(0);
    });

    it('should provide helpful error context', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await service.migrateMarkdownFiles();

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Content directory not found');
      expect(result.message).toContain('Migration failed');
    });
  });
});