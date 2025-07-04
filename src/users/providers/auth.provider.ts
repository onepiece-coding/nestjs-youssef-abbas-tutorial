import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterDto } from '../dtos/register.dto';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from '../dtos/login.dto';
import { MailService } from '../../mail/mail.service';
import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import * as bcryptjs from 'bcryptjs';
import { TJwtPayload } from '../../utils/types';

@Injectable()
export class AuthProvider {
  constructor(
    @InjectRepository(User) private readonly _usersRepository: Repository<User>,
    private readonly _jwtService: JwtService,
    private readonly _mailService: MailService,
    private readonly _configService: ConfigService,
  ) {}

  /**
   * @description Create new user
   * @param registerDto - Body from client
   * @returns JWT (Access Token)
   */
  public async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    let user = await this._usersRepository.findOne({
      where: { email },
    });

    if (user) throw new BadRequestException('User Already Exists');

    const hashedPassword = await this.hashPassword(password);

    user = this._usersRepository.create({
      username,
      email,
      password: hashedPassword,
      verificationToken: randomBytes(32).toString('hex'),
    });

    user = await this._usersRepository.save(user);

    const link = this.generateVerificationLink(
      user.id,
      user.verificationToken!,
    );

    await this._mailService.sendEmailVerificationLink(user.email, link);

    return {
      message:
        'Verification token has been sent to your email, please verify your account',
    };
  }

  /**
   * @description login user
   * @param loginDto - Body from client
   * @returns JWT (Access Token)
   */
  public async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this._usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid email or password!');
    }

    const isPasswordMatch = await bcryptjs.compare(password, user.password);

    if (!isPasswordMatch) {
      throw new BadRequestException('Invalid email or password!');
    }

    if (!user.isAccountVerified) {
      let verificationToken = user.verificationToken;

      if (!verificationToken) {
        user.verificationToken = randomBytes(32).toString('hex');
        const result = await this._usersRepository.save(user);
        verificationToken = result.verificationToken;
      }

      const link = this.generateVerificationLink(
        user.id,
        user.verificationToken!,
      );

      await this._mailService.sendEmailVerificationLink(user.email, link);

      return {
        message:
          'Verification token has been sent to your email, please verify your account',
      };
    }

    const accessToken = await this.generateJwt({
      id: user.id,
      userType: user.userType,
    });

    // await this._mailService.sendLoginEmail(user.email, user.username);

    return { accessToken };
  }

  /**
   * @description send the reset password link to the user
   * @param email the target user email
   * @returns success message
   */
  public async setnResetPaswordLink(email: string) {
    let user = await this._usersRepository.findOne({ where: { email } });

    if (!user)
      throw new BadRequestException("The user with given email doesn't exist!");

    user.resetPasswordToken = randomBytes(32).toString('hex');
    user = await this._usersRepository.save(user);

    const resetPasswordLink = `${this._configService.get<string>('CLIENT_DOMAIN')}/reset-password/${user.id}/${user.resetPasswordToken}`;

    await this._mailService.sendResetPasswordLink(
      user.email,
      resetPasswordLink,
    );

    return {
      message:
        'Reset Password link has been sent to your email, please check your inbox.',
    };
  }

  /**
   * @description check data from reset password link
   * @param userId the target user id
   * @param resetPasswordToken the reset Password token
   * @returns success or error message
   */
  public async getResetPaswordLink(userId: number, resetPasswordToken: string) {
    const user = await this._usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Invalid Link!');

    if (
      user.resetPasswordToken === null ||
      user.resetPasswordToken !== resetPasswordToken
    ) {
      throw new BadRequestException('Invalid Link!');
    }

    return { message: 'Valid Link.' };
  }

  /**
   * @description reset password
   * @param resetPasswordDto data to reset password
   * @returns success or error message
   */
  public async resetPasword(resetPasswordDto: ResetPasswordDto) {
    const { newPassword, userId, resetPasswordToken } = resetPasswordDto;
    const user = await this._usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Invalid Link!');

    if (
      user.resetPasswordToken === null ||
      user.resetPasswordToken !== resetPasswordToken
    ) {
      throw new BadRequestException('Invalid Link!');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    this._usersRepository.save(user);

    return { message: 'Password reset successfully, please log in.' };
  }

  /**
   * @description to make password hashed
   * @param password plain password text
   * @returns hashed password
   */
  public async hashPassword(password: string): Promise<string> {
    const salt = await bcryptjs.genSalt(10);
    return bcryptjs.hash(password, salt);
  }

  /**
   * @description Generate Json Web Token
   * @param payload JWT Payload
   * @returns JWT (Access Token)
   */
  private async generateJwt(payload: TJwtPayload) {
    return await this._jwtService.signAsync(payload);
  }

  /**
   * @description to generate verification link
   * @param userId
   * @param verificationToken
   * @returns verification link
   */
  private generateVerificationLink(userId: number, verificationToken: string) {
    return `${this._configService.get('DOMAIN')}/api/users/verify-email/${userId}/${verificationToken}`;
  }
}
