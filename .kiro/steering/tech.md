# Technology Stack

## Monorepo Structure

Workspace-based monorepo with frontend and backend packages.

## Frontend

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: React Router 7
- **Rich Text**: Lexical editor
- **Testing**: Jest with React Testing Library, fast-check for property-based testing

## Backend

- **Framework**: Laravel 11 with PHP 8.2+
- **Database**: MySQL 8.0+ with Eloquent ORM
- **Authentication**: JWT with tymon/jwt-auth
- **Validation**: Laravel Form Requests
- **Security**: Laravel Sanctum, rate limiting, bcrypt
- **Logging**: Laravel logging with daily rotation
- **Testing**: PHPUnit with Feature and Unit tests

## Common Commands

### Root Level
```bash
npm run dev              # Start both frontend and backend
npm run build            # Build both applications
npm run test             # Run all tests
npm run lint             # Lint all code
npm run format           # Format with Prettier
```

### Frontend (from root or frontend/)
```bash
npm run dev:frontend     # Dev server on http://localhost:5173
npm run build:frontend   # Production build
npm run test:frontend    # Run Jest tests
npm run test:pbt         # Run property-based tests
```

### Backend (from root or backend-laravel/)
```bash
npm run dev:backend      # Dev server on http://localhost:8000
npm run test:backend     # Run PHPUnit tests
php artisan serve        # Start Laravel dev server
php artisan test         # Run all tests
php artisan migrate      # Run database migrations
php artisan db:seed      # Seed database
composer install         # Install PHP dependencies
```

## Environment Configuration

- `.env.development` - Development environment variables
- `.env.production` - Production environment variables
- Backend requires database credentials, JWT secret, frontend URL
- Frontend requires backend API URL

## Code Quality Tools

- **ESLint**: TypeScript linting with recommended rules (frontend)
- **Prettier**: Code formatting (3.x)
- **TypeScript**: Strict mode enabled (5.x) (frontend)
- **PHP CS Fixer**: PHP code style fixer (backend)
- **PHPStan**: Static analysis for PHP (backend)
