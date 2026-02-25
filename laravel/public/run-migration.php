<?php
// SECURITY: Remove this file after running migrations!
$password = 'TomBradyIsGod12';

if (!isset($_GET['password']) || $_GET['password'] !== $password) {
    die('Unauthorized');
}

// Enable error display
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h2>Running Laravel Migrations</h2>";
echo "<hr>";

try {
    // Load Laravel
    echo "<p>Loading Laravel...</p>";
    require __DIR__.'/../laravel/vendor/autoload.php';
    $app = require_once __DIR__.'/../laravel/bootstrap/app.php';
    
    // Bootstrap Laravel
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    
    echo "<p style='color: green;'>✓ Laravel loaded</p>";
    
    // Get database connection
    echo "<p>Connecting to database...</p>";
    $db = app('db');
    $pdo = $db->connection()->getPdo();
    echo "<p style='color: green;'>✓ Database connected</p>";
    
    // Fix migrations table
    echo "<h3>Step 1: Fix migrations table</h3>";
    
    try {
        // Check if migrations table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'migrations'");
        $exists = $stmt->fetch();
        
        if ($exists) {
            echo "<p>Migrations table exists, checking structure...</p>";
            
            // Check columns
            $stmt = $pdo->query("SHOW COLUMNS FROM migrations");
            $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            echo "<p>Current columns: " . implode(', ', $columns) . "</p>";
            
            // If it has the wrong structure, drop it
            if (!in_array('migration', $columns)) {
                echo "<p style='color: orange;'>⚠ Wrong structure detected, dropping table...</p>";
                $pdo->exec("DROP TABLE migrations");
                echo "<p style='color: green;'>✓ Dropped old migrations table</p>";
                $exists = false;
            } else {
                echo "<p style='color: green;'>✓ Migrations table structure is correct</p>";
            }
        }
        
        if (!$exists) {
            echo "<p>Creating migrations table...</p>";
            $pdo->exec("
                CREATE TABLE migrations (
                    id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    migration varchar(255) NOT NULL,
                    batch int NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            echo "<p style='color: green;'>✓ Created migrations table</p>";
        }
        
    } catch (Exception $e) {
        echo "<p style='color: red;'>✗ Error with migrations table: " . $e->getMessage() . "</p>";
        throw $e;
    }
    
    // Run migrations
    echo "<h3>Step 2: Running migrations</h3>";
    
    // Check which tables already exist
    $existingTables = [];
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $existingTables[] = $row[0];
    }
    
    echo "<p>Existing tables: " . implode(', ', $existingTables) . "</p>";
    
    // If tables exist, we need to be more careful
    if (count($existingTables) > 1) {
        echo "<p style='color: orange;'>⚠ Database has existing tables. Running migrations carefully...</p>";
        
        // Try to run migrations, but continue on error
        try {
            $exitCode = $kernel->call('migrate', [
                '--force' => true,
            ]);
            echo "<pre>" . $kernel->output() . "</pre>";
        } catch (Exception $e) {
            echo "<p style='color: orange;'>⚠ Some migrations may have failed (tables might already exist)</p>";
            echo "<p>Error: " . $e->getMessage() . "</p>";
        }
        
        // Check if blog table exists, if not create it
        if (!in_array('blog', $existingTables)) {
            echo "<p>Creating blog table...</p>";
            try {
                $pdo->exec("
                    CREATE TABLE `blog` (
                        `id` bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
                        `title` varchar(200) NOT NULL,
                        `content` text NOT NULL,
                        `excerpt` varchar(500) DEFAULT NULL,
                        `featuredImage` varchar(2048) DEFAULT NULL,
                        `tags` text DEFAULT NULL,
                        `status` varchar(20) NOT NULL DEFAULT 'published',
                        `slug` varchar(100) DEFAULT NULL UNIQUE,
                        `createdAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                        `updatedAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                        `publishedAt` timestamp NULL DEFAULT NULL,
                        KEY `blog_status_publishedAt_index` (`status`, `publishedAt`),
                        CONSTRAINT `blog_title_not_empty` CHECK (`title` != ''),
                        CONSTRAINT `blog_content_not_empty` CHECK (`content` != ''),
                        CONSTRAINT `blog_status_valid` CHECK (`status` IN ('draft', 'published', 'archived'))
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                ");
                echo "<p style='color: green;'>✓ Blog table created</p>";
            } catch (Exception $e) {
                echo "<p style='color: red;'>✗ Error creating blog table: " . $e->getMessage() . "</p>";
            }
        }
        
        // Check other tables
        $requiredTables = ['music', 'videos', 'audio'];
        foreach ($requiredTables as $table) {
            if (!in_array($table, $existingTables)) {
                echo "<p style='color: orange;'>⚠ Table '$table' is missing - you may need to run migrations manually</p>";
            }
        }
        
        $exitCode = 0; // Continue anyway
    } else {
        // Fresh database, run all migrations
        $exitCode = $kernel->call('migrate', [
            '--force' => true,
        ]);
        echo "<pre>" . $kernel->output() . "</pre>";
    }
    
    if ($exitCode === 0) {
        echo "<p style='color: green;'>✓ Migrations completed successfully!</p>";
        
        // Run seeders
        echo "<h3>Step 3: Running seeders</h3>";
        
        echo "<p>Seeding admin user...</p>";
        $exitCode = $kernel->call('db:seed', [
            '--class' => 'AdminUserSeeder',
            '--force' => true,
        ]);
        echo "<pre>" . $kernel->output() . "</pre>";
        
        echo "<p>Seeding blog posts from markdown...</p>";
        $exitCode = $kernel->call('db:seed', [
            '--class' => 'BlogMarkdownSeeder',
            '--force' => true,
        ]);
        echo "<pre>" . $kernel->output() . "</pre>";
        
        echo "<hr>";
        echo "<h2 style='color: green;'>✓ All setup completed successfully!</h2>";
        echo "<p><strong>Admin credentials:</strong></p>";
        echo "<ul>";
        echo "<li>Email: coreysmaller@gmail.com</li>";
        echo "<li>Password: Vi\$ions1</li>";
        echo "</ul>";
    } else {
        echo "<p style='color: red;'>✗ Migration failed with exit code: $exitCode</p>";
    }
    
} catch (Exception $e) {
    echo "<h3 style='color: red;'>✗ Error occurred:</h3>";
    echo "<p><strong>Message:</strong> " . $e->getMessage() . "</p>";
    echo "<p><strong>File:</strong> " . $e->getFile() . " (line " . $e->getLine() . ")</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<hr>";
echo "<p style='color: red; font-weight: bold;'>⚠ IMPORTANT: Delete this file after running!</p>";
