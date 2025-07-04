import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, RequestTimeoutException } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly _mailerService: MailerService) {}

  /**
   * @description to send email
   * @param userEmail the target user email
   * @param username the target user name
   */
  public async sendLoginEmail(userEmail: string, username: string) {
    try {
      const today = new Date();
      await this._mailerService.sendMail({
        to: userEmail,
        from: '<our-service@nest-demo.com>',
        subject: 'Login Email',
        template: 'login',
        context: { username, today },
      });
    } catch (error) {
      console.log(error);
      throw new RequestTimeoutException();
    }
  }

  /**
   * @description to send email verification link
   * @param userEmail the target user email
   * @param link link with user id and verification token
   */
  public async sendEmailVerificationLink(userEmail: string, link: string) {
    try {
      await this._mailerService.sendMail({
        to: userEmail,
        from: '<our-service@nest-demo.com>',
        subject: 'Email Verification',
        template: 'verify-email',
        context: { link },
      });
    } catch (error) {
      console.log(error);
      throw new RequestTimeoutException();
    }
  }

  /**
   * @description to send reset password link
   * @param userEmail the target user email
   * @param link link with user id and reset password token
   */
  public async sendResetPasswordLink(userEmail: string, link: string) {
    try {
      await this._mailerService.sendMail({
        to: userEmail,
        from: '<our-service@nest-demo.com>',
        subject: 'Reset Password',
        template: 'reset-password',
        context: { link },
      });
    } catch (error) {
      console.log(error);
      throw new RequestTimeoutException();
    }
  }
}
