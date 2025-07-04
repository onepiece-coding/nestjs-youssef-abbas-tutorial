import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './providers/users.service';
// import { ReviewsService } from 'src/reviews/reviews.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { TJwtPayload } from '../utils/types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/user-roles.decorator';
import { UserType } from '../utils/enums';
import { AuthRolesGuard } from './guards/auth-roles.guard';
import { UpdateUserDto } from './dtos/update-user.dto';
import { LoggerInterceptor } from '../utils/interceptors/logger.interceptor';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Express, Response } from 'express';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ForgotPasswordDto } from './dtos/forgote-password.dto';
import { ApiBody, ApiConsumes, ApiSecurity } from '@nestjs/swagger';
import { ImageUploadDto } from './dtos/image-upload.dto';

@Controller('/api/users')
export class UsersController {
  constructor(
    private readonly _usersService: UsersService,
    // Circular Dependency is when two modules depend on each other.
    // private readonly _reviewsService: ReviewsService,
  ) {}

  // POST : ~/api/users/auth/register
  @Post('/auth/register') // 201
  public registerUser(@Body() body: RegisterDto) {
    return this._usersService.register(body);
  }

  // POST : ~/api/users/auth/login
  @Post('/auth/login')
  @HttpCode(HttpStatus.OK) // 200
  public loginUser(@Body() body: LoginDto) {
    return this._usersService.login(body);
  }

  // GET : ~/api/users/current-user
  @Get('/current-user')
  @UseGuards(AuthGuard)
  @UseInterceptors(LoggerInterceptor)
  public getMe(@CurrentUser() payload: TJwtPayload) {
    console.log('Get the current User!');
    return this._usersService.getCurrentUser(payload.id);
  }

  // GET : ~/api/users
  @Get('/')
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  public getAllUsers() {
    return this._usersService.getAllUsers();
  }

  // PUT : ~/api/users
  @Put('/')
  @Roles(UserType.ADMIN, UserType.USER)
  @UseGuards(AuthRolesGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public updateMe(
    @CurrentUser() payload: TJwtPayload,
    @Body() body: UpdateUserDto,
  ) {
    return this._usersService.updateCurrentUser(payload.id, body);
  }

  // DELETE : ~/api/users/:userId
  @Delete('/:userId')
  @Roles(UserType.ADMIN, UserType.USER)
  @UseGuards(AuthRolesGuard)
  public deleteUser(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() payload: TJwtPayload,
  ) {
    return this._usersService.deleteUser(userId, payload);
  }

  // POST :  ~/api/users/profile-photo/upload
  @Post('/profile-photo/upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('profile-photo', {}))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ImageUploadDto, description: 'Profile Photo' })
  @ApiSecurity('bearer')
  public async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() payload: TJwtPayload,
  ) {
    if (!file) throw new NotFoundException('No file provided!');
    return await this._usersService.setProfilePhoto(payload.id, file.filename);
  }

  // DELETE :  ~/api/users/profile-photo/remove
  @Delete('/profile-photo/remove')
  @UseGuards(AuthGuard)
  public async removeProfilePhoto(@CurrentUser() payload: TJwtPayload) {
    return await this._usersService.removeProfilePhoto(payload.id);
  }

  // GET :  ~/api/users/profile-photo/:image
  @Get('/profile-photo/:image')
  @UseGuards(AuthGuard)
  @ApiSecurity('bearer')
  public getProfilePhoto(@Param('image') image: string, @Res() res: Response) {
    return res.sendFile(image, { root: 'images/users' });
  }

  // GET : ~/api/users/verify-email/:userId/:verificationToken
  @Get('/verify-email/:userId/:verificationToken')
  public verifyEmail(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('verificationToken') verificationToken: string,
  ) {
    return this._usersService.verifyEmail(userId, verificationToken);
  }

  // POST : ~/api/users/forgot-password
  @Post('/forgot-password')
  @HttpCode(HttpStatus.OK)
  public forgotPassword(@Body() body: ForgotPasswordDto) {
    return this._usersService.setnResetPaswordLink(body.email);
  }

  // GET : ~/api/users/reset-password/:userId/:resetPasswordToken
  @Get('/reset-password/:userId/:resetPasswordToken')
  public getResetPaswordLink(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('resetPasswordToken') resetPasswordToken: string,
  ) {
    return this._usersService.getResetPaswordLink(userId, resetPasswordToken);
  }

  // POST : ~/api/users/reset-password
  @Post('/reset-password')
  public resetPasword(@Body() body: ResetPasswordDto) {
    return this._usersService.resetPasword(body);
  }
}
