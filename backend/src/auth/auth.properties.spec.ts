import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

describe('AuthService Property Tests', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Generators for test data
  const emailArbitrary = fc.emailAddress();
  const passwordArbitrary = fc.string({ minLength: 6, maxLength: 50 });
  const roleArbitrary = fc.oneof(fc.constant('admin'), fc.constant('user'), fc.constant('moderator'));
  const uuidArbitrary = fc.uuid();

  const userArbitrary = fc.record({
    id: uuidArbitrary,
    email: emailArbitrary,
    password: fc.string({ minLength: 10, maxLength: 100 }), // Hashed password
    role: roleArbitrary,
    createdAt: fc.date(),
    updatedAt: fc.date(),
  });

  const createUserDtoArbitrary = fc.record({
    email: emailArbitrary,
    password: passwordArbitrary,
    role: fc.option(roleArbitrary, { nil: undefined }),
  });

  describe('Property 12: Authentication credential validation', () => {
    it('**Validates: Requirements 6.1, 6.2** - Property: For any valid email and password combination, validateUser should return user data when credentials match', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArbitrary,
          passwordArbitrary,
          userArbitrary,
          async (email, password, user) => {
            // Setup: User exists with matching email
            const userWithEmail = { ...user, email };
            mockUserRepository.findOne.mockResolvedValue(userWithEmail);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

            const result = await service.validateUser(email, password);

            // Should return user data without password
            expect(result).toBeDefined();
            expect(result.email).toBe(email);
            expect(result.password).toBeUndefined();
            expect(result.id).toBe(user.id);
            expect(result.role).toBe(user.role);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 6.1, 6.2** - Property: For any email and password combination, validateUser should return null when credentials do not match', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArbitrary,
          passwordArbitrary,
          userArbitrary,
          async (email, password, user) => {
            // Setup: User exists but password doesn't match
            const userWithEmail = { ...user, email };
            mockUserRepository.findOne.mockResolvedValue(userWithEmail);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

            const result = await service.validateUser(email, password);

            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: Security behavior for invalid credentials', () => {
    it('**Validates: Requirements 6.3** - Property: For any non-existent email, validateUser should return null without revealing user existence', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArbitrary,
          passwordArbitrary,
          async (email, password) => {
            // Setup: User does not exist
            mockUserRepository.findOne.mockResolvedValue(null);

            const result = await service.validateUser(email, password);

            expect(result).toBeNull();
            // Verify that we don't call bcrypt.compare when user doesn't exist
            expect(bcrypt.compare).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 15: Password security implementation', () => {
    it('**Validates: Requirements 6.6** - Property: For any valid user creation data, passwords should be hashed before storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          createUserDtoArbitrary,
          async (createUserDto) => {
            // Skip if password is too short (would fail validation)
            fc.pre(createUserDto.password.length >= 6);

            // Clear previous mocks
            jest.clearAllMocks();

            const hashedPassword = `bcrypt_hash_${Math.random()}`;
            const savedUser = {
              id: 'test-id',
              email: createUserDto.email,
              password: hashedPassword,
              role: createUserDto.role || 'admin',
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // Setup: User doesn't exist, hash succeeds
            mockUserRepository.findOne.mockResolvedValue(null);
            jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
            mockUserRepository.create.mockReturnValue(savedUser);
            mockUserRepository.save.mockResolvedValue(savedUser);

            const result = await service.createUser(createUserDto);

            // Verify password was hashed
            expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
            
            // Verify password is not returned in result
            expect(result.password).toBeUndefined();
            
            // Verify user was created with hashed password
            expect(mockUserRepository.create).toHaveBeenCalledWith({
              email: createUserDto.email,
              password: hashedPassword,
              role: createUserDto.role || 'admin',
            });
          }
        ),
        { numRuns: 50 } // Reduced runs for faster execution
      );
    });

    it('**Validates: Requirements 6.6** - Property: For any password, the original password should never be stored in plain text', async () => {
      await fc.assert(
        fc.asyncProperty(
          passwordArbitrary,
          emailArbitrary,
          async (password, email) => {
            fc.pre(password.length >= 6);

            const createUserDto: CreateUserDto = { email, password };
            
            // Clear previous mocks
            jest.clearAllMocks();
            
            mockUserRepository.findOne.mockResolvedValue(null);
            
            // Mock bcrypt.hash to return a predictable but different value
            const hashedPassword = `bcrypt_hash_${Math.random()}`;
            jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
            
            const savedUser = {
              id: 'test-id',
              email,
              password: hashedPassword,
              role: 'admin',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            mockUserRepository.create.mockReturnValue(savedUser);
            mockUserRepository.save.mockResolvedValue(savedUser);

            await service.createUser(createUserDto);

            // Verify the original password is never passed to create or save
            const createCall = mockUserRepository.create.mock.calls[0][0];
            expect(createCall.password).not.toBe(password);
            expect(createCall.password).toBe(hashedPassword);
            
            // Verify bcrypt.hash was called with the original password
            expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
          }
        ),
        { numRuns: 50 } // Reduced runs for faster execution
      );
    });
  });

  describe('Property: JWT token generation consistency', () => {
    it('**Validates: Requirements 6.1, 6.2** - Property: For any user data, login should generate consistent token structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary,
          async (user) => {
            const token = 'generated-jwt-token';
            mockJwtService.sign.mockReturnValue(token);

            const result = await service.login(user, '192.168.1.1', 'test-user-agent');

            // Verify token structure
            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('session_id');
            expect(result).toHaveProperty('user');
            expect(result.access_token).toBe(token);
            expect(result.user.id).toBe(user.id);
            expect(result.user.email).toBe(user.email);
            expect(result.user.role).toBe(user.role);
            
            // Verify JWT payload structure
            expect(mockJwtService.sign).toHaveBeenCalledWith({
              email: user.email,
              sub: user.id,
              role: user.role,
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: User creation uniqueness', () => {
    it('**Validates: Requirements 6.1** - Property: For any email that already exists, user creation should fail', async () => {
      await fc.assert(
        fc.asyncProperty(
          createUserDtoArbitrary,
          userArbitrary,
          async (createUserDto, existingUser) => {
            fc.pre(createUserDto.password.length >= 6);

            // Setup: User already exists with same email
            const existingUserWithEmail = { ...existingUser, email: createUserDto.email };
            mockUserRepository.findOne.mockResolvedValue(existingUserWithEmail);

            // Should throw ConflictException
            await expect(service.createUser(createUserDto)).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Token validation security', () => {
    it('**Validates: Requirements 6.4, 6.5** - Property: For any valid token, validateToken should return user data, for invalid tokens should return null', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary,
          fc.string({ minLength: 10, maxLength: 100 }),
          async (user, invalidToken) => {
            // Test valid token
            const validPayload = { email: user.email, sub: user.id, role: user.role };
            mockJwtService.verify.mockReturnValue(validPayload);
            mockUserRepository.findOne.mockResolvedValue(user);

            const validResult = await service.validateToken('valid-token');
            expect(validResult).toBeDefined();
            expect(validResult.id).toBe(user.id);
            expect(validResult.email).toBe(user.email);

            // Test invalid token
            mockJwtService.verify.mockImplementation(() => {
              throw new Error('Invalid token');
            });

            const invalidResult = await service.validateToken(invalidToken);
            expect(invalidResult).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: User lookup by ID', () => {
    it('**Validates: Requirements 6.1** - Property: For any valid user ID, findById should return user data, for invalid IDs should throw error', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary,
          uuidArbitrary,
          async (user, invalidId) => {
            // Test valid ID
            mockUserRepository.findOne.mockResolvedValue(user);
            
            const validResult = await service.findById(user.id);
            expect(validResult).toBeDefined();
            expect(validResult.id).toBe(user.id);
            expect(validResult.email).toBe(user.email);

            // Test invalid ID
            mockUserRepository.findOne.mockResolvedValue(null);
            
            await expect(service.findById(invalidId)).rejects.toThrow('User not found');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});