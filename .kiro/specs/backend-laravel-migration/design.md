# Design Document: Backend Laravel Migration

## Overview

This design document specifies the architecture and implementation details for migrating the coreysmaller.com backend from NestJS/TypeScript to PHP Laravel while maintaining complete API compatibility. The Laravel backend will preserve all existing functionality including authentication, content management, caching, rate limiting, and security features.

### Design Goals

1. **API Compatibility**: Maintain identical REST API endpoints, request/response formats, and HTTP status codes
2. **Data Preservation**: Use existing MySQL database schema without modifications
3. **Performance Parity**: Match or exceed NestJS backend performance characteristics
4. **Security Equivalence**: Implement identical security features including JWT authentication, rate limiting, and security headers
5. **Cache Strategy**: Preserve Redis caching patterns and TTL configurations
6. **Testing Coverage**: Achieve comprehensive test coverage with unit, integration, and property-based tests

### Technology Stack

- **Framework**: Laravel 10.x (PHP 8.1+)
- **Database**: MySQL 8.0+ with Eloquent ORM
- **Cache**: Redis 6.0+ via Laravel Cache facade
- **Authentication**: JWT via tymon/jwt-auth package
- **Testing**: PHPUnit 10.x with property-based testing via eris/phpquickcheck
- **Validation**: Laravel Form Requests
- **API Resources**: Laravel API Resources for response transformation


## Architecture

### Application Structure

The Laravel application follows a layered architecture pattern:

```
app/
├── Http/
│   ├── Controllers/          # API endpoint handlers
│   │   ├── AuthController.php
│   │   ├── BlogController.php
│   │   ├── MusicController.php
│   │   ├── VideoController.php
│   │   └── AudioController.php
│   ├── Middleware/           # Request/response middleware
│   │   ├── JwtAuthenticate.php
│   │   ├── RateLimitMiddleware.php
│   │   ├── SecurityHeaders.php
│   │   ├── CacheControl.php
│   │   └── LogSecurity.php
│   ├── Requests/             # Form request validation
│   │   ├── Auth/
│   │   ├── Blog/
│   │   ├── Music/
│   │   ├── Video/
│   │   └── Audio/
│   └── Resources/            # API response transformers
│       ├── BlogPostResource.php
│       ├── BlogPostSummaryResource.php
│       ├── MusicResource.php
│       ├── VideoResource.php
│       └── AudioResource.php
├── Models/                   # Eloquent models
│   ├── User.php
│   ├── BlogPost.php
│   ├── Music.php
│   ├── Video.php
│   └── Audio.php
├── Services/                 # Business logic layer
│   ├── AuthService.php
│   ├── BlogService.php
│   ├── MusicService.php
│   ├── VideoService.php
│   ├── AudioService.php
│   └── MigrationService.php
├── Repositories/             # Data access layer (optional)
├── Exceptions/               # Custom exception handlers
│   └── Handler.php
└── Console/
    └── Commands/
        └── MigrateMarkdownCommand.php
```

### Request Flow

1. **Request Entry**: All requests enter through `public/index.php`
2. **Middleware Stack**: Applied in order:
   - SecurityHeaders (X-Frame-Options, CSP, etc.)
   - CORS handling
   - Rate limiting
   - JWT authentication (protected routes)
   - Cache control headers
   - Logging
3. **Route Matching**: Laravel router matches request to controller action
4. **Request Validation**: Form Request validates input
5. **Controller**: Delegates to service layer
6. **Service Layer**: Implements business logic, interacts with models
7. **Model/Repository**: Database operations via Eloquent
8. **Response Transformation**: API Resources format response
9. **Response Interceptor**: Wraps response in standard format
10. **Cache Middleware**: Caches response if applicable


## Components and Interfaces

### Authentication System

**JWT Configuration**:
- Package: `tymon/jwt-auth`
- Token expiration: Configurable via `JWT_EXPIRATION` (default: 3600 seconds)
- Secret key: Shared with NestJS via `JWT_SECRET` environment variable
- Payload structure: `{ sub: userId, email: userEmail, role: userRole, iat: timestamp, exp: timestamp }`

**AuthController** (`app/Http/Controllers/AuthController.php`):
```php
POST   /api/auth/login          # Authenticate user, return JWT
POST   /api/auth/register       # Create new user account
GET    /api/auth/profile        # Get authenticated user info (protected)
POST   /api/auth/logout         # Logout single session (protected)
POST   /api/auth/logout-all     # Logout all sessions (protected)
```

**AuthService** (`app/Services/AuthService.php`):
- `login(email, password, ipAddress, userAgent)`: Validate credentials, generate JWT
- `register(userData)`: Create user with bcrypt password hashing
- `validateToken(token)`: Verify JWT signature and expiration
- `logout(sessionId, userId)`: Invalidate specific session
- `logoutAllSessions(userId)`: Invalidate all user sessions
- `hashPassword(password)`: Bcrypt with cost factor 10

### Blog Management System

**BlogController** (`app/Http/Controllers/BlogController.php`):
```php
GET    /api/blog                # List blog posts (paginated)
GET    /api/blog/recent         # Get recent published posts
GET    /api/blog/stats          # Get blog statistics
GET    /api/blog/:id            # Get single blog post
POST   /api/blog                # Create blog post (protected)
PATCH  /api/blog/:id            # Update blog post (protected)
DELETE /api/blog/:id            # Delete blog post (protected)
POST   /api/blog/migrate        # Migrate markdown files (protected)
GET    /api/blog/migration/status # Get migration status (protected)
```

**BlogService** (`app/Services/BlogService.php`):
- `findAll(page, limit)`: Paginated blog post list with caching
- `findOne(id)`: Single blog post with caching
- `getRecentPosts(limit)`: Recent published posts with caching
- `getStats()`: Blog statistics with caching
- `create(data)`: Create blog post, invalidate cache
- `update(id, data)`: Update blog post, invalidate cache
- `delete(id)`: Delete blog post, invalidate cache
- `migrateMarkdownFiles()`: Process markdown files from directory

