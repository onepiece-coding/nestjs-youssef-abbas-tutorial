import { ApiProperty } from '@nestjs/swagger';
import { Express } from 'express';

export class FilesUploadDto {
  @ApiProperty({
    name: 'files',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  files: Array<Express.Multer.File>;
}
