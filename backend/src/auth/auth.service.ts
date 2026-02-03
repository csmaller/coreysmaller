import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { SessionService } from './services/session.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private sessionService: SessionService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
  
    if (user && await bcrypt.compare(password, user.password)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role = 'admin' } = createUserDto;
    
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      role,
    });

    const savedUser = await this.userRepository.save(user);
    
    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...result } = savedUser;
    return result as User;
  }

  async login(user: any, ipAddress: string, userAgent: string) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    
    // Create session
    const sessionId = this.sessionService.createSession(
      user.id,
      user.email,
      ipAddress,
      userAgent,
    );

    this.logger.log(`User logged in successfully: ${user.email}`, {
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent,
      sessionId,
    });

    return {
      access_token: accessToken,
      session_id: sessionId,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(sessionId: string, userId: string): Promise<void> {
    this.sessionService.destroySession(sessionId);
    
    this.logger.log(`User logged out: ${userId}`, {
      userId,
      sessionId,
    });
  }

  async logoutAllSessions(userId: string): Promise<void> {
    this.sessionService.destroyAllUserSessions(userId);
    
    this.logger.log(`All sessions destroyed for user: ${userId}`, {
      userId,
    });
  }

  async findById(id: string | number): Promise<User> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const user = await this.userRepository.findOne({ where: { id: numericId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token);
      return await this.findById(payload.sub);
    } catch (error) {
      return null;
    }
  }
}