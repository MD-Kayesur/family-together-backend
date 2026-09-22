import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express, { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const server: Express = express();
let isInitialized = false;

async function bootstrap() {
  if (!isInitialized) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    app.use(express.json({ limit: '100mb' }));
    app.use(express.urlencoded({ limit: '100mb', extended: true }));
    app.use(cookieParser());

    app.enableCors({
      origin: process.env.FRONTEND_URL || '*',
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
      .setDescription('REST API documentation for FamilyRoots')
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

    await app.init();
    isInitialized = true;
  }
}

export default async function handler(req: Request, res: Response) {
  try {
    // Instant redirect from root or /api to Swagger API documentation
    const normalizedPath = (req.url || '/').split('?')[0];
    if (normalizedPath === '/' || normalizedPath === '/api' || normalizedPath === '') {
      res.writeHead(302, { Location: '/api/docs' });
      res.end();
      return;
    }

    // Path normalization: Support both /api/auth/signin and /auth/signin
    if (req.url && req.url.startsWith('/api') && !req.url.startsWith('/api/docs')) {
      req.url = req.url.replace(/^\/api/, '') || '/';
    }

    await bootstrap();
    server(req, res);
  } catch (err: any) {
    console.error('Error in Vercel serverless handler:', err);
    res.status(500).json({
      error: 'Backend Serverless Initialization Error',
      message: err?.message || 'Unknown error during NestJS bootstrap',
      timestamp: new Date().toISOString(),
    });
  }
}
