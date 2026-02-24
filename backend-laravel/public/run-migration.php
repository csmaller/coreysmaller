<?php
// SECURITY: Remove this file after running migrations!
// Or add password protection

$password = 'TomBradyIsGod12'; // Change this!

if (!isset($_GET['password']) || $_GET['password'] !== $password) {
    die('Unauthorized');
}

echo "<h2>Running Laravel Migrations</h2>";

try {
    require __DIR__.'/../laravel/vendor/autoload.php';
    $app = require_once __DIR__.'/../laravel/bootstrap/app.php';
    
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    
    // Run migrations
    $exitCode = $kernel->call('migrate', [
        '--force' => true, // Required for production
    ]);
    
    echo "<pre>";
    echo $kernel->output();
    echo "</pre>";
    
    if ($exitCode === 0) {
        echo "<br><strong style='color: green;'>✓ Migrations completed successfully!</strong>";
    } else {
        echo "<br><strong style='color: red;'>✗ Migration failed with exit code: $exitCode</strong>";
    }
    
} catch (Exception $e) {
    echo "<strong style='color: red;'>✗ Error:</strong> " . $e->getMessage() . "<br>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<br><br><strong style='color: red;'>IMPORTANT: Delete this file after running!</strong>";
