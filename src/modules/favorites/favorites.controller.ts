import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, JwtPayload } from '../../common/decorators/user.decorator';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { ReorderFavoritesDto } from './dto/reorder-favorites.dto';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async getFavorites(@User() user: JwtPayload) {
    const favorites = await this.favoritesService.listFavorites(user.userId);
    return { favorites };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFavorite(@User() user: JwtPayload, @Body() dto: CreateFavoriteDto) {
    const favorite = await this.favoritesService.addFavorite(user.userId, {
      name: dto.name,
      country: dto.country,
      lat: dto.lat,
      lon: dto.lon,
    });
    return { favorite };
  }

  @Delete(':cityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFavorite(@User() user: JwtPayload, @Param('cityId') cityId: string) {
    await this.favoritesService.removeFavorite(user.userId, cityId);
  }

  @Patch('reorder')
  async reorderFavorites(@User() user: JwtPayload, @Body() dto: ReorderFavoritesDto) {
    const favorites = await this.favoritesService.reorderFavorites(user.userId, dto.favoriteIds);
    return { favorites };
  }
}
