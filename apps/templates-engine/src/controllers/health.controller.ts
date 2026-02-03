import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TemplatesService } from '../templates/templates.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  getHealth() {
    const cache = this.templatesService.getCacheStats();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'granobox-templates',
      cache: {
        enabled: cache.enabled,
        size: cache.size,
        maxSize: cache.maxSize,
      },
    };
  }
}
