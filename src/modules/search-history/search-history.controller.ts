import { Controller, Get, Post, Delete, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SearchHistoryService } from './search-history.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, JwtPayload } from '../../common/decorators/user.decorator';
import { CreateSearchHistoryDto } from './dto/create-search-history.dto';

@Controller('search-history')
@UseGuards(JwtAuthGuard)
export class SearchHistoryController {
  constructor(private readonly searchHistoryService: SearchHistoryService) {}

  @Get()
  async getSearchHistory(@User() user: JwtPayload) {
    const history = await this.searchHistoryService.listSearchHistory(user.userId);
    return { history };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSearchHistory(@User() user: JwtPayload, @Body() dto: CreateSearchHistoryDto) {
    const entry = await this.searchHistoryService.addSearchHistoryEntry(user.userId, {
      name: dto.name,
      country: dto.country,
      lat: dto.lat,
      lon: dto.lon,
    });
    return { entry };
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearSearchHistory(@User() user: JwtPayload) {
    await this.searchHistoryService.clearSearchHistory(user.userId);
  }
}
