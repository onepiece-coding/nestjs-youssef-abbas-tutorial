import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CURRENT_USER_KEY } from '../../utils/constants';
import { TJwtPayload } from '../../utils/types';

export const CurrentUser = createParamDecorator(
  (_data, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const payload: TJwtPayload = request[CURRENT_USER_KEY];
    return payload;
  },
);
