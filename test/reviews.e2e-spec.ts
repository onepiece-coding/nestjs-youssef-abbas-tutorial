// Simulating a module in NestJS for testing purposes
import { Test, TestingModule } from '@nestjs/testing';
// To integrate with our database
import { DataSource } from 'typeorm';
// type of our application (I = Interface)
import { INestApplication } from '@nestjs/common';
// Root Module = Entry Point
import { AppModule } from '../src/app.module';
// Review Entity (DB Table)
import { Review } from '../src/reviews/review.entity';
// Product Entity (DB Table)
import { Product } from '../src/products/product.entity';
// Data to create a new product
import { CreateReviewDto } from '../src/reviews/dtos/create-review.dto';
// User Entity (DB Table)
import { User } from '../src/users/user.entity';
// User Type
import { UserType } from '../src/utils/enums';
// to request our route handler (controller)
import * as request from 'supertest';
import * as bcryptjs from 'bcryptjs';

describe('Reviews Controller (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let createReviewDto: CreateReviewDto;

  beforeEach(async () => {
    createReviewDto = { comment: 'Thanks', rating: 4 };

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    dataSource = app.get<DataSource>(DataSource);

    // Saving a new user (admin) to database
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash('123456', salt);
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          username: 'Lahcen Alhiane',
          email: 'lahcen@email.com',
          password: hashedPassword,
          isAccountVerified: true,
          userType: UserType.ADMIN,
        },
      ])
      .execute();

    // Login
    const { body } = await request(app.getHttpServer())
      .post('/api/users/auth/login')
      .send({ email: 'lahcen@email.com', password: '123456' });
    accessToken = body.accessToken;
  });

  afterEach(async () => {
    // Clear The Database
    await dataSource.createQueryBuilder().delete().from(Review).execute();
    await dataSource.createQueryBuilder().delete().from(Product).execute();
    await dataSource.createQueryBuilder().delete().from(User).execute();
    await app.close();
  });

  // POST: ~/api/reviews/:productId
  describe('POST', () => {
    it('should create a new review and save it to the db', async () => {
      // Create a new product and save it to the db
      const { body } = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'book', description: 'about book', price: 10 });

      // Create a new review and save it to the db
      const response = await request(app.getHttpServer())
        .post(`/api/reviews/${body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createReviewDto);

      // Assertions
      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body).toMatchObject(createReviewDto);
    });
  });
});
