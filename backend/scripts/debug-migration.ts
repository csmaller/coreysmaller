#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BlogService } from '../src/blog/blog.service';

async function debugMigration() {
  console.log('🔍 Debug Migration');
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const blogService = app.get(BlogService);
    
    console.log('1. Getting migration status...');
    const status = await blogService.getMigrationStatus();
    console.log('Status:', JSON.stringify(status, null, 2));
    
    if (status.unmigrated.length > 0) {
      console.log('2. Running migration...');
      const result = await blogService.migrateMarkdownFiles();
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      console.log('2. No files to migrate');
    }
    
    await app.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  debugMigration();
}