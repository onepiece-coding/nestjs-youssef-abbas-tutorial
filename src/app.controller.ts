import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/')
  public getHome() {
    return 'Your App Is Working Nice.';
  }
}
