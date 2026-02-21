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
import { SchemasService } from '../services/schemas.service';
import { CreateSchemaDto, UpdateSchemaDto } from '../dto';

@Controller('sheets/schemas')
@UseGuards(JwtAuthGuard)
export class SchemasController {
  constructor(private readonly schemasService: SchemasService) {}

  @Get()
  async findAll(@CurrentUser() user: { clientId: string }) {
    return this.schemasService.findAll(user.clientId);
  }

  @Get('templates')
  async getBaseTemplates() {
    return this.schemasService.getBaseTemplates();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { clientId: string },
  ) {
    return this.schemasService.findOne(id, user.clientId);
  }

  @Post()
  async create(
    @Body() dto: CreateSchemaDto,
    @CurrentUser() user: { clientId: string },
  ) {
    return this.schemasService.create(user.clientId, dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSchemaDto,
    @CurrentUser() user: { clientId: string },
  ) {
    return this.schemasService.update(id, user.clientId, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { clientId: string },
  ) {
    await this.schemasService.remove(id, user.clientId);
    return { success: true };
  }
}
