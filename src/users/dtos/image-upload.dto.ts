import { ApiProperty } from '@nestjs/swagger';
import { Express } from 'express';

export class ImageUploadDto {
  @ApiProperty({
    required: true,
    type: 'string',
    format: 'binary',
    name: 'profile-photo',
  })
  file: Express.Multer.File;
}
