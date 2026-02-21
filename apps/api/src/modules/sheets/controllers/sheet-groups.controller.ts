import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SheetGroupsService } from '../services/sheet-groups.service';
import { CreateSheetGroupDto, UpdateSheetGroupDto } from '../dto/sheet-group.dto';
import { SheetGroup } from '../entities/sheet-group.entity';

@Controller('sheets/groups')
@UseGuards(JwtAuthGuard)
export class SheetGroupsController {
  constructor(private readonly sheetGroupsService: SheetGroupsService) {}

  @Get()
  async list(@CurrentUser() user: { clientId: string }): Promise<SheetGroup[]> {
    return this.sheetGroupsService.findAll(user.clientId);
  }

  @Post()
  async create(
    @Body() dto: CreateSheetGroupDto,
    @CurrentUser() user: { clientId: string },
  ): Promise<SheetGroup> {
    return this.sheetGroupsService.create(user.clientId, dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSheetGroupDto,
    @CurrentUser() user: { clientId: string },
  ): Promise<SheetGroup> {
    return this.sheetGroupsService.update(id, user.clientId, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { clientId: string },
  ): Promise<{ success: true }> {
    await this.sheetGroupsService.remove(id, user.clientId);
    return { success: true };
  }
}
