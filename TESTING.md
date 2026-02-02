# Testing Framework Configuration

This document describes the testing setup for the Coreysmaller.com personal website project.

## Overview

The project uses a dual testing approach combining unit testing and property-based testing:

- **Unit Testing**: Specific examples and edge cases for individual components
- **Property-Based Testing**: Universal properties that hold across all valid inputs using fast-check

## Frontend Testing Setup

### Technologies
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **fast-check**: Property-based testing library
- **@testing-library/jest-dom**: Additional Jest matchers for DOM testing

### Configuration Files
- `frontend/jest.config.js`: Main Jest configuration
- `frontend/src/setupTests.ts`: Global test setup and fast-check configuration
- `frontend/src/utils/test-utils.tsx`: Custom testing utilities and generators

### Running Tests
```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only property-based tests
npm run test:pbt
```

### Test File Patterns
- Unit tests: `*.test.ts`, `*.test.tsx`
- Component tests: `*.test.tsx`
- Property tests: Tests with "Property:" in the name

## Backend Testing Setup

### Technologies
- **Jest**: Test runner and assertion library
- **Supertest**: HTTP assertion library for API testing
- **fast-check**: Property-based testing library
- **@nestjs/testing**: NestJS testing utilities

### Configuration Files
- `backend/package.json`: Jest configuration in package.json
- `backend/src/test-setup.ts`: Global test setup and fast-check configuration
- `backend/src/utils/test-utils.ts`: Custom testing utilities and generators
- `backend/test/jest-e2e.json`: End-to-end test configuration

### Running Tests
```bash
cd backend

# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e

# Run only property-based tests
npm run test:pbt
```

### Test File Patterns
- Unit tests: `*.spec.ts`
- End-to-end tests: `*.e2e-spec.ts`
- Property tests: Tests with "Property:" in the name

## Property-Based Testing Configuration

### fast-check Configuration
Both frontend and backend are configured with:
- **100 iterations minimum** per property test (as per design document)
- **Fixed seed (42)** for reproducible tests in CI
- **Verbose output** for detailed test information

### Property Test Naming Convention
Property tests must follow this format:
```typescript
it('Property {number}: {description}', () => {
  // Property test implementation
});
```

Example:
```typescript
it('Property 1: Content persistence round-trip', () => {
  fc.assert(
    fc.property(generators.blogPost(), (post) => {
      // Test implementation
    })
  );
});
```

### Property Test Documentation
Each property test should include a comment referencing the design document:
```typescript
// **Validates: Requirements 1.1, 2.3**
it('Property 1: Content persistence round-trip', () => {
  // Test implementation
});
```

## Test Utilities and Generators

### Frontend Generators
Located in `frontend/src/utils/test-utils.tsx`:
- `generators.blogTitle()`: Blog post titles
- `generators.blogContent()`: Blog post content
- `generators.musicTitle()`: Music track titles
- `generators.youtubeUrl()`: YouTube URLs
- `generators.soundcloudUrl()`: SoundCloud URLs

### Backend Generators
Located in `backend/src/utils/test-utils.ts`:
- `generators.email()`: Valid email addresses
- `generators.password()`: Secure passwords
- `generators.blogPost()`: Complete blog post objects
- `generators.musicTrack()`: Complete music track objects
- `generators.videoContent()`: Complete video content objects

### Test Factories
Both frontend and backend include factory functions for creating test data:
- `factories.createBlogPost(overrides)`
- `factories.createMusicTrack(overrides)`
- `factories.createUser(overrides)` (backend only)

## Database Testing (Backend)

### Test Database Configuration
- Uses separate test database: `coreysmaller_test`
- Automatically drops and recreates schema for each test run
- Configured in `backend/src/test-setup.ts`

### Database Test Helpers
- `dbTestHelpers.createTestModule()`: Creates NestJS test module with database
- `dbTestHelpers.cleanupDatabase()`: Cleans up test database after tests

## Coverage Requirements

### Coverage Targets
- **Unit Test Coverage**: Minimum 80% line coverage
- **Property Test Coverage**: All correctness properties from design document
- **Integration Coverage**: All API endpoints and major user workflows

### Coverage Reports
- Frontend: `frontend/coverage/`
- Backend: `backend/coverage/`
- E2E: `backend/coverage-e2e/`

## CI/CD Integration

### Test Execution in CI
1. Install dependencies
2. Run unit tests with coverage
3. Run property-based tests
4. Run end-to-end tests
5. Generate and upload coverage reports

### Test Performance
- Property tests timeout: 30 seconds
- Regular tests timeout: 5 seconds
- Total test suite should complete within 5 minutes

## Best Practices

### Unit Testing
1. Test specific examples and edge cases
2. Mock external dependencies appropriately
3. Use descriptive test names
4. Group related tests in describe blocks
5. Keep tests focused and independent

### Property-Based Testing
1. Write smart generators that constrain input space intelligently
2. Test universal properties that should always hold
3. Use shrinking to find minimal failing examples
4. Reference design document properties in test names
5. Validate requirements in test comments

### Integration Testing
1. Test complete user workflows
2. Use real database connections (with test database)
3. Test API endpoints with Supertest
4. Verify error handling and edge cases
5. Test authentication and authorization flows

## Troubleshooting

### Common Issues
1. **Import errors**: Ensure proper TypeScript configuration
2. **Database connection**: Check test database configuration
3. **Timeout errors**: Increase timeout for property-based tests
4. **Memory issues**: Use `--maxWorkers=1` for Jest in CI

### Debug Commands
```bash
# Debug specific test
npm run test:debug -- --testNamePattern="specific test name"

# Run tests with verbose output
npm test -- --verbose

# Run tests without cache
npm test -- --no-cache
```

## Example Test Files

### Unit Test Example
```typescript
import { render, screen } from '@testing-library/react';
import { BlogPost } from './BlogPost';

describe('BlogPost Component', () => {
  it('should render blog post title', () => {
    const post = { title: 'Test Post', content: 'Test content' };
    render(<BlogPost post={post} />);
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });
});
```

### Property Test Example
```typescript
import fc from 'fast-check';
import { generators } from '../utils/test-utils';

describe('Blog Service', () => {
  // **Validates: Requirements 1.1, 1.2**
  it('Property 1: Content persistence round-trip', () => {
    fc.assert(
      fc.property(generators.blogPost(), async (post) => {
        const saved = await blogService.create(post);
        const retrieved = await blogService.findById(saved.id);
        return retrieved.title === post.title && 
               retrieved.content === post.content;
      })
    );
  });
});
```

This testing framework provides comprehensive coverage for both specific examples and universal properties, ensuring the reliability and correctness of the Coreysmaller.com website.