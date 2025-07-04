import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/providers/users.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { Repository } from 'typeorm';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { TJwtPayload } from '../utils/types';
import { UserType } from '../utils/enums';

@Injectable() // to be instantiated by the Nest injector => DI Container
export class ReviewsService {
  // Circular Dependency is when two modules depend on each other.
  constructor(
    // Doing this because ReviewsService already Injectable
    // @Inject(forwardRef(() => UsersService))
    private readonly _usersService: UsersService,
    private readonly _productsService: ProductsService,
    @InjectRepository(Review)
    private readonly _reviewsRepository: Repository<Review>,
  ) {}

  /**
   * @description create new review for the target product
   * @param userId the logged in user id
   * @param productId the target product id
   * @param createReviewDto data to create a new review
   * @returns created review from db
   */
  public async createNew(
    userId: number,
    productId: number,
    createReviewDto: CreateReviewDto,
  ) {
    const user = await this._usersService.getCurrentUser(userId);
    const product = await this._productsService.getById(productId);

    const review = this._reviewsRepository.create({
      ...createReviewDto,
      user,
      product,
    });

    return await this._reviewsRepository.save(review);
  }

  /**
   * @description get all products reviews
   * @param pageNumber number of the current page
   * @param reviewsPerPage data per page
   * @returns all reviews from db
   */
  public getAll(pageNumber?: number, reviewsPerPage?: number) {
    pageNumber = pageNumber || 1;
    reviewsPerPage = reviewsPerPage || 3;
    return this._reviewsRepository.find({
      skip: reviewsPerPage * (pageNumber - 1),
      take: reviewsPerPage,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * @description update review by id
   * @returns updated review from db
   * @private only user himself
   */
  public async updateById(
    reviewId: number,
    userId: number,
    updateReviewDto: UpdateReviewDto,
  ) {
    const review = await this.getReviewById(reviewId);

    if (review.user.id !== userId) {
      throw new ForbiddenException('Access denied, you are not allowed!');
    }

    review.rating = updateReviewDto.rating ?? review.rating;
    review.comment = updateReviewDto.comment ?? review.comment;

    return this._reviewsRepository.save(review);
  }

  /**
   * @description gdelete review by id
   * @returns success message
   * @private only user himself or admin
   */
  public async deleteById(reviewId: number, payload: TJwtPayload) {
    const review = await this.getReviewById(reviewId);

    if (review.user.id === payload.id && payload.userType === UserType.ADMIN) {
      await this._reviewsRepository.remove(review);
      return { message: `Review with id ${reviewId} has been deleteed!` };
    }

    throw new ForbiddenException('Access denied, you are not allowed!');
  }

  /**
   * @description get a single reviews
   * @param id the wanter review id
   * @returns a review from db
   */
  private async getReviewById(id: number) {
    const review = await this._reviewsRepository.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found!');
    return review;
  }
}
