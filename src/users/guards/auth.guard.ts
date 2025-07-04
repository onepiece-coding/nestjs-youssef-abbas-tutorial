import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { CURRENT_USER_KEY } from '../../utils/constants';
import { TJwtPayload } from '../../utils/types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (token && type === 'Bearer') {
      try {
        const payload: TJwtPayload = await this._jwtService.verifyAsync(token, {
          secret: this._configService.get('JWT_SECRET_KEY'),
        });
        request[CURRENT_USER_KEY] = payload;
      } catch {
        throw new UnauthorizedException('access denied, invalid token!');
      }
    } else {
      throw new UnauthorizedException('access denied, no token provided!');
    }

    return true;
  }
}
