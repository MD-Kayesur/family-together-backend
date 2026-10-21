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
  // Comprehensive, future-proof CORS configuration
  app.enableCors({
    origin: (requestOrigin, callback) => {
      // Allow non-browser requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!requestOrigin) {
        return callback(null, true);
      }

      const envOrigins = (process.env.FRONTEND_URL || '')
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);

      // Match localhost or 127.0.0.1 on ANY port (3000, 3001, 3002, 5173, etc.)
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(requestOrigin);

      // Match local LAN IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const isLocalNetwork = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(requestOrigin);

      // Match Vercel deployment preview / production domains
      const isVercel = /^https:\/\/[a-zA-Z0-9_\-.]+\.vercel\.app$/.test(requestOrigin);

      if (
        envOrigins.includes(requestOrigin) ||
        isLocalhost ||
        isLocalNetwork ||
        isVercel ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }

      logger.warn(`[CORS] Blocked request from disallowed origin: ${requestOrigin}`);
      callback(new Error(`CORS policy blocked access from origin: ${requestOrigin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'Range',
      'Cache-Control',
      'Cookie',
      'baggage',
      'sentry-trace',
    ],
    exposedHeaders: ['Content-Range', 'X-Total-Count', 'Authorization', 'Set-Cookie'],
    maxAge: 86400, // Preflight response cached for 24 hours
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
    .setDescription(`
### REST API Documentation & Role Permission Matrix
Welcome to the **FamilyRoots** digital family relationship & lineage management SaaS platform API.

---

### 🛡️ Role-Based Access Control (RBAC) Architecture

Every route in this API documentation is tagged with its **Route Path** and **Allowed Roles** directly in the header summary and detailed description:

| Role Tag | Access Scope & Capabilities |
| :--- | :--- |
| **\`PUBLIC\`** | Unauthenticated endpoints (User Registration, Login, Token Refresh, Password Recovery, Health Check). |
| **\`MEMBER\` / \`USER\`** | Verified family members with access to browse directory, search lineages, author personal memories, upload documents up to 100MB, schedule events, and link direct relative branches. |
| **\`VIEWER\`** | Read-only sanctuary observer (can view tree, directory, and shared memories without modification capabilities). |
| **\`OWNER\`** | Family Sanctuary creator with comprehensive control over their tree lineage, member records, invitation approvals, sanctuary branding, settings, and document purges. |
| **\`ADMIN\`** | Platform administrator with privileges to manage cross-sanctuary accounts, user status, roles, and administrative diagnostics. |
| **\`SUPER_ADMIN\`** | Master root administrator with unrestricted platform authority across all tenants, databases, and system configuration. |

---

### 🔑 Authentication Guide
- **Bearer Token**: Click the **Authorize** button above and supply \`Bearer <jwt_access_token>\` or standard JWT string.
- **Cookie Auth**: The API also accepts automatic HTTP-only secure session cookies (\`access_token\`).
- **Identity Isolation**: User-level queries automatically filter by the authenticated user's session ID and email to prevent tenant cross-talk.
    `)
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
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger OpenAPI docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();


