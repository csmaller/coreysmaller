import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    createUser: jest.fn(),
  };

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'admin',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginResult = {
        access_token: 'jwt-token',
        user: mockUser,
      };

      const mockRequest = { user: mockUser };
      mockAuthService.login.mockResolvedValue(loginResult);

      const result = await controller.login(mockRequest, loginDto);

      expect(result).toEqual(loginResult);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        role: 'admin',
      };

      const createdUser = {
        id: '456e7890-e89b-12d3-a456-426614174001',
        email: createUserDto.email,
        role: createUserDto.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.createUser.mockResolvedValue(createdUser);

      const result = await controller.register(createUserDto);

      expect(result).toEqual(createdUser);
      expect(authService.createUser).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', () => {
      const mockRequest = { user: mockUser };

      const result = controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
    });
  });
});