import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { UsersService } from '../users/providers/users.service';
import { Roles } from '../users/decorators/user-roles.decorator';
import { UserType } from '../utils/enums';
import { AuthRolesGuard } from '../users/guards/auth-roles.guard';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { TJwtPayload } from '../utils/types';
import { CreateReviewDto } from './dtos/create-review.dto';
import { ReviewsInterceptor } from './reviews.interceptor';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@Controller('/api/reviews')
export class ReviewsController {
  constructor(
    private readonly _reviewsService: ReviewsService,
    // Circular Dependency is when two modules depend on each other.
    private readonly _usersService: UsersService,
  ) {}

  // POST: ~/api/reviews/:productId => endpoint
  @Post('/:productId')
  @ApiOperation({ summary: 'Create new review for the target product' })
  @ApiResponse({
    status: 201,
    description: 'Created review from db',
  })
  @Roles(UserType.USER, UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  @UseInterceptors(ReviewsInterceptor)
  @ApiSecurity('bearer')
  public async createReview(
    @CurrentUser() payload: TJwtPayload,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: CreateReviewDto,
  ) {
    console.log(typeof body.rating);
    return this._reviewsService.createNew(payload.id, productId, body);
  }

  // GET: ~/api/reviews
  @Get('/')
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  public getAllReview(
    @Query() quertString: { pageNumber: string; reviewsPerPage: string },
  ) {
    const { pageNumber, reviewsPerPage } = quertString ?? {};
    return this._reviewsService.getAll(+pageNumber, +reviewsPerPage);
  }

  // PUT: ~/api/reviews/:id
  @Put('/:id')
  @Roles(UserType.ADMIN, UserType.USER)
  @UseGuards(AuthRolesGuard)
  public updateSingleReview(
    @Param('id', ParseIntPipe) reviewId: number,
    @CurrentUser() payload: TJwtPayload,
    @Body() _updateReviewDto: UpdateReviewDto,
  ) {
    return this._reviewsService.updateById(
      reviewId,
      payload.id,
      _updateReviewDto,
    );
  }

  // DELETE: ~/api/reviews/:id
  @Delete('/:id')
  @Roles(UserType.ADMIN, UserType.USER)
  @UseGuards(AuthRolesGuard)
  public dleteSingleReview(
    @Param('id', ParseIntPipe) reviewId: number,
    @CurrentUser() payload: TJwtPayload,
  ) {
    return this._reviewsService.deleteById(reviewId, payload);
  }
}
