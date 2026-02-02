import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

describe('BlogController', () => {
  let controller: BlogController;
  let service: BlogService;

  const mockBlogService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    migrateMarkdownFiles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogController],
      providers: [
        {
          provide: BlogService,
          useValue: mockBlogService,
        },
      ],
    }).compile();

    controller = module.get<BlogController>(BlogController);
    service = module.get<BlogService>(BlogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a blog post', async () => {
      const createDto: CreateBlogPostDto = {
        title: 'Test Post',
        content: 'Test content',
      };

      const expectedResult = { id: '1', ...createDto };
      mockBlogService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return all blog posts with pagination', async () => {
      const expectedResult = {
        data: [{ id: '1', title: 'Test Post' }],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockBlogService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(1, 10);

      expect(service.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(expectedResult);
    });

    it('should handle undefined pagination parameters', async () => {
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockBlogService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single blog post', async () => {
      const expectedResult = { id: '1', title: 'Test Post' };
      mockBlogService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a blog post', async () => {
      const updateDto: UpdateBlogPostDto = { title: 'Updated Title' };
      const expectedResult = { id: '1', title: 'Updated Title' };

      mockBlogService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a blog post', async () => {
      mockBlogService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toBeUndefined();
    });
  });

  describe('migrateMarkdownFiles', () => {
    it('should trigger markdown migration', async () => {
      const expectedResult = { message: 'Migration completed', count: 5 };
      mockBlogService.migrateMarkdownFiles.mockResolvedValue(expectedResult);

      const result = await controller.migrateMarkdownFiles();

      expect(service.migrateMarkdownFiles).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });
});