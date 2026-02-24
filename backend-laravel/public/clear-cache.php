<?php
// Cache clearing script - DELETE AFTER USE
$password = 'TomBradyIsGod12';

if (!isset($_GET['password']) || $_GET['password'] !== $password) {
    die('Unauthorized');
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h2>Laravel Cache Clearing</h2>";
echo "<hr>";

try {
    // Load Laravel
    echo "<p>Loading Laravel...</p>";
    require __DIR__.'/../laravel/vendor/autoload.php';
    $app = require_once __DIR__.'/../laravel/bootstrap/app.php';
    
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    
    echo "<p style='color: green;'>✓ Laravel loaded</p>";
    
    // Clear config cache
    echo "<h3>Clearing Config Cache</h3>";
    try {
        $exitCode = $kernel->call('config:clear');
        echo "<p style='color: green;'>✓ Config cache cleared</p>";
    } catch (Exception $e) {
        echo "<p style='color: orange;'>⚠ Config cache clear failed: " . $e->getMessage() . "</p>";
    }
    
    // Clear application cache
    echo "<h3>Clearing Application Cache</h3>";
    try {
        $exitCode = $kernel->call('cache:clear');
        echo "<p style='color: green;'>✓ Application cache cleared</p>";
    } catch (Exception $e) {
        echo "<p style='color: orange;'>⚠ Application cache clear failed: " . $e->getMessage() . "</p>";
    }
    
    // Clear route cache
    echo "<h3>Clearing Route Cache</h3>";
    try {
        $exitCode = $kernel->call('route:clear');
        echo "<p style='color: green;'>✓ Route cache cleared</p>";
    } catch (Exception $e) {
        echo "<p style='color: orange;'>⚠ Route cache clear failed: " . $e->getMessage() . "</p>";
    }
    
    // Clear view cache
    echo "<h3>Clearing View Cache</h3>";
    try {
        $exitCode = $kernel->call('view:clear');
        echo "<p style='color: green;'>✓ View cache cleared</p>";
    } catch (Exception $e) {
        echo "<p style='color: orange;'>⚠ View cache clear failed: " . $e->getMessage() . "</p>";
    }
    
    // Clear compiled classes
    echo "<h3>Clearing Compiled Classes</h3>";
    try {
        $exitCode = $kernel->call('clear-compiled');
        echo "<p style='color: green;'>✓ Compiled classes cleared</p>";
    } catch (Exception $e) {
        echo "<p style='color: orange;'>⚠ Compiled classes clear failed: " . $e->getMessage() . "</p>";
    }
    
    // Optimize autoloader
    echo "<h3>Optimizing Autoloader</h3>";
    try {
        $exitCode = $kernel->call('optimize:clear');
        echo "<p style='color: green;'>✓ Optimization cache cleared</p>";
    } catch (Exception $e) {
        echo "<p style='color: orange;'>⚠ Optimization clear failed: " . $e->getMessage() . "</p>";
    }
    
    echo "<hr>";
    echo "<h2 style='color: green;'>✓ Cache clearing completed!</h2>";
    echo "<p>You can now test the API endpoints.</p>";
    
} catch (Exception $e) {
    echo "<h3 style='color: red;'>✗ Error occurred:</h3>";
    echo "<p><strong>Message:</strong> " . $e->getMessage() . "</p>";
    echo "<p><strong>File:</strong> " . $e->getFile() . " (line " . $e->getLine() . ")</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<hr>";
echo "<p style='color: red; font-weight: bold;'>⚠ IMPORTANT: Delete this file after running!</p>";
