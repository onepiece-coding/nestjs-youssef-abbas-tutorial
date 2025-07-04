import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { TJwtPayload } from '../../utils/types';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserType } from '../../utils/enums';
import { AuthProvider } from './auth.provider';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';
import { ResetPasswordDto } from '../dtos/reset-password.dto';

@Injectable()
export class UsersService {
  // Circular Dependency is when two modules depend on each other.
  constructor(
    // Doing this because UsersService already Injectable
    // @Inject(forwardRef(() => ReviewsService))
    // private readonly _reviewsService: ReviewsService,
    @InjectRepository(User) private readonly _usersRepository: Repository<User>,
    private readonly _authService: AuthProvider,
  ) {}

  /**
   * @description Create new user
   * @param registerDto - Body from client
   * @returns JWT (Access Token)
   */
  public async register(registerDto: RegisterDto) {
    return this._authService.register(registerDto);
  }

  /**
   * @description login user
   * @param loginDto - Body from client
   * @returns JWT (Access Token)
   */
  public async login(loginDto: LoginDto) {
    return this._authService.login(loginDto);
  }

  /**
   * @description Get the current logged in user
   * @param id the ID of the logged in user
   * @returns the logged in user from the DB
   */
  public async getCurrentUser(id: number): Promise<User> {
    const user = await this._usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found!');
    return user;
  }

  /**
   * @description get all users
   * @returns all users from DB
   * @private only admin
   */
  public async getAllUsers(): Promise<User[]> {
    return this._usersRepository.find();
  }

  /**
   * @description update user info
   * @param userId logged in user id
   * @param updateUserDto new user info
   * @returns updated user from db
   */
  public async updateCurrentUser(userId: number, updateUserDto: UpdateUserDto) {
    const { username, password } = updateUserDto ?? {};
    const user = await this.getCurrentUser(userId);

    user.username = username ?? user.username;

    if (password) {
      user.password = await this._authService.hashPassword(password);
    }

    return this._usersRepository.save(user);
  }

  /**
   * @description delete user by id
   * @param userId target user to be deleted id
   * @param payload JWT payload
   * @returns success message
   */
  public async deleteUser(userId: number, payload: TJwtPayload) {
    const user = await this.getCurrentUser(userId);

    if (user.id === payload.id || user.userType === UserType.ADMIN) {
      await this._usersRepository.remove(user);
      return { message: 'User with id ' + userId + ' has been deleted!' };
    }

    throw new ForbiddenException('Access denied, you are not allowed!');
  }

  /**
   * @description to set the profile picture that the user uploaded
   * @param userId the target user id
   * @param profilePhoto the profile photo name
   * @returns updated user from db
   */
  public async setProfilePhoto(userId: number, profilePhoto: string) {
    const user = await this.getCurrentUser(userId);

    if (user.profilePhoto === null) {
      user.profilePhoto = profilePhoto;
    } else {
      await this.removeProfilePhoto(userId);
      user.profilePhoto = profilePhoto;
    }
    return this._usersRepository.save(user);
  }

  /**
   * @description to remove the user profile picture
   * @param userId the target user id
   * @returns updated user from db
   */
  public async removeProfilePhoto(userId: number) {
    const user = await this.getCurrentUser(userId);
    if (user.profilePhoto === null) {
      throw new BadRequestException('There is no profile image!');
    }

    const imagePath = join(
      process.cwd(),
      `./images/users/${user.profilePhoto}`,
    );
    unlinkSync(imagePath);

    user.profilePhoto = null;
    return this._usersRepository.save(user);
  }

  /**
   * @description to check the email verification link
   * @param userId the user id from the link
   * @param verificationToken the verification token from the link
   * @returns success message
   */
  public async verifyEmail(userId: number, verificationToken: string) {
    const user = await this.getCurrentUser(userId);

    if (user.verificationToken === null) {
      throw new NotFoundException('There is no verification token');
    }

    if (user.verificationToken !== verificationToken) {
      throw new BadRequestException('Invalid Link');
    }

    user.isAccountVerified = true;
    user.verificationToken = null;

    await this._usersRepository.save(user);

    return {
      message: 'Your email has been verified, please log in to your account.',
    };
  }

  /**
   * @description send the reset password link to the user
   * @param email the target user email
   * @returns success message
   */
  public async setnResetPaswordLink(email: string) {
    return this._authService.setnResetPaswordLink(email);
  }

  /**
   * @description check data from reset password link
   * @param userId the target user id
   * @param resetPasswordToken the reset Password token
   * @returns success or error message
   */
  public async getResetPaswordLink(userId: number, resetPasswordToken: string) {
    return this._authService.getResetPaswordLink(userId, resetPasswordToken);
  }

  /**
   * @description reset password
   * @param _resetPasswordDto data to reset password
   * @returns success or error message
   */
  public async resetPasword(_resetPasswordDto: ResetPasswordDto) {
    return this._authService.resetPasword(_resetPasswordDto);
  }
}