**Cache Keys**:
- List: `blog:list:page:{page}:limit:{limit}` (TTL: 300s)
- Item: `blog:item:{id}` (TTL: 600s)
- Recent: `blog:recent:limit:{limit}` (TTL: 180s)
- Stats: `blog:stats` (TTL: 300s)
- Migration: `blog:migration:status` (TTL: 60s)


### Music Management System

**MusicController** (`app/Http/Controllers/MusicController.php`):
```php
GET    /api/music               # List all music tracks
GET    /api/music/:id           # Get single music track
POST   /api/music               # Create music track (protected)
PATCH  /api/music/:id           # Update music track (protected)
PATCH  /api/music/:id/play      # Increment play count
DELETE /api/music/:id           # Delete music track (protected)
```

**MusicService** (`app/Services/MusicService.php`):
- `findAll()`: All music tracks ordered by releaseDate DESC
- `findOne(id)`: Single music track
- `create(data)`: Create music track
- `update(id, data)`: Update music track
- `incrementPlayCount(id)`: Atomic increment of playCount
- `delete(id)`: Delete music track

### Video Management System

**VideoController** (`app/Http/Controllers/VideoController.php`):
```php
GET    /api/video                        # List all videos
GET    /api/video/validate-youtube       # Validate YouTube URL
GET    /api/video/by-youtube-id/:id      # Get video by YouTube ID
GET    /api/video/:id                    # Get single video
POST   /api/video                        # Create video (protected)
PATCH  /api/video/:id                    # Update video (protected)
DELETE /api/video/:id                    # Delete video (protected)
```

**VideoService** (`app/Services/VideoService.php`):
- `findAll()`: All videos ordered by createdAt DESC
- `findOne(id)`: Single video by UUID
- `findByYoutubeId(youtubeId)`: Find video by YouTube ID
- `validateYoutubeUrl(url)`: Extract YouTube ID, validate format
- `create(data)`: Create video with UUID
- `update(id, data)`: Update video
- `delete(id)`: Delete video

**YouTube URL Utility** (`app/Utils/YouTubeUtils.php`):
- `extractVideoId(url)`: Extract ID from various YouTube URL formats
- `isValidUrl(url)`: Validate YouTube URL pattern
- Supported formats: `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/embed/ID`

### Audio Management System

**AudioController** (`app/Http/Controllers/AudioController.php`):
```php
GET    /api/audio                          # List all audio
GET    /api/audio/validate-soundcloud      # Validate SoundCloud URL
GET    /api/audio/by-soundcloud-id/:id     # Get audio by SoundCloud ID
GET    /api/audio/:id                      # Get single audio
POST   /api/audio/:id/play                 # Increment play count
POST   /api/audio                          # Create audio (protected)
PATCH  /api/audio/:id                      # Update audio (protected)
DELETE /api/audio/:id                      # Delete audio (protected)
```

**AudioService** (`app/Services/AudioService.php`):
- `findAll()`: All audio ordered by createdAt DESC
- `findOne(id)`: Single audio by UUID
- `findBySoundcloudId(soundcloudId)`: Find audio by SoundCloud ID
- `validateSoundcloudUrl(url)`: Extract SoundCloud ID, validate format
- `incrementPlayCount(id)`: Atomic increment of playCount
- `create(data)`: Create audio with UUID
- `update(id, data)`: Update audio
- `delete(id)`: Delete audio

**SoundCloud URL Utility** (`app/Utils/SoundCloudUtils.php`):
- `extractTrackId(url)`: Extract track ID from SoundCloud URL
- `isValidUrl(url)`: Validate SoundCloud URL pattern
- Supported format: `soundcloud.com/artist/track`


### Middleware Components

**SecurityHeadersMiddleware** (`app/Http/Middleware/SecurityHeaders.php`):
- Sets `X-Content-Type-Options: nosniff`
- Sets `X-Frame-Options: DENY`
- Sets `X-XSS-Protection: 1; mode=block`
- Removes `X-Powered-By` header
- Sets `Content-Security-Policy` allowing YouTube and SoundCloud embeds
- Sets `Strict-Transport-Security` in production (max-age=31536000)

**RateLimitMiddleware** (`app/Http/Middleware/RateLimitMiddleware.php`):
- Global limits: 10/second, 100/minute, 1000/15min per IP
- Endpoint-specific limits:
  - `GET /api/blog`: 20/minute
  - `GET /api/blog/recent`: 30/minute
  - `POST /api/blog/migrate`: 1/5min
- Returns 429 with `retryAfter` header when exceeded
- Uses Redis for distributed rate limiting
- Logs violations with IP, user agent, endpoint

**JwtAuthenticateMiddleware** (`app/Http/Middleware/JwtAuthenticate.php`):
- Extracts JWT from `Authorization: Bearer {token}` header
- Validates token signature and expiration
- Loads user from database and attaches to request
- Returns 401 Unauthorized on failure

**CacheControlMiddleware** (`app/Http/Middleware/CacheControl.php`):
- Sets appropriate `Cache-Control` headers
- Static content: `public, max-age=31536000`
- Dynamic content: `no-cache, must-revalidate`
- Private content: `private, no-store`

**LogSecurityMiddleware** (`app/Http/Middleware/LogSecurity.php`):
- Logs authentication events (login, logout, failed attempts)
- Logs authorization failures
- Logs admin operations
- Captures IP address, user agent, user ID, timestamp
- Writes to separate security log file

### Cache Service

**CacheService** (`app/Services/CacheService.php`):
- `get(key)`: Retrieve cached value
- `set(key, value, ttl)`: Store value with TTL
- `delete(key)`: Remove cached value
- `invalidatePattern(pattern)`: Remove keys matching pattern
- `remember(key, ttl, callback)`: Cache or execute callback
- Fallback to in-memory cache when Redis unavailable
- Configuration: default TTL 300s, max 1000 items


