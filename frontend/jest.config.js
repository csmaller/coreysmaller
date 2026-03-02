/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
      isolatedModules: true,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        types: ['jest', '@testing-library/jest-dom'],
      },
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-helmet-async$': '<rootDir>/src/__mocks__/react-helmet-async.tsx',
    '^@/services/api$': '<rootDir>/src/services/__mocks__/api.ts',
    '^../services/api$': '<rootDir>/src/services/__mocks__/api.ts',
    '^../../services/api$': '<rootDir>/src/services/__mocks__/api.ts',
    '^\\.\\./\\.\\./services/api$': '<rootDir>/src/services/__mocks__/api.ts',
    '^\\.\\./services/api$': '<rootDir>/src/services/__mocks__/api.ts',
    '^\\./api$': '<rootDir>/src/services/__mocks__/api.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      isolatedModules: true,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        types: ['jest', '@testing-library/jest-dom'],
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Property-based testing configuration
  testTimeout: 30000, // Increased timeout for property-based tests
};