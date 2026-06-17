import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, JwtPayload } from '../../common/decorators/user.decorator';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  async getPreferences(@User() user: JwtPayload) {
    const preferences = await this.preferencesService.getPreferences(user.userId);
    return { preferences };
  }

  @Patch()
  async updatePreferences(@User() user: JwtPayload, @Body() dto: UpdatePreferencesDto) {
    const preferences = await this.preferencesService.updatePreferences(user.userId, {
      tempUnit: dto.tempUnit,
      windUnit: dto.windUnit,
      language: dto.language,
      timeFormat: dto.timeFormat,
      updateInterval: dto.updateInterval,
      pushNotifications: dto.pushNotifications,
      autoUpdate: dto.autoUpdate,
      offlineMode: dto.offlineMode,
    });
    return { preferences };
  }
}
