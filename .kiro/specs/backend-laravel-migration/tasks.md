# Implementation Plan: Backend Laravel Migration

## Overview

This implementation plan breaks down the migration of the coreysmaller.com backend from NestJS/TypeScript to PHP Laravel into discrete, actionable coding tasks. The implementation follows a layered approach: infrastructure setup, database layer, authentication, core content management features, middleware, external integrations, testing, and deployment configuration.

The Laravel backend will maintain complete API compatibility with the existing NestJS backend, preserve the MySQL database schema, and implement identical security, caching, and rate limiting features.

## Tasks

- [x] 1. Laravel project setup and configuration
  - Create new Laravel 10.x project with PHP 8.1+ requirement
  - Install required packages: tymon/jwt-auth, predis/predis, giorgiosironi/eris (property testing)
  - Configure .env.example with all required environment variables
  - Set up directory structure following design architecture
  - Configure composer.json with all dependencies
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10, 20.1_

- [ ] 2. Database migrations and schema setup
  - [x] 2.1 Create users table migration
    - Define schema with id, email, password, role, createdAt, updatedAt columns
    - Add unique index on email column
    - Add CHECK constraint for email format
    - _Requirements: 3.2, 18.1_
  
  - [x] 2.2 Create blog table migration
    - Define schema with all columns: id, title, content, excerpt, featuredImage, tags, status, slug, publishedAt, createdAt, updatedAt
    - Add composite index on (status, publishedAt)
    - Add unique index on slug
    - Add CHECK constraints for non-empty title and content
    - _Requirements: 3.3, 18.2_
  
  - [x] 2.3 Create music table migration
    - Define schema with all columns: id, title, description, audioUrl, coverArt, genre, duration, playCount, releaseDate, createdAt, updatedAt
    - Add composite index on (genre, releaseDate)
    - Add index on playCount
    - Add CHECK constraints for non-empty title, positive duration, non-negative playCount
    - _Requirements: 3.4, 18.3_
  
  - [x] 2.4 Create video table migration
    - Define schema with UUID primary key and all columns: id, title, description, youtubeUrl, youtubeId, thumbnail, duration, viewCount, createdAt, updatedAt
    - Add unique index on youtubeId
    - Add CHECK constraints for non-empty title, positive duration, non-negative viewCount
    - _Requirements: 3.5, 18.4_
  
  - [x] 2.5 Create audio table migration
    - Define schema with UUID primary key and all columns: id, title, description, soundcloudUrl, soundcloudId, artwork, duration, playCount, createdAt, updatedAt
    - Add unique index on soundcloudId
    - Add CHECK constraints for non-empty title, positive duration, non-negative playCount
    - _Requirements: 3.6, 18.5_

- [ ] 3. Eloquent models for all entities
  - [x] 3.1 Create User model
    - Implement Authenticatable and JWTSubject interfaces
    - Configure table name, primary key, fillable fields, hidden fields (password)
    - Set up timestamp column names (createdAt, updatedAt)
    - Configure password hashing in model events
    - _Requirements: 3.2, 14.3_
  
  - [x] 3.2 Create BlogPost model
    - Configure table name, primary key, fillable fields
    - Set up timestamp column names (createdAt, updatedAt)
    - Add casts for tags (array), publishedAt (datetime)
    - Implement computed attributes: readingTimeMinutes, wordCount, isPublished
    - Add model event to set publishedAt when status changes to published
    - _Requirements: 3.3, 7.11_
  
  - [x] 3.3 Create Music model
    - Configure table name, primary key, fillable fields
    - Set up timestamp column names (createdAt, updatedAt)
    - Add casts for duration (integer), playCount (integer), releaseDate (datetime)
    - _Requirements: 3.4_
  
  - [x] 3.4 Create Video model
    - Configure table name with UUID primary key (non-incrementing)
    - Set up timestamp column names (createdAt, updatedAt)
    - Add casts for duration (integer), viewCount (integer)
    - Implement boot method to auto-generate UUID on creation
    - _Requirements: 3.5, 3.9, 9.1_
  
  - [x] 3.5 Create Audio model
    - Configure table name with UUID primary key (non-incrementing)
    - Set up timestamp column names (createdAt, updatedAt)
    - Add casts for duration (integer), playCount (integer)
    - Implement boot method to auto-generate UUID on creation
    - _Requirements: 3.6, 3.10, 10.1_

