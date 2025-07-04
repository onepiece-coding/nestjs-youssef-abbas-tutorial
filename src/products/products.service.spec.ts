import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { UsersService } from '../users/providers/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dtos/create-product.dto';
import { Repository } from 'typeorm';
import { skip } from 'node:test';

type TProduct = {
  id: number;
  title: string;
  description: string;
  price: number;
};

type TOptions = {
  where: {
    title?: string;
    minPrice?: number;
    maxPrice?: number;
  };
};

type TFindOneOptions = {
  where: {
    id: number;
  };
};

describe('Products Service', () => {
  const REPOSITORY_TOKEN = getRepositoryToken(Product);
  const createProductDto: CreateProductDto = {
    title: 'pc',
    description: 'about pc',
    price: 350,
  };

  let productsService: ProductsService;
  let productsRepository: Repository<Product>;
  let products: TProduct[];

  beforeEach(async () => {
    products = [
      { id: 1, title: 'p1', description: 'about p1', price: 10 },
      { id: 2, title: 'p2', description: 'about p2', price: 15 },
      { id: 3, title: 'p3', description: 'about p3', price: 20 },
    ];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        /* 
            - Inject the products service dependencies
            - getRepositoryToken() => This function generates an injection token
            for an Entity or Repository
        */
        {
          provide: UsersService,
          useValue: {
            getCurrentUser: jest.fn((userId: number) =>
              Promise.resolve({ id: userId }),
            ),
          },
        },
        {
          provide: REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn((dto: CreateProductDto) => dto),
            save: jest.fn((dto: CreateProductDto) =>
              Promise.resolve({ ...dto, id: 10 }),
            ), // id => productId
            find: jest.fn((options?: TOptions) => {
              if (options?.where.title) {
                return Promise.resolve([products[0], products[1]]);
              }
              return Promise.resolve(products);
            }),
            findOne: jest.fn((options: TFindOneOptions) => {
              return Promise.resolve(
                products.find((product) => product.id === options.where.id),
              );
            }),
            remove: jest.fn((product: TProduct) => {
              const index = products.indexOf(product);
              if (index !== -1) {
                return Promise.resolve(products.slice(index, 1));
              }
            }),
          },
        },
      ],
    }).compile();
    // Dependency Injection
    // get() => Retrieves an instance of either injectable or controller
    // new ProductsService()
    productsService = module.get(ProductsService);
    // new Repository() : Product
    productsRepository = module.get<Repository<Product>>(REPOSITORY_TOKEN);
  });

  it('should products service be defined', () => {
    expect(productsService).toBeDefined();
  });

  it('should products repository be defined', () => {
    expect(productsRepository).toBeDefined();
  });

  // Create new product tests
  describe('createNew()', () => {
    it("should call 'create' method in products repository", async () => {
      await productsService.createNew(createProductDto, 1);
      expect(productsRepository.create).toHaveBeenCalled();
      expect(productsRepository.create).toHaveBeenCalledTimes(1);
    });
    it("should call 'save' method in products repository", async () => {
      await productsService.createNew(createProductDto, 1);
      expect(productsRepository.save).toHaveBeenCalled();
      expect(productsRepository.save).toHaveBeenCalledTimes(1);
    });
    it('should create new product', async () => {
      // id => userId
      const result = await productsService.createNew(createProductDto, 1);
      // {title: "pc", description: "about pc", price: 350, id: 1}
      expect(result.title).toBe('pc');
      expect(result.id).toBe(10);
    });
  });

  // Get all products tests
  describe('getAll()', () => {
    it("should call 'find' method in products repository", async () => {
      await productsService.getAll();
      expect(productsRepository.find).toHaveBeenCalled();
      expect(productsRepository.find).toHaveBeenCalledTimes(1);
    });
    it('should return products with given title', async () => {
      const data = await productsService.getAll('book');
      expect(data).toHaveLength(2);
    });
    it('should return all products', async () => {
      const data = await productsService.getAll();
      expect(data).toHaveLength(3);
      expect(data).toBe(products);
    });
  });

  // Get product by id tests
  describe('getById()', () => {
    it("should call 'findOne' method in products repository", async () => {
      await productsService.getById(1);
      expect(productsRepository.findOne).toHaveBeenCalled();
      expect(productsRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return product with given id', async () => {
      const data = await productsService.getById(1);
      expect(data).toMatchObject(products[0]);
    });

    it('should throw NotFoundException if the product is not found', async () => {
      expect.assertions(1);
      try {
        await productsService.getById(20);
      } catch (error) {
        expect(error).toMatchObject({ message: 'Product Not Found!' });
      }
    });
  });

  // update product by id tests
  describe('updateById()', () => {
    const title = 'Updated Product';

    it("should call 'save' method in products repository", async () => {
      await productsService.updateById(1, { title });
      expect(productsRepository.save).toHaveBeenCalled();
      expect(productsRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should return updated product', async () => {
      const data = await productsService.updateById(1, { title });
      expect(data.title).toBe(title);
    });

    it('should throw NotFoundException if the product is not found', async () => {
      expect.assertions(1);
      try {
        await productsService.updateById(20, { title });
      } catch (error) {
        expect(error).toMatchObject({ message: 'Product Not Found!' });
      }
    });
  });

  // delete product by id tests
  describe('deleteById()', () => {
    it("should call 'remove' method in products repository", async () => {
      await productsService.deleteById(1);
      expect(productsRepository.remove).toHaveBeenCalled();
      expect(productsRepository.remove).toHaveBeenCalledTimes(1);
    });

    it('should remove product and return success message', async () => {
      const data = await productsService.deleteById(1);
      expect(data).toMatchObject({
        message: `Product With ID 1 Has Been Deleted Successfully.`,
      });
    });

    it('should throw NotFoundException if the product is not found', async () => {
      expect.assertions(1);
      try {
        await productsService.deleteById(20);
      } catch (error) {
        expect(error).toMatchObject({ message: 'Product Not Found!' });
      }
    });
  });
});
