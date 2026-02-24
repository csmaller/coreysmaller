<?php
// Debug script for auth endpoint - DELETE AFTER USE
$password = 'TomBradyIsGod12';

if (!isset($_GET['password']) || $_GET['password'] !== $password) {
    die('Unauthorized');
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h2>Auth Endpoint Debug</h2>";
echo "<hr>";

try {
    // Load Laravel
    echo "<p>Loading Laravel...</p>";
    require __DIR__.'/../laravel/vendor/autoload.php';
    $app = require_once __DIR__.'/../laravel/bootstrap/app.php';
    
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    
    echo "<p style='color: green;'>✓ Laravel loaded</p>";
    
    // Check environment
    echo "<h3>Environment Check</h3>";
    echo "<p>APP_ENV: " . env('APP_ENV') . "</p>";
    echo "<p>APP_DEBUG: " . (env('APP_DEBUG') ? 'true' : 'false') . "</p>";
    echo "<p>APP_KEY: " . (env('APP_KEY') ? 'SET' : 'NOT SET') . "</p>";
    echo "<p>JWT_SECRET: " . (env('JWT_SECRET') ? 'SET (' . strlen(env('JWT_SECRET')) . ' chars)' : 'NOT SET') . "</p>";
    echo "<p>DB_CONNECTION: " . env('DB_CONNECTION') . "</p>";
    echo "<p>DB_DATABASE: " . env('DB_DATABASE') . "</p>";
    echo "<p>CACHE_DRIVER: " . env('CACHE_DRIVER') . "</p>";
    
    // Check database
    echo "<h3>Database Check</h3>";
    $db = app('db');
    $pdo = $db->connection()->getPdo();
    echo "<p style='color: green;'>✓ Database connected</p>";
    
    // Check users table
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>Users in database: " . $result['count'] . "</p>";
    
    // Check admin user
    $stmt = $pdo->prepare("SELECT id, email, role FROM users WHERE email = ?");
    $stmt->execute(['coreysmaller@gmail.com']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "<p style='color: green;'>✓ Admin user exists</p>";
        echo "<pre>" . print_r($user, true) . "</pre>";
    } else {
        echo "<p style='color: red;'>✗ Admin user NOT found</p>";
    }
    
    // Check JWT configuration
    echo "<h3>JWT Configuration</h3>";
    $jwtSecret = config('jwt.secret');
    echo "<p>JWT Secret from config: " . ($jwtSecret ? 'SET (' . strlen($jwtSecret) . ' chars)' : 'NOT SET') . "</p>";
    echo "<p>JWT TTL: " . config('jwt.ttl') . " minutes</p>";
    echo "<p>JWT Algo: " . config('jwt.algo') . "</p>";
    
    // Try to test password verification
    echo "<h3>Password Verification Test</h3>";
    if ($user) {
        $stmt = $pdo->prepare("SELECT password FROM users WHERE email = ?");
        $stmt->execute(['coreysmaller@gmail.com']);
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $testPassword = 'Vi$ions1';
        $passwordMatches = password_verify($testPassword, $userData['password']);
        
        echo "<p>Password hash length: " . strlen($userData['password']) . "</p>";
        echo "<p>Password verification: " . ($passwordMatches ? '<span style="color: green;">✓ MATCHES</span>' : '<span style="color: red;">✗ DOES NOT MATCH</span>') . "</p>";
    }
    
    // Check recent logs
    echo "<h3>Recent Laravel Logs</h3>";
    $logFile = __DIR__.'/../laravel/storage/logs/laravel.log';
    if (file_exists($logFile)) {
        $logs = file_get_contents($logFile);
        $lines = explode("\n", $logs);
        $recentLines = array_slice($lines, -50); // Last 50 lines
        echo "<pre style='background: #f5f5f5; padding: 10px; max-height: 400px; overflow-y: scroll;'>";
        echo htmlspecialchars(implode("\n", $recentLines));
        echo "</pre>";
    } else {
        echo "<p>Log file not found at: $logFile</p>";
    }
    
    // Test auth service directly
    echo "<h3>Test Auth Service</h3>";
    try {
        $authService = app(\App\Services\AuthService::class);
        echo "<p style='color: green;'>✓ AuthService instantiated</p>";
        
        // Try login
        try {
            $result = $authService->login(
                'coreysmaller@gmail.com', 
                'Vi$ions1',
                '127.0.0.1',
                'Test Script'
            );
            echo "<p style='color: green;'>✓ Login successful!</p>";
            echo "<pre>" . print_r($result, true) . "</pre>";
        } catch (Exception $e) {
            echo "<p style='color: red;'>✗ Login failed: " . $e->getMessage() . "</p>";
            echo "<pre>" . $e->getTraceAsString() . "</pre>";
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>✗ Could not instantiate AuthService: " . $e->getMessage() . "</p>";
    }
    
} catch (Exception $e) {
    echo "<h3 style='color: red;'>✗ Error occurred:</h3>";
    echo "<p><strong>Message:</strong> " . $e->getMessage() . "</p>";
    echo "<p><strong>File:</strong> " . $e->getFile() . " (line " . $e->getLine() . ")</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<hr>";
echo "<p style='color: red; font-weight: bold;'>⚠ DELETE THIS FILE AFTER USE!</p>";
