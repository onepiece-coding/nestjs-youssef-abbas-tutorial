import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  // MinLength,
  // MaxLength,
  Max,
  Length,
  MinLength,
} from 'class-validator';

// DTO (Data Transfer Object) is a type that needs methods (validations, ...)
export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: "Title can't be empty!" })
  // @MinLength(3, { message: 'Title must be at least 3 characters!' })
  // @MaxLength(100, { message: 'Title must be less than 100 characters!' })
  @Length(3, 100)
  @ApiProperty({ description: 'The product title', example: 'Product Title' })
  title: string;

  @IsString()
  @MinLength(5)
  @ApiProperty({
    description: 'The product description',
    example: 'Product Description',
  })
  description: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: "Price can't be a negative number" })
  @Max(1000)
  @ApiProperty({
    description: 'The product Price',
    example: 150,
  })
  price: number;

  // Validations & More...
}
