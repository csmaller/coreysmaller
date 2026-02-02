import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import fc from 'fast-check';
import { testDbConfig } from '../test-setup';

// Property-based testing generators for domain objects
export const generators = {
  // User generators
  email: () => fc.emailAddress(),
  password: () => fc.string({ minLength: 6, maxLength: 50 }),
  
  // Blog post generators
  blogTitle: () => fc.string({ minLength: 1, maxLength: 200 }),
  blogContent: () => fc.string({ minLength: 10, maxLength: 10000 }),
  blogTags: () => fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
  blogStatus: () => fc.constantFrom('draft', 'published', 'archived'),
  
  // Music track generators
  musicTitle: () => fc.string({ minLength: 1, maxLength: 100 }),
  musicGenre: () => fc.constantFrom('rock', 'pop', 'jazz', 'classical', 'electronic', 'folk'),
  audioDuration: () => fc.integer({ min: 1, max: 3600 }), // 1 second to 1 hour
  audioUrl: () => fc.webUrl(),
  
  // Video generators
  youtubeUrl: () => fc.string().map(id => `https://www.youtube.com/watch?v=${id}`),
  youtubeId: () => fc.string({ minLength: 11, maxLength: 11 }),
  
  // Audio generators
  soundcloudUrl: () => fc.string().map(id => `https://soundcloud.com/user/${id}`),
  soundcloudId: () => fc.string({ minLength: 1, maxLength: 50 }),
  
  // Common generators
  uuid: () => fc.uuid(),
  timestamp: () => fc.date(),
  positiveInteger: () => fc.integer({ min: 1 }),
  nonEmptyString: () => fc.string({ minLength: 1 }),
};

// Test data factories
export const factories = {
  createUser: (overrides: Partial<any> = {}) => ({
    id: fc.sample(generators.uuid(), 1)[0],
    email: fc.sample(generators.email(), 1)[0],
    password: fc.sample(generators.password(), 1)[0],
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  createBlogPost: (overrides: Partial<any> = {}) => ({
    id: fc.sample(generators.uuid(), 1)[0],
    title: fc.sample(generators.blogTitle(), 1)[0],
    content: fc.sample(generators.blogContent(), 1)[0],
    tags: fc.sample(generators.blogTags(), 1)[0],
    status: fc.sample(generators.blogStatus(), 1)[0],
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    ...overrides,
  }),
  
  createMusicTrack: (overrides: Partial<any> = {}) => ({
    id: fc.sample(generators.uuid(), 1)[0],
    title: fc.sample(generators.musicTitle(), 1)[0],
    genre: fc.sample(generators.musicGenre(), 1)[0],
    duration: fc.sample(generators.audioDuration(), 1)[0],
    audioUrl: fc.sample(generators.audioUrl(), 1)[0],
    createdAt: new Date(),
    updatedAt: new Date(),
    releaseDate: new Date(),
    ...overrides,
  }),
  
  createVideoContent: (overrides: Partial<any> = {}) => ({
    id: fc.sample(generators.uuid(), 1)[0],
    title: fc.sample(generators.musicTitle(), 1)[0],
    youtubeUrl: fc.sample(generators.youtubeUrl(), 1)[0],
    youtubeId: fc.sample(generators.youtubeId(), 1)[0],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  createAudioContent: (overrides: Partial<any> = {}) => ({
    id: fc.sample(generators.uuid(), 1)[0],
    title: fc.sample(generators.musicTitle(), 1)[0],
    soundcloudUrl: fc.sample(generators.soundcloudUrl(), 1)[0],
    soundcloudId: fc.sample(generators.soundcloudId(), 1)[0],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

// Database test helpers
export const dbTestHelpers = {
  /**
   * Creates a test module with database connection
   */
  createTestModule: async (entities: any[] = [], providers: any[] = []) => {
    const moduleBuilder = Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          ...testDbConfig,
          entities,
        }),
        ...(entities.length > 0 ? [TypeOrmModule.forFeature(entities)] : []),
      ],
      providers,
    });
    
    return moduleBuilder.compile();
  },
  
  /**
   * Cleans up test database
   */
  cleanupDatabase: async (module: TestingModule) => {
    const connection = module.get('Connection');
    if (connection) {
      await connection.dropDatabase();
      await connection.close();
    }
  },
};

// Property test helpers
export const propertyTestHelpers = {
  /**
   * Creates a property test with proper tagging for design document traceability
   * @param propertyNumber - The property number from the design document
   * @param propertyDescription - Brief description of the property
   * @param testFn - The property test function
   */
  createPropertyTest: (
    propertyNumber: number,
    propertyDescription: string,
    testFn: () => void
  ) => {
    it(`Property ${propertyNumber}: ${propertyDescription}`, testFn);
  },
  
  /**
   * Validates that a property test references the correct requirements
   * @param requirements - Array of requirement numbers (e.g., ['1.1', '2.3'])
   */
  validateRequirements: (requirements: string[]) => {
    // This is a marker for test documentation - actual validation would be in CI
    return `**Validates: Requirements ${requirements.join(', ')}**`;
  },
};

// HTTP test helpers for Supertest
export const httpTestHelpers = {
  /**
   * Creates authentication headers for testing protected endpoints
   */
  createAuthHeaders: (token: string) => ({
    Authorization: `Bearer ${token}`,
  }),
  
  /**
   * Validates API response structure
   */
  validateApiResponse: (response: any, expectedFields: string[]) => {
    expectedFields.forEach(field => {
      expect(response.body).toHaveProperty(field);
    });
  },
};