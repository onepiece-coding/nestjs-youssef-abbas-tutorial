import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/providers/users.service';
import { TJwtPayload } from '../utils/types';
import { UserType } from '../utils/enums';
import { CreateProductDto } from './dtos/create-product.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateProductDto } from './dtos/update-product.dto';

type TProduct = {
  id: number;
  title: string;
  description: string;
  price: number;
};

describe('Products Controller', () => {
  let productsController: ProductsController;
  let productsService: ProductsService;

  const payload: TJwtPayload = {
    id: 1,
    userType: UserType.ADMIN,
  };

  const createProductDto: CreateProductDto = {
    title: 'Product Title',
    description: 'About Product',
    price: 100,
  };

  let products: TProduct[];

  beforeEach(async () => {
    // Data Source
    products = [
      { id: 1, title: 'the best book', description: 'about p1', price: 10 },
      { id: 2, title: 'book nadi', description: 'about p2', price: 100 },
      { id: 3, title: 't-shirt', description: 'about p3', price: 50 },
      { id: 4, title: 'laptop', description: 'about p4', price: 200 },
      { id: 5, title: 'tv', description: 'about p4', price: 150 },
    ];

    // Module Simulation
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            createNew: jest.fn(
              (createProductDto: CreateProductDto, userId: number) => {
                return Promise.resolve({ ...createProductDto, id: userId });
              },
            ),
            getAll: jest.fn(
              (title?: string, minPrice?: string, maxPrice?: string) => {
                if (title) {
                  return Promise.resolve(
                    products.filter((p) => p.title.includes(title)),
                  );
                }
                if (minPrice && maxPrice) {
                  return Promise.resolve(
                    products.filter(
                      (p) => p.price >= +minPrice && p.price <= +maxPrice,
                    ),
                  );
                }
                if (title && minPrice && maxPrice) {
                  return Promise.resolve(
                    products.filter((p) => {
                      return (
                        p.title.includes(title) &&
                        p.price >= +minPrice &&
                        p.price <= +maxPrice
                      );
                    }),
                  );
                }
                return Promise.resolve(products);
              },
            ),
            getById: jest.fn((productId: number) => {
              const product = products.find((p) => p.id === productId);
              if (!product) {
                throw new NotFoundException('Product Not Found!');
              }
              return product;
            }),
            updateById: jest.fn((productId: number, dto: UpdateProductDto) => {
              return Promise.resolve({ ...dto, id: productId });
            }),
            deleteById: jest.fn((productId: number) => {
              const product = products.find((p) => p.id === productId);
              if (!product) {
                throw new NotFoundException('Product Not Found!');
              }
              return {
                message: `Product With ID ${productId} Has Been Deleted Successfully.`,
              };
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {},
        },
        {
          provide: UsersService,
          useValue: {},
        },
      ],
    }).compile();

    productsController = module.get(ProductsController);
    productsService = module.get(ProductsService);
  });

  it('shoud products controller to be defined', () => {
    expect(productsController).toBeDefined();
  });

  it('shoud products service to be defined', () => {
    expect(productsService).toBeDefined();
  });

  // Create new product tests
  describe('createNewProduct()', () => {
    it("should call 'createNew' method in products service", async () => {
      await productsController.createNewProduct(createProductDto, payload);
      expect(productsService.createNew).toHaveBeenCalled();
      expect(productsService.createNew).toHaveBeenCalledTimes(1);
      expect(productsService.createNew).toHaveBeenCalledWith(
        createProductDto,
        payload.id,
      );
    });
    it('should return the created product', async () => {
      const result = await productsController.createNewProduct(
        createProductDto,
        payload,
      );
      expect(result).toMatchObject({ ...createProductDto, id: 1 });
    });
  });

  // Get all products tests
  describe('getAllProducts()', () => {
    it("should call 'getAll' method in products service", async () => {
      await productsController.getAllProducts();
      expect(productsService.getAll).toHaveBeenCalled();
      expect(productsService.getAll).toHaveBeenCalledTimes(1);
    });
    it('should return the products based on title', async () => {
      const data = await productsController.getAllProducts('book');
      expect(data).toHaveLength(2);
      expect(data[1]).toMatchObject({
        id: 2,
        title: 'book nadi',
        description: 'about p2',
        price: 100,
      });
    });
    it('should return the products based on min & max price', async () => {
      const data = await productsController.getAllProducts(
        undefined,
        '50',
        '300',
      );
      expect(data).toHaveLength(4);
    });
    it('should return the products based on title, min & max price', async () => {
      const data = await productsController.getAllProducts('book', '5', '120');
      expect(data).toHaveLength(2);
      expect(data[0]).toMatchObject({
        id: 1,
        title: 'the best book',
        description: 'about p1',
        price: 10,
      });
    });
    it('should return all products if no arguments passed', async () => {
      const data = await productsController.getAllProducts();
      expect(data).toHaveLength(5);
      expect(data).toBe(products);
    });
  });

  // Get single product tests
  describe('getSingleProduct()', () => {
    it("should call 'getById' method in products service", async () => {
      await productsController.getSingleProduct(2);
      expect(productsService.getById).toHaveBeenCalled();
      expect(productsService.getById).toHaveBeenCalledTimes(1);
      expect(productsService.getById).toHaveBeenCalledWith(2);
    });
    it('should return the product with given id', async () => {
      const result = await productsController.getSingleProduct(2);
      expect(result.id).toBe(2);
    });
    it('should throw NotFoundException if product was not found', async () => {
      // Expected one assertion to be called but received zero assertion calls.
      expect.assertions(1);

      try {
        // await productsController.getSingleProduct(2);
        await productsController.getSingleProduct(20);
      } catch (error) {
        expect(error).toMatchObject({ message: 'Product Not Found!' });
      }
    });
  });

  // Update product tests
  describe('updateProduct()', () => {
    const title = 'Updated Product';

    it("should call 'updateById' method in products service", async () => {
      await productsController.updateProduct(2, { title });
      expect(productsService.updateById).toHaveBeenCalled();
      expect(productsService.updateById).toHaveBeenCalledTimes(1);
      expect(productsService.updateById).toHaveBeenCalledWith(2, { title });
    });
    it('should return the updated product', async () => {
      const result = await productsController.updateProduct(2, { title });
      expect(result.id).toBe(2);
      expect(result.title).toBe(title);
    });
  });

  // Delete product tests
  describe('deleteProduct()', () => {
    it("should call 'deleteById' method in products service", async () => {
      await productsController.deleteProduct(2);
      expect(productsService.deleteById).toHaveBeenCalled();
      expect(productsService.deleteById).toHaveBeenCalledTimes(1);
      expect(productsService.deleteById).toHaveBeenCalledWith(2);
    });
    it('should return the success message', async () => {
      const result = await productsController.deleteProduct(2);
      expect(result).toMatchObject({
        message: `Product With ID 2 Has Been Deleted Successfully.`,
      });
    });
    it('should throw NotFoundException if product was not found!', async () => {
      expect.assertions(1);
      try {
        await productsController.deleteProduct(20);
      } catch (error) {
        expect(error).toMatchObject({ message: 'Product Not Found!' });
      }
    });
  });
});
