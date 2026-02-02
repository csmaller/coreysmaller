import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export interface SortOptions {
  field?: string;
  direction?: 'ASC' | 'DESC';
  allowedFields?: string[];
}

export interface FilterOptions {
  [key: string]: any;
}

@Injectable()
export class QueryOptimizationService {
  /**
   * Apply pagination to a query builder
   */
  applyPagination<T>(
    queryBuilder: SelectQueryBuilder<T>,
    options: PaginationOptions = {}
  ): SelectQueryBuilder<T> {
    const { page = 1, limit = 10, maxLimit = 100 } = options;
    
    const safeLimit = Math.min(limit, maxLimit);
    const offset = (page - 1) * safeLimit;
    
    return queryBuilder.skip(offset).take(safeLimit);
  }

  /**
   * Apply sorting to a query builder
   */
  applySorting<T>(
    queryBuilder: SelectQueryBuilder<T>,
    options: SortOptions = {}
  ): SelectQueryBuilder<T> {
    const { field, direction = 'DESC', allowedFields = [] } = options;
    
    if (field && (allowedFields.length === 0 || allowedFields.includes(field))) {
      // Sanitize field name to prevent SQL injection
      const sanitizedField = field.replace(/[^a-zA-Z0-9_.]/g, '');
      queryBuilder.orderBy(`entity.${sanitizedField}`, direction);
    }
    
    return queryBuilder;
  }

  /**
   * Apply filters to a query builder
   */
  applyFilters<T>(
    queryBuilder: SelectQueryBuilder<T>,
    filters: FilterOptions = {},
    allowedFilters: string[] = []
  ): SelectQueryBuilder<T> {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (allowedFilters.length === 0 || allowedFilters.includes(key)) {
          // Sanitize key to prevent SQL injection
          const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '');
          
          if (typeof value === 'string' && value.includes('%')) {
            // Handle LIKE queries
            queryBuilder.andWhere(`entity.${sanitizedKey} LIKE :${sanitizedKey}`, {
              [sanitizedKey]: value,
            });
          } else if (Array.isArray(value)) {
            // Handle IN queries
            queryBuilder.andWhere(`entity.${sanitizedKey} IN (:...${sanitizedKey})`, {
              [sanitizedKey]: value,
            });
          } else {
            // Handle exact matches
            queryBuilder.andWhere(`entity.${sanitizedKey} = :${sanitizedKey}`, {
              [sanitizedKey]: value,
            });
          }
        }
      }
    });
    
    return queryBuilder;
  }

  /**
   * Apply search functionality to a query builder
   */
  applySearch<T>(
    queryBuilder: SelectQueryBuilder<T>,
    searchTerm: string,
    searchFields: string[] = []
  ): SelectQueryBuilder<T> {
    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields
        .map((field, index) => {
          const sanitizedField = field.replace(/[^a-zA-Z0-9_.]/g, '');
          return `entity.${sanitizedField} LIKE :searchTerm${index}`;
        })
        .join(' OR ');
      
      queryBuilder.andWhere(`(${searchConditions})`, 
        searchFields.reduce((params, _, index) => {
          params[`searchTerm${index}`] = `%${searchTerm}%`;
          return params;
        }, {} as Record<string, string>)
      );
    }
    
    return queryBuilder;
  }

  /**
   * Optimize query with indexes and relations
   */
  optimizeQuery<T>(
    queryBuilder: SelectQueryBuilder<T>,
    options: {
      selectFields?: string[];
      relations?: string[];
      useIndex?: string;
    } = {}
  ): SelectQueryBuilder<T> {
    const { selectFields, relations, useIndex } = options;
    
    // Select only needed fields to reduce data transfer
    if (selectFields && selectFields.length > 0) {
      const sanitizedFields = selectFields.map(field => 
        `entity.${field.replace(/[^a-zA-Z0-9_.]/g, '')}`
      );
      queryBuilder.select(sanitizedFields);
    }
    
    // Add relations efficiently
    if (relations && relations.length > 0) {
      relations.forEach(relation => {
        const sanitizedRelation = relation.replace(/[^a-zA-Z0-9_.]/g, '');
        queryBuilder.leftJoinAndSelect(`entity.${sanitizedRelation}`, sanitizedRelation);
      });
    }
    
    // Use specific index if provided (MySQL specific)
    if (useIndex) {
      const sanitizedIndex = useIndex.replace(/[^a-zA-Z0-9_]/g, '');
      // Note: This is MySQL specific syntax
      queryBuilder.addSelect(`USE INDEX (${sanitizedIndex})`);
    }
    
    return queryBuilder;
  }

  /**
   * Build a complete optimized query
   */
  buildOptimizedQuery<T>(
    repository: Repository<T>,
    options: {
      pagination?: PaginationOptions;
      sorting?: SortOptions;
      filters?: FilterOptions;
      allowedFilters?: string[];
      search?: { term: string; fields: string[] };
      optimization?: {
        selectFields?: string[];
        relations?: string[];
        useIndex?: string;
      };
    } = {}
  ): SelectQueryBuilder<T> {
    const {
      pagination,
      sorting,
      filters,
      allowedFilters,
      search,
      optimization,
    } = options;
    
    let queryBuilder = repository.createQueryBuilder('entity');
    
    // Apply optimization first
    if (optimization) {
      queryBuilder = this.optimizeQuery(queryBuilder, optimization);
    }
    
    // Apply filters
    if (filters) {
      queryBuilder = this.applyFilters(queryBuilder, filters, allowedFilters);
    }
    
    // Apply search
    if (search) {
      queryBuilder = this.applySearch(queryBuilder, search.term, search.fields);
    }
    
    // Apply sorting
    if (sorting) {
      queryBuilder = this.applySorting(queryBuilder, sorting);
    }
    
    // Apply pagination
    if (pagination) {
      queryBuilder = this.applyPagination(queryBuilder, pagination);
    }
    
    return queryBuilder;
  }

  /**
   * Execute paginated query with count
   */
  async executePaginatedQuery<T>(
    queryBuilder: SelectQueryBuilder<T>,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
}