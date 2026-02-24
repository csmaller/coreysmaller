# Requirements Document: Backend Laravel Migration

## Introduction

This document specifies the requirements for migrating the coreysmaller.com backend from NestJS/TypeScript to PHP Laravel. The migration must maintain complete API compatibility, preserve all existing functionality, and ensure the React frontend continues to work without any modifications. The system currently provides authentication, blog management, music/video/audio content management, Redis caching, rate limiting, and comprehensive security features.

## Glossary

- **Laravel_Backend**: The new PHP Laravel backend system that will replace the NestJS backend
- **NestJS_Backend**: The current TypeScript/NestJS backend system being replaced
- **API_Client**: The React frontend application that consumes the REST API
- **Database**: The MySQL database storing all application data
- **Redis_Cache**: The Redis server used for caching and session management
- **JWT_Token**: JSON Web Token used for authentication
- **Content_Entity**: Any of the content types (blog posts, music tracks, video content, audio content)
- **Migration_System**: The markdown file migration functionality for blog posts
- **Rate_Limiter**: The system component that enforces request rate limits
- **Security_Middleware**: Middleware components that enforce security policies

## Requirements

### Requirement 1: API Endpoint Compatibility

**User Story:** As an API client, I want all existing REST API endpoints to work identically, so that the frontend continues to function without changes.

#### Acceptance Criteria

