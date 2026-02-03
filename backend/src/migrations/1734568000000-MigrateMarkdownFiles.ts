import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as matter from 'gray-matter';
import { randomUUID } from 'crypto';

export class MigrateMarkdownFiles1734568000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const contentDir = path.join(__dirname, '..', '..', '..', 'content', 'blog');
    
    if (!fs.existsSync(contentDir)) {
      console.log('Content directory not found, skipping markdown migration');
      return;
    }

    const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
    
    for (const filename of files) {
      const filePath = path.join(contentDir, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(fileContent);
      
      const title = parsed.data.title || filename.replace('.md', '').replace(/[-_]/g, ' ');
      const slug = parsed.data.path || filename.replace('.md', '');
      const publishedAt = parsed.data.date ? new Date(parsed.data.date) : new Date();
      
      let tags = 'migrated';
      if (parsed.data.isMusic) tags += ',music';
      if (parsed.data.isNews) tags += ',news';
      
      await queryRunner.query(`
        INSERT INTO blog (id, title, content, excerpt, status, slug, createdAt, updatedAt, publishedAt, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        randomUUID(),
        title,
        parsed.content.trim(),
        parsed.data.description || null,
        'published',
        slug,
        publishedAt,
        new Date(),
        publishedAt,
        tags
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM blog WHERE tags LIKE '%migrated%'`);
  }
}