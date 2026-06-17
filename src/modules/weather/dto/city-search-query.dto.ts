import { IsString, MinLength } from 'class-validator';

export class CitySearchQueryDto {
  @IsString()
  @MinLength(2)
  q: string;
}
