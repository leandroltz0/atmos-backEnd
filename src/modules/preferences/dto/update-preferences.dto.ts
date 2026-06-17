import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max, MaxLength } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tempUnit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  windUnit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  timeFormat?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440)
  updateInterval?: number;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  autoUpdate?: boolean;

  @IsOptional()
  @IsBoolean()
  offlineMode?: boolean;
}
