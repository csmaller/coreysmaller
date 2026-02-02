# Database Setup Guide

This guide explains how to set up the MySQL database for the Coreysmaller.com backend.

## Prerequisites

- MySQL 8.0 or higher
- Node.js and npm
- Docker (optional, for containerized setup)

## Setup Options

### Option 1: Docker Setup (Recommended)

1. **Start the MySQL container:**
   ```bash
   docker-compose up -d mysql
   ```

2. **Wait for the database to be ready (about 30 seconds), then run setup:**
   ```bash
   npm run db:setup
   ```

### Option 2: Local MySQL Installation

1. **Install MySQL locally** and create the database:
   ```sql
   CREATE DATABASE coreysmaller_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Update environment variables** in `.env.development`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_DATABASE=coreysmaller_db
   ```

3. **Run the database setup:**
   ```bash
   npm run db:setup
   ```

## Database Schema

The database includes the following tables:

### Users Table
- `id` (UUID, Primary Key)
- `email` (Unique)
- `password` (Hashed)
- `role` (Default: 'admin')
- `createdAt`, `updatedAt` (Timestamps)

### Blog Table
- `id` (UUID, Primary Key)
- `title`, `content` (Required)
- `excerpt`, `featuredImage`, `slug` (Optional)
- `tags` (Array of strings)
- `status` (draft/published/archived)
- `publishedAt` (Optional)
- `createdAt`, `updatedAt` (Timestamps)

### Music Table
- `id` (UUID, Primary Key)
- `title` (Required)
- `description`, `audioUrl`, `coverArt`, `genre` (Optional)
- `duration`, `playCount` (Numbers)
- `releaseDate` (Optional)
- `createdAt`, `updatedAt` (Timestamps)

### Video Table
- `id` (UUID, Primary Key)
- `title`, `youtubeUrl` (Required)
- `description`, `youtubeId`, `thumbnail` (Optional)
- `duration`, `viewCount` (Numbers)
- `createdAt`, `updatedAt` (Timestamps)

### Audio Table
- `id` (UUID, Primary Key)
- `title`, `soundcloudUrl` (Required)
- `description`, `soundcloudId`, `artwork` (Optional)
- `duration`, `playCount` (Numbers)
- `createdAt`, `updatedAt` (Timestamps)

## Default Admin User

The setup script creates a default admin user:
- **Email:** admin@coreysmaller.com
- **Password:** admin123

⚠️ **Important:** Change this password in production!

## Available Scripts

- `npm run db:check` - Test database connection
- `npm run db:setup` - Run migrations and create admin user
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration
- `npm run migration:generate -- MigrationName` - Generate new migration

## Troubleshooting

### Connection Issues
1. Ensure MySQL is running
2. Check environment variables in `.env.development`
3. Verify database exists and user has proper permissions

### Docker Issues
1. Ensure Docker is running
2. Check if port 3306 is available
3. Try `docker-compose down` and `docker-compose up -d mysql`

### Migration Issues
1. Check if migrations table exists
2. Verify entity files are properly imported
3. Ensure database schema matches entity definitions

## Environment Variables

Required environment variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=coreysmaller_db
DB_SYNCHRONIZE=false  # Set to true only in development
DB_LOGGING=false      # Set to true for SQL query logging
DB_SSL=false          # Set to true for production

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Application Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```