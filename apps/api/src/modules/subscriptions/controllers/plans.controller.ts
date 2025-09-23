import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from '../services/plans.service';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plans' })
  @ApiResponse({ status: 200, description: 'List of plans' })
  findAll() {
    return this.plansService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active plans' })
  @ApiResponse({ status: 200, description: 'List of active plans' })
  findActive() {
    return this.plansService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan details' })
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update plan' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  update(@Param('id') id: string, @Body() updatePlanDto: any) {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete plan' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}