- [ ] 4. JWT authentication system
  - [x] 4.1 Configure JWT package
    - Install and configure tymon/jwt-auth package
    - Set up config/jwt.php with secret, TTL, algorithm settings
    - Configure JWT provider in config/auth.php
    - _Requirements: 2.1, 17.3_
  
  - [x] 4.2 Create AuthService
    - Implement login method with credential validation and JWT generation
    - Implement register method with password hashing (bcrypt cost 10)
    - Implement validateToken method for JWT verification
    - Implement logout method for single session invalidation
    - Implement logoutAllSessions method
    - Add security event logging for all authentication operations
    - _Requirements: 2.2, 2.4, 2.5, 2.6, 2.7, 2.8, 2.10_
  
  - [x] 4.3 Create AuthController
    - Implement POST /api/auth/login endpoint
    - Implement POST /api/auth/register endpoint
    - Implement GET /api/auth/profile endpoint (protected)
    - Implement POST /api/auth/logout endpoint (protected)
    - Implement POST /api/auth/logout-all endpoint (protected)
    - Return 401 Unauthorized for authentication failures
    - _Requirements: 1.1, 2.2, 2.5, 2.6, 2.7, 2.8, 2.9_
  
  - [x] 4.4 Create JwtAuthenticateMiddleware
    - Extract JWT from Authorization Bearer header
    - Validate token signature and expiration
    - Load user from database and attach to request
    - Return 401 Unauthorized on validation failure
    - _Requirements: 2.3, 19.1_
  
  - [ ]* 4.5 Write property test for JWT token interoperability
    - **Property 4: JWT Token Interoperability**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - Generate JWT tokens with various payloads, verify both backends validate identically
  
  - [ ]* 4.6 Write property test for password hash compatibility
    - **Property 5: Password Hash Compatibility**
    - **Validates: Requirements 2.4**
    - Hash passwords with bcrypt, verify both backends validate identically
  
  - [ ]* 4.7 Write property test for authentication determinism
    - **Property 26: Authentication Determinism**
    - **Validates: Requirements 16.12**
    - Test that valid credentials always succeed and invalid always fail

- [x] 5. Request validation and API resources
  - [x] 5.1 Create Form Request classes for authentication
    - Create LoginRequest with email and password validation
    - Create RegisterRequest with email, password, and role validation
    - _Requirements: 6.8, 14.10_
  
  - [x] 5.2 Create Form Request classes for blog posts
    - Create CreateBlogPostRequest with validation for title, content, excerpt, featuredImage, tags, status, slug
    - Create UpdateBlogPostRequest with same validation but all fields optional
    - Add validation rules: title max 200 chars, status enum, slug unique
    - _Requirements: 7.8, 7.9, 7.10, 14.10_
  
  - [x] 5.3 Create Form Request classes for music
    - Create CreateMusicRequest with validation for title, description, audioUrl, coverArt, genre, duration, releaseDate
    - Create UpdateMusicRequest with same validation but all fields optional
    - Add validation rules: title max 200 chars, duration positive integer, URLs valid
    - _Requirements: 8.7, 8.8, 8.9, 8.10_
  
  - [x] 5.4 Create Form Request classes for video
    - Create CreateVideoRequest with validation for title, description, youtubeUrl, thumbnail, duration
    - Create UpdateVideoRequest with same validation but all fields optional
    - Add validation rules: youtubeUrl regex pattern, duration positive integer
    - _Requirements: 9.8, 9.9, 9.10, 9.11_
  
  - [x] 5.5 Create Form Request classes for audio
    - Create CreateAudioRequest with validation for title, description, soundcloudUrl, artwork, duration
    - Create UpdateAudioRequest with same validation but all fields optional
    - Add validation rules: soundcloudUrl regex pattern, duration positive integer
    - _Requirements: 10.9, 10.10, 10.11, 10.12_
  
  - [x] 5.6 Create API Resource classes
    - Create BlogPostResource for full blog post responses
    - Create BlogPostSummaryResource for list responses (exclude content)
    - Create MusicResource, VideoResource, AudioResource for respective entities
    - Implement date formatting as ISO 8601 strings
    - Implement tags array to comma-separated string conversion
    - _Requirements: 14.2, 14.4, 14.5, 14.7, 14.8_
  
  - [ ]* 5.7 Write property test for input validation consistency
    - **Property 14: Input Validation Consistency**
    - **Validates: Requirements 6.8, 7.8-7.10, 8.8-8.10, 9.8-9.11, 10.9-10.12**
    - Test that invalid inputs return 400 with field-specific errors matching NestJS format