## Data Models

### User Model

**Table**: `users`

**Eloquent Model** (`app/Models/User.php`):
```php
class User extends Authenticatable implements JWTSubject
{
    protected $table = 'users';
    protected $keyType = 'int';
    public $incrementing = true;
    
    protected $fillable = ['email', 'password', 'role'];
    protected $hidden = ['password'];
    protected $casts = [
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];
    
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
```

**Schema**:
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `email`: VARCHAR(255) UNIQUE NOT NULL
- `password`: VARCHAR(255) NOT NULL (bcrypt hashed)
- `role`: VARCHAR(255) DEFAULT 'admin'
- `createdAt`: DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
- `updatedAt`: DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`

### BlogPost Model

**Table**: `blog`

**Eloquent Model** (`app/Models/BlogPost.php`):
```php
class BlogPost extends Model
{
    protected $table = 'blog';
    protected $keyType = 'int';
    public $incrementing = true;
    
    protected $fillable = [
        'title', 'content', 'excerpt', 'featuredImage',
        'tags', 'status', 'slug', 'publishedAt'
    ];
    
    protected $casts = [
        'tags' => 'array',
        'publishedAt' => 'datetime',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];
    
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
    
    // Computed attributes
    public function getReadingTimeMinutesAttribute(): int
    {
        $wordCount = str_word_count($this->content ?? '');
        return (int) ceil($wordCount / 200);
    }
    
    public function getWordCountAttribute(): int
    {
        return str_word_count($this->content ?? '');
    }
    
    public function getIsPublishedAttribute(): bool
    {
        return $this->status === 'published';
    }
}
```

**Schema**:
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `title`: VARCHAR(200) NOT NULL CHECK(LENGTH(title) > 0)
- `content`: TEXT NOT NULL CHECK(LENGTH(content) > 0)
- `excerpt`: VARCHAR(255) NULL
- `featuredImage`: VARCHAR(255) NULL
- `tags`: TEXT NULL (JSON array stored as comma-separated string)
- `status`: ENUM('draft', 'published', 'archived') DEFAULT 'draft'
- `slug`: VARCHAR(255) NULL UNIQUE
- `publishedAt`: DATETIME NULL
- `createdAt`: DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
- `updatedAt`: DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)

**Indexes**:
- PRIMARY KEY on `id`
- COMPOSITE INDEX on `(status, publishedAt)`
- INDEX on `slug`


### Music Model

**Table**: `music`

**Eloquent Model** (`app/Models/Music.php`):
```php
class Music extends Model
{
    protected $table = 'music';
    protected $keyType = 'int';
    public $incrementing = true;
    
    protected $fillable = [
        'title', 'description', 'audioUrl', 'coverArt',
        'genre', 'duration', 'playCount', 'releaseDate'
    ];
    
    protected $casts = [
        'duration' => 'integer',
        'playCount' => 'integer',
        'releaseDate' => 'datetime',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];
    
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
```

**Schema**:
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `title`: VARCHAR(200) NOT NULL CHECK(LENGTH(title) > 0)
- `description`: TEXT NULL
- `audioUrl`: VARCHAR(255) NULL
- `coverArt`: VARCHAR(255) NULL
- `genre`: VARCHAR(255) NULL
- `duration`: INT NULL CHECK(duration IS NULL OR duration > 0)
- `playCount`: INT DEFAULT 0 CHECK(playCount >= 0)
- `releaseDate`: DATETIME NULL
- `createdAt`: DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
- `updatedAt`: DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)

**Indexes**:
- PRIMARY KEY on `id`
- COMPOSITE INDEX on `(genre, releaseDate)`
- INDEX on `playCount`

### Video Model

**Table**: `video`

**Eloquent Model** (`app/Models/Video.php`):
```php
class Video extends Model
{
    protected $table = 'video';
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'title', 'description', 'youtubeUrl', 'youtubeId',
        'thumbnail', 'duration', 'viewCount'
    ];
    
