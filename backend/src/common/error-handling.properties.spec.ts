import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import * as fc from 'fast-check';
import { AppModule } from '../app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ValidationExceptionFilter } from './filters/validation-exception.filter';

describe('Error Handling Properties', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same configuration as main.ts
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    app.useGlobalFilters(
      new AllExceptionsFilter(),
      new ValidationExceptionFilter(),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Property 24: Error handling descriptiveness', () => {
    it('**Feature: coreysmaller-website, Property 24: Error handling descriptiveness** - For any error condition, the system should provide descriptive error messages and appropriate HTTP status codes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various invalid request scenarios
          fc.record({
            endpoint: fc.oneof(
              fc.constant('/api/blog'),
              fc.constant('/api/music'),
              fc.constant('/api/video'),
              fc.constant('/api/audio'),
              fc.constant('/api/auth/login'),
              fc.constant('/api/auth/register'),
            ),
            method: fc.oneof(
              fc.constant('GET'),
              fc.constant('POST'),
              fc.constant('PUT'),
              fc.constant('DELETE'),
            ),
            invalidData: fc.oneof(
              // Invalid JSON structure
              fc.record({
                title: fc.oneof(fc.constant(null), fc.constant(''), fc.integer()),
                content: fc.oneof(fc.constant(null), fc.boolean()),
              }),
              // Missing required fields
              fc.record({}),
              // Invalid field types
              fc.record({
                title: fc.integer(),
                content: fc.boolean(),
                email: fc.constant('invalid-email'),
                password: fc.constant('123'), // Too short
              }),
            ),
          }),
          async ({ endpoint, method, invalidData }) => {
            // Skip GET requests for this test as they don't typically have request bodies
            if (method === 'GET') return;

            let response: request.Response;
            
            try {
              const req = request(app.getHttpServer())[method.toLowerCase()](endpoint);
              
              if (method === 'POST' || method === 'PUT') {
                req.send(invalidData);
              }
              
              response = await req;
            } catch (error) {
              // Network errors should not happen in tests
              throw new Error(`Network error occurred: ${error}`);
            }

            // Property: Error responses should have appropriate HTTP status codes
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.status).toBeLessThan(600);

            // Property: Error responses should have descriptive messages
            expect(response.body).toBeDefined();
            expect(response.body).toHaveProperty('message');
            expect(typeof response.body.message).toBe('string');
            expect(response.body.message.length).toBeGreaterThan(0);

            // Property: Error responses should include timestamp
            expect(response.body).toHaveProperty('timestamp');
            expect(typeof response.body.timestamp).toBe('string');

            // Property: Error responses should include status code
            expect(response.body).toHaveProperty('statusCode');
            expect(response.body.statusCode).toBe(response.status);

            // Property: Error responses should include path
            expect(response.body).toHaveProperty('path');
            expect(response.body.path).toBe(endpoint);

            // Property: Validation errors should include detailed error information
            if (response.status === 400 && response.body.errors) {
              expect(Array.isArray(response.body.errors)).toBe(true);
              response.body.errors.forEach((error: any) => {
                expect(typeof error).toBe('string');
                expect(error.length).toBeGreaterThan(0);
              });
            }

            // Property: Error messages should not expose sensitive information
            const sensitivePatterns = [
              /password/i,
              /secret/i,
              /token/i,
              /key/i,
              /database.*error/i,
              /sql/i,
            ];

            const messageText = JSON.stringify(response.body).toLowerCase();
            sensitivePatterns.forEach(pattern => {
              if (pattern.test(messageText)) {
                // Allow generic mentions but not specific values
                expect(messageText).not.toMatch(/password.*=.*['"]/);
                expect(messageText).not.toMatch(/secret.*=.*['"]/);
                expect(messageText).not.toMatch(/token.*=.*['"]/);
              }
            });
          }
        ),
        { numRuns: 50, timeout: 30000 }
      );
    });

    it('**Feature: coreysmaller-website, Property 24: Error handling descriptiveness** - Authentication errors should provide appropriate status codes and messages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.oneof(
              fc.constant(''), // Empty email
              fc.constant('invalid-email'), // Invalid format
              fc.constant('nonexistent@example.com'), // Valid format but doesn't exist
            ),
            password: fc.oneof(
              fc.constant(''), // Empty password
              fc.constant('123'), // Too short
              fc.constant('wrongpassword'), // Wrong password
            ),
          }),
          async ({ email, password }) => {
            const response = await request(app.getHttpServer())
              .post('/api/auth/login')
              .send({ email, password });

            // Property: Authentication failures should return 401 or 400
            expect([400, 401]).toContain(response.status);

            // Property: Error response should be well-formed
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('statusCode');
            expect(response.body).toHaveProperty('timestamp');

            // Property: Error message should be descriptive but not reveal user existence
            if (response.status === 401) {
              expect(response.body.message).toMatch(/invalid|unauthorized|authentication/i);
              // Should not reveal whether user exists or not
              expect(response.body.message).not.toMatch(/user.*not.*found/i);
              expect(response.body.message).not.toMatch(/email.*not.*exist/i);
            }

            // Property: Validation errors should provide field-specific feedback
            if (response.status === 400 && response.body.errors) {
              expect(Array.isArray(response.body.errors)).toBe(true);
              response.body.errors.forEach((error: string) => {
                expect(error).toMatch(/email|password/i);
              });
            }
          }
        ),
        { numRuns: 30, timeout: 20000 }
      );
    });

    it('**Feature: coreysmaller-website, Property 24: Error handling descriptiveness** - Not found errors should provide clear 404 responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            resourceType: fc.oneof(
              fc.constant('blog'),
              fc.constant('music'),
              fc.constant('video'),
              fc.constant('audio'),
            ),
            invalidId: fc.oneof(
              fc.uuid(), // Valid UUID format but doesn't exist
              fc.constant('invalid-id'), // Invalid format
              fc.constant(''), // Empty ID
            ),
          }),
          async ({ resourceType, invalidId }) => {
            const endpoint = `/api/${resourceType}/${invalidId}`;
            
            const response = await request(app.getHttpServer())
              .get(endpoint);

            // Property: Non-existent resources should return 404
            if (invalidId === '' || invalidId === 'invalid-id') {
              // Invalid format might return 400 instead of 404
              expect([400, 404]).toContain(response.status);
            } else {
              // Valid UUID format but non-existent should return 404
              expect(response.status).toBe(404);
            }

            // Property: 404 responses should be well-formed
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('statusCode');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('path');

            // Property: 404 messages should be descriptive
            if (response.status === 404) {
              expect(response.body.message).toMatch(/not found|does not exist/i);
            }
          }
        ),
        { numRuns: 25, timeout: 15000 }
      );
    });

    it('**Feature: coreysmaller-website, Property 24: Error handling descriptiveness** - Rate limiting should provide appropriate error responses', async () => {
      // This test simulates rate limiting by making many requests quickly
      const endpoint = '/api/health/ping';
      const responses: request.Response[] = [];

      // Make multiple rapid requests to potentially trigger rate limiting
      for (let i = 0; i < 15; i++) {
        try {
          const response = await request(app.getHttpServer()).get(endpoint);
          responses.push(response);
        } catch (error) {
          // Continue even if some requests fail
        }
      }

      // Check if any responses indicate rate limiting
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      if (rateLimitedResponses.length > 0) {
        rateLimitedResponses.forEach(response => {
          // Property: Rate limit responses should be well-formed
          expect(response.body).toHaveProperty('message');
          expect(response.body).toHaveProperty('statusCode');
          expect(response.body.statusCode).toBe(429);

          // Property: Rate limit messages should be descriptive
          expect(response.body.message).toMatch(/too many|rate limit|limit exceeded/i);

          // Property: Rate limit responses should include retry information
          if (response.body.retryAfter) {
            expect(typeof response.body.retryAfter).toBe('number');
            expect(response.body.retryAfter).toBeGreaterThan(0);
          }
        });
      }

      // At least some requests should succeed
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });
  });
});