import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import fc from 'fast-check';

// Custom render function for components with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Property-based testing generators for domain objects
export const generators = {
  // Blog post generators
  blogTitle: () => fc.string({ minLength: 1, maxLength: 200 }),
  blogContent: () => fc.string({ minLength: 10, maxLength: 10000 }),
  blogTags: () => fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
  
  // Music track generators
  musicTitle: () => fc.string({ minLength: 1, maxLength: 100 }),
  musicGenre: () => fc.constantFrom('rock', 'pop', 'jazz', 'classical', 'electronic', 'folk'),
  audioDuration: () => fc.integer({ min: 1, max: 3600 }), // 1 second to 1 hour
  
  // URL generators
  youtubeUrl: () => fc.string().map(id => `https://www.youtube.com/watch?v=${id}`),
  soundcloudUrl: () => fc.string().map(id => `https://soundcloud.com/user/${id}`),
  
  // Common generators
  email: () => fc.emailAddress(),
  password: () => fc.string({ minLength: 6, maxLength: 50 }),
  uuid: () => fc.uuid(),
  timestamp: () => fc.date(),
};

// Test data factories
export const factories = {
  createBlogPost: (overrides: Partial<any> = {}) => ({
    id: fc.sample(generators.uuid(), 1)[0],
    title: fc.sample(generators.blogTitle(), 1)[0],
    content: fc.sample(generators.blogContent(), 1)[0],
    tags: fc.sample(generators.blogTags(), 1)[0],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  createMusicTrack: (overrides: Partial<any> = {}) => ({
    id: fc.sample(generators.uuid(), 1)[0],
    title: fc.sample(generators.musicTitle(), 1)[0],
    genre: fc.sample(generators.musicGenre(), 1)[0],
    duration: fc.sample(generators.audioDuration(), 1)[0],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
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

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };