import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { UsersService } from '../users/providers/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable() // ProductsService will be have instance in the DI Container
export class ProductsService {
  // outer dependency => our service needs another one in the outer module
  constructor(
    private readonly _usersService: UsersService,
    @InjectRepository(Product)
    private readonly _productsRepository: Repository<Product>,
  ) {}

  /**
   * @description get all products
   * @returns all products from db
   */
  public getAll(title?: string, minPrice?: string, maxPrice?: string) {
    const filters = {
      ...(title ? { title: Like(`%${title}%`) } : {}),
      // title: title ? { title: Like(`%${title}%`) } : {}
      ...(minPrice && maxPrice ? { price: Between(+minPrice, +maxPrice) } : {}),
    };

    return this._productsRepository.find({
      where: filters,
    });
  }

  /**
   * @description get product by id
   * @param productId the product id
   * @returns product from db
   */
  public async getById(productId: number) {
    console.log(typeof productId);
    const findProduct = await this._productsRepository.findOne({
      where: { id: productId },
      relations: { user: true },
    });
    if (!findProduct) {
      /*
        - NestJS has an error handling system, 
        - so we don't need to catch any errors or exceptions we throw.
        - objectOrError => error message
        - descriptionOrOptions => { description => error description }
        - { message: 'error message', error: 'error description', statusCode: '404' }
        */
      throw new NotFoundException('Product Not Found!', {
        description: 'Product Not Found Error!',
      });
    }
    return findProduct;
  }

  /**
   * @description create new product
   * @param createProductDto data to create a new product
   * @param userId the logged user id (ADMIN)
   * @returns the created profuct from db
   */
  public async createNew(
    { title, description, price }: CreateProductDto,
    userId: number,
  ) {
    const user = await this._usersService.getCurrentUser(userId);
    const newProduct = this._productsRepository.create({
      title: title.toLowerCase(),
      description,
      price,
      user,
    });
    return await this._productsRepository.save(newProduct);
  }

  /**
   * @description update single product
   * @param id the product id
   * @param updateProductDto data to update the product
   * @returns updated product from db
   */
  public async updateById(
    id: number,
    { title, description, price }: UpdateProductDto,
  ) {
    console.log({ title, price });

    const product = await this.getById(id);

    product.title = title ?? product.title;
    product.description = description ?? product.description;
    product.price = price ?? product.price;

    return this._productsRepository.save(product);
  }

  /**
   * @description delete product
   * @param productId the product id
   * @returns success message
   */
  public async deleteById(productId: number) {
    const product = await this.getById(productId);
    await this._productsRepository.remove(product);
    return {
      message: `Product With ID ${productId} Has Been Deleted Successfully.`,
    };
  }
}
