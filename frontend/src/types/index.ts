// Core data types for the application

import { BlogPost } from "../components";

export interface User {
  id: number;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  message?: string;
  success: boolean;
}

export interface BlogApiResponse extends ApiResponse {
  data:{data:BlogPost[]}
}

export interface MusicApiResponse extends ApiResponse {
  data:MusicTrack[];
}

export interface VideoApiResponse extends ApiResponse {
  data:VideoContent[];
}

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface MusicTrack {
  id: number;
  title: string;
  description?: string;
  audioUrl?: string;
  coverArt?: string;
  genre?: string;
  duration?: number;
  playCount: number;
  createdAt: Date;
  updatedAt: Date;
  releaseDate?: Date;
}

export interface VideoContent {
  id: number;
  title: string;
  description?: string;
  youtubeUrl: string;
  youtubeId?: string;
  thumbnail?: string;
  duration?: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudioContent {
  id: number;
  title: string;
  description?: string;
  soundcloudUrl: string;
  soundcloudId?: string;
  artwork?: string;
  duration?: number;
  playCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Migration types
export interface MigrationResult {
  success: boolean;
  message: string;
  migratedCount: number;
  skippedCount: number;
  errors: string[];
  migratedFiles: string[];
  duration: number;
  startTime: string;
  endTime: string;
}

export interface MigrationStatus {
  totalMarkdownFiles: number;
  totalBlogPosts: number;
  unmigrated: string[];
}