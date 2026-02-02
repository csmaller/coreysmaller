import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogPost } from './entities/blog-post.entity';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { MigrationService } from './migration.service';

describe('BlogService', () => {
  let service: BlogService;
  let repository: Repository<BlogPost>;
  let migrationService: MigrationService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockMigrationService = {
    migrateMarkdownFiles: jest.fn(),
    getMigrationStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        {
          provide: getRepositoryToken(BlogPost),
          useValue: mockRepository,
        },
        {
          provide: MigrationService,
          useValue: mockMigrationService,
        },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
    repository = module.get<Repository<BlogPost>>(getRepositoryToken(BlogPost));
    migrationService = module.get<MigrationService>(MigrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new blog post', async () => {
      const createBlogPostDto: CreateBlogPostDto = {
        title: 'Test Post',
        content: 'Test content',
        status: 'published',
      };

      const savedPost = {
        id: '1',
        ...createBlogPostDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(savedPost);
      mockRepository.save.mockResolvedValue(savedPost);

      const result = await service.create(createBlogPostDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createBlogPostDto);
      expect(mockRepository.save).toHaveBeenCalledWith(savedPost);
      expect(result).toEqual(savedPost);
    });
  });

  describe('findAll', () => {
    it('should return paginated blog posts', async () => {
      const posts = [
        { id: '1', title: 'Post 1', status: 'published' },
        { id: '2', title: 'Post 2', status: 'published' },
      ];

      mockRepository.findAndCount.mockResolvedValue([posts, 2]);

      const result = await service.findAll(1, 10);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { status: 'published' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });

      expect(result).toEqual({
        data: posts,
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('should use default pagination values', async () => {
      const posts = [];
      mockRepository.findAndCount.mockResolvedValue([posts, 0]);

      await service.findAll();

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { status: 'published' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return a blog post by id', async () => {
      const post = { id: '1', title: 'Test Post' };
      mockRepository.findOne.mockResolvedValue(post);

      const result = await service.findOne('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(post);
    });

    it('should throw NotFoundException when post not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a blog post', async () => {
      const existingPost = { id: '1', title: 'Old Title' };
      const updateDto: UpdateBlogPostDto = { title: 'New Title' };
      const updatedPost = { ...existingPost, ...updateDto };

      mockRepository.findOne.mockResolvedValue(existingPost);
      mockRepository.save.mockResolvedValue(updatedPost);

      const result = await service.update('1', updateDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedPost);
      expect(result).toEqual(updatedPost);
    });

    it('should throw NotFoundException when post not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a blog post', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when post not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('migrateMarkdownFiles', () => {
    it('should call migration service and return result', async () => {
      const mockResult = {
        message: 'Migration completed successfully',
        count: 5,
        errors: [],
      };

      mockMigrationService.migrateMarkdownFiles.mockResolvedValue(mockResult);

      const result = await service.migrateMarkdownFiles();

      expect(mockMigrationService.migrateMarkdownFiles).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });
});