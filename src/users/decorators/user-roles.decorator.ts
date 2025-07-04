import { SetMetadata } from '@nestjs/common';
import { UserType } from '../../utils/enums';

export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles);
