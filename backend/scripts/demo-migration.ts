#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as matter from 'gray-matter';

/**
 * Demo script to show markdown file parsing without database
 * This demonstrates the core functionality of the migration system
 */
async function demoMigration() {
  console.log('🚀 Markdown Migration Demo');
  console.log('==========================\n');

  const contentDir = path.join(process.cwd(), '..', 'content', 'blog');
  
  if (!fs.existsSync(contentDir)) {
    console.log('❌ Content directory not found:', contentDir);
    return;
  }

  console.log('📁 Content directory:', contentDir);
  
  const files = fs.readdirSync(contentDir);
  const markdownFiles = files.filter(f => f.endsWith('.md'));
  
  console.log(`📄 Found ${markdownFiles.length} markdown files\n`);

  // Process first 3 files as examples
  const sampleFiles = markdownFiles.slice(0, 3);
  
  for (const filename of sampleFiles) {
    console.log(`\n📝 Processing: ${filename}`);
    console.log('─'.repeat(50));
    
    try {
      const fullPath = path.join(contentDir, filename);
      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      const parsed = matter(fileContent);
      
      console.log('📋 Frontmatter:');
      console.log('  Title:', parsed.data.title || 'Not specified');
      console.log('  Date:', parsed.data.date || 'Not specified');
      console.log('  Path/Slug:', parsed.data.path || 'Not specified');
      console.log('  Description:', parsed.data.description || 'Not specified');
      console.log('  Is Music:', parsed.data.isMusic || false);
      console.log('  Is News:', parsed.data.isNews || false);
      
      console.log('\n📄 Content preview:');
      const contentPreview = parsed.content.trim().substring(0, 200);
      console.log('  ' + contentPreview + (parsed.content.length > 200 ? '...' : ''));
      
      // Show what would be created in database
      console.log('\n💾 Database record would be:');
      const blogPost = {
        title: parsed.data.title || generateTitleFromFilename(filename),
        content: parsed.content.trim(),
        slug: parsed.data.path || path.basename(filename, '.md'),
        excerpt: parsed.data.description || null,
        status: 'published',
        tags: determineTags(parsed.data),
        publishedAt: parsed.data.date ? new Date(parsed.data.date) : null,
      };
      
      console.log('  Title:', blogPost.title);
      console.log('  Slug:', blogPost.slug);
      console.log('  Status:', blogPost.status);
      console.log('  Tags:', blogPost.tags);
      console.log('  Published:', blogPost.publishedAt?.toISOString() || 'Not set');
      console.log('  Content length:', blogPost.content.length, 'characters');
      
    } catch (error) {
      console.log('❌ Error processing file:', error.message);
    }
  }
  
  console.log('\n✅ Demo completed!');
  console.log(`\n📊 Summary:`);
  console.log(`   Total markdown files: ${markdownFiles.length}`);
  console.log(`   Sample files processed: ${sampleFiles.length}`);
  console.log(`\n🔧 To run actual migration:`);
  console.log(`   1. Start the database: docker-compose up -d`);
  console.log(`   2. Run migrations: npm run migration:run`);
  console.log(`   3. Run migration: npm run migrate:markdown`);
}

function generateTitleFromFilename(filename: string): string {
  const baseName = path.basename(filename, '.md');
  return baseName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function determineTags(frontmatter: any): string[] {
  const tags: string[] = [];
  
  if (frontmatter.isMusic === true) {
    tags.push('music');
  }
  
  if (frontmatter.isNews === true) {
    tags.push('news');
  }
  
  if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
    tags.push(...frontmatter.tags);
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

if (require.main === module) {
  demoMigration().catch(console.error);
}