    protected $casts = [
        'duration' => 'integer',
        'viewCount' => 'integer',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];
    
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
    
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}
```

**Schema**:
- `id`: VARCHAR(36) PRIMARY KEY (UUID)
- `title`: VARCHAR(200) NOT NULL CHECK(LENGTH(title) > 0)
- `description`: TEXT NULL
- `youtubeUrl`: VARCHAR(255) NOT NULL
- `youtubeId`: VARCHAR(255) NULL UNIQUE
- `thumbnail`: VARCHAR(255) NULL
- `duration`: INT NULL CHECK(duration IS NULL OR duration > 0)
- `viewCount`: INT DEFAULT 0 CHECK(viewCount >= 0)
- `createdAt`: DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
- `updatedAt`: DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `youtubeId`


### Audio Model

**Table**: `audio`

**Eloquent Model** (`app/Models/Audio.php`):
```php
class Audio extends Model
{
    protected $table = 'audio';
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'title', 'description', 'soundcloudUrl', 'soundcloudId',
        'artwork', 'duration', 'playCount'
    ];
    
    protected $casts = [
        'duration' => 'integer',
        'playCount' => 'integer',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];
    
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
    
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}
```

**Schema**:
- `id`: VARCHAR(36) PRIMARY KEY (UUID)
- `title`: VARCHAR(200) NOT NULL CHECK(LENGTH(title) > 0)
- `description`: TEXT NULL
- `soundcloudUrl`: VARCHAR(255) NOT NULL
- `soundcloudId`: VARCHAR(255) NULL UNIQUE
- `artwork`: VARCHAR(255) NULL
- `duration`: INT NULL CHECK(duration IS NULL OR duration > 0)
- `playCount`: INT DEFAULT 0 CHECK(playCount >= 0)
- `createdAt`: DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
- `updatedAt`: DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `soundcloudId`

### Request Validation DTOs

**Form Requests** use Laravel's Form Request validation:

**CreateBlogPostRequest**:
- `title`: required, string, max:200, min:1
- `content`: required, string, min:1
- `excerpt`: nullable, string, max:255
- `featuredImage`: nullable, url
- `tags`: nullable, array
- `status`: required, in:draft,published,archived
- `slug`: nullable, string, max:255, unique:blog,slug

**UpdateBlogPostRequest**:
- Same as CreateBlogPostRequest but all fields optional

**CreateMusicRequest**:
- `title`: required, string, max:200, min:1
- `description`: nullable, string
- `audioUrl`: nullable, url
- `coverArt`: nullable, url
- `genre`: nullable, string, max:255
- `duration`: nullable, integer, min:1
- `releaseDate`: nullable, date

**CreateVideoRequest**:
- `title`: required, string, max:200, min:1
- `description`: nullable, string
- `youtubeUrl`: required, url, regex:/^https:\/\/(www\.youtube\.com|youtu\.be)\/.+$/
- `thumbnail`: nullable, url
- `duration`: nullable, integer, min:1

**CreateAudioRequest**:
- `title`: required, string, max:200, min:1
- `description`: nullable, string
- `soundcloudUrl`: required, url, regex:/^https:\/\/soundcloud\.com\/.+$/
- `artwork`: nullable, url
- `duration`: nullable, integer, min:1


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 1.1-1.5 (endpoint-specific API compatibility) can be combined into a single comprehensive property about API compatibility
- Properties 1.6, 1.8, 2.5-2.8, 7.2-7.7, 7.12, 14.2, 14.7-14.9 are redundant with other properties
- Cache key properties 4.2-4.6 can be combined into one property about cache key patterns
- Security header properties 6.1-6.4 can be combined into one property

The following properties represent the unique, non-redundant correctness requirements:

### Property 1: API Endpoint Compatibility

For any valid request to any endpoint (auth, blog, music, video, audio), the Laravel backend response structure, field names, field types, and nested object structures should match the NestJS backend response for the same request.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: HTTP Status Code Consistency

For any operation (success, validation error, not found, unauthorized, forbidden, server error), the Laravel backend should return the same HTTP status code as the NestJS backend for equivalent operations.

**Validates: Requirements 1.9**

### Property 3: Query Parameter Handling

For any endpoint that accepts query parameters (pagination, filtering, validation), the Laravel backend should parse and handle query parameters identically to the NestJS backend, including type conversion and default values.

**Validates: Requirements 1.10**

### Property 4: JWT Token Interoperability

For any JWT token generated by either the NestJS or Laravel backend using the same secret key, both backends should successfully validate the token and extract identical user information (userId, email, role).

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Password Hash Compatibility

For any password hashed by either the NestJS or Laravel backend, both backends should successfully validate the password against the hash using bcrypt verification.

**Validates: Requirements 2.4**

### Property 6: Authentication Error Handling

For any authentication failure (invalid credentials, expired token, missing token), the Laravel backend should return 401 Unauthorized with an error response structure matching the NestJS backend.

**Validates: Requirements 2.9**

### Property 7: Security Event Logging

For any authentication event (login, logout, failed attempt), the Laravel backend should create a log entry containing IP address, user agent, user ID (if available), timestamp, and event type.

**Validates: Requirements 2.10, 6.10**

### Property 8: Cache Key Pattern Consistency

For any cacheable endpoint, the Laravel backend should generate cache keys using the same pattern as the NestJS backend, including parameter interpolation and TTL values.

**Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6**

### Property 9: Cache Invalidation on Modification

For any POST, PATCH, or DELETE operation that modifies cached data, the Laravel backend should invalidate all relevant cache entries before returning the response.

**Validates: Requirements 4.7**

### Property 10: Rate Limit Enforcement

For any endpoint, when the number of requests from a single IP address exceeds the configured limit within the time window, the Laravel backend should return 429 Too Many Requests with a retryAfter header indicating when the client can retry.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 11: Rate Limit Isolation

For any two different IP addresses making requests to the same endpoint, the rate limit counters should be independent—one IP reaching its limit should not affect the other IP's ability to make requests.

**Validates: Requirements 5.8**

### Property 12: Rate Limit Violation Logging

For any rate limit violation, the Laravel backend should create a log entry containing IP address, user agent, endpoint path, and timestamp.

**Validates: Requirements 5.9**

### Property 13: Security Headers Presence

For any HTTP response, the Laravel backend should include the following security headers: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, X-XSS-Protection: 1; mode=block, and should not include X-Powered-By header.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 14: Input Validation Consistency

For any invalid input (missing required fields, wrong types, constraint violations), the Laravel backend should reject the request with 400 Bad Request and return field-specific error messages in the same format as the NestJS backend.

**Validates: Requirements 6.8, 7.8, 7.9, 7.10, 8.8, 8.9, 8.10, 9.8, 9.9, 9.10, 9.11, 10.9, 10.10, 10.11, 10.12**


### Property 15: Published Status Timestamp

For any blog post where the status field changes from a non-published state to "published", the Laravel backend should automatically set the publishedAt field to the current timestamp.

**Validates: Requirements 7.11**

### Property 16: YouTube URL Validation

For any YouTube URL in a supported format (youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID), the Laravel backend should extract the video ID and return isValid: true with the extracted ID; for any URL not matching these patterns, it should return isValid: false with an error message.

**Validates: Requirements 11.1, 11.2, 11.3**

### Property 17: SoundCloud URL Validation

For any SoundCloud URL matching the pattern soundcloud.com/artist/track, the Laravel backend should extract the track ID and return isValid: true with the extracted ID; for any URL not matching this pattern, it should return isValid: false with an error message.

**Validates: Requirements 11.4, 11.5, 11.6**

### Property 18: Error Response Structure

For any error condition (validation, not found, unauthorized, forbidden, server error), the Laravel backend should return a structured error response with statusCode, message, and timestamp fields, matching the NestJS backend error format.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7**

### Property 19: Error Logging

For any error (4xx or 5xx status), the Laravel backend should create a log entry with severity level (error for 5xx, warn for 4xx), timestamp, request path, HTTP method, IP address, and user ID (if authenticated).

**Validates: Requirements 13.10**

### Property 20: Response Wrapper Structure

For any successful API response, the Laravel backend should wrap the data in a consistent structure containing data, statusCode, and timestamp fields.

**Validates: Requirements 14.1**

### Property 21: Password Field Exclusion

For any response containing user objects, the Laravel backend should exclude the password field from the serialized output.

**Validates: Requirements 14.3**

### Property 22: ISO 8601 Date Formatting

For any response containing date/datetime fields, the Laravel backend should format them as ISO 8601 strings (YYYY-MM-DDTHH:mm:ss.sssZ).

**Validates: Requirements 14.4**

### Property 23: Pagination Metadata

For any paginated response, the Laravel backend should include metadata fields: total (total items), page (current page), limit (items per page), and totalPages (calculated total pages).

**Validates: Requirements 14.6**

### Property 24: Request Body Whitelist

For any request with a body containing unknown/extra fields not defined in the DTO, the Laravel backend should ignore those fields and only process whitelisted fields.

**Validates: Requirements 14.10**

### Property 25: Serialization Round-Trip

For any valid blog post object, serializing it to JSON using BlogPostResponseDto and then deserializing it back should produce an object with equivalent field values (excluding computed fields).

**Validates: Requirements 16.11**

### Property 26: Authentication Determinism

For any set of credentials, valid credentials should always result in successful authentication with a JWT token, and invalid credentials should always result in authentication failure with 401 status.

**Validates: Requirements 16.12**


## Error Handling

### Exception Hierarchy

Laravel's exception handling will be customized to match NestJS error responses:

**Custom Exception Handler** (`app/Exceptions/Handler.php`):
- Catches all exceptions and formats them consistently
- Maps Laravel exceptions to appropriate HTTP status codes
- Sanitizes error messages in production environment
- Logs errors with appropriate severity levels

### Exception Types and Status Codes

| Exception Type | HTTP Status | Description |
|---------------|-------------|-------------|
| ValidationException | 400 | Input validation failures |
| ModelNotFoundException | 404 | Resource not found |
| AuthenticationException | 401 | Authentication required or failed |
| AuthorizationException | 403 | Insufficient permissions |
| QueryException | 400 | Database constraint violations |
| ThrottleRequestsException | 429 | Rate limit exceeded |
| Generic Exception | 500 | Unexpected server errors |

### Error Response Format

All errors return a consistent JSON structure:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "title": ["The title field is required."],
    "email": ["The email must be a valid email address."]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Production vs Development**:
- Development: Include stack traces and detailed error information
- Production: Sanitize messages, exclude stack traces, use generic messages for 500 errors

### Error Logging Strategy

**Log Channels**:
- `daily`: General application logs (rotated daily)
- `security`: Authentication and authorization events
- `performance`: Slow queries and performance issues

**Log Levels**:
- `error`: 5xx errors, exceptions, critical failures
- `warning`: 4xx errors, validation failures, rate limits
- `info`: Successful operations, authentication events
- `debug`: Detailed debugging information (development only)

**Log Format**:
```
[2024-01-15 10:30:00] production.ERROR: Database query failed
{
  "message": "SQLSTATE[23000]: Integrity constraint violation",
  "statusCode": 400,
  "path": "/api/blog",
  "method": "POST",
  "ip": "192.168.1.1",
  "userId": 123,
  "userAgent": "Mozilla/5.0..."
}
```


## Testing Strategy

### Dual Testing Approach

The Laravel backend requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**:
- Verify specific examples and edge cases
- Test integration points between components
- Test error conditions and boundary cases
- Focus on concrete scenarios with known inputs/outputs

**Property-Based Tests**:
- Verify universal properties across all inputs
- Use randomized input generation for comprehensive coverage
- Test invariants that should hold for any valid input
- Minimum 100 iterations per property test

Both approaches are complementary and necessary—unit tests catch concrete bugs while property tests verify general correctness.

### Property-Based Testing Library

**Library**: `eris/phpquickcheck` or `giorgiosironi/eris`
- PHP implementation of QuickCheck-style property testing
- Supports generators for random data
- Automatic shrinking of failing test cases
- Integration with PHPUnit

### Test Organization

```
tests/
├── Unit/
│   ├── Services/
│   │   ├── AuthServiceTest.php
│   │   ├── BlogServiceTest.php
│   │   ├── MusicServiceTest.php
│   │   ├── VideoServiceTest.php
│   │   └── AudioServiceTest.php
│   ├── Utils/
│   │   ├── YouTubeUtilsTest.php
│   │   └── SoundCloudUtilsTest.php
│   └── Models/
│       ├── UserTest.php
│       ├── BlogPostTest.php
│       └── ...
├── Feature/
│   ├── AuthenticationTest.php
│   ├── BlogManagementTest.php
│   ├── MusicManagementTest.php
│   ├── VideoManagementTest.php
│   └── AudioManagementTest.php
├── Properties/
│   ├── ApiCompatibilityPropertiesTest.php
│   ├── AuthenticationPropertiesTest.php
│   ├── CachePropertiesTest.php
│   ├── RateLimitPropertiesTest.php
│   ├── SecurityPropertiesTest.php
│   ├── ValidationPropertiesTest.php
│   ├── SerializationPropertiesTest.php
│   └── ErrorHandlingPropertiesTest.php
└── Integration/
    └── NestJsCompatibilityTest.php
