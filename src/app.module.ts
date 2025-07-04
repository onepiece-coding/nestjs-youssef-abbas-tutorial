import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
  ParseIntPipe,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Product } from './products/product.entity';
import { User } from './users/user.entity';
import { Review } from './reviews/review.entity';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { UploadsModule } from './uploads/uploads.module';
import { MailModule } from './mail/mail.module';
import { LoggerMiddleware } from './utils/middlewares/logger.middleware';
import helmet from 'helmet';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { dataSourceOptions } from 'db/data-source';
import { AppController } from './app.controller';

/**
 *  Modularity
 *  Streamline upkeep by organizing applications into self-contained modules.
 *  There are many Modules (Components) that make your application
 *  Each route represents a module.
 *  /api/products => Products Module [Controller, Service, Entity (Model), ...]
 *  /api/reviews => Reviews Module [Controller, Service, Entity (Model), ...]
 *  /api/users => Users Module [Controller, Service, Entity (Model), ...]
 *  main.ts (entry point)
 *  App Module (Root Module) => [Products M, Reviews M, Users M]
 */

@Module({
  controllers: [AppController],
  imports: [
    ProductsModule,
    ReviewsModule,
    UsersModule,
    UploadsModule,
    MailModule,
    /*
      - A database driver (pg => postgres) 
      - is a software component that enables communication 
      - between an application and a database management system (DBMS).
      - Database drivers facilitate the exchange
      - of data between applications and databases.
    */
    // Local Database
    // TypeOrmModule.forRootAsync({
    //   // connection string http://localhost:5432/nest-demo-db?username=&password=
    //   inject: [ConfigService],
    //   useFactory: (_configService: ConfigService) => ({
    //     type: 'postgres',
    //     database: _configService.get<string>('DB_DATABASE'),
    //     username: _configService.get<string>('DB_USERNAME'),
    //     password: _configService.get<string>('DB_PASSWORD'),
    //     port: _configService.get<number>('DB_PORT'),
    //     host: 'localhost',
    //     synchronize: process.env.NODE_ENV !== 'production', // true only in development
    //     entities: [Product, User, Review],
    //   }),
    // }),

    // Remote Database
    TypeOrmModule.forRoot(dataSourceOptions),

    // depend on dotenv package (Express.js)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV !== 'production'
          ? `.env.${process.env.NODE_ENV}`
          : '.env',
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // Time To Leave => 60s
          limit: 10, // 10 requests per 60s
        },
      ],
    }),
  ],
  // Make it global (guard, interceptor pipe)
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude({ path: '*', method: RequestMethod.POST })
      .exclude({ path: '/api/reviews', method: RequestMethod.ALL })
      .forRoutes(
        {
          path: '*', // "/api/users" | "/api/products" | ...
          method: RequestMethod.ALL, // GET | POST | ...
        },
        /* {
        path: '/api/users',
        method: RequestMethod.DELETE,
      },
      {
        path: '/api/reviews',
        method: RequestMethod.PUT,
      },
      {
        path: '/api/reviews',
        method: RequestMethod.PATCH,
      }, */
      );
    // To use other Middleware
    /* consumer.apply(LoggerMiddleware).forRoutes({
      path: '/api/products',
      method: RequestMethod.GET,
    }); */
    // consumer.apply(helmet()).forRoutes({
    //   path: '*',
    //   method: RequestMethod.ALL,
    // });
  }
}