- [x] 6. Blog management system
  - [x] 6.1 Create BlogService
    - Implement findAll method with pagination support
    - Implement findOne method for single blog post retrieval
    - Implement getRecentPosts method (5 most recent published)
    - Implement getStats method (total, published, draft counts)
    - Implement create method with cache invalidation
    - Implement update method with cache invalidation
    - Implement delete method with cache invalidation
    - Integrate Redis caching with appropriate TTLs and key patterns
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 4.2, 4.3, 4.4, 4.5, 4.7_
  
  - [x] 6.2 Create BlogController
    - Implement GET /api/blog with pagination (default page=1, limit=10)
    - Implement GET /api/blog/recent
    - Implement GET /api/blog/stats
    - Implement GET /api/blog/:id
    - Implement POST /api/blog (protected)
    - Implement PATCH /api/blog/:id (protected)
    - Implement DELETE /api/blog/:id (protected)
    - Use BlogPostResource and BlogPostSummaryResource for responses
    - _Requirements: 1.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.12_
  
  - [ ]* 6.3 Write unit tests for BlogService
    - Test findAll with various pagination parameters
    - Test cache hit and miss scenarios
    - Test cache invalidation on create/update/delete
    - Test error handling for not found cases
  
  - [ ]* 6.4 Write integration tests for blog endpoints
    - Test all blog endpoints with valid and invalid inputs
    - Test authentication requirements for protected endpoints
    - Test response format matches NestJS backend

- [x] 7. Music management system
  - [x] 7.1 Create MusicService
    - Implement findAll method ordered by releaseDate DESC
    - Implement findOne method for single music track retrieval
    - Implement create method
    - Implement update method
    - Implement incrementPlayCount method with atomic increment
    - Implement delete method
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 7.2 Create MusicController
    - Implement GET /api/music
    - Implement GET /api/music/:id
    - Implement PATCH /api/music/:id/play
    - Implement POST /api/music (protected)
    - Implement PATCH /api/music/:id (protected)
    - Implement DELETE /api/music/:id (protected)
    - Use MusicResource for responses
    - _Requirements: 1.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ]* 7.3 Write unit tests for MusicService
    - Test findAll ordering
    - Test incrementPlayCount atomicity
    - Test error handling for not found cases
  
  - [ ]* 7.4 Write integration tests for music endpoints
    - Test all music endpoints with valid and invalid inputs
    - Test authentication requirements for protected endpoints

