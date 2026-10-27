import { apiService } from './api';
import type { BlogPost, PaginatedResponse, ApiResponse } from '../types';

export interface CreateBlogPostDto {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  visibility?: 'public' | 'private';
}

export interface UpdateBlogPostDto extends Partial<CreateBlogPostDto> {}

export class BlogService {
  async getAllPosts(page: number = 1, limit: number = 10, manage: boolean = false): Promise<PaginatedResponse<BlogPost>> {
    const scope = manage ? '&manage=1' : '';
    return apiService.get<PaginatedResponse<BlogPost>>(`/blog?page=${page}&limit=${limit}${scope}`);
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
}

export const blogService = new BlogService();