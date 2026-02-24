# CoreySmaller.com Laravel Backend

This is the Laravel backend for coreysmaller.com, migrated from NestJS/TypeScript to maintain complete API compatibility while leveraging PHP Laravel's ecosystem.

## Requirements

- PHP 8.1 or higher
- Composer
- MySQL 8.0+
- Redis 6.0+

## Installation

1. Install dependencies:
```bash
composer install
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Generate application key:
```bash
php artisan key:generate
```

4. Configure your environment variables in `.env`:
   - Database credentials (DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD)
   - Redis connection (REDIS_URL)
   - JWT secret (JWT_SECRET)
   - Frontend URL (FRONTEND_URL)

5. Run database migrations:
```bash
php artisan migrate
```

## Configuration

### Environment Variables

The following environment variables are required:

- `APP_NAME`: Application name (default: CoreySmallerBackend)
- `APP_ENV`: Environment (production, local, etc.)
- `APP_DEBUG`: Debug mode (true/false)
- `APP_URL`: Application URL
- `DB_*`: Database connection settings
- `REDIS_URL`: Redis connection URL
- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_EXPIRATION`: JWT token expiration time in seconds (default: 3600)
- `FRONTEND_URL`: Frontend application URL for CORS
- `CACHE_DRIVER`: Cache driver (redis recommended)
- `CACHE_TTL`: Default cache TTL in seconds (default: 300)
- `CACHE_MAX_ITEMS`: Maximum cache items (default: 1000)
- `LOG_CHANNEL`: Logging channel (daily recommended)
- `LOG_LEVEL`: Logging level (info, debug, error, etc.)
- `MARKDOWN_MIGRATION_PATH`: Path for markdown file migrations

## Project Structure

```
app/
├── Http/
│   ├── Controllers/          # API endpoint handlers
│   ├── Middleware/           # Request/response middleware
│   ├── Requests/             # Form request validation
│   └── Resources/            # API response transformers
├── Models/                   # Eloquent models
├── Services/                 # Business logic layer
├── Utils/                    # Utility classes
└── Console/Commands/         # Artisan commands
```

## API Endpoints

All API endpoints are prefixed with `/api`:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile (protected)
- `POST /api/auth/logout` - Logout single session (protected)
- `POST /api/auth/logout-all` - Logout all sessions (protected)

### Blog
- `GET /api/blog` - List blog posts (paginated)
- `GET /api/blog/recent` - Get recent posts
- `GET /api/blog/stats` - Get blog statistics
- `GET /api/blog/:id` - Get single blog post
- `POST /api/blog` - Create blog post (protected)
- `PATCH /api/blog/:id` - Update blog post (protected)
- `DELETE /api/blog/:id` - Delete blog post (protected)
- `POST /api/blog/migrate` - Migrate markdown files (protected)
- `GET /api/blog/migration/status` - Get migration status (protected)

### Music
- `GET /api/music` - List music tracks
- `GET /api/music/:id` - Get single music track
- `PATCH /api/music/:id/play` - Increment play count
- `POST /api/music` - Create music track (protected)
- `PATCH /api/music/:id` - Update music track (protected)
- `DELETE /api/music/:id` - Delete music track (protected)

### Video
- `GET /api/video` - List videos
- `GET /api/video/validate-youtube` - Validate YouTube URL
- `GET /api/video/by-youtube-id/:youtubeId` - Get video by YouTube ID
- `GET /api/video/:id` - Get single video
- `POST /api/video` - Create video (protected)
- `PATCH /api/video/:id` - Update video (protected)
- `DELETE /api/video/:id` - Delete video (protected)

### Audio
- `GET /api/audio` - List audio content
- `GET /api/audio/validate-soundcloud` - Validate SoundCloud URL
- `GET /api/audio/by-soundcloud-id/:soundcloudId` - Get audio by SoundCloud ID
- `GET /api/audio/:id` - Get single audio
- `POST /api/audio/:id/play` - Increment play count
- `POST /api/audio` - Create audio (protected)
- `PATCH /api/audio/:id` - Update audio (protected)
- `DELETE /api/audio/:id` - Delete audio (protected)

### Health
- `GET /api/health` - Health check
- `GET /api/ready` - Readiness check

## Testing

Run the test suite:
```bash
php artisan test
```

Run with coverage:
```bash
php artisan test --coverage
```

## Development

Start the development server:
```bash
php artisan serve
```

The application will be available at `http://localhost:8000` by default.

## Deployment

1. Set `APP_ENV=production` and `APP_DEBUG=false`
2. Run optimizations:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

3. Set up a web server (nginx/Apache) to serve the application
4. Configure SSL/TLS certificates
5. Set up process monitoring (supervisor, systemd)

## License

MIT
