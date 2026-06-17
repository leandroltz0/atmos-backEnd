import { IsString, MinLength, MaxLength } from 'class-validator';

export class DeleteUserDto {
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;
}
