# Project Structure

## Repository Layout

```
├── frontend/              # React frontend application
├── backend-laravel/       # Laravel backend API
├── content/               # Legacy markdown content files
├── static/                # Static assets
└── .kiro/                 # Kiro configuration
    ├── specs/             # Feature specifications
    ├── steering/          # Steering documents
    └── hooks/             # Agent hooks
```

## Backend Architecture (Laravel)

### Directory Organization
```
backend-laravel/
├── app/
│   ├── Http/
│   │   ├── Controllers/   # API controllers
│   │   ├── Middleware/    # Custom middleware
│   │   └── Requests/      # Form request validation
│   ├── Models/            # Eloquent models
│   ├── Services/          # Business logic services
│   ├── Traits/            # Reusable traits
│   └── Exceptions/        # Custom exceptions
├── config/                # Configuration files
├── database/
│   ├── migrations/        # Database migrations
│   ├── seeders/           # Database seeders
│   └── factories/         # Model factories
├── routes/
│   ├── api.php            # API routes
│   └── web.php            # Web routes
├── tests/
│   ├── Feature/           # Feature tests
│   └── Unit/              # Unit tests
└── public/                # Public assets
```

### Laravel Conventions
- All API routes prefixed with `/api`
- Controllers use Service classes for business logic
- Form Requests handle validation
- Eloquent models for database interaction
- Traits for shared functionality (e.g., LogsErrors)
- Middleware for authentication and rate limiting
- Resource classes for API responses

## Frontend Architecture (React)

### Component Organization
```
frontend/src/
├── components/            # Reusable components
│   ├── admin/             # Admin-specific components
│   ├── blog/              # Blog components (editor, list, post)
│   ├── music/             # Music components (player, editor, list)
│   ├── video/             # Video components (player, editor, list)
│   ├── audio/             # Audio components (player, editor, list)
│   └── __tests__/         # Component tests
├── pages/                 # Route-level page components
├── services/              # API client services
├── contexts/              # React contexts (Auth)
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── assets/                # Static assets
```

### Key Conventions
- Pages map to routes (one page per route)
- Services handle all API communication
- Components are organized by feature domain
- Tests co-located with components using `__tests__` folders
- Tailwind CSS for all styling (no CSS modules)
- Error boundaries for graceful error handling
- Protected routes use `ProtectedRoute` component

## Testing Strategy

### Backend
- Feature tests: `tests/Feature/*Test.php` for API endpoint testing
- Unit tests: `tests/Unit/*Test.php` for isolated logic testing
- Run with: `php artisan test`
- Database factories for test data generation

### Frontend
- Component tests: `__tests__/*.test.tsx` in component folders
- Integration tests: `src/__tests__/integration.test.tsx`
- Property-based tests: Using fast-check with Jest
- Test utilities in `src/utils/test-utils.tsx`

## Database

- Laravel migrations in `backend-laravel/database/migrations/`
- Migration naming: `YYYY_MM_DD_HHMMSS_description.php`
- Eloquent models define relationships and business logic
- Auto-increment IDs for all tables
- Indexes on frequently queried fields

## Configuration Files

- `package.json` - Root workspace configuration
- `composer.json` - PHP dependencies (backend)
- `tsconfig.json` - TypeScript configuration (frontend)
- `.eslintrc.js` - ESLint rules (frontend)
- `.prettierrc` - Prettier formatting
- `vite.config.ts` - Vite build configuration (frontend)
- `tailwind.config.js` - Tailwind CSS configuration (frontend)
- `.env` - Environment configuration (backend)
