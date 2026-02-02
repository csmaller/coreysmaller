# Coreysmaller.com Backend

NestJS backend API for the Coreysmaller.com personal website.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Blog Management**: CRUD operations for blog posts with rich text support
- **Music Portfolio**: Management of music tracks with metadata
- **Video Integration**: YouTube video embedding and management
- **Audio Integration**: SoundCloud audio embedding and management
- **Database**: MySQL with TypeORM for data persistence
- **Validation**: Input validation using class-validator
- **Environment Configuration**: Flexible environment-based configuration

## Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: MySQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator and class-transformer
- **Testing**: Jest
- **Code Quality**: ESLint and Prettier

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MySQL database
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.development
# Edit .env.development with your database credentials
```

3. Set up the database:
```bash
# Option 1: Using Docker (Recommended)
docker-compose up -d mysql
npm run db:setup

# Option 2: Using local MySQL
# Create database manually, then:
npm run db:setup
```

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed database setup instructions.

4. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (authenticated)

### Blog
- `GET /api/blog` - Get all blog posts
- `GET /api/blog/:id` - Get specific blog post
- `POST /api/blog` - Create blog post (authenticated)
- `PATCH /api/blog/:id` - Update blog post (authenticated)
- `DELETE /api/blog/:id` - Delete blog post (authenticated)
- `POST /api/blog/migrate` - Migrate markdown files (authenticated)

### Music
- `GET /api/music` - Get all music tracks
- `GET /api/music/:id` - Get specific music track
- `POST /api/music` - Create music track (authenticated)
- `PATCH /api/music/:id` - Update music track (authenticated)
- `DELETE /api/music/:id` - Delete music track (authenticated)

### Video
- `GET /api/video` - Get all videos
- `GET /api/video/:id` - Get specific video
- `POST /api/video` - Create video entry (authenticated)
- `PATCH /api/video/:id` - Update video entry (authenticated)
- `DELETE /api/video/:id` - Delete video entry (authenticated)

### Audio
- `GET /api/audio` - Get all audio content
- `GET /api/audio/:id` - Get specific audio content
- `POST /api/audio` - Create audio entry (authenticated)
- `PATCH /api/audio/:id` - Update audio entry (authenticated)
- `DELETE /api/audio/:id` - Delete audio entry (authenticated)

## Scripts

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:prod` - Start in production mode
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Database Scripts

- `npm run db:check` - Test database connection
- `npm run db:setup` - Run migrations and create default admin user
- `npm run migration:generate -- MigrationName` - Generate a new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert the last migration

## Environment Variables

See `.env.example` for all available environment variables.

## Project Structure

```
src/
├── auth/           # Authentication module
├── blog/           # Blog management module
├── music/          # Music portfolio module
├── video/          # Video integration module
├── audio/          # Audio integration module
├── config/         # Configuration files
├── app.module.ts   # Main application module
└── main.ts         # Application entry point
```