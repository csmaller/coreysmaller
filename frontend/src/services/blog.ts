import { apiService } from './api';
import type { BlogPost, PaginatedResponse, ApiResponse, MigrationResult, MigrationStatus } from '../types';

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
  async getAllPosts(page: number = 1, limit: number = 10): Promise<PaginatedResponse<BlogPost>> {
    return apiService.get<PaginatedResponse<BlogPost>>(`/blog?page=${page}&limit=${limit}`);
  }

  async getPostById(id: string): Promise<ApiResponse<BlogPost>> {
    return apiService.get<ApiResponse<BlogPost>>(`/blog/${id}`);
  }

  async createPost(postData: CreateBlogPostDto): Promise<ApiResponse<BlogPost>> {
    return apiService.post<ApiResponse<BlogPost>>('/blog', postData);
  }

  async updatePost(id: string, updateData: UpdateBlogPostDto): Promise<ApiResponse<BlogPost>> {
    return apiService.put<ApiResponse<BlogPost>>(`/blog/${id}`, updateData);
  }

  async deletePost(id: string): Promise<ApiResponse<void>> {
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