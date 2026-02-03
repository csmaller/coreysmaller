import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { BlogPostResponseDto, BlogPostSummaryDto } from './dto/blog-post-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CacheKey, CacheTTL } from '../common/cache.interceptor';
import { Throttle } from '@nestjs/throttler';
import { SerializationInterceptor } from '../common/interceptors/serialization.interceptor';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(new SerializationInterceptor(BlogPostResponseDto))
  create(@Body() createBlogPostDto: CreateBlogPostDto) {
    return this.blogService.create(createBlogPostDto);
  }

  @Get()
  @CacheKey('blog:list:page::page:limit::limit')
  @CacheTTL(300) // 5 minutes
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @UseInterceptors(new SerializationInterceptor(BlogPostSummaryDto))
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    console.log('Controller findAll called with:', { page, limit });
    return this.blogService.findAll(page, limit);
  }

  @Get('recent')
  @CacheKey('blog:recent:limit::limit')
  @CacheTTL(180) // 3 minutes
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @UseInterceptors(new SerializationInterceptor(BlogPostSummaryDto))
  getRecentPosts(@Query('limit') limit?: number) {
    return this.blogService.getRecentPosts(limit || 5);
  }

  @Get('stats')
  @CacheKey('blog:stats')
  @CacheTTL(300) // 5 minutes
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  getStats() {
    return this.blogService.getStats();
  }

  @Get(':id')
  @CacheKey('blog:item::id')
  @CacheTTL(600) // 10 minutes
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 requests per minute
  @UseInterceptors(new SerializationInterceptor(BlogPostResponseDto))
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(new SerializationInterceptor(BlogPostResponseDto))
  update(@Param('id') id: string, @Body() updateBlogPostDto: UpdateBlogPostDto) {
    return this.blogService.update(id, updateBlogPostDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('migrate')
  @Throttle({ default: { limit: 1, ttl: 300000 } }) // 1 request per 5 minutes
  migrateMarkdownFiles() {
    return this.blogService.migrateMarkdownFiles();
  }

  @UseGuards(JwtAuthGuard)
  @Get('migration/status')
  @CacheKey('blog:migration:status')
  @CacheTTL(60) // 1 minute
  getMigrationStatus() {
    return this.blogService.getMigrationStatus();
  }
}