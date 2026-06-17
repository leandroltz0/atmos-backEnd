import { IsArray, IsString } from 'class-validator';

export class ReorderFavoritesDto {
  @IsArray()
  @IsString({ each: true })
  favoriteIds: string[];
}
