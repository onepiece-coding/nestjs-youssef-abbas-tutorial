import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable() // Mark a class as a provider
export class ReviewsInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((responseData) => ({
        id: responseData.id,
        rating: responseData.rating,
        comment: responseData.comment,
        createdAt: responseData.createdAt,
        updatedAt: responseData.updatedAt,
      })),
    );
  }
}
