import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  // Defines an HTTP exception for Not Found type errors
  NotFoundException,
  Put,
  Delete,
  Req,
  Res,
  Headers,
  ParseIntPipe,
  ValidationPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { ProductsService } from './products.service';
import { ConfigService } from '@nestjs/config';
import { AuthRolesGuard } from '../users/guards/auth-roles.guard';
import { UserType } from '../utils/enums';
import { Roles } from '../users/decorators/user-roles.decorator';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { TJwtPayload } from '../utils/types';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

/* 
  class Person {}
  - IS-A Relationship
  - Student IS A Person
  class Student extends Person {}

  class SendEmail {}
  - HAS-A Relationship
  - Account HAS A SendEmail
  class Account {
    - Dependency
    private sendEmail = new SendEmail();
  }
*/

type TProduct = {
  id: number;
  title: string;
  price: number;
};

/**
 * The job of nestjs controllers is to handle requests and responses.
 * Receive the request from the client and send the response.
 */

@Controller('/api/products')
@ApiTags('Products Group')
export class ProductsController {
  /* private _productsService: ProductsService;
  constructor(productsService: ProductsService) {
    this._productsService = productsService;
  } */

  // Inner Dependency => The Controller & The Service belong to the same Module
  constructor(
    private readonly _productsService: ProductsService,
    private readonly _configService: ConfigService,
  ) {}

  private products: TProduct[] = [
    { id: 1, title: 'book', price: 99 },
    { id: 2, title: 'phone', price: 1200 },
    { id: 3, title: 'laptop', price: 3500 },
  ];

  // GET: ~/api/products (API Endpoint)
  @Get() // Route Handler
  @ApiOperation({ summary: 'Fetch all products' })
  @ApiResponse({
    status: 200,
    description: 'All products fetched successfully.',
  })
  @ApiQuery({
    name: 'title',
    type: 'string',
    required: false,
    description: 'Search based on product title',
    example: 'book',
  })
  @ApiQuery({
    name: 'minPrice',
    type: 'number',
    required: false,
    description: 'Filter based on product price { Min Price }',
    example: 150,
  })
  @ApiQuery({
    name: 'maxPrice',
    type: 'number',
    required: false,
    description: 'Filter based on product price { Max Price }',
    example: 250,
  })
  @Throttle({ default: { ttl: 10000, limit: 5 } }) // 5 requests per 10s
  public getAllProducts(
    @Query('title') title?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    // console.log(this._configService.get('FORTEST')); // better approach to get ENV
    // console.log(process.env.FORTEST);
    return this._productsService.getAll(title, minPrice, maxPrice);
  }

  /*
    - This way, 
    - NestJS gives us the ability to get the request and response object,
    - if we need them.
  */
  // GET: ~/api/products/express-way/:id
  @Get('/express-way/:id') // Route Handler
  public getSingleProductExpressWay(
    @Req() req: Request<{ id: string }>,
    @Res() res: Response,
  ) {
    console.log(req.params); // { id: '1' }

    const findProduct = this.products.find(
      (product) => product.id === +req.params.id,
    );

    if (!findProduct) {
      throw new NotFoundException('Product Not Found!', {
        description: 'Product Not Found Error!',
      });
    }

    return res.status(200).json(findProduct);
  }

  // GET: ~/api/products/:id
  @Get('/:id') // Route Handler
  @SkipThrottle()
  public getSingleProduct(@Param('id', ParseIntPipe) productId: number) {
    console.log(typeof productId);

    // (@Param() params: any) => { id: 1 }

    return this._productsService.getById(productId);
  }

  // nest.js uses express.js to handle requests and responses by default.
  // It can also use another Node.js framwork like 'Fastify'
  // POST: ~/api/products/express-way
  @Post('/express-way')
  // Body Type : { title: string, price: number } + Methods (validations)
  public createNewProductExpressWay(
    @Req() req: Request<any, any, { title: string; price: number }>,
    // { passthrough: true } => to have ability of set response
    @Res({ passthrough: true }) res: Response,
    // request headers (from client)
    @Headers() headers: any,
  ) {
    console.log(req.body); // { title: 'Product Title', price: 199 }

    console.log(req.headers); // request headers (from client)

    console.log(headers); // request headers (from client)

    const newProduct: TProduct = {
      id: this.products.length + 1,
      title: req.body.title,
      price: req.body.price,
    };
    this.products.push(newProduct);

    // need res object to set cookie
    res.cookie('authCookie', 'token', {
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 1day
    });

    res.status(201).json(newProduct);
  }

  // POST: ~/api/products
  @Post()
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  @ApiSecurity('bearer')
  // Body Type : { title: string, price: number } + Methods (validations)
  public createNewProduct(
    /* 
      - If set to true { whitelist: true }, validator will strip validated object 
      of any properties that do not have any decorators. 
      - If set to true { forbidNonWhitelisted: true }, 
      instead of stripping non-whitelisted properties validator will throw an error.
    */
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: CreateProductDto,
    @CurrentUser() payload: TJwtPayload,
  ) {
    // console.log(body); // {whitelist: false} => { title: 'aaa', price: 99, rating: 5 }
    console.log(body); // {whitelist: true} => { title: 'aaa', price: 99 }

    return this._productsService.createNew(body, payload.id);
  }

  // PUT: ~/api/products/:id
  @Put('/:id')
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  @ApiSecurity('bearer')
  // Body Type : { title?: string, price?: number } + Methods [UpdateProductDto]
  public updateProduct(
    // @Param() params: { id: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ) {
    // console.log(params); // { id: 3 }
    console.log(body);

    return this._productsService.updateById(id, body);
  }

  // DELETE: ~/api/products/:id
  @Delete('/:id')
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  @ApiSecurity('bearer')
  public deleteProduct(@Param('id', ParseIntPipe) productId: number) {
    return this._productsService.deleteById(productId);
  }
}

/* const productsController = 
  new ProductsController(instanse of ProductsService from DI Container) */