```

### Property Test Configuration

Each property test must:
1. Run minimum 100 iterations with randomized inputs
2. Include a comment tag referencing the design property
3. Use appropriate generators for input data
4. Verify the property holds for all generated inputs

**Tag Format**:
```php
/**
 * @test
 * Feature: backend-laravel-migration, Property 1: API Endpoint Compatibility
 */
public function test_api_endpoint_compatibility()
{
    $this->forAll(
        Generator\associative([
            'title' => Generator\string(),
            'content' => Generator\string(),
            'status' => Generator\elements(['draft', 'published', 'archived'])
        ])
    )->then(function ($blogData) {
        // Test that Laravel response matches NestJS response structure
    })->runs(100);
}
```

### Unit Test Coverage

**Service Layer Tests**:
- Test each service method with valid inputs
- Test error conditions (not found, validation failures)
- Test cache interactions (hit, miss, invalidation)
- Mock external dependencies (database, Redis)

**Controller Tests**:
- Test request validation
- Test authentication/authorization
- Test response formatting
- Test HTTP status codes

**Model Tests**:
- Test computed attributes
- Test relationships
- Test scopes and query builders
- Test model events (creating, updating)

**Utility Tests**:
- Test URL parsing and validation
- Test data transformation functions
- Test helper methods

### Integration Tests

**API Compatibility Tests**:
- Compare Laravel responses to NestJS responses for identical requests
- Test all endpoints with various input combinations
- Verify response structure, field names, and types match
- Test error responses match

**Database Tests**:
- Test migrations create correct schema
- Test models interact correctly with database
- Test constraints and indexes work as expected
- Use in-memory SQLite for fast test execution

**Cache Tests**:
- Test Redis connection and operations
- Test cache key generation
- Test cache invalidation
- Test fallback to in-memory cache

**Rate Limiting Tests**:
- Test rate limits are enforced
- Test rate limit headers are correct
- Test rate limit isolation between IPs
- Test rate limit logging

### Test Data Generators

**Property Test Generators**:
```php
// Blog post generator
Generator\associative([
    'title' => Generator\string()->withMaxSize(200),
    'content' => Generator\string()->withMinSize(1),
    'excerpt' => Generator\oneOf(Generator\constant(null), Generator\string()),
    'status' => Generator\elements(['draft', 'published', 'archived']),
    'tags' => Generator\seq(Generator\string())
]);

