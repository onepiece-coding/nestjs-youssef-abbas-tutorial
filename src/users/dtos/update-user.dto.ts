import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @Length(2, 150)
  @IsOptional()
  username?: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  @IsOptional()
  password?: string;
}
