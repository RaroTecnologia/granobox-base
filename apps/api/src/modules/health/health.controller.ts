import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check da API' })
  @ApiResponse({
    status: 200,
    description: 'API está funcionando',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 3600 },
        environment: { type: 'string', example: 'production' },
      },
    },
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('api')
  @ApiOperation({ summary: 'Health check específico da API' })
  @ApiResponse({
    status: 200,
    description: 'API está funcionando',
  })
  checkApi() {
    return {
      status: 'ok',
      service: 'granobox-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