- [x] 8. Video management system
  - [x] 8.1 Create YouTubeUtils utility class
    - Implement extractVideoId method supporting multiple URL formats
    - Implement isValidUrl method for YouTube URL validation
    - Support formats: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
    - _Requirements: 11.1, 11.2, 11.7_
  
  - [x] 8.2 Create VideoService
    - Implement findAll method ordered by createdAt DESC
    - Implement findOne method for single video retrieval
    - Implement findByYoutubeId method
    - Implement validateYoutubeUrl method using YouTubeUtils
    - Implement create method with UUID generation
    - Implement update method
    - Implement delete method
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.9_
  
  - [x] 8.3 Create VideoController
    - Implement GET /api/video
    - Implement GET /api/video/validate-youtube
    - Implement GET /api/video/by-youtube-id/:youtubeId
    - Implement GET /api/video/:id
    - Implement POST /api/video (protected)
    - Implement PATCH /api/video/:id (protected)
    - Implement DELETE /api/video/:id (protected)
    - Use VideoResource for responses
    - _Requirements: 1.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [ ]* 8.4 Write property test for YouTube URL validation
    - **Property 16: YouTube URL Validation**
    - **Validates: Requirements 11.1, 11.2, 11.3**
    - Test various YouTube URL formats return correct validation results
  
  - [ ]* 8.5 Write unit tests for VideoService
    - Test YouTube URL extraction and validation
    - Test UUID generation on creation
    - Test error handling for not found cases

- [x] 9. Audio management system
  - [x] 9.1 Create SoundCloudUtils utility class
    - Implement extractTrackId method for SoundCloud URLs
    - Implement isValidUrl method for SoundCloud URL validation
    - Support format: soundcloud.com/artist/track
    - _Requirements: 11.4, 11.5, 11.8_
  
  - [x] 9.2 Create AudioService
    - Implement findAll method ordered by createdAt DESC
    - Implement findOne method for single audio retrieval
    - Implement findBySoundcloudId method
    - Implement validateSoundcloudUrl method using SoundCloudUtils
    - Implement incrementPlayCount method with atomic increment
    - Implement create method with UUID generation
    - Implement update method
    - Implement delete method
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.10_
  
  - [x] 9.3 Create AudioController
    - Implement GET /api/audio
    - Implement GET /api/audio/validate-soundcloud
    - Implement GET /api/audio/by-soundcloud-id/:soundcloudId
    - Implement GET /api/audio/:id
    - Implement POST /api/audio/:id/play
    - Implement POST /api/audio (protected)
    - Implement PATCH /api/audio/:id (protected)
    - Implement DELETE /api/audio/:id (protected)
    - Use AudioResource for responses
    - _Requirements: 1.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_
  
  - [ ]* 9.4 Write property test for SoundCloud URL validation
    - **Property 17: SoundCloud URL Validation**
    - **Validates: Requirements 11.4, 11.5, 11.6**
    - Test various SoundCloud URL formats return correct validation results
  
  - [ ]* 9.5 Write unit tests for AudioService
    - Test SoundCloud URL extraction and validation
    - Test UUID generation on creation
    - Test incrementPlayCount atomicity
    - Test error handling for not found cases

- [x] 10. Checkpoint - Ensure core functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Redis caching implementation
  - [ ] 11.1 Configure Redis connection
    - Set up config/cache.php with Redis store configuration
    - Configure Redis connection in config/database.php
    - Set up fallback to array cache when Redis unavailable
    - _Requirements: 4.1, 4.8, 17.2_
  
  - [ ] 11.2 Create CacheService
    - Implement get method for cache retrieval
    - Implement set method with TTL support
    - Implement delete method for cache invalidation
    - Implement invalidatePattern method for pattern-based invalidation
    - Implement remember method (cache or execute callback)
    - Add fallback logic for Redis unavailability
    - _Requirements: 4.8, 4.9_
  
  - [ ] 11.3 Integrate caching in BlogService
    - Add caching to findAll with key pattern "blog:list:page:{page}:limit:{limit}" (TTL: 300s)
    - Add caching to findOne with key pattern "blog:item:{id}" (TTL: 600s)
    - Add caching to getRecentPosts with key pattern "blog:recent:limit:{limit}" (TTL: 180s)
    - Add caching to getStats with key "blog:stats" (TTL: 300s)
    - Invalidate relevant caches on create/update/delete operations
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.7_
  
  - [ ]* 11.4 Write property test for cache key pattern consistency
    - **Property 8: Cache Key Pattern Consistency**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6**
    - Test that cache keys match NestJS patterns with correct TTLs
  
  - [ ]* 11.5 Write property test for cache invalidation
    - **Property 9: Cache Invalidation on Modification**
    - **Validates: Requirements 4.7**
    - Test that POST/PATCH/DELETE operations invalidate relevant caches
  
  - [ ]* 11.6 Write unit tests for CacheService
    - Test Redis connection and operations
    - Test fallback to in-memory cache
    - Test pattern-based invalidation

