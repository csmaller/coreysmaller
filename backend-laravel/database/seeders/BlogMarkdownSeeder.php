<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BlogMarkdownSeeder extends Seeder
{
    /**
     * Seed the blog table from markdown files in content/blog directory.
     */
    public function run(): void
    {
        $contentPath = base_path('../content/blog');
        
        if (!is_dir($contentPath)) {
            $this->command->error("Content directory not found: {$contentPath}");
            return;
        }

        $files = glob($contentPath . '/*.md');
        
        if (empty($files)) {
            $this->command->warn('No markdown files found in content/blog');
            return;
        }

        $this->command->info("Found " . count($files) . " markdown files");
        
        $imported = 0;
        $skipped = 0;

        foreach ($files as $file) {
            try {
                $content = file_get_contents($file);
                $parsed = $this->parseMarkdown($content);
                
                if (!$parsed) {
                    $this->command->warn("Skipping {$file}: Could not parse frontmatter");
                    $skipped++;
                    continue;
                }

                // Check if already exists by slug
                $exists = DB::table('blog')
                    ->where('slug', $parsed['slug'])
                    ->exists();

                if ($exists) {
                    $this->command->info("Skipping {$parsed['title']}: Already exists");
                    $skipped++;
                    continue;
                }

                DB::table('blog')->insert([
                    'title' => $parsed['title'],
                    'content' => $parsed['content'],
                    'excerpt' => $parsed['excerpt'],
                    'slug' => $parsed['slug'],
                    'status' => 'published',
                    'publishedAt' => $parsed['publishedAt'],
                    'createdAt' => $parsed['createdAt'],
                    'updatedAt' => $parsed['updatedAt'],
                ]);

                $this->command->info("Imported: {$parsed['title']}");
                $imported++;

            } catch (\Exception $e) {
                $this->command->error("Error processing {$file}: " . $e->getMessage());
                $skipped++;
            }
        }

        $this->command->info("\nImport complete: {$imported} imported, {$skipped} skipped");
    }

    /**
     * Parse markdown file with YAML frontmatter.
     */
    private function parseMarkdown(string $content): ?array
    {
        // Match YAML frontmatter between --- delimiters
        if (!preg_match('/^---\s*\n(.*?)\n---\s*\n(.*)$/s', $content, $matches)) {
            return null;
        }

        $frontmatter = $matches[1];
        $body = trim($matches[2]);

        // Parse YAML frontmatter
        $meta = $this->parseYaml($frontmatter);
        
        if (!isset($meta['title']) || !isset($meta['date'])) {
            return null;
        }

        // Generate slug from path or title
        $slug = $meta['path'] ?? Str::slug($meta['title']);
        
        // Create excerpt from first 200 chars of content
        $excerpt = Str::limit(strip_tags($body), 200);

        // Parse dates
        $createdAt = date('Y-m-d H:i:s', strtotime($meta['date']));
        $updatedAt = isset($meta['updated']) 
            ? date('Y-m-d H:i:s', strtotime($meta['updated']))
            : $createdAt;

        return [
            'title' => $meta['title'],
            'content' => $body,
            'excerpt' => $excerpt,
            'slug' => $slug,
            'publishedAt' => $createdAt,
            'createdAt' => $createdAt,
            'updatedAt' => $updatedAt,
        ];
    }

    /**
     * Simple YAML parser for frontmatter.
     */
    private function parseYaml(string $yaml): array
    {
        $result = [];
        $lines = explode("\n", $yaml);

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            if (preg_match('/^(\w+):\s*(.*)$/', $line, $matches)) {
                $key = $matches[1];
                $value = trim($matches[2]);
                
                // Remove quotes if present
                $value = trim($value, '"\'');
                
                // Convert boolean strings
                if ($value === 'true') $value = true;
                if ($value === 'false') $value = false;
                
                $result[$key] = $value;
            }
        }

        return $result;
    }
}
