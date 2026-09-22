import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Redirect('/api/docs', 302)
  @ApiOperation({ summary: 'Redirect root directly to Swagger OpenAPI documentation' })
  @ApiResponse({ status: 302, description: 'Redirects directly to Swagger UI at /api/docs' })
  getRoot() {
    return { url: '/api/docs' };
  }

  @Get('health')
  @ApiOperation({ summary: 'System health check' })
  @ApiResponse({ status: 200, description: 'Returns system operational status' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'family-together-backend',
    };
  }
}
