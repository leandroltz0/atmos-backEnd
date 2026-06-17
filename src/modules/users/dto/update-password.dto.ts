import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  newPassword: string;
}
