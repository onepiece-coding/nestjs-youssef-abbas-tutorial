import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @ApiProperty({ description: 'The review rating', example: 5 })
  rating: number;

  @IsString()
  @MinLength(2)
  @ApiProperty({ description: 'The review comment', example: 'Comment' })
  comment: string;
}