1. THE Laravel_Backend SHALL expose all authentication endpoints at /api/auth/* with identical request/response formats
2. THE Laravel_Backend SHALL expose all blog endpoints at /api/blog/* with identical request/response formats
3. THE Laravel_Backend SHALL expose all music endpoints at /api/music/* with identical request/response formats
4. THE Laravel_Backend SHALL expose all video endpoints at /api/video/* with identical request/response formats
5. THE Laravel_Backend SHALL expose all audio endpoints at /api/audio/* with identical request/response formats
6. WHEN an API_Client sends a request to any endpoint, THE Laravel_Backend SHALL return responses with the same JSON structure as NestJS_Backend
7. THE Laravel_Backend SHALL use the /api prefix for all routes
8. THE Laravel_Backend SHALL support all HTTP methods (GET, POST, PATCH, DELETE) on the same endpoints as NestJS_Backend
9. THE Laravel_Backend SHALL return the same HTTP status codes as NestJS_Backend for equivalent operations
10. THE Laravel_Backend SHALL preserve query parameter handling for pagination, filtering, and validation endpoints

### Requirement 2: Authentication System

**User Story:** As a user, I want to authenticate using the same JWT tokens, so that my existing sessions remain valid during migration.

#### Acceptance Criteria

1. THE Laravel_Backend SHALL implement JWT authentication using the same secret key as NestJS_Backend
2. WHEN a user submits valid credentials to POST /api/auth/login, THE Laravel_Backend SHALL return a JWT token with the same payload structure
3. WHEN a user submits a valid JWT token, THE Laravel_Backend SHALL authenticate the request and extract user information
4. THE Laravel_Backend SHALL hash passwords using bcrypt with the same cost factor as NestJS_Backend
5. THE Laravel_Backend SHALL support POST /api/auth/register for user registration
6. THE Laravel_Backend SHALL support GET /api/auth/profile for retrieving authenticated user information
7. THE Laravel_Backend SHALL support POST /api/auth/logout for single session logout
8. THE Laravel_Backend SHALL support POST /api/auth/logout-all for logging out all user sessions
9. WHEN authentication fails, THE Laravel_Backend SHALL return 401 Unauthorized with the same error format
10. THE Laravel_Backend SHALL log authentication events (login, logout, failed attempts) with IP address and user agent

### Requirement 3: Database Schema Preservation

**User Story:** As a system administrator, I want the database schema to remain unchanged, so that existing data is preserved without migration.

#### Acceptance Criteria

1. THE Laravel_Backend SHALL use the existing MySQL database without schema modifications
2. THE Laravel_Backend SHALL use the users table with columns: id, email, password, role, createdAt, updatedAt
3. THE Laravel_Backend SHALL use the blog table with all existing columns including title, content, excerpt, featuredImage, tags, status, slug, publishedAt
4. THE Laravel_Backend SHALL use the music table with all existing columns including title, description, audioUrl, coverArt, genre, duration, playCount, releaseDate
5. THE Laravel_Backend SHALL use the video table with all existing columns including id (UUID), title, description, youtubeUrl, youtubeId, thumbnail, duration, viewCount
6. THE Laravel_Backend SHALL use the audio table with all existing columns including id (UUID), title, description, soundcloudUrl, soundcloudId, artwork, duration, playCount
7. THE Laravel_Backend SHALL preserve all database indexes including status+publishedAt, slug, genre+releaseDate, playCount, youtubeId, soundcloudId
8. THE Laravel_Backend SHALL enforce all database constraints including CHECK constraints for non-empty titles, positive durations, non-negative play counts
9. THE Laravel_Backend SHALL use auto-increment integer IDs for users, blog, and music tables
10. THE Laravel_Backend SHALL use UUID primary keys for video and audio tables

### Requirement 4: Redis Caching Strategy

**User Story:** As a system operator, I want Redis caching to work identically, so that performance characteristics are maintained.

#### Acceptance Criteria

1. THE Laravel_Backend SHALL connect to Redis using the same connection URL as NestJS_Backend
2. THE Laravel_Backend SHALL cache blog list responses with key pattern "blog:list:page:{page}:limit:{limit}" for 300 seconds
3. THE Laravel_Backend SHALL cache individual blog posts with key pattern "blog:item:{id}" for 600 seconds
4. THE Laravel_Backend SHALL cache recent blog posts with key pattern "blog:recent:limit:{limit}" for 180 seconds
5. THE Laravel_Backend SHALL cache blog stats with key "blog:stats" for 300 seconds
6. THE Laravel_Backend SHALL cache migration status with key "blog:migration:status" for 60 seconds
7. WHEN cached data is modified via POST, PATCH, or DELETE operations, THE Laravel_Backend SHALL invalidate relevant cache entries
8. THE Laravel_Backend SHALL fall back to in-memory caching when Redis is unavailable
9. THE Laravel_Backend SHALL configure Redis with a default TTL of 300 seconds and maximum 1000 items
10. THE Laravel_Backend SHALL use the same cache key patterns as NestJS_Backend for all cached endpoints

### Requirement 5: Rate Limiting

**User Story:** As a system administrator, I want rate limiting to protect the API, so that abuse is prevented.

#### Acceptance Criteria

1. THE Laravel_Backend SHALL enforce a rate limit of 10 requests per second per IP address
2. THE Laravel_Backend SHALL enforce a rate limit of 100 requests per minute per IP address
3. THE Laravel_Backend SHALL enforce a rate limit of 1000 requests per 15 minutes per IP address
4. WHEN a rate limit is exceeded, THE Laravel_Backend SHALL return 429 Too Many Requests with a retryAfter value
5. THE Laravel_Backend SHALL apply stricter rate limits to specific endpoints: 20 requests per minute for GET /api/blog
6. THE Laravel_Backend SHALL apply stricter rate limits to specific endpoints: 30 requests per minute for GET /api/blog/recent
7. THE Laravel_Backend SHALL apply stricter rate limits to specific endpoints: 1 request per 5 minutes for POST /api/blog/migrate
8. THE Laravel_Backend SHALL identify users by IP address and authenticated user ID for rate limiting
9. THE Laravel_Backend SHALL log rate limit violations with IP address, user agent, and endpoint information
10. THE Laravel_Backend SHALL clean up expired rate limit entries periodically

### Requirement 6: Security Features

**User Story:** As a security administrator, I want all security features preserved, so that the application remains secure.

#### Acceptance Criteria

1. THE Laravel_Backend SHALL set X-Content-Type-Options: nosniff header on all responses
2. THE Laravel_Backend SHALL set X-Frame-Options: DENY header on all responses
3. THE Laravel_Backend SHALL set X-XSS-Protection: 1; mode=block header on all responses
4. THE Laravel_Backend SHALL remove X-Powered-By header from all responses
5. THE Laravel_Backend SHALL set Content-Security-Policy header allowing YouTube and SoundCloud embeds
6. WHERE the application runs in production, THE Laravel_Backend SHALL set Strict-Transport-Security header with max-age=31536000
7. THE Laravel_Backend SHALL enable CORS for the frontend URL with credentials support
8. THE Laravel_Backend SHALL validate all input using the same validation rules as NestJS_Backend
9. THE Laravel_Backend SHALL sanitize error messages in production to prevent information disclosure
10. THE Laravel_Backend SHALL log all security-relevant requests (authentication, admin operations) with IP and user agent

### Requirement 7: Blog Post Management

**User Story:** As a content manager, I want to manage blog posts, so that I can publish and edit content.

#### Acceptance Criteria

1. WHEN an authenticated user sends POST /api/blog with valid data, THE Laravel_Backend SHALL create a blog post and return 201 Created
2. WHEN any user sends GET /api/blog, THE Laravel_Backend SHALL return paginated blog posts with default page=1 and limit=10
3. WHEN any user sends GET /api/blog/recent, THE Laravel_Backend SHALL return the 5 most recent published posts
4. WHEN any user sends GET /api/blog/stats, THE Laravel_Backend SHALL return statistics including total posts, published posts, and draft posts
5. WHEN any user sends GET /api/blog/:id, THE Laravel_Backend SHALL return the full blog post with that ID
6. WHEN an authenticated user sends PATCH /api/blog/:id with valid data, THE Laravel_Backend SHALL update the blog post
7. WHEN an authenticated user sends DELETE /api/blog/:id, THE Laravel_Backend SHALL delete the blog post
8. THE Laravel_Backend SHALL validate that title is non-empty and maximum 200 characters
9. THE Laravel_Backend SHALL validate that content is non-empty text
10. THE Laravel_Backend SHALL validate that status is one of: draft, published, archived
11. THE Laravel_Backend SHALL automatically set publishedAt when status changes to published
12. THE Laravel_Backend SHALL serialize responses using BlogPostResponseDto for single posts and BlogPostSummaryDto for lists

### Requirement 8: Music Track Management

**User Story:** As a content manager, I want to manage music tracks, so that I can showcase my music.

#### Acceptance Criteria

1. WHEN an authenticated user sends POST /api/music with valid data, THE Laravel_Backend SHALL create a music track
2. WHEN any user sends GET /api/music, THE Laravel_Backend SHALL return all music tracks ordered by releaseDate descending
3. WHEN any user sends GET /api/music/:id, THE Laravel_Backend SHALL return the music track with that ID
4. WHEN any user sends PATCH /api/music/:id/play, THE Laravel_Backend SHALL increment the playCount by 1
5. WHEN an authenticated user sends PATCH /api/music/:id with valid data, THE Laravel_Backend SHALL update the music track
6. WHEN an authenticated user sends DELETE /api/music/:id, THE Laravel_Backend SHALL delete the music track
7. THE Laravel_Backend SHALL validate that title is non-empty and maximum 200 characters
8. THE Laravel_Backend SHALL validate that duration is null or a positive integer
9. THE Laravel_Backend SHALL validate that playCount is a non-negative integer
10. THE Laravel_Backend SHALL validate that audioUrl and coverArt are valid URLs when provided

### Requirement 9: Video Content Management

**User Story:** As a content manager, I want to manage video content, so that I can showcase YouTube videos.

#### Acceptance Criteria

1. WHEN an authenticated user sends POST /api/video with valid data, THE Laravel_Backend SHALL create video content with a UUID primary key
2. WHEN any user sends GET /api/video, THE Laravel_Backend SHALL return all video content ordered by createdAt descending
3. WHEN any user sends GET /api/video/validate-youtube with url parameter, THE Laravel_Backend SHALL validate the YouTube URL and extract metadata
4. WHEN any user sends GET /api/video/by-youtube-id/:youtubeId, THE Laravel_Backend SHALL return video content with that YouTube ID
5. WHEN any user sends GET /api/video/:id, THE Laravel_Backend SHALL return the video content with that UUID
6. WHEN an authenticated user sends PATCH /api/video/:id with valid data, THE Laravel_Backend SHALL update the video content
7. WHEN an authenticated user sends DELETE /api/video/:id, THE Laravel_Backend SHALL delete the video content
8. THE Laravel_Backend SHALL validate that youtubeUrl matches pattern https://www.youtube.com/* or https://youtu.be/*
9. THE Laravel_Backend SHALL extract youtubeId from valid YouTube URLs
10. THE Laravel_Backend SHALL validate that duration is null or a positive integer
11. THE Laravel_Backend SHALL validate that viewCount is a non-negative integer

### Requirement 10: Audio Content Management

**User Story:** As a content manager, I want to manage audio content, so that I can showcase SoundCloud tracks.

#### Acceptance Criteria

1. WHEN an authenticated user sends POST /api/audio with valid data, THE Laravel_Backend SHALL create audio content with a UUID primary key
2. WHEN any user sends GET /api/audio, THE Laravel_Backend SHALL return all audio content ordered by createdAt descending
3. WHEN any user sends GET /api/audio/validate-soundcloud with url parameter, THE Laravel_Backend SHALL validate the SoundCloud URL and extract metadata
4. WHEN any user sends GET /api/audio/by-soundcloud-id/:soundcloudId, THE Laravel_Backend SHALL return audio content with that SoundCloud ID
5. WHEN any user sends GET /api/audio/:id, THE Laravel_Backend SHALL return the audio content with that UUID
6. WHEN any user sends POST /api/audio/:id/play, THE Laravel_Backend SHALL increment the playCount by 1
7. WHEN an authenticated user sends PATCH /api/audio/:id with valid data, THE Laravel_Backend SHALL update the audio content
8. WHEN an authenticated user sends DELETE /api/audio/:id, THE Laravel_Backend SHALL delete the audio content
9. THE Laravel_Backend SHALL validate that soundcloudUrl matches pattern https://soundcloud.com/*
10. THE Laravel_Backend SHALL extract soundcloudId from valid SoundCloud URLs
11. THE Laravel_Backend SHALL validate that duration is null or a positive integer
12. THE Laravel_Backend SHALL validate that playCount is a non-negative integer

### Requirement 11: External Service Integration

**User Story:** As a content manager, I want YouTube and SoundCloud URL validation, so that I can verify content before saving.

#### Acceptance Criteria

1. WHEN validating a YouTube URL, THE Laravel_Backend SHALL extract the video ID from various YouTube URL formats
2. WHEN validating a YouTube URL, THE Laravel_Backend SHALL return isValid: true for valid URLs with extracted metadata
3. WHEN validating a YouTube URL, THE Laravel_Backend SHALL return isValid: false with an error message for invalid URLs
4. WHEN validating a SoundCloud URL, THE Laravel_Backend SHALL extract the track ID from SoundCloud URLs
5. WHEN validating a SoundCloud URL, THE Laravel_Backend SHALL return isValid: true for valid URLs with extracted metadata
6. WHEN validating a SoundCloud URL, THE Laravel_Backend SHALL return isValid: false with an error message for invalid URLs
7. THE Laravel_Backend SHALL support YouTube URL formats: https://www.youtube.com/watch?v=ID, https://youtu.be/ID, https://www.youtube.com/embed/ID
8. THE Laravel_Backend SHALL support SoundCloud URL format: https://soundcloud.com/artist/track
9. IF a URL parameter is missing from validation endpoints, THEN THE Laravel_Backend SHALL return isValid: false with error "URL parameter is required"
10. THE Laravel_Backend SHALL not make external API calls during URL validation (pattern matching only)

### Requirement 12: Markdown Migration System

**User Story:** As a content manager, I want to migrate markdown files to blog posts, so that I can import existing content.

#### Acceptance Criteria

1. WHEN an authenticated user sends POST /api/blog/migrate, THE Laravel_Backend SHALL process markdown files from a configured directory
2. WHEN processing markdown files, THE Laravel_Backend SHALL parse frontmatter using the gray-matter format
3. WHEN processing markdown files, THE Laravel_Backend SHALL extract title, date, tags, excerpt, and featuredImage from frontmatter
4. WHEN processing markdown files, THE Laravel_Backend SHALL use the markdown content as the blog post content
5. WHEN processing markdown files, THE Laravel_Backend SHALL generate a slug from the filename
6. WHEN a markdown file is successfully migrated, THE Laravel_Backend SHALL create a blog post with status "published"
7. WHEN a markdown file already exists (matching slug), THE Laravel_Backend SHALL skip it and report as "skipped"
8. WHEN markdown file processing fails, THE Laravel_Backend SHALL report the error and continue with remaining files
9. WHEN migration completes, THE Laravel_Backend SHALL return a summary with counts of processed, created, skipped, and failed files
10. WHEN an authenticated user sends GET /api/blog/migration/status, THE Laravel_Backend SHALL return the status of the last migration

### Requirement 13: Error Handling and Logging

**User Story:** As a system administrator, I want comprehensive error handling and logging, so that I can troubleshoot issues.

#### Acceptance Criteria

1. WHEN any exception occurs, THE Laravel_Backend SHALL catch it and return a structured error response
2. WHEN a validation error occurs, THE Laravel_Backend SHALL return 400 Bad Request with field-specific error messages
3. WHEN a resource is not found, THE Laravel_Backend SHALL return 404 Not Found with a descriptive message
4. WHEN authentication fails, THE Laravel_Backend SHALL return 401 Unauthorized with a descriptive message
5. WHEN authorization fails, THE Laravel_Backend SHALL return 403 Forbidden with a descriptive message
6. WHEN a database error occurs, THE Laravel_Backend SHALL return 400 Bad Request with a sanitized error message
7. WHEN an unexpected error occurs, THE Laravel_Backend SHALL return 500 Internal Server Error with a generic message in production
8. WHERE the application runs in development, THE Laravel_Backend SHALL include stack traces in error responses
9. WHERE the application runs in production, THE Laravel_Backend SHALL exclude stack traces and sensitive information from error responses
10. THE Laravel_Backend SHALL log all errors with severity level (error for 5xx, warn for 4xx), timestamp, request path, method, IP address, and user ID
11. THE Laravel_Backend SHALL use daily rotating log files with the same format as NestJS_Backend
12. THE Laravel_Backend SHALL log security events (authentication, authorization failures) to a separate security log

### Requirement 14: Request/Response Serialization

**User Story:** As an API client, I want consistent response formats, so that I can reliably parse responses.

#### Acceptance Criteria

1. THE Laravel_Backend SHALL wrap all successful responses in a consistent structure with data, statusCode, and timestamp fields
2. THE Laravel_Backend SHALL transform entity objects to DTOs before sending responses
3. THE Laravel_Backend SHALL exclude password fields from user objects in all responses
4. THE Laravel_Backend SHALL format dates as ISO 8601 strings in all responses
5. THE Laravel_Backend SHALL convert tags arrays to comma-separated strings in blog post responses
6. THE Laravel_Backend SHALL include pagination metadata (total, page, limit, totalPages) in paginated responses
7. THE Laravel_Backend SHALL use BlogPostSummaryDto for list endpoints (excluding full content)
8. THE Laravel_Backend SHALL use BlogPostResponseDto for single post endpoints (including full content)
9. THE Laravel_Backend SHALL enable implicit type conversion for query parameters (string to number)
10. THE Laravel_Backend SHALL strip unknown properties from request bodies (whitelist validation)

### Requirement 15: Performance Optimization

**User Story:** As a system operator, I want the Laravel backend to perform comparably to NestJS, so that user experience is maintained.

#### Acceptance Criteria

1. THE Laravel_Backend SHALL enable response compression for responses larger than 1KB
2. THE Laravel_Backend SHALL use compression level 6 for balanced performance
3. THE Laravel_Backend SHALL skip compression when X-No-Compression header is present
4. THE Laravel_Backend SHALL use database query optimization with eager loading for relationships
5. THE Laravel_Backend SHALL use database indexes for all frequently queried columns
6. THE Laravel_Backend SHALL cache database query results using Redis when appropriate
7. THE Laravel_Backend SHALL set appropriate Cache-Control headers for static and dynamic content
8. THE Laravel_Backend SHALL use HTTP ETag headers for conditional requests where appropriate
9. THE Laravel_Backend SHALL limit database query result sets with pagination
10. THE Laravel_Backend SHALL use connection pooling for database connections

### Requirement 16: Testing Strategy

**User Story:** As a developer, I want comprehensive tests, so that I can verify the migration is correct.

#### Acceptance Criteria

1. THE Laravel_Backend SHALL include unit tests for all service classes
2. THE Laravel_Backend SHALL include integration tests for all API endpoints
3. THE Laravel_Backend SHALL include property-based tests for authentication logic
4. THE Laravel_Backend SHALL include property-based tests for serialization/deserialization
5. THE Laravel_Backend SHALL include property-based tests for error handling
6. THE Laravel_Backend SHALL include property-based tests for security features
7. THE Laravel_Backend SHALL achieve minimum 80% code coverage
8. THE Laravel_Backend SHALL include tests that verify API compatibility with NestJS_Backend
9. THE Laravel_Backend SHALL include tests for rate limiting behavior
10. THE Laravel_Backend SHALL include tests for cache invalidation logic
11. FOR ALL valid blog post objects, THE Laravel_Backend SHALL satisfy the round-trip property: serialize then deserialize produces an equivalent object
12. FOR ALL authentication attempts, THE Laravel_Backend SHALL satisfy the property: valid credentials always succeed and invalid credentials always fail

### Requirement 17: Configuration Management

**User Story:** As a system administrator, I want environment-based configuration, so that I can deploy to different environments.

#### Acceptance Criteria

1. THE Laravel_Backend SHALL read database configuration from environment variables: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
2. THE Laravel_Backend SHALL read Redis configuration from environment variable: REDIS_URL
3. THE Laravel_Backend SHALL read JWT configuration from environment variables: JWT_SECRET, JWT_EXPIRATION
4. THE Laravel_Backend SHALL read CORS configuration from environment variable: FRONTEND_URL
5. THE Laravel_Backend SHALL read application environment from environment variable: APP_ENV (development, production)
6. THE Laravel_Backend SHALL read cache configuration from environment variables: CACHE_TTL, CACHE_MAX_ITEMS
7. THE Laravel_Backend SHALL read logging configuration from environment variable: LOG_LEVEL
8. THE Laravel_Backend SHALL use default values when environment variables are not set
9. THE Laravel_Backend SHALL validate required environment variables on startup
10. THE Laravel_Backend SHALL support .env files for local development configuration

### Requirement 18: Database Migrations

**User Story:** As a developer, I want Laravel migrations that match the existing schema, so that I can set up new environments.

#### Acceptance Criteria

1. THE Laravel_Backend SHALL include migration files that create the users table with the exact schema
2. THE Laravel_Backend SHALL include migration files that create the blog table with the exact schema
3. THE Laravel_Backend SHALL include migration files that create the music table with the exact schema
4. THE Laravel_Backend SHALL include migration files that create the video table with the exact schema
5. THE Laravel_Backend SHALL include migration files that create the audio table with the exact schema
6. THE Laravel_Backend SHALL include migrations that create all indexes from the NestJS schema
7. THE Laravel_Backend SHALL include migrations that create all CHECK constraints from the NestJS schema
8. THE Laravel_Backend SHALL include migrations that create all unique constraints from the NestJS schema
9. THE Laravel_Backend SHALL support running migrations against an empty database
10. THE Laravel_Backend SHALL support rolling back migrations

### Requirement 19: API Versioning and Middleware

**User Story:** As an API maintainer, I want proper middleware architecture, so that cross-cutting concerns are handled consistently.

#### Acceptance Criteria

1. THE Laravel_Backend SHALL apply authentication middleware to all protected routes
2. THE Laravel_Backend SHALL apply rate limiting middleware to all routes
3. THE Laravel_Backend SHALL apply security headers middleware to all routes
4. THE Laravel_Backend SHALL apply logging middleware to all routes
5. THE Laravel_Backend SHALL apply CORS middleware to all routes
6. THE Laravel_Backend SHALL apply compression middleware to all routes
7. THE Laravel_Backend SHALL apply validation middleware to all routes with request bodies
8. THE Laravel_Backend SHALL apply cache middleware to routes marked as cacheable
9. THE Laravel_Backend SHALL execute middleware in the correct order: security → CORS → rate limiting → authentication → caching → logging
10. THE Laravel_Backend SHALL support adding API version headers for future versioning

### Requirement 20: Deployment and Operations

**User Story:** As a DevOps engineer, I want deployment compatibility, so that I can deploy the Laravel backend alongside or in place of NestJS.

#### Acceptance Criteria

1. THE Laravel_Backend SHALL run on PHP 8.1 or higher
2. THE Laravel_Backend SHALL support deployment via Docker containers
3. THE Laravel_Backend SHALL support deployment to traditional PHP hosting environments
4. THE Laravel_Backend SHALL include a health check endpoint at /api/health
5. THE Laravel_Backend SHALL include a readiness check endpoint at /api/ready
6. THE Laravel_Backend SHALL gracefully handle database connection failures
7. THE Laravel_Backend SHALL gracefully handle Redis connection failures
8. THE Laravel_Backend SHALL log startup configuration and environment
9. THE Laravel_Backend SHALL support running behind a reverse proxy (nginx, Apache)
10. THE Laravel_Backend SHALL preserve the same port configuration as NestJS_Backend (default 3000)