// User generator
Generator\associative([
    'email' => Generator\email(),
    'password' => Generator\string()->withMinSize(6),
    'role' => Generator\constant('admin')
]);

// YouTube URL generator
Generator\oneOf(
    Generator\bind(Generator\string(), fn($id) => "https://www.youtube.com/watch?v={$id}"),
    Generator\bind(Generator\string(), fn($id) => "https://youtu.be/{$id}"),
    Generator\bind(Generator\string(), fn($id) => "https://www.youtube.com/embed/{$id}")
);
```

### Coverage Goals

- Minimum 80% code coverage overall
- 90%+ coverage for service layer
- 100% coverage for critical paths (authentication, authorization)
- Property tests cover all 26 correctness properties
- Integration tests verify NestJS compatibility


## Implementation Details

### Route Definitions

**routes/api.php**:
```php
Route::prefix('api')->group(function () {
    // Authentication routes
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/register', [AuthController::class, 'register']);
    
    Route::middleware('auth:api')->group(function () {
        Route::get('auth/profile', [AuthController::class, 'profile']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::post('auth/logout-all', [AuthController::class, 'logoutAll']);
    });
    
    // Blog routes
    Route::get('blog', [BlogController::class, 'index']);
    Route::get('blog/recent', [BlogController::class, 'recent']);
    Route::get('blog/stats', [BlogController::class, 'stats']);
    Route::get('blog/{id}', [BlogController::class, 'show']);
    
    Route::middleware('auth:api')->group(function () {
        Route::post('blog', [BlogController::class, 'store']);
        Route::patch('blog/{id}', [BlogController::class, 'update']);
        Route::delete('blog/{id}', [BlogController::class, 'destroy']);
        Route::post('blog/migrate', [BlogController::class, 'migrate']);
        Route::get('blog/migration/status', [BlogController::class, 'migrationStatus']);
    });
    
    // Music routes
    Route::get('music', [MusicController::class, 'index']);
    Route::get('music/{id}', [MusicController::class, 'show']);
    Route::patch('music/{id}/play', [MusicController::class, 'incrementPlay']);
    
    Route::middleware('auth:api')->group(function () {
        Route::post('music', [MusicController::class, 'store']);
        Route::patch('music/{id}', [MusicController::class, 'update']);
        Route::delete('music/{id}', [MusicController::class, 'destroy']);
    });
    
    // Video routes
    Route::get('video', [VideoController::class, 'index']);
    Route::get('video/validate-youtube', [VideoController::class, 'validateYoutube']);
    Route::get('video/by-youtube-id/{youtubeId}', [VideoController::class, 'byYoutubeId']);
    Route::get('video/{id}', [VideoController::class, 'show']);
    
    Route::middleware('auth:api')->group(function () {
        Route::post('video', [VideoController::class, 'store']);
        Route::patch('video/{id}', [VideoController::class, 'update']);
        Route::delete('video/{id}', [VideoController::class, 'destroy']);
    });
    
    // Audio routes
    Route::get('audio', [AudioController::class, 'index']);
    Route::get('audio/validate-soundcloud', [AudioController::class, 'validateSoundcloud']);
    Route::get('audio/by-soundcloud-id/{soundcloudId}', [AudioController::class, 'bySoundcloudId']);
    Route::get('audio/{id}', [AudioController::class, 'show']);
    Route::post('audio/{id}/play', [AudioController::class, 'incrementPlay']);
    
    Route::middleware('auth:api')->group(function () {
        Route::post('audio', [AudioController::class, 'store']);
        Route::patch('audio/{id}', [AudioController::class, 'update']);
        Route::delete('audio/{id}', [AudioController::class, 'destroy']);
    });
    
    // Health check routes
    Route::get('health', function () {
        return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
    });
    
    Route::get('ready', function () {
        // Check database and Redis connectivity
        try {
            DB::connection()->getPdo();
            Cache::store('redis')->get('health-check');
            return response()->json(['status' => 'ready', 'timestamp' => now()->toIso8601String()]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'not ready', 'error' => $e->getMessage()], 503);
        }
    });
});
```

### Middleware Registration

**app/Http/Kernel.php**:
```php
protected $middlewareGroups = [
    'api' => [
        \App\Http\Middleware\SecurityHeaders::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        \App\Http\Middleware\RateLimitMiddleware::class,
        \App\Http\Middleware\CacheControl::class,
        \App\Http\Middleware\LogSecurity::class,
    ],
];

