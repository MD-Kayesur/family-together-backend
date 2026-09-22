import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';


async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Increase payload limit to 100MB for multiple/large document uploads
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ limit: '100mb', extended: true }));

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });


  app.useGlobalPipes(

    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );


  const config = new DocumentBuilder()
    .setTitle('FamilyRoots Backend API')
    .setDescription('REST API documentation for FamilyRoots digital family relationship & tree management SaaS platform.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addCookieAuth('access_token')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  const swaggerCustomOptions = {
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.32.13/swagger-ui.min.css',
    ],
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.32.13/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.32.13/swagger-ui-standalone-preset.min.js',
    ],
    customSiteTitle: 'FamilyRoots Backend Swagger API Docs',
    customfavIcon: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.32.13/favicon-32x32.png',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 24px 0; }
      .swagger-ui .info .title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; color: #4f46e5; }
      .swagger-ui .btn.authorize { background-color: #6366f1; border-color: #6366f1; color: #fff; }
      .swagger-ui .btn.authorize svg { fill: #fff; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  };

  SwaggerModule.setup('api/docs', app, documentFactory, swaggerCustomOptions);
  SwaggerModule.setup('docs', app, documentFactory, swaggerCustomOptions);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger OpenAPI docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();


