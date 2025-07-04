import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Express, Response } from 'express';
import { FilesUploadDto } from './dtos/files-upload.dto';

@Controller('/api/uploads')
export class UploadsController {
  /**
   * To upload a single file,
   * simply tie the FileInterceptor('fieldName') interceptor to the route handler.
   * and extract file from the request using the @UploadedFile() decorator.
   */

  // POST : .../api/uploads
  @Post()
  @UseInterceptors(FileInterceptor('file', {})) // {} => options = configuration
  public uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No provided file!');
    console.log('File Uploaded', file);
    return { message: 'File uploaded successfully.' };
  }

  // POST : .../api/uploads/multiple
  @Post('/multiple')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FilesUploadDto, description: 'To upload multi files' })
  public uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    if (!files || files.length === 0)
      throw new NotFoundException('No files provided!');
    console.log('Files Uploaded', files);
    return { message: 'Files uploaded successfully.' };
  }

  // POST : .../api/uploads
  @Get('/:image')
  public getUploadedImage(@Param('image') image: string, @Res() res: Response) {
    return res.sendFile(image, { root: 'images' });
  }
}
