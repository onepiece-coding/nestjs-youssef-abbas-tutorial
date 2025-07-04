import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  /*
    - Use NestFactory to create an application instance.
    - Pass the required root module for the application via the module parameter.
  */
  const app = await NestFactory.create(AppModule);

  /*
    - Using helmet middleware Helps to secure Express apps,
    - by setting HTTP response headers.
  */
  app.use(helmet());

  // app.useGlobalPipes(
  //   new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  // );

  app.enableCors({
    origin: 'http://localhost:3000',
  });

  const swagger = new DocumentBuilder()
    .setVersion('1.0')
    .setTitle('Nest JS Demo - Restful API')
    .setDescription(
      'Reference site about Lorem Ipsum, giving information on its origins, as well as a random Lipsum generator.',
    )
    .addServer('http://localhost:5000')
    .setTermsOfService('http://localhost:5000/trems-of-service')
    .setLicense('MIT License', 'http://localhost:5000/license')
    .addSecurity('bearer', { type: 'http', scheme: 'bearer' })
    .addBearerAuth()
    .build();
  const documentation = SwaggerModule.createDocument(app, swagger);
  // http://localhost:5000/swagger
  SwaggerModule.setup('swagger', app, documentation);

  // Starts the application.
  await app.listen(5000);
}
bootstrap();