- [ ] 12. Rate limiting middleware
  - [ ] 12.1 Create RateLimitMiddleware
    - Implement multi-tier rate limiting: 10/second, 100/minute, 1000/15min per IP
    - Implement endpoint-specific limits: 20/min for GET /api/blog, 30/min for GET /api/blog/recent, 1/5min for POST /api/blog/migrate
    - Use Redis for distributed rate limit counters
    - Return 429 Too Many Requests with retryAfter header when exceeded
    - Log rate limit violations with IP, user agent, endpoint
    - Implement cleanup for expired rate limit entries
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9, 5.10_
  
  - [ ] 12.2 Register RateLimitMiddleware in middleware stack
    - Add to api middleware group in app/Http/Kernel.php
    - Ensure correct middleware order
    - _Requirements: 19.2_
  
  - [ ]* 12.3 Write property test for rate limit enforcement
    - **Property 10: Rate Limit Enforcement**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
    - Test that exceeding limits returns 429 with retryAfter header
  
  - [ ]* 12.4 Write property test for rate limit isolation
    - **Property 11: Rate Limit Isolation**
    - **Validates: Requirements 5.8**
    - Test that different IPs have independent rate limit counters
  
  - [ ]* 12.5 Write unit tests for rate limiting
    - Test rate limit counters increment correctly
    - Test rate limit reset after time window
    - Test endpoint-specific limits
    - Test logging of violations

- [ ] 13. Security middleware implementation
  - [ ] 13.1 Create SecurityHeadersMiddleware
    - Set X-Content-Type-Options: nosniff header
    - Set X-Frame-Options: DENY header
    - Set X-XSS-Protection: 1; mode=block header
    - Remove X-Powered-By header
    - Set Content-Security-Policy allowing YouTube and SoundCloud embeds
    - Set Strict-Transport-Security in production (max-age=31536000)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ] 13.2 Create LogSecurityMiddleware
    - Log authentication events (login, logout, failed attempts)
    - Log authorization failures
    - Log admin operations
    - Capture IP address, user agent, user ID, timestamp
    - Write to separate security log file
    - _Requirements: 2.10, 6.10_
  
  - [ ] 13.3 Create CacheControlMiddleware
    - Set appropriate Cache-Control headers based on content type
    - Static content: public, max-age=31536000
    - Dynamic content: no-cache, must-revalidate
    - Private content: private, no-store
    - _Requirements: 15.7_
  
  - [ ] 13.4 Configure CORS middleware
    - Set up config/cors.php with frontend URL from environment
    - Enable credentials support
    - Allow all methods and headers for API routes
    - _Requirements: 6.7, 17.4_
  
  - [ ] 13.5 Register all security middleware in correct order
    - Add SecurityHeadersMiddleware first
    - Add CORS middleware second
    - Add RateLimitMiddleware third
    - Add JwtAuthenticateMiddleware for protected routes
    - Add CacheControlMiddleware
    - Add LogSecurityMiddleware last
    - _Requirements: 19.3, 19.4, 19.5, 19.9_
  
  - [ ]* 13.6 Write property test for security headers presence
    - **Property 13: Security Headers Presence**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    - Test that all responses include required security headers
  
  - [ ]* 13.7 Write property test for security event logging
    - **Property 7: Security Event Logging**
    - **Validates: Requirements 2.10, 6.10**
    - Test that authentication events are logged with required fields

