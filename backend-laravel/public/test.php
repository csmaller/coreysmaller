<?php
echo "<h1>PHP Test</h1>";
echo "<p>PHP is working!</p>";
echo "<p>Current directory: " . __DIR__ . "</p>";
echo "<p>Parent directory: " . dirname(__DIR__) . "</p>";

echo "<h2>Checking paths:</h2>";
echo "<p>Vendor exists (local): " . (file_exists(__DIR__.'/../vendor/autoload.php') ? 'YES' : 'NO') . "</p>";
echo "<p>Vendor exists (laravel): " . (file_exists(__DIR__.'/../laravel/vendor/autoload.php') ? 'YES' : 'NO') . "</p>";
echo "<p>Bootstrap exists (local): " . (file_exists(__DIR__.'/../bootstrap/app.php') ? 'YES' : 'NO') . "</p>";
echo "<p>Bootstrap exists (laravel): " . (file_exists(__DIR__.'/../laravel/bootstrap/app.php') ? 'YES' : 'NO') . "</p>";

echo "<h2>Environment:</h2>";
echo "<p>Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
echo "<p>PHP Version: " . phpversion() . "</p>";

echo "<h2>Request Info:</h2>";
echo "<p>Request URI: " . $_SERVER['REQUEST_URI'] . "</p>";
echo "<p>Script Name: " . $_SERVER['SCRIPT_NAME'] . "</p>";
echo "<p>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";

echo "<h2>Try loading Laravel:</h2>";
try {
    if (file_exists(__DIR__.'/../laravel/vendor/autoload.php')) {
        require __DIR__.'/../laravel/vendor/autoload.php';
        echo "<p style='color: green;'>✓ Autoload loaded</p>";
        
        $app = require_once __DIR__.'/../laravel/bootstrap/app.php';
        echo "<p style='color: green;'>✓ Laravel app loaded</p>";
        
        echo "<p>App class: " . get_class($app) . "</p>";
    } else {
        echo "<p style='color: red;'>✗ Vendor autoload not found</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Error: " . $e->getMessage() . "</p>";
}
