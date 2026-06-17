import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService, UserWithoutPassword } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, JwtPayload } from '../../common/decorators/user.decorator';

interface PublicUser {
  id: number;
  email: string;
  name: string | null;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const toPublicUser = (user: UserWithoutPassword): PublicUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  displayName: user.name,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto.name, dto.email, dto.password);
    const token = this.authService.generateToken(user);
    return { token, user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@User() user: JwtPayload) {
    const userData = await this.authService.getCurrentUser(user.userId);
    return { user: toPublicUser(userData) };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout() {
    return { message: 'Logout handled client-side by removing the bearer token' };
  }
}
