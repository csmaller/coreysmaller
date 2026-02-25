<?php
// Fix admin password - DELETE AFTER USE
$password = 'TomBradyIsGod12';

if (!isset($_GET['password']) || $_GET['password'] !== $password) {
    die('Unauthorized');
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h2>Fix Admin Password</h2>";
echo "<hr>";

try {
    // Load Laravel
    echo "<p>Loading Laravel...</p>";
    require __DIR__.'/../laravel/vendor/autoload.php';
    $app = require_once __DIR__.'/../laravel/bootstrap/app.php';
    
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    
    echo "<p style='color: green;'>✓ Laravel loaded</p>";
    
    // Get database connection
    $db = app('db');
    $pdo = $db->connection()->getPdo();
    
    // Get current password hash
    $stmt = $pdo->prepare("SELECT id, email, password FROM users WHERE email = ?");
    $stmt->execute(['coreysmaller@gmail.com']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo "<p style='color: red;'>✗ Admin user not found</p>";
        exit;
    }
    
    echo "<h3>Current Password Info</h3>";
    echo "<p>Email: " . $user['email'] . "</p>";
    echo "<p>Current hash: " . substr($user['password'], 0, 20) . "...</p>";
    echo "<p>Hash length: " . strlen($user['password']) . "</p>";
    
    // Check if it's already bcrypt
    if (substr($user['password'], 0, 4) === '$2y$') {
        echo "<p style='color: orange;'>⚠ Password already appears to be bcrypt</p>";
    } else {
        echo "<p style='color: orange;'>⚠ Password is NOT bcrypt format</p>";
    }
    
    // Generate new bcrypt hash
    $newPassword = 'Vi$ions1';
    $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 10]);
    
    echo "<h3>New Password Hash</h3>";
    echo "<p>New hash: " . substr($newHash, 0, 20) . "...</p>";
    echo "<p>Hash length: " . strlen($newHash) . "</p>";
    
    // Verify the new hash works
    if (password_verify($newPassword, $newHash)) {
        echo "<p style='color: green;'>✓ New hash verified with password_verify()</p>";
    } else {
        echo "<p style='color: red;'>✗ New hash verification failed!</p>";
        exit;
    }
    
    // Test with Laravel's Hash facade
    if (\Illuminate\Support\Facades\Hash::check($newPassword, $newHash)) {
        echo "<p style='color: green;'>✓ New hash verified with Laravel Hash::check()</p>";
    } else {
        echo "<p style='color: red;'>✗ Laravel Hash::check() failed!</p>";
        exit;
    }
    
    // Update the password
    echo "<h3>Updating Password</h3>";
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
    $stmt->execute([$newHash, 'coreysmaller@gmail.com']);
    
    echo "<p style='color: green;'>✓ Password updated successfully!</p>";
    
    // Verify the update
    $stmt = $pdo->prepare("SELECT password FROM users WHERE email = ?");
    $stmt->execute(['coreysmaller@gmail.com']);
    $updated = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($updated['password'] === $newHash) {
        echo "<p style='color: green;'>✓ Database update confirmed</p>";
    } else {
        echo "<p style='color: red;'>✗ Database update verification failed</p>";
    }
    
    // Test login with AuthService
    echo "<h3>Testing Login</h3>";
    try {
        $authService = app(\App\Services\AuthService::class);
        $result = $authService->login(
            'coreysmaller@gmail.com',
            'Vi$ions1',
            '127.0.0.1',
            'Fix Password Script'
        );
        echo "<p style='color: green;'>✓ Login successful!</p>";
        echo "<p>Token: " . substr($result['access_token'], 0, 50) . "...</p>";
    } catch (Exception $e) {
        echo "<p style='color: red;'>✗ Login failed: " . $e->getMessage() . "</p>";
    }
    
    echo "<hr>";
    echo "<h2 style='color: green;'>✓ Password fix completed!</h2>";
    echo "<p><strong>You can now login with:</strong></p>";
    echo "<ul>";
    echo "<li>Email: coreysmaller@gmail.com</li>";
    echo "<li>Password: Vi\$ions1</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<h3 style='color: red;'>✗ Error occurred:</h3>";
    echo "<p><strong>Message:</strong> " . $e->getMessage() . "</p>";
    echo "<p><strong>File:</strong> " . $e->getFile() . " (line " . $e->getLine() . ")</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<hr>";
echo "<p style='color: red; font-weight: bold;'>⚠ IMPORTANT: Delete this file after running!</p>";
