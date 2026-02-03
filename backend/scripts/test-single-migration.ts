#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { MigrationService } from '../src/blog/migration.service';
import * as fs from 'fs';
import * as path from 'path';
import * as matter from 'gray-matter';

async function testSingleMigration() {
  console.log('🧪 Testing single file migration...');
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const migrationService = app.get(MigrationService);
    
    // Read a single test file
    const testFile = path.join(process.cwd(), '..', 'content', 'blog', 'blame.md');
    const fileContent = fs.readFileSync(testFile, 'utf-8');
    const parsed = matter(fileContent);
    
    console.log('📄 File content:');
    console.log('Frontmatter:', JSON.stringify(parsed.data, null, 2));
    console.log('Content length:', parsed.content.length);
    
    // Try to create the blog post directly
    const markdownFile = {
      filename: 'blame.md',
      frontmatter: parsed.data,
      content: parsed.content,
      fullPath: testFile,
    };
    
    console.log('🔄 Attempting to create blog post...');
    const result = await (migrationService as any).createBlogPostFromMarkdown(markdownFile);
    console.log('✅ Success! Created post:', result.id);
    
    await app.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  testSingleMigration();
}