- [x] 14. Error handling and logging
  - [x] 14.1 Customize exception handler
    - Modify app/Exceptions/Handler.php to format errors consistently
    - Map Laravel exceptions to appropriate HTTP status codes
    - Return structured error responses with statusCode, message, errors, timestamp
    - Sanitize error messages in production (exclude stack traces)
    - Include stack traces in development environment
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_
  
  - [x] 14.2 Configure logging channels
    - Set up daily rotating log files in config/logging.php
    - Create separate security log channel
    - Configure log levels based on environment
    - Set up log format matching NestJS backend
    - _Requirements: 13.10, 13.11, 13.12, 17.7_
  
  - [x] 14.3 Implement error logging in services
    - Add error logging to all service methods
    - Log 5xx errors with error level
    - Log 4xx errors with warning level
    - Include request path, method, IP address, user ID in logs
    - _Requirements: 13.10_
  
  - [ ]* 14.4 Write property test for error response structure
    - **Property 18: Error Response Structure**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7**
    - Test that all error conditions return structured responses matching NestJS format
  
  - [ ]* 14.5 Write property test for authentication error handling
    - **Property 6: Authentication Error Handling**
    - **Validates: Requirements 2.9**
    - Test that authentication failures return 401 with correct error structure
  
  - [ ]* 14.6 Write property test for error logging
    - **Property 19: Error Logging**
    - **Validates: Requirements 13.10**
    - Test that errors are logged with correct severity and required fields

- [ ] 15. Response serialization and formatting
  - [ ] 15.1 Create response wrapper middleware
    - Wrap all successful responses in structure with data, statusCode, timestamp
    - Apply to all API routes
    - _Requirements: 14.1_
  
  - [ ] 15.2 Implement pagination metadata in resources
    - Add pagination metadata (total, page, limit, totalPages) to paginated responses
    - Calculate totalPages from total and limit
    - _Requirements: 14.6_
  
  - [ ] 15.3 Configure date formatting
    - Ensure all datetime fields serialize as ISO 8601 strings
    - Configure Carbon date formatting globally
    - _Requirements: 14.4_
  
  - [ ]* 15.4 Write property test for response wrapper structure
    - **Property 20: Response Wrapper Structure**
    - **Validates: Requirements 14.1**
    - Test that all successful responses have data, statusCode, timestamp fields
  
  - [ ]* 15.5 Write property test for password field exclusion
    - **Property 21: Password Field Exclusion**
    - **Validates: Requirements 14.3**
    - Test that user objects never include password field in responses
  
  - [ ]* 15.6 Write property test for ISO 8601 date formatting
    - **Property 22: ISO 8601 Date Formatting**
    - **Validates: Requirements 14.4**
    - Test that all date fields are formatted as ISO 8601 strings
  
  - [ ]* 15.7 Write property test for pagination metadata
    - **Property 23: Pagination Metadata**
    - **Validates: Requirements 14.6**
    - Test that paginated responses include correct metadata fields
  
  - [ ]* 15.8 Write property test for request body whitelist
    - **Property 24: Request Body Whitelist**
    - **Validates: Requirements 14.10**
    - Test that unknown fields in request bodies are ignored
  
  - [ ]* 15.9 Write property test for serialization round-trip
    - **Property 25: Serialization Round-Trip**
    - **Validates: Requirements 16.11**
    - Test that serializing and deserializing blog posts produces equivalent objects

