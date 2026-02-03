#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as matter from 'gray-matter';

async function minimalMigration() {
  console.log('🔧 Minimal Migration Test');
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    
    // Read one markdown file
    const filePath = path.join(process.cwd(), '..', 'content', 'blog', 'blame.md');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(fileContent);
    
    console.log('📄 File parsed:');
    console.log('Title:', parsed.data.title);
    console.log('Path:', parsed.data.path);
    console.log('Content length:', parsed.content.length);
    
    // Insert directly with raw SQL - MySQL syntax with UUID
    const insertData = {
      id: require('crypto').randomUUID(),
      title: parsed.data.title || 'Blame',
      content: parsed.content.trim(),
      excerpt: parsed.data.description || null,
      status: 'published',
      slug: parsed.data.path || 'blame',
      createdAt: new Date(parsed.data.date || new Date()),
      updatedAt: new Date(),
      publishedAt: new Date(parsed.data.date || new Date()),
      tags: 'migrated'
    };
    
    console.log('💾 Inserting:', insertData.title);
    
    const result = await dataSource.query(`
      INSERT INTO blog (id, title, content, excerpt, status, slug, createdAt, updatedAt, publishedAt, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      insertData.id,
      insertData.title,
      insertData.content,
      insertData.excerpt,
      insertData.status,
      insertData.slug,
      insertData.createdAt,
      insertData.updatedAt,
      insertData.publishedAt,
      insertData.tags
    ]);
    
    console.log('✅ Raw SQL result:', result);
    
    // Check count
    const count = await dataSource.query('SELECT COUNT(*) as total FROM blog');
    console.log('📊 Total rows now:', count[0].total);
    
    await app.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  minimalMigration();
}