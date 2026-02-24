<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>Laravel Debug</h1>";

try {
    require __DIR__.'/../laravel/vendor/autoload.php';
    $app = require_once __DIR__.'/../laravel/bootstrap/app.php';
    
    echo "<p style='color: green;'>✓ Laravel loaded</p>";
    
    // Bootstrap the kernel
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    
    echo "<p style='color: green;'>✓ Kernel bootstrapped</p>";
    
    // Check environment
    echo "<h2>Environment:</h2>";
    echo "<p>APP_ENV: " . env('APP_ENV', 'not set') . "</p>";
    echo "<p>APP_DEBUG: " . (env('APP_DEBUG') ? 'true' : 'false') . "</p>";
    echo "<p>APP_KEY: " . (env('APP_KEY') ? 'SET' : 'NOT SET') . "</p>";
    
    // Check .env file
    echo "<h2>.env File:</h2>";
    $envPath = __DIR__.'/../laravel/.env';
    if (file_exists($envPath)) {
        echo "<p style='color: green;'>✓ .env file exists</p>";
    } else {
        echo "<p style='color: red;'>✗ .env file NOT found at: $envPath</p>";
        
        // Check for .env-prod
        $envProdPath = __DIR__.'/../laravel/.env-prod';
        if (file_exists($envProdPath)) {
            echo "<p style='color: orange;'>⚠ Found .env-prod - you may need to copy it to .env</p>";
        }
    }
    
    // Try database connection
    echo "<h2>Database:</h2>";
    try {
        $db = app('db');
        $pdo = $db->connection()->getPdo();
        echo "<p style='color: green;'>✓ Database connected</p>";
        
        // Check if tables exist
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        echo "<p>Tables found: " . count($tables) . "</p>";
        echo "<p>Tables: " . implode(', ', $tables) . "</p>";
        
    } catch (Exception $e) {
        echo "<p style='color: red;'>✗ Database error: " . $e->getMessage() . "</p>";
    }
    
    // Try to make a request
    echo "<h2>Test API Request:</h2>";
    try {
        $request = Illuminate\Http\Request::create('/api/audio', 'GET');
        $response = $app->make(Illuminate\Contracts\Http\Kernel::class)->handle($request);
        
        echo "<p>Status: " . $response->getStatusCode() . "</p>";
        echo "<p>Content:</p>";
        echo "<pre>" . htmlspecialchars(substr($response->getContent(), 0, 500)) . "</pre>";
        
    } catch (Exception $e) {
        echo "<p style='color: red;'>✗ Request error: " . $e->getMessage() . "</p>";
        echo "<pre>" . $e->getTraceAsString() . "</pre>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Fatal error: " . $e->getMessage() . "</p>";
    echo "<p>File: " . $e->getFile() . " (line " . $e->getLine() . ")</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
