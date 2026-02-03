#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function testDirectInsertion() {
  console.log('🧪 Testing direct database insertion...');
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    
    // Test raw SQL insertion
    const testData = {
      id: 'test-' + Date.now(),
      title: 'Direct Test Post',
      content: 'This is a test post inserted directly via raw SQL',
      excerpt: 'Test excerpt',
      status: 'published',
      slug: 'direct-test-post-' + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
      tags: 'test,direct'
    };
    
    console.log('📝 Inserting test data:', testData);
    
    const result = await dataSource.query(`
      INSERT INTO blog (id, title, content, excerpt, status, slug, createdAt, updatedAt, publishedAt, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testData.id,
      testData.title,
      testData.content,
      testData.excerpt,
      testData.status,
      testData.slug,
      testData.createdAt,
      testData.updatedAt,
      testData.publishedAt,
      testData.tags
    ]);
    
    console.log('✅ Raw SQL insertion successful:', result);
    
    // Now test TypeORM repository
    const blogRepository = dataSource.getRepository('BlogPost');
    console.log('🔄 Testing TypeORM repository...');
    
    const blogPost = blogRepository.create({
      title: 'TypeORM Test Post',
      content: 'This is a test post via TypeORM',
      excerpt: 'TypeORM test',
      status: 'published',
      slug: 'typeorm-test-' + Date.now(),
      tags: ['test', 'typeorm']
    });
    
    const savedPost = await blogRepository.save(blogPost);
    console.log('✅ TypeORM insertion successful:', savedPost.id);
    
    await app.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  testDirectInsertion();
}