import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';

export interface IntegrityCheckResult {
  isValid: boolean;
  violations: string[];
}

@Injectable()
export class DatabaseIntegrityService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Check referential integrity for a specific entity
   */
  async checkReferentialIntegrity(
    entityType: string,
    entityId: string,
    operation: 'create' | 'update' | 'delete'
  ): Promise<IntegrityCheckResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const violations: string[] = [];

      switch (entityType) {
        case 'blog':
          violations.push(...await this.checkBlogIntegrity(queryRunner, entityId, operation));
          break;
        case 'music':
          violations.push(...await this.checkMusicIntegrity(queryRunner, entityId, operation));
          break;
        case 'video':
          violations.push(...await this.checkVideoIntegrity(queryRunner, entityId, operation));
          break;
        case 'audio':
          violations.push(...await this.checkAudioIntegrity(queryRunner, entityId, operation));
          break;
      }

      return {
        isValid: violations.length === 0,
        violations,
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Check unique constraints before insert/update
   */
  async checkUniqueConstraints(
    tableName: string,
    constraints: { [field: string]: any },
    excludeId?: string
  ): Promise<IntegrityCheckResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const violations: string[] = [];

      for (const [field, value] of Object.entries(constraints)) {
        if (value === null || value === undefined) continue;

        let query = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${field} = ?`;
        const params = [value];

        if (excludeId) {
          query += ' AND id != ?';
          params.push(excludeId);
        }

        const result = await queryRunner.query(query, params);
        const count = parseInt(result[0].count);

        if (count > 0) {
          violations.push(`${field} '${value}' already exists`);
        }
      }

      return {
        isValid: violations.length === 0,
        violations,
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Validate foreign key constraints
   */
  async validateForeignKeys(
    references: { table: string; field: string; value: any }[]
  ): Promise<IntegrityCheckResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const violations: string[] = [];

      for (const ref of references) {
        if (ref.value === null || ref.value === undefined) continue;

        const query = `SELECT COUNT(*) as count FROM ${ref.table} WHERE ${ref.field} = ?`;
        const result = await queryRunner.query(query, [ref.value]);
        const count = parseInt(result[0].count);

        if (count === 0) {
          violations.push(`Referenced ${ref.table}.${ref.field} '${ref.value}' does not exist`);
        }
      }

      return {
        isValid: violations.length === 0,
        violations,
      };
    } finally {
      await queryRunner.release();
    }
  }

  private async checkBlogIntegrity(
    queryRunner: QueryRunner,
    entityId: string,
    operation: string
  ): Promise<string[]> {
    const violations: string[] = [];

    if (operation === 'delete') {
      // Check if blog post is referenced by other entities (if any)
      // For now, blog posts are standalone entities
    }

    return violations;
  }

  private async checkMusicIntegrity(
    queryRunner: QueryRunner,
    entityId: string,
    operation: string
  ): Promise<string[]> {
    const violations: string[] = [];

    if (operation === 'delete') {
      // Check if music track is referenced by playlists or other entities
      // For now, music tracks are standalone entities
    }

    return violations;
  }

  private async checkVideoIntegrity(
    queryRunner: QueryRunner,
    entityId: string,
    operation: string
  ): Promise<string[]> {
    const violations: string[] = [];

    if (operation === 'delete') {
      // Check if video is referenced by playlists or other entities
      // For now, videos are standalone entities
    }

    return violations;
  }

  private async checkAudioIntegrity(
    queryRunner: QueryRunner,
    entityId: string,
    operation: string
  ): Promise<string[]> {
    const violations: string[] = [];

    if (operation === 'delete') {
      // Check if audio content is referenced by playlists or other entities
      // For now, audio content are standalone entities
    }

    return violations;
  }

  /**
   * Run comprehensive database integrity checks
   */
  async runIntegrityChecks(): Promise<{
    passed: boolean;
    results: { check: string; passed: boolean; message?: string }[];
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const results: { check: string; passed: boolean; message?: string }[] = [];

      // Check for orphaned records
      const orphanChecks = [
        {
          name: 'Blog posts with invalid status',
          query: `SELECT COUNT(*) as count FROM blog WHERE status NOT IN ('draft', 'published', 'archived')`,
        },
        {
          name: 'Music tracks with negative duration',
          query: `SELECT COUNT(*) as count FROM music WHERE duration < 0`,
        },
        {
          name: 'Videos with negative duration',
          query: `SELECT COUNT(*) as count FROM video WHERE duration < 0`,
        },
        {
          name: 'Audio with negative duration',
          query: `SELECT COUNT(*) as count FROM audio WHERE duration < 0`,
        },
        {
          name: 'Negative play counts',
          query: `SELECT COUNT(*) as count FROM music WHERE playCount < 0 
                  UNION ALL 
                  SELECT COUNT(*) as count FROM audio WHERE playCount < 0`,
        },
        {
          name: 'Negative view counts',
          query: `SELECT COUNT(*) as count FROM video WHERE viewCount < 0`,
        },
      ];

      for (const check of orphanChecks) {
        try {
          const result = await queryRunner.query(check.query);
          const count = parseInt(result[0].count);
          results.push({
            check: check.name,
            passed: count === 0,
            message: count > 0 ? `Found ${count} violations` : undefined,
          });
        } catch (error) {
          results.push({
            check: check.name,
            passed: false,
            message: `Check failed: ${error.message}`,
          });
        }
      }

      const allPassed = results.every(r => r.passed);

      return {
        passed: allPassed,
        results,
      };
    } finally {
      await queryRunner.release();
    }
  }
}