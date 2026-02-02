#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BlogService } from '../src/blog/blog.service';

/**
 * Enhanced CLI command for running markdown migration with detailed progress tracking
 * Usage: npm run migrate:markdown
 */
async function migrateMarkdown() {
  console.log('🚀 Markdown Migration CLI Tool');
  console.log('================================\n');
  
  const startTime = Date.now();
  
  try {
    console.log('📦 Initializing NestJS application context...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const blogService = app.get(BlogService);
    console.log('✅ Application context initialized\n');
    
    // Get current status with detailed reporting
    console.log('🔍 Analyzing current migration status...');
    const status = await blogService.getMigrationStatus();
    
    console.log('📊 Migration Status Report:');
    console.log(`   📄 Total markdown files found: ${status.totalMarkdownFiles}`);
    console.log(`   💾 Current blog posts in database: ${status.totalBlogPosts}`);
    console.log(`   ⏳ Files pending migration: ${status.unmigrated.length}`);
    
    if (status.unmigrated.length > 0) {
      console.log('\n📋 Files to be migrated:');
      status.unmigrated.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
      
      // Confirm migration
      console.log('\n🔄 Starting migration process...');
      console.log('⚠️  This will create new blog posts in the database');
      
      const result = await blogService.migrateMarkdownFiles();
      
      console.log('\n📈 Migration Results:');
      console.log('===================');
      console.log(`✅ Success: ${result.success ? 'YES' : 'NO'}`);
      console.log(`📝 Summary: ${result.message}`);
      console.log(`🆕 Files migrated: ${result.migratedCount}`);
      console.log(`⏭️  Files skipped: ${result.skippedCount}`);
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      
      if (result.migratedFiles.length > 0) {
        console.log('\n✅ Successfully migrated files:');
        result.migratedFiles.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file}`);
        });
      }
      
      // Final verification
      console.log('\n🔍 Running post-migration verification...');
      const finalStatus = await blogService.getMigrationStatus();
      console.log(`📊 Final status: ${finalStatus.unmigrated.length} files remaining`);
      
      if (finalStatus.unmigrated.length === 0) {
        console.log('🎉 All files successfully migrated!');
      } else {
        console.log('⚠️  Some files still need migration:');
        finalStatus.unmigrated.forEach(file => console.log(`   - ${file}`));
      }
      
    } else {
      console.log('\n🎉 All files are already migrated!');
      console.log('💡 No action needed - your blog content is up to date.');
    }
    
    await app.close();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Migration completed in ${duration} seconds`);
    console.log('🏁 Migration script finished successfully');
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('\n💥 Migration failed!');
    console.error('================');
    console.error(`❌ Error: ${error.message}`);
    console.error(`⏱️  Failed after ${duration} seconds`);
    
    if (error.stack) {
      console.error('\n🔍 Stack trace:');
      console.error(error.stack);
    }
    
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Ensure the database is running and accessible');
    console.error('   2. Check that the content/blog directory exists');
    console.error('   3. Verify database connection settings in .env');
    console.error('   4. Run "npm run migration:run" to ensure database schema is up to date');
    
    process.exit(1);
  }
}

if (require.main === module) {
  migrateMarkdown();
}