protected $routeMiddleware = [
    'auth' => \App\Http\Middleware\JwtAuthenticate::class,
    'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
];
```

### Configuration Files

**config/jwt.php**:
```php
return [
    'secret' => env('JWT_SECRET'),
    'ttl' => env('JWT_EXPIRATION', 3600),
    'refresh_ttl' => env('JWT_REFRESH_TTL', 20160),
    'algo' => 'HS256',
    'required_claims' => ['iss', 'iat', 'exp', 'nbf', 'sub'],
    'blacklist_enabled' => true,
    'blacklist_grace_period' => 0,
    'providers' => [
        'jwt' => Tymon\JWTAuth\Providers\JWT\Lcobucci::class,
        'auth' => Tymon\JWTAuth\Providers\Auth\Illuminate::class,
        'storage' => Tymon\JWTAuth\Providers\Storage\Illuminate::class,
    ],
];
```

**config/cache.php**:
```php
return [
    'default' => env('CACHE_DRIVER', 'redis'),
    'stores' => [
        'redis' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'lock_connection' => 'default',
        ],
        'array' => [
            'driver' => 'array',
            'serialize' => false,
        ],
    ],
    'prefix' => env('CACHE_PREFIX', 'laravel_cache'),
    'ttl' => env('CACHE_TTL', 300),
    'max_items' => env('CACHE_MAX_ITEMS', 1000),
];
```

**config/database.php**:
```php
'connections' => [
    'mysql' => [
        'driver' => 'mysql',
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => env('DB_PORT', '3306'),
        'database' => env('DB_DATABASE', 'coreysmaller'),
        'username' => env('DB_USERNAME', 'root'),
        'password' => env('DB_PASSWORD', ''),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => '',
        'strict' => true,
        'engine' => 'InnoDB',
    ],
],
```

**config/cors.php**:
```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

### Environment Variables

**.env.example**:
```
APP_NAME=CoreySmallerBackend
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://localhost:3000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=coreysmaller
DB_USERNAME=root
DB_PASSWORD=

REDIS_URL=redis://localhost:6379

JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=3600

FRONTEND_URL=http://localhost:5173

CACHE_DRIVER=redis
CACHE_TTL=300
CACHE_MAX_ITEMS=1000

LOG_CHANNEL=daily
LOG_LEVEL=info

MARKDOWN_MIGRATION_PATH=storage/markdown
```


### Database Migrations

**Migration Files Structure**:

**database/migrations/2024_01_01_000001_create_users_table.php**:
```php
public function up()
{
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('email', 255)->unique();
        $table->string('password', 255);
        $table->string('role', 255)->default('admin');
        $table->timestamp('createdAt', 6)->useCurrent();
        $table->timestamp('updatedAt', 6)->useCurrent()->useCurrentOnUpdate();
    });
}
```

**database/migrations/2024_01_01_000002_create_blog_table.php**:
```php
public function up()
{
    Schema::create('blog', function (Blueprint $table) {
        $table->id();
        $table->string('title', 200);
        $table->text('content');
        $table->string('excerpt', 255)->nullable();
        $table->string('featuredImage', 255)->nullable();
        $table->text('tags')->nullable();
        $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
        $table->string('slug', 255)->nullable()->unique();
        $table->timestamp('publishedAt')->nullable();
        $table->timestamp('createdAt', 6)->useCurrent();
        $table->timestamp('updatedAt', 6)->useCurrent()->useCurrentOnUpdate();
        
        // Indexes
        $table->index(['status', 'publishedAt']);
        $table->index('slug');
        
        // Check constraints (MySQL 8.0.16+)
        DB::statement('ALTER TABLE blog ADD CONSTRAINT blog_title_not_empty CHECK (LENGTH(title) > 0)');
        DB::statement('ALTER TABLE blog ADD CONSTRAINT blog_content_not_empty CHECK (LENGTH(content) > 0)');
    });
}
```

**database/migrations/2024_01_01_000003_create_music_table.php**:
```php
public function up()
{
    Schema::create('music', function (Blueprint $table) {
        $table->id();
        $table->string('title', 200);
        $table->text('description')->nullable();
        $table->string('audioUrl', 255)->nullable();
        $table->string('coverArt', 255)->nullable();
        $table->string('genre', 255)->nullable();
        $table->integer('duration')->nullable();
        $table->integer('playCount')->default(0);
        $table->timestamp('releaseDate')->nullable();
        $table->timestamp('createdAt', 6)->useCurrent();
        $table->timestamp('updatedAt', 6)->useCurrent()->useCurrentOnUpdate();
        
        // Indexes
        $table->index(['genre', 'releaseDate']);
        $table->index('playCount');
        
        // Check constraints
        DB::statement('ALTER TABLE music ADD CONSTRAINT music_title_not_empty CHECK (LENGTH(title) > 0)');
        DB::statement('ALTER TABLE music ADD CONSTRAINT music_duration_positive CHECK (duration IS NULL OR duration > 0)');
        DB::statement('ALTER TABLE music ADD CONSTRAINT music_playcount_nonnegative CHECK (playCount >= 0)');
    });
}
```

