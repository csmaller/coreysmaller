import { Controller, Post, UseGuards, Request, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LogSecurity } from '../common/decorators/log-security.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @LogSecurity('USER_LOGIN')
  async login(@Request() req, @Body() loginDto: LoginDto) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    return this.authService.login(req.user, ipAddress, userAgent);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @LogSecurity('USER_REGISTRATION')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @LogSecurity('PROFILE_ACCESS')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @LogSecurity('USER_LOGOUT')
  async logout(@Request() req, @Body() body: { sessionId?: string }) {
    const sessionId = body.sessionId;
    if (sessionId) {
      await this.authService.logout(sessionId, req.user.id);
    }
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @LogSecurity('USER_LOGOUT_ALL')
  async logoutAll(@Request() req) {
    await this.authService.logoutAllSessions(req.user.id);
    return { message: 'All sessions logged out successfully' };
  }
}