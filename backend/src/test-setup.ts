import fc from 'fast-check';

// Configure fast-check for consistent property-based testing
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations per property test as per design document
  verbose: true,
  seed: 42, // Fixed seed for reproducible tests in CI
});

// Test database configuration
export const testDbConfig = {
  type: 'mysql' as const,
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '3306'),
  username: process.env.TEST_DB_USERNAME || 'test',
  password: process.env.TEST_DB_PASSWORD || 'test',
  database: process.env.TEST_DB_NAME || 'coreysmaller_test',
  synchronize: true, // Only for testing
  dropSchema: true, // Clean database for each test run
  logging: false,
};

// Helper function to create test module
export const createTestModule = async (imports: any[] = []) => {
  const { Test } = await import('@nestjs/testing');
  const { TypeOrmModule } = await import('@nestjs/typeorm');
  
  return Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot(testDbConfig),
      ...imports,
    ],
  });
};