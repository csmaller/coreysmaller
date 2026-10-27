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
  volume?: string | null;
}

export interface BlogChapter {
  id: number;
  title: string;
  chapterOrder: number;
  status: string;
  visibility?: 'public' | 'private';
  wordCount?: number;
}

export interface BlogVolume {
  title: string;
  slug: string;
  description?: string | null;
  chapterCount?: number;
  wordCount?: number;
  chapters: Array<BlogChapter | BlogPost>;
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

  async listVolumes(): Promise<ApiResponse<BlogVolume[]>> {
    return apiService.get<ApiResponse<BlogVolume[]>>('/blog/volumes');
  }

  async getVolume(slug: string): Promise<ApiResponse<BlogVolume>> {
    return apiService.get<ApiResponse<BlogVolume>>(`/blog/volumes/${encodeURIComponent(slug)}`);
  }

  async updateVolume(volume: string, title: string, description: string): Promise<ApiResponse<BlogVolume>> {
    return apiService.put<ApiResponse<BlogVolume>>('/blog/volumes', { volume, title, description });
  }

  async reorderVolume(volume: string, ids: Array<number | string>): Promise<ApiResponse<BlogVolume[]>> {
    return apiService.put<ApiResponse<BlogVolume[]>>('/blog/volumes/order', { volume, ids });
  }
}

export const blogService = new BlogService();