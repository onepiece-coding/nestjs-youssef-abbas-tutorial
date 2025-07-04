import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { CURRENT_USER_KEY } from '../../utils/constants';
import { UserType } from '../../utils/enums';
import { TJwtPayload } from '../../utils/types';
import { UsersService } from '../providers/users.service';

@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
    private readonly _reflector: Reflector,
    private readonly _userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles: UserType[] = this._reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) return false;

    const request: Request = context.switchToHttp().getRequest();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (token && type === 'Bearer') {
      try {
        const payload: TJwtPayload = await this._jwtService.verifyAsync(token, {
          secret: this._configService.get('JWT_SECRET_KEY'),
        });

        const user = await this._userService.getCurrentUser(payload.id);
        if (!user) return false;

        if (roles.includes(user.userType)) {
          request[CURRENT_USER_KEY] = payload;
          return true;
        }
      } catch {
        throw new UnauthorizedException('access denied, invalid token!');
      }
    } else {
      throw new UnauthorizedException('access denied, no token provided!');
    }

    throw new ForbiddenException('Forbidden, you are not allowed!');
  }
}
