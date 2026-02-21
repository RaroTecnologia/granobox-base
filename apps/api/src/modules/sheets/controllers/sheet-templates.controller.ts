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
import { SheetTemplatesService } from '../services/sheet-templates.service';
import { AddSheetTemplateDto, UpdateSheetTemplateDto, ReorderSheetTemplatesDto, UpdateFieldMappingsDto } from '../dto/sheet-template.dto';

@Controller('sheets/:sheetId/templates')
@UseGuards(JwtAuthGuard)
export class SheetTemplatesController {
  constructor(private readonly templatesService: SheetTemplatesService) {}

  @Get()
  findAll(@Param('sheetId') sheetId: string, @CurrentUser() user: any) {
    return this.templatesService.findBySheet(sheetId, user.clientId);
  }

  @Get('types')
  getTypes() {
    return this.templatesService.getTemplateTypes();
  }

  @Get(':id')
  findOne(
    @Param('sheetId') sheetId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.templatesService.findOne(id, sheetId, user.clientId);
  }

  @Post()
  add(
    @Param('sheetId') sheetId: string,
    @Body() dto: AddSheetTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.templatesService.add(sheetId, user.clientId, dto);
  }

  @Put('reorder')
  reorder(
    @Param('sheetId') sheetId: string,
    @Body() dto: ReorderSheetTemplatesDto,
    @CurrentUser() user: any,
  ) {
    return this.templatesService.reorder(sheetId, user.clientId, dto.templateIds);
  }

  @Put(':id')
  update(
    @Param('sheetId') sheetId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSheetTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.templatesService.update(id, sheetId, user.clientId, dto);
  }

  @Delete(':id')
  remove(
    @Param('sheetId') sheetId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.templatesService.remove(id, sheetId, user.clientId);
  }

  // ── Variable mapping endpoints ──

  @Get(':id/variables')
  getVariables(
    @Param('sheetId') sheetId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.templatesService.getVariables(id, sheetId, user.clientId);
  }

  @Put(':id/mappings')
  updateMappings(
    @Param('sheetId') sheetId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFieldMappingsDto,
    @CurrentUser() user: any,
  ) {
    return this.templatesService.updateFieldMappings(id, sheetId, user.clientId, dto.mappings);
  }

}
