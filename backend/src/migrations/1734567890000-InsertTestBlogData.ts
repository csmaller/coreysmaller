import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertTestBlogData1734567890000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO blog (id, title, content, excerpt, status, slug, createdAt, updatedAt, publishedAt, tags)
      VALUES 
      (
        UUID(),
        'Test Blog Post 1',
        'This is test content for the first blog post. It contains some sample text to verify that the blog table can accept data properly.',
        'A test blog post to verify database insertion',
        'published',
        'test-blog-post-1',
        NOW(),
        NOW(),
        NOW(),
        'test,sample'
      ),
      (
        UUID(),
        'Test Blog Post 2',
        'This is another test post with different content. This helps us verify that multiple posts can be inserted successfully.',
        'Another test post for verification',
        'draft',
        'test-blog-post-2',
        NOW(),
        NOW(),
        NULL,
        'test,draft'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM blog WHERE slug IN ('test-blog-post-1', 'test-blog-post-2')
    `);
  }
}