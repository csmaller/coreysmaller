import { Expose, Transform } from 'class-transformer';

export class BaseResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Transform(({ value }) => {
    if (!value) return null;
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null;
      return value.toISOString();
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    }
    return null;
  })
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => {
    if (!value) return null;
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null;
      return value.toISOString();
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    }
    return null;
  })
  updatedAt: Date;
}

export class PaginatedResponseDto<T> {
  @Expose()
  data: T[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  totalPages: number;

  @Expose()
  hasNext: boolean;

  @Expose()
  hasPrevious: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrevious = page > 1;
  }
}

export class ApiResponseDto<T> {
  @Expose()
  success: boolean;

  @Expose()
  data?: T;

  @Expose()
  message?: string;

  @Expose()
  error?: string;

  @Expose()
  @Transform(({ value }) => {
    if (!value) return null;
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null;
      return value.toISOString();
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    }
    return null;
  })
  timestamp: Date;

  constructor(data?: T, message?: string, error?: string) {
    this.success = !error;
    this.data = data;
    this.message = message;
    this.error = error;
    this.timestamp = new Date();
  }
}