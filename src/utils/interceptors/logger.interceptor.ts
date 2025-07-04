import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, tap, Observable } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    console.log('Before the route handler');

    /*
        - Serialization is a process that happens (changes)
        - before objects are returned in a network response (to the client).
    */

    return (
      next
        .handle()
        //   .pipe(tap(() => console.log('After the route handler')));
        .pipe(
          map((responseData) => {
            const { password, ...otherData } = responseData;
            return { ...otherData };
          }),
        )
    );
  }
}
