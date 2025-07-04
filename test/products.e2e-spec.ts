// Simulating a module in NestJS for testing purposes
import { Test, TestingModule } from '@nestjs/testing';
// To integrate with our database
import { DataSource } from 'typeorm';
// type of our application (I = Interface)
import { INestApplication, ValidationPipe } from '@nestjs/common';
// Root Module = Entry Point
import { AppModule } from '../src/app.module';
// Product Entity (DB Table)
import { Product } from '../src/products/product.entity';
// Data to create a new product
import { CreateProductDto } from 'src/products/dtos/create-product.dto';
// User Entity (DB Table)
import { User } from '../src/users/user.entity';
// User Type
import { UserType } from '../src/utils/enums';
// to request our route handler (controller)
import * as request from 'supertest';
import * as bcryptjs from 'bcryptjs';
import { APP_PIPE } from '@nestjs/core';

// In the testing envirenment (e2e) => the entry point in AppModule, not main.ts

// jest in the ground run the server (no need to main.ts)

// main.ts settings doesn't work in the testing envirenment

describe('Products Controller (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let productsToSave: CreateProductDto[];
  let accessToken: string;
  let createProductDto: CreateProductDto;

  beforeEach(async () => {
    createProductDto = { title: 'book', description: 'about book', price: 5 };
    productsToSave = [
      { title: 'Laptop', description: 'About Laptop', price: 1000 },
      { title: 'TV', description: 'About TV', price: 500 },
      { title: 'T-Shirt', description: 'About T-Shirt', price: 100 },
      { title: 'Pen', description: 'About Pen', price: 10 },
    ];

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      // providers: [
      //   {
      //     provide: APP_PIPE,
      //     useValue: new ValidationPipe({
      //       whitelist: true,
      //       forbidNonWhitelisted: true,
      //     }),
      //   },
      // ],
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
    await dataSource.createQueryBuilder().delete().from(Product).execute();
    await dataSource.createQueryBuilder().delete().from(User).execute();
    await app.close();
  });

  // GET: ~/api/products
  describe('GET', () => {
    beforeEach(async () => {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(Product)
        .values(productsToSave)
        .execute();
    });

    it('should return all products from database', async () => {
      const response = await request(app.getHttpServer()).get('/api/products');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(4);
    });

    it('should return products based on the given title', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/products?title=Laptop',
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('should return products based on the min and max price', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/products?minPrice=50&maxPrice=700',
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should return products based on the title min, and max price', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/products?title=T-Shirt&minPrice=50&maxPrice=700',
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  // POST: ~/api/products
  describe('POST', () => {
    it('should create a new product and save it to the database', async () => {
      // Create Product
      const response = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createProductDto);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(createProductDto);
    });

    it('should return 400 status code if title was less than 3 chars', async () => {
      // Create Product
      createProductDto.title = 'b';
      const response = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createProductDto);

      expect(response.status).toBe(400);
    });

    it('should return 400 status code if price was negative number', async () => {
      // Create Product
      createProductDto.price = -1;
      const response = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createProductDto);

      expect(response.status).toBe(400);
    });

    it('should return 401 if no token provided', async () => {
      // Create Product
      const response = await request(app.getHttpServer())
        .post('/api/products')
        .send(createProductDto);

      expect(response.status).toBe(401);
    });
  });

  // POST: ~/api/products/:id
  describe('GET/:id', () => {
    it('should return a product with the given id', async () => {
      // Inster new product to db
      const { body } = await request(app.getHttpServer())
        .post('/api/products/')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createProductDto);

      // Get single product from db
      const response = await request(app.getHttpServer()).get(
        `/api/products/${body.id}`,
      );

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(body.id);
      expect(response.body).toMatchObject(createProductDto);
    });

    it('should return 404 status code if product was not found!', async () => {
      // Get single product from db
      const response = await request(app.getHttpServer()).get(
        `/api/products/2`,
      );

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        message: 'Product Not Found!',
      });
    });

    it('should return 400 status code if invalid id passed', async () => {
      // Get single product from db
      const response = await request(app.getHttpServer()).get(
        `/api/products/abc`,
      );

      // Assertions
      expect(response.status).toBe(400);
    });
  });

  // PUT: ~/api/products/:id
  describe('PUT/:id', () => {
    it('should update the product', async () => {
      // Inster new product to db
      const { body } = await request(app.getHttpServer())
        .post('/api/products/')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createProductDto);

      // Update single product
      const response = await request(app.getHttpServer())
        .put(`/api/products/${body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'New Title' });

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('New Title');
    });

    it('should return 400 status code if title was less than 3 chars', async () => {
      // Inster new product to db
      const { body } = await request(app.getHttpServer())
        .post('/api/products/')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createProductDto);

      // Update single product
      const response = await request(app.getHttpServer())
        .put(`/api/products/${body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'a' });

      // Assertions
      expect(response.status).toBe(400);
    });

    it('should return 404 status code if product was not found', async () => {
      // Update single product
      const response = await request(app.getHttpServer())
        .put(`/api/products/20`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title' });

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product Not Found!');
    });

    it('should return 400 if invalid id passed', async () => {
      // Update single product
      const response = await request(app.getHttpServer())
        .put(`/api/products/abc`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title' });

      // Assertions
      expect(response.status).toBe(400);
    });
  });

  // DELETE: ~/api/products/:id
  describe('DELETE/:id', () => {
    it('should delete product with the given id', async () => {
      // Inster new product to db
      const { body } = await request(app.getHttpServer())
        .post('/api/products/')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createProductDto);

      // Delete single product
      const response = await request(app.getHttpServer())
        .delete(`/api/products/${body.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: `Product With ID ${body.id} Has Been Deleted Successfully.`,
      });
    });

    it('should return 401 status code if no token provided', async () => {
      // Delete single product
      const response = await request(app.getHttpServer()).delete(
        `/api/products/1`,
      );

      // Assertions
      expect(response.status).toBe(401);
    });

    it('should return 404 status code if product not found', async () => {
      // Delete single product
      const response = await request(app.getHttpServer())
        .delete(`/api/products/20`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        message: `Product Not Found!`,
      });
    });

    it('should return 400 status code if invalid id passed', async () => {
      // Delete single product
      const response = await request(app.getHttpServer())
        .delete(`/api/products/abc`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assertions
      expect(response.status).toBe(400);
    });
  });
});
