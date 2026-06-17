import { Controller, Get, Patch, Delete, Body, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { UsersService, UserWithoutPassword } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, JwtPayload } from '../../common/decorators/user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

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

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@User() user: JwtPayload) {
    const userData = await this.usersService.getCurrentUserProfile(user.userId);
    return { user: toPublicUser(userData) };
  }

  @Patch('me')
  async updateMe(@User() user: JwtPayload, @Body() dto: UpdateUserDto) {
    const name = dto.displayName ?? dto.name;
    if (!name) {
      throw new BadRequestException('name or displayName is required');
    }
    const userData = await this.usersService.updateCurrentUserProfile(user.userId, name);
    return { user: toPublicUser(userData) };
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  async updatePassword(@User() user: JwtPayload, @Body() dto: UpdatePasswordDto) {
    await this.usersService.updateCurrentUserPassword(user.userId, dto.currentPassword, dto.newPassword);
    return { message: 'Password updated successfully' };
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@User() user: JwtPayload, @Body() dto: DeleteUserDto) {
    await this.usersService.deleteCurrentUser(user.userId, dto.password);
  }
}
