# Markdown Migration CLI Guide

## Overview

The Coreysmaller.com website includes a comprehensive markdown migration system that converts existing blog posts from markdown files to database records. This guide covers all available migration tools and their usage.

## Available Migration Tools

### 1. Interactive CLI Tool (Recommended)
**Command:** `npm run migration:cli`

The most user-friendly option with interactive prompts and detailed progress tracking.

**Features:**
- 🎯 Interactive prompts for confirmation
- 📊 Real-time progress tracking
- 🔍 Detailed status reporting
- ⚠️ Comprehensive error handling
- 🧪 Dry-run mode for testing
- 📝 Verbose logging options

**Usage Examples:**
```bash
# Interactive mode (recommended for first-time users)
npm run migration:cli

# Non-interactive mode (for automation)
npm run migration:cli --non-interactive

# Dry run to see what would be migrated
npm run migration:cli --dry-run

# Verbose mode with detailed progress
npm run migration:cli --verbose

# Combined options
npm run migration:cli --verbose --dry-run
```

**Options:**
- `-n, --non-interactive`: Run without user prompts
- `-v, --verbose`: Show detailed progress information
- `-d, --dry-run`: Show what would be migrated without making changes
- `-h, --help`: Show help message

### 2. Standard CLI Tool
**Command:** `npm run migrate:markdown`

A streamlined CLI tool with enhanced progress tracking and error reporting.

**Features:**
- 🚀 Enhanced progress tracking with emojis
- ⏱️ Duration tracking
- 📈 Detailed migration statistics
- 🔧 Troubleshooting tips on failure
- ✅ Post-migration verification

### 3. Demo Tool
**Command:** `npm run demo:migration`

Preview what would be migrated without touching the database.

**Features:**
- 📄 Shows frontmatter parsing results
- 💾 Displays database record structure
- 🔍 Processes sample files for preview
- 📊 Provides migration statistics

### 4. Admin Web Interface

Access through the admin panel at `/admin` after logging in.

**Features:**
- 📊 Real-time migration status display
- 🎯 One-click migration execution
- 📈 Detailed results with expandable sections
- 🔄 Status refresh functionality
- 📋 File-by-file progress tracking

## Migration Process Details

### What Gets Migrated

The system processes all `.md` files in the `content/blog` directory and converts them to database records in the `blog` table.

**Frontmatter Mapping:**
```yaml
---
title: "Post Title"           → BlogPost.title
date: "2021-03-23"           → BlogPost.publishedAt & createdAt
path: "post-slug"            → BlogPost.slug
description: "Post desc"     → BlogPost.excerpt
isMusic: true                → Adds 'music' tag
isNews: true                 → Adds 'news' tag
tags: [tag1, tag2]          → BlogPost.tags
---
Content here...             → BlogPost.content
```

### Duplicate Detection

The system prevents duplicate migrations by checking:
1. **Slug match**: Frontmatter `path` field
2. **Title match**: Frontmatter `title` field
3. **Filename match**: Filename without extension

### Error Handling

**Common Issues and Solutions:**

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose ps
   
   # Start database if needed
   docker-compose up -d
   ```

2. **Content Directory Not Found**
   ```bash
   # Verify directory exists
   ls -la ../content/blog
   
   # Create if missing
   mkdir -p ../content/blog
   ```

3. **Schema Not Up to Date**
   ```bash
   # Run database migrations
   npm run migration:run
   ```

4. **Permission Issues**
   ```bash
   # Check file permissions
   ls -la ../content/blog/*.md
   
   # Fix permissions if needed
   chmod 644 ../content/blog/*.md
   ```

## Migration Status Monitoring

### CLI Status Check
```bash
# View current migration status
npm run migration:cli --dry-run
```

### API Endpoints
```bash
# Get migration status (requires authentication)
GET /blog/migration-status

# Run migration (requires authentication)
POST /blog/migrate
```

### Admin Interface
1. Navigate to `/admin`
2. Log in with admin credentials
3. View "Migration Tools" section for real-time status

## Best Practices

### Before Migration
1. **Backup your database**
   ```bash
   mysqldump -u username -p database_name > backup.sql
   ```

2. **Test with dry run**
   ```bash
   npm run migration:cli --dry-run
   ```

3. **Verify content directory**
   ```bash
   ls -la ../content/blog
   ```

### During Migration
1. **Use interactive mode for first run**
   ```bash
   npm run migration:cli
   ```

2. **Monitor progress with verbose mode**
   ```bash
   npm run migration:cli --verbose
   ```

### After Migration
1. **Verify results**
   ```bash
   npm run migration:cli --dry-run
   ```

2. **Check admin interface** for final status

3. **Test blog functionality** on the website

## Troubleshooting

### Migration Fails Silently
- Check database connection settings in `.env`
- Verify TypeORM migrations are up to date
- Ensure content directory has readable files

### Partial Migration
- Review error messages in CLI output
- Check file permissions on failed files
- Verify frontmatter format in problematic files

### Performance Issues
- Large numbers of files may take time
- Use `--verbose` mode to monitor progress
- Consider running during low-traffic periods

### Database Issues
- Ensure MySQL is running and accessible
- Check database user permissions
- Verify table schema matches entity definitions

## Advanced Usage

### Automation Scripts
```bash
#!/bin/bash
# Automated migration script
echo "Starting automated migration..."
cd backend
npm run migration:cli --non-interactive --verbose
echo "Migration completed"
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run Migration
  run: |
    cd backend
    npm run migration:cli --non-interactive
```

### Custom Migration Logic
The migration service can be extended for custom requirements:

```typescript
// Custom migration in your service
import { MigrationService } from './blog/migration.service';

@Injectable()
export class CustomMigrationService {
  constructor(private migrationService: MigrationService) {}
  
  async customMigration() {
    // Your custom logic here
    return this.migrationService.migrateMarkdownFiles();
  }
}
```

## Support

For issues or questions:
1. Check this guide for common solutions
2. Review error messages and stack traces
3. Verify system requirements and dependencies
4. Test with dry-run mode to isolate issues

## Migration Statistics

After successful migration, you'll see detailed statistics:
- **Files processed**: Total markdown files found
- **Successfully migrated**: New database records created
- **Skipped**: Files already in database
- **Errors**: Files that failed to migrate
- **Duration**: Total time taken
- **Verification**: Post-migration integrity check

This comprehensive migration system ensures reliable, trackable, and user-friendly conversion of your markdown blog content to the database system.