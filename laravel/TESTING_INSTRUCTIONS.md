# Testing Instructions for Laravel Backend

## Issue Encountered

There's a file permission issue with the vendor directory that's preventing artisan commands from running. This is likely due to macOS security restrictions.

## Fix the Permission Issue

Run these commands in your terminal:

```bash
cd laravel

# Fix vendor directory permissions
chmod -R 755 vendor/

# Or if that doesn't work, reinstall dependencies
rm -rf vendor/
composer install

# Generate application key
php artisan key:generate

# Generate JWT secret
php artisan jwt:secret
```

## Database Setup

1. **Configure Database Connection**

Edit `.env` file and set your MySQL credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=coreysmaller
DB_USERNAME=root
DB_PASSWORD=your_password_here
```

2. **Create Database**

```bash
mysql -u root -p
CREATE DATABASE coreysmaller;
EXIT;
```

3. **Run Migrations**

```bash
php artisan migrate
```

You should see:
```
Migration table created successfully.
Migrating: 2014_10_12_000000_create_users_table
Migrated:  2014_10_12_000000_create_users_table
Migrating: 2024_01_01_000002_create_blog_table
Migrated:  2024_01_01_000002_create_blog_table
Migrating: 2024_01_01_000003_create_music_table
Migrated:  2024_01_01_000003_create_music_table
Migrating: 2024_01_01_000004_create_video_table
Migrated:  2024_01_01_000004_create_video_table
Migrating: 2024_01_01_000005_create_audio_table
Migrated:  2024_01_01_000005_create_audio_table
```

## Start Development Server

```bash
php artisan serve
```

The server will start at `http://localhost:8000`

## Test Authentication Endpoints

### 1. Register a New User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "data": {
    "id": 1,
    "email": "test@example.com",
    "role": "admin",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "statusCode": 201,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "session_id": "session_abc123",
    "user": {
      "id": 1,
      "email": "test@example.com",
      "role": "admin"
    }
  },
  "statusCode": 200,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Save the `access_token` from the response for the next steps!**

### 3. Get Profile (Protected Route)

Replace `YOUR_TOKEN_HERE` with the token from the login response:

```bash
curl -X GET http://localhost:8000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected response:
```json
{
  "data": {
    "id": 1,
    "email": "test@example.com",
    "role": "admin",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Test Invalid Token

```bash
curl -X GET http://localhost:8000/api/auth/profile \
  -H "Authorization: Bearer invalid_token"
```

Expected response:
```json
{
  "statusCode": 401,
  "message": "Token is invalid",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 5. Logout

```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected response:
```json
{
  "data": {
    "message": "Logged out successfully"
  },
  "statusCode": 200,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Run Tests

```bash
php artisan test
```

This will run the authentication test suite in `tests/Feature/AuthTest.php`.

## Verify Database

Check that the tables were created:

```bash
php artisan migrate:status
```

You should see all 5 migrations marked as "Ran".

## Check Logs

Security events are logged to `storage/logs/security.log`:

```bash
tail -f storage/logs/security.log
```

You should see login, logout, and failed authentication attempts logged here.

## What to Test

✅ **User Registration** - Can create new users
✅ **User Login** - Can login with valid credentials
✅ **JWT Token Generation** - Tokens are generated correctly
✅ **Protected Routes** - Profile endpoint requires authentication
✅ **Token Validation** - Invalid tokens are rejected
✅ **Logout** - Can logout successfully
✅ **Security Logging** - Events are logged to security.log

## If Everything Works

Once all tests pass, we can continue with:
1. Blog management system (BlogService, BlogController)
2. Music, Video, Audio management systems
3. Complete API routes
4. Error handling and middleware

## Troubleshooting

### Permission Errors
```bash
chmod -R 755 storage bootstrap/cache
```

### Database Connection Errors
- Check MySQL is running: `mysql.server status`
- Verify credentials in `.env`
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### JWT Secret Not Set
```bash
php artisan jwt:secret
```

### Composer Issues
```bash
composer clear-cache
composer install
```

## Next Steps

After successful testing, let me know and I'll continue with:
- Blog management system implementation
- Complete API routes
- Error handling
- Remaining content management systems
