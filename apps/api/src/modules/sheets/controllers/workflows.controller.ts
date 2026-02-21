import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { WorkflowsService } from '../services/workflows.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from '../dto/workflow.dto';

@Controller('sheets/workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.workflowsService.findAll(user.clientId);
  }

  @Get('templates')
  getTemplates() {
    return this.workflowsService.getTemplates();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workflowsService.findOne(id, user.clientId);
  }

  @Post()
  create(@Body() dto: CreateWorkflowDto, @CurrentUser() user: any) {
    return this.workflowsService.create(user.clientId, dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDto,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.update(id, user.clientId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workflowsService.remove(id, user.clientId);
  }
}
