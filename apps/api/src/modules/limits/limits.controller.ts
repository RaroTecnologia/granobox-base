import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LimitsService } from './limits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Limits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('limits')
export class LimitsController {
  constructor(private readonly limitsService: LimitsService) {}

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get client limits and usage' })
  @ApiResponse({ status: 200, description: 'Client limits retrieved successfully' })
  async getClientLimits(@Param('clientId') clientId: string) {
    return this.limitsService.getClientLimits(clientId);
  }
}
