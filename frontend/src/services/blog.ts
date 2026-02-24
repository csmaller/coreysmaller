import { apiService } from './api';
import type { BlogPost, PaginatedResponse, ApiResponse, MigrationResult, MigrationStatus, BlogApiResponse } from '../types';

export interface CreateBlogPostDto {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdateBlogPostDto extends Partial<CreateBlogPostDto> {}

export class BlogService {
  async getAllPosts(page: number = 1, limit: number = 10): Promise<PaginatedResponse<BlogApiResponse>> {
    return apiService.get<PaginatedResponse<BlogApiResponse>>(`/blog?page=${page}&limit=${limit}`);
  }

  async getPostById(id: number | string): Promise<ApiResponse<BlogPost>> {
    return apiService.get<ApiResponse<BlogPost>>(`/blog/${id}`);
  }

  async createPost(postData: CreateBlogPostDto): Promise<ApiResponse<BlogPost>> {
    return apiService.post<ApiResponse<BlogPost>>('/blog', postData);
  }

  async updatePost(id: number | string, updateData: UpdateBlogPostDto): Promise<ApiResponse<BlogPost>> {
    return apiService.patch<ApiResponse<BlogPost>>(`/blog/${id}`, updateData);
  }

  async deletePost(id: number | string): Promise<ApiResponse<void>> {
    return apiService.delete<ApiResponse<void>>(`/blog/${id}`);
  }

  async migrateMarkdownFiles(): Promise<ApiResponse<MigrationResult>> {
    return apiService.post<ApiResponse<MigrationResult>>('/blog/migrate');
  }

  async getMigrationStatus(): Promise<ApiResponse<MigrationStatus>> {
    return apiService.get<ApiResponse<MigrationStatus>>('/blog/migration-status');
  }
}

export const blogService = new BlogService();