**database/migrations/2024_01_01_000004_create_video_table.php**:
```php
public function up()
{
    Schema::create('video', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->string('title', 200);
        $table->text('description')->nullable();
        $table->string('youtubeUrl', 255);
        $table->string('youtubeId', 255)->nullable()->unique();
        $table->string('thumbnail', 255)->nullable();
        $table->integer('duration')->nullable();
        $table->integer('viewCount')->default(0);
        $table->timestamp('createdAt', 6)->useCurrent();
        $table->timestamp('updatedAt', 6)->useCurrent()->useCurrentOnUpdate();
        
        // Indexes
        $table->index('youtubeId');
        
        // Check constraints
        DB::statement('ALTER TABLE video ADD CONSTRAINT video_title_not_empty CHECK (LENGTH(title) > 0)');
        DB::statement('ALTER TABLE video ADD CONSTRAINT video_duration_positive CHECK (duration IS NULL OR duration > 0)');
        DB::statement('ALTER TABLE video ADD CONSTRAINT video_viewcount_nonnegative CHECK (viewCount >= 0)');
    });
}
```

**database/migrations/2024_01_01_000005_create_audio_table.php**:
```php
public function up()
{
    Schema::create('audio', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->string('title', 200);
        $table->text('description')->nullable();
        $table->string('soundcloudUrl', 255);
        $table->string('soundcloudId', 255)->nullable()->unique();
        $table->string('artwork', 255)->nullable();
        $table->integer('duration')->nullable();
        $table->integer('playCount')->default(0);
        $table->timestamp('createdAt', 6)->useCurrent();
        $table->timestamp('updatedAt', 6)->useCurrent()->useCurrentOnUpdate();
        
        // Indexes
        $table->index('soundcloudId');
        
        // Check constraints
        DB::statement('ALTER TABLE audio ADD CONSTRAINT audio_title_not_empty CHECK (LENGTH(title) > 0)');
        DB::statement('ALTER TABLE audio ADD CONSTRAINT audio_duration_positive CHECK (duration IS NULL OR duration > 0)');
        DB::statement('ALTER TABLE audio ADD CONSTRAINT audio_playcount_nonnegative CHECK (playCount >= 0)');
    });
}
```

### Markdown Migration Command

**app/Console/Commands/MigrateMarkdownCommand.php**:
```php
class MigrateMarkdownCommand extends Command
{
    protected $signature = 'blog:migrate-markdown {--path=storage/markdown}';
    protected $description = 'Migrate markdown files to blog posts';
    
    public function handle(MigrationService $migrationService)
    {
        $path = $this->option('path');
        $this->info("Migrating markdown files from: {$path}");
        
        $result = $migrationService->migrateMarkdownFiles($path);
        
        $this->info("Migration complete:");
        $this->info("  Processed: {$result['processed']}");
        $this->info("  Created: {$result['created']}");
        $this->info("  Skipped: {$result['skipped']}");
        $this->info("  Failed: {$result['failed']}");
        
        if (!empty($result['errors'])) {
            $this->error("Errors:");
            foreach ($result['errors'] as $error) {
                $this->error("  - {$error}");
            }
        }
        
        return 0;
    }
}
```

### Deployment Considerations

**Docker Support**:
- Create Dockerfile for PHP 8.1+ with required extensions
- Include docker-compose.yml for local development
- Configure nginx or Apache as reverse proxy
- Set up Redis and MySQL containers

**Performance Optimization**:
- Enable OPcache in production
- Configure PHP-FPM with appropriate worker settings
- Use Laravel's route caching: `php artisan route:cache`
- Use config caching: `php artisan config:cache`
- Enable query result caching for frequently accessed data

**Monitoring and Logging**:
- Configure Laravel Telescope for development debugging
- Set up log aggregation (e.g., ELK stack, Papertrail)
- Monitor Redis memory usage and eviction policies
- Track API response times and error rates
- Set up alerts for authentication failures and rate limit violations

**Security Hardening**:
- Disable directory listing in web server
- Set appropriate file permissions (755 for directories, 644 for files)
- Keep storage and bootstrap/cache directories writable
- Use HTTPS in production with valid SSL certificates
- Regularly update dependencies for security patches
- Implement database connection encryption
- Use environment-specific .env files (never commit to version control)


## Design Summary

This design document provides a comprehensive blueprint for migrating the coreysmaller.com backend from NestJS to Laravel while maintaining complete API compatibility. The key design decisions include:

1. **Layered Architecture**: Controllers handle HTTP concerns, Services implement business logic, Models manage data access, and Middleware handles cross-cutting concerns.

2. **JWT Authentication**: Using tymon/jwt-auth package with shared secret key ensures token interoperability between NestJS and Laravel backends during migration.

3. **Cache Strategy**: Redis-backed caching with identical key patterns and TTL values preserves performance characteristics. Fallback to in-memory cache ensures resilience.

4. **Rate Limiting**: Multi-tier rate limiting (per-second, per-minute, per-15-minutes) with endpoint-specific overrides protects against abuse.

5. **Security Headers**: Comprehensive security middleware sets all required headers and enforces CSP policies compatible with YouTube and SoundCloud embeds.

6. **Error Handling**: Centralized exception handler ensures consistent error responses with appropriate status codes and sanitized messages in production.

7. **Testing Strategy**: Dual approach with unit tests for specific scenarios and property-based tests (minimum 100 iterations) for universal correctness guarantees.

8. **Database Compatibility**: Eloquent models map to existing schema without modifications, preserving all data and constraints.

9. **API Resources**: Laravel API Resources transform models to DTOs, ensuring response format compatibility with NestJS backend.

10. **Middleware Stack**: Carefully ordered middleware ensures security headers, CORS, rate limiting, authentication, caching, and logging are applied correctly.

The design achieves the primary goals of API compatibility, data preservation, performance parity, security equivalence, and comprehensive testing coverage. Implementation can proceed incrementally, with property-based tests verifying correctness at each stage.