- [ ] 16. Markdown migration system
  - [ ] 16.1 Create MigrationService
    - Implement migrateMarkdownFiles method to process markdown directory
    - Parse frontmatter using gray-matter format (title, date, tags, excerpt, featuredImage)
    - Extract markdown content as blog post content
    - Generate slug from filename
    - Create blog posts with status "published"
    - Skip files with existing slugs
    - Handle errors gracefully and continue processing
    - Return summary with processed, created, skipped, failed counts
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_
  
  - [ ] 16.2 Add migration endpoints to BlogController
    - Implement POST /api/blog/migrate (protected)
    - Implement GET /api/blog/migration/status (protected)
    - Cache migration status with key "blog:migration:status" (TTL: 60s)
    - _Requirements: 12.1, 12.10, 4.6_
  
  - [ ] 16.3 Create MigrateMarkdownCommand
    - Create Artisan command blog:migrate-markdown
    - Accept --path option for markdown directory
    - Display progress and summary
    - _Requirements: 12.1_
  
  - [ ]* 16.4 Write unit tests for MigrationService
    - Test frontmatter parsing
    - Test slug generation
    - Test duplicate handling (skip existing)
    - Test error handling

- [ ] 17. Route definitions and API setup
  - [ ] 17.1 Define all API routes in routes/api.php
    - Define authentication routes (login, register, profile, logout, logout-all)
    - Define blog routes (list, recent, stats, show, create, update, delete, migrate, migration status)
    - Define music routes (list, show, play, create, update, delete)
    - Define video routes (list, validate-youtube, by-youtube-id, show, create, update, delete)
    - Define audio routes (list, validate-soundcloud, by-soundcloud-id, show, play, create, update, delete)
    - Apply auth middleware to protected routes
    - Use /api prefix for all routes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8_
  
  - [ ] 17.2 Create health check endpoints
    - Implement GET /api/health returning status and timestamp
    - Implement GET /api/ready checking database and Redis connectivity
    - Return 503 Service Unavailable if dependencies not ready
    - _Requirements: 20.4, 20.5_
  
  - [ ]* 17.3 Write property test for API endpoint compatibility
    - **Property 1: API Endpoint Compatibility**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
    - Test that Laravel responses match NestJS response structure for all endpoints
  
  - [ ]* 17.4 Write property test for HTTP status code consistency
    - **Property 2: HTTP Status Code Consistency**
    - **Validates: Requirements 1.9**
    - Test that Laravel returns same status codes as NestJS for equivalent operations
  
  - [ ]* 17.5 Write property test for query parameter handling
    - **Property 3: Query Parameter Handling**
    - **Validates: Requirements 1.10**
    - Test that query parameters are parsed and handled identically to NestJS

- [ ] 18. Checkpoint - Ensure all features integrated
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Comprehensive testing suite
  - [ ] 19.1 Set up property-based testing framework
    - Install and configure giorgiosironi/eris package
    - Create test generators for all entity types
    - Configure minimum 100 iterations per property test
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_
  
  - [ ] 19.2 Create property test generators
    - Create blog post generator with valid data ranges
    - Create user generator with valid email and password
    - Create YouTube URL generator with various formats
    - Create SoundCloud URL generator
    - Create music, video, audio generators
  
  - [ ]* 19.3 Write integration tests for NestJS compatibility
    - Test all endpoints return identical responses to NestJS backend
    - Test error responses match NestJS format
    - Test authentication flow compatibility
    - _Requirements: 16.8_
  
  - [ ]* 19.4 Write unit tests for all controllers
    - Test request validation
    - Test authentication/authorization
    - Test response formatting
    - Test HTTP status codes
  
  - [ ]* 19.5 Write unit tests for all services
    - Test business logic with valid inputs
    - Test error conditions
    - Test cache interactions
    - Mock database and Redis dependencies
  
  - [ ]* 19.6 Write unit tests for utility classes
    - Test YouTubeUtils URL parsing
    - Test SoundCloudUtils URL parsing
    - Test helper methods
  
  - [ ]* 19.7 Write property test for published status timestamp
    - **Property 15: Published Status Timestamp**
    - **Validates: Requirements 7.11**
    - Test that publishedAt is set when status changes to published
  
  - [ ]* 19.8 Write property test for rate limit violation logging
    - **Property 12: Rate Limit Violation Logging**
    - **Validates: Requirements 5.9**
    - Test that rate limit violations are logged with required fields
  
  - [ ] 19.9 Run test coverage analysis
    - Generate code coverage report using PHPUnit
    - Verify minimum 80% overall coverage
    - Verify 90%+ coverage for service layer
    - _Requirements: 16.7_

