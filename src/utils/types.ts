import { UserType } from './enums';

export type TJwtPayload = {
  id: number;
  userType: UserType;
};

export type TAccessToken = {
  accessToken: string;
};
