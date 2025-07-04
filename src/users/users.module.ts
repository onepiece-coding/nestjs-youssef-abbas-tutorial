import { BadRequestException, forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './providers/users.service';
import { AuthProvider } from './providers/auth.provider';
import { ReviewsModule } from '../reviews/reviews.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MailModule } from '../mail/mail.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService, AuthProvider],
  exports: [UsersService],
  imports: [
    MailModule,
    // forwardRef(() => ReviewsModule),
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      // Method Injection
      useFactory: (_configService: ConfigService) => ({
        global: true,
        secret: _configService.get('JWT_SECRET_KEY'),
        signOptions: { expiresIn: _configService.get('JWT_EXPIRES_In') },
      }),
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: './images/users',
        filename: (req, file, cb) => {
          const prefix = `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
          const fileName = `${prefix}-${file.originalname}`;
          cb(null, fileName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Unsupprted file format!'), false);
        }
      },
      limits: { fileSize: 1024 * 1024 }, // 1MB
    }),
  ],
})
export class UsersModule {}