- [ ] 20. Performance optimization
  - [ ] 20.1 Configure response compression
    - Enable gzip compression for responses larger than 1KB
    - Set compression level to 6
    - Skip compression when X-No-Compression header present
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [ ] 20.2 Optimize database queries
    - Add eager loading for relationships where needed
    - Verify all indexes are used in queries
    - Implement query result caching for frequently accessed data
    - Use pagination to limit result sets
    - _Requirements: 15.4, 15.5, 15.6, 15.9_
  
  - [ ] 20.3 Configure database connection pooling
    - Set up connection pooling in config/database.php
    - Configure appropriate pool size
    - _Requirements: 15.10_
  
  - [ ] 20.4 Configure OPcache for production
    - Enable OPcache in PHP configuration
    - Set appropriate cache size and settings
    - Configure preloading if applicable

- [ ] 21. Docker and deployment configuration
  - [ ] 21.1 Create Dockerfile
    - Base image: PHP 8.1+ with required extensions
    - Install Composer dependencies
    - Configure PHP-FPM settings
    - Set appropriate file permissions
    - _Requirements: 20.1, 20.2_
  
  - [ ] 21.2 Create docker-compose.yml
    - Define PHP service with Laravel application
    - Define MySQL service
    - Define Redis service
    - Define nginx service as reverse proxy
    - Configure networking and volumes
    - _Requirements: 20.2_
  
  - [ ] 21.3 Configure nginx
    - Create nginx configuration for Laravel
    - Set up reverse proxy to PHP-FPM
    - Configure SSL/TLS for production
    - Set appropriate headers and timeouts
    - _Requirements: 20.9_
  
  - [ ] 21.4 Create deployment scripts
    - Create script for running migrations
    - Create script for cache clearing
    - Create script for config caching
    - Create script for route caching
  
  - [ ] 21.5 Configure environment-specific settings
    - Create .env.example with all required variables
    - Document environment variable requirements
    - Set up validation for required environment variables on startup
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10, 20.8_
  
  - [ ] 21.6 Implement graceful error handling for dependencies
    - Handle database connection failures gracefully
    - Handle Redis connection failures gracefully
    - Implement retry logic for transient failures
    - _Requirements: 20.6, 20.7_

- [ ] 22. Documentation and final integration
  - [ ] 22.1 Create README.md
    - Document project setup and installation
    - Document environment variable configuration
    - Document running migrations and seeding
    - Document running tests
    - Document deployment process
  
  - [ ] 22.2 Create API documentation
    - Document all API endpoints with request/response examples
    - Document authentication flow
    - Document error responses
    - Document rate limiting behavior
  
  - [ ] 22.3 Create migration guide
    - Document steps for migrating from NestJS to Laravel
    - Document database compatibility
    - Document JWT token compatibility
    - Document testing strategy for verifying migration
  
  - [ ] 22.4 Verify all requirements are met
    - Review all 20 requirement sections
    - Verify all acceptance criteria are implemented
    - Verify all 26 correctness properties are tested
    - Run full test suite and verify all tests pass

- [ ] 23. Final checkpoint - Production readiness
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify NestJS compatibility
- Checkpoints ensure incremental validation at key milestones
- The implementation maintains complete API compatibility with the NestJS backend
- All database schema, JWT tokens, and cache keys are compatible with the existing system
- The Laravel backend can be deployed alongside or in place of the NestJS backend
