// DTO (Data Transfer Object) is a type that needs methods (validations, ...)
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  // MinLength,
  // MaxLength,
  Max,
  Length,
  IsOptional,
  MinLength,
} from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsNotEmpty({ message: "Title can't be empty!" })
  // @MinLength(3, { message: 'Title must be at least 3 characters!' })
  // @MaxLength(100, { message: 'Title must be less than 100 characters!' })
  @Length(3, 100)
  @IsOptional()
  @ApiPropertyOptional()
  title?: string;

  @IsString()
  @MinLength(5)
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: "Price can't be a negative number" })
  @Max(1000)
  @IsOptional()
  @ApiPropertyOptional()
  price?: number;

  // without decorators === striped
  // rating?: number;

  // Validations & More...
}
