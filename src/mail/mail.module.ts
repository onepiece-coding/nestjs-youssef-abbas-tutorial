import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { join } from 'node:path';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (_configService: ConfigService) => {
        return {
          transport: {
            host: _configService.get<string>('SMTP_HOST'),
            port: _configService.get<number>('SMTP_PORT'),
            secure: false, // production will have ssl (https) so  secure: true
            auth: {
              user: _configService.get<string>('SMTP_USERNAME'),
              pass: _configService.get<string>('SMTP_PASSWORD'),
            },
          },
          // dir => read html templates from ...
          // __dirname => working directory path (mail folder)
          // inlineCssEnabled => to enable using inline styles in our templates
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new EjsAdapter({
              inlineCssEnabled: true,
            }),
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
