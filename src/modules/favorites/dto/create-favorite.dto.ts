import { IsString, IsNumber, MinLength, MaxLength } from 'class-validator';

export class CreateFavoriteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  country: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lon: number;
}
