#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BlogService } from '../src/blog/blog.service';
import * as readline from 'readline';

/**
 * Interactive CLI tool for markdown migration with enhanced progress tracking
 * Usage: npm run migration:cli
 */

interface CliOptions {
  interactive: boolean;
  verbose: boolean;
  dryRun: boolean;
}

class MigrationCLI {
  private rl: readline.Interface;
  private options: CliOptions = {
    interactive: true,
    verbose: false,
    dryRun: false,
  };

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private async question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  private log(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
    const icons = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
    };
    
    const colors = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      success: '\x1b[32m', // Green
    };
    
    const reset = '\x1b[0m';
    console.log(`${colors[level]}${icons[level]} ${message}${reset}`);
  }

  private async parseArguments() {
    const args = process.argv.slice(2);
    
    for (const arg of args) {
      switch (arg) {
        case '--non-interactive':
        case '-n':
          this.options.interactive = false;
          break;
        case '--verbose':
        case '-v':
          this.options.verbose = true;
          break;
        case '--dry-run':
        case '-d':
          this.options.dryRun = true;
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
      }
    }
  }

  private showHelp() {
    console.log(`
🚀 Markdown Migration CLI Tool

Usage: npm run migration:cli [options]

Options:
  -n, --non-interactive    Run without user prompts
  -v, --verbose           Show detailed progress information
  -d, --dry-run           Show what would be migrated without making changes
  -h, --help              Show this help message

Examples:
  npm run migration:cli                    # Interactive mode
  npm run migration:cli -n                 # Non-interactive mode
  npm run migration:cli -v -d              # Verbose dry run
  npm run migration:cli --non-interactive  # Full non-interactive migration
`);
  }

  private async showWelcome() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  📝 Markdown Migration CLI                   ║
║                                                              ║
║  This tool will migrate your markdown blog posts from       ║
║  the content/blog directory to the database.                ║
╚══════════════════════════════════════════════════════════════╝
`);
  }

  private async confirmMigration(unmigrated: string[]): Promise<boolean> {
    if (!this.options.interactive) {
      return true;
    }

    console.log(`\n📋 Files to be migrated (${unmigrated.length}):`);
    unmigrated.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });

    const answer = await this.question('\n❓ Do you want to proceed with the migration? (y/N): ');
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  private async showProgressBar(current: number, total: number, filename: string) {
    if (!this.options.verbose) return;

    const percentage = Math.round((current / total) * 100);
    const barLength = 30;
    const filledLength = Math.round((barLength * current) / total);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    process.stdout.write(`\r📊 Progress: [${bar}] ${percentage}% - ${filename.padEnd(30)}`);
    
    if (current === total) {
      console.log(); // New line when complete
    }
  }

  async run() {
    try {
      await this.parseArguments();
      await this.showWelcome();

      if (this.options.dryRun) {
        this.log('Running in DRY RUN mode - no changes will be made', 'warn');
      }

      this.log('Initializing application context...', 'info');
      const app = await NestFactory.createApplicationContext(AppModule);
      const blogService = app.get(BlogService);

      // Get migration status
      this.log('Analyzing migration status...', 'info');
      const status = await blogService.getMigrationStatus();

      console.log(`
📊 Migration Status Report:
   📄 Total markdown files: ${status.totalMarkdownFiles}
   💾 Blog posts in database: ${status.totalBlogPosts}
   ⏳ Files pending migration: ${status.unmigrated.length}
`);

      if (status.unmigrated.length === 0) {
        this.log('All files are already migrated! 🎉', 'success');
        await app.close();
        this.rl.close();
        return;
      }

      if (this.options.dryRun) {
        this.log('DRY RUN: The following files would be migrated:', 'info');
        status.unmigrated.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file}`);
        });
        await app.close();
        this.rl.close();
        return;
      }

      // Confirm migration
      const shouldProceed = await this.confirmMigration(status.unmigrated);
      if (!shouldProceed) {
        this.log('Migration cancelled by user', 'warn');
        await app.close();
        this.rl.close();
        return;
      }

      // Run migration
      this.log('Starting migration process...', 'info');
      const startTime = Date.now();

      const result = await blogService.migrateMarkdownFiles();

      const duration = Date.now() - startTime;
      
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     Migration Results                        ║
╚══════════════════════════════════════════════════════════════╝

${result.success ? '✅' : '❌'} Status: ${result.success ? 'SUCCESS' : 'FAILED'}
📝 Summary: ${result.message}
🆕 Files migrated: ${result.migratedCount}
⏭️  Files skipped: ${result.skippedCount}
⏱️  Duration: ${(duration / 1000).toFixed(2)}s
`);

      if (result.migratedFiles.length > 0) {
        console.log('✅ Successfully migrated files:');
        result.migratedFiles.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file}`);
        });
        console.log();
      }

      if (result.errors.length > 0) {
        console.log('❌ Errors encountered:');
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
        console.log();
      }

      // Final verification
      this.log('Running post-migration verification...', 'info');
      const finalStatus = await blogService.getMigrationStatus();
      
      if (finalStatus.unmigrated.length === 0) {
        this.log('🎉 All files successfully migrated!', 'success');
      } else {
        this.log(`⚠️  ${finalStatus.unmigrated.length} files still need migration`, 'warn');
        if (this.options.verbose) {
          finalStatus.unmigrated.forEach(file => console.log(`   - ${file}`));
        }
      }

      await app.close();
      this.rl.close();

    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error');
      
      if (this.options.verbose && error.stack) {
        console.log('\n🔍 Stack trace:');
        console.log(error.stack);
      }
      
      console.log(`
💡 Troubleshooting tips:
   1. Ensure the database is running and accessible
   2. Check that the content/blog directory exists
   3. Verify database connection settings in .env
   4. Run "npm run migration:run" to ensure database schema is up to date
`);
      
      this.rl.close();
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const cli = new MigrationCLI();
  cli.run();
}