import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SheetSharesService } from '../services/sheet-shares.service';
import { CreateSheetShareDto, ShareCommentDto, ShareEditDto } from '../dto/sheet-share.dto';

@Controller('sheets')
@UseGuards(JwtAuthGuard)
export class SheetSharesController {
  constructor(private readonly sharesService: SheetSharesService) {}

  // === Rotas protegidas (gestão de compartilhamentos) ===

  @Post(':sheetId/shares')
  async create(
    @Param('sheetId') sheetId: string,
    @Body() dto: CreateSheetShareDto,
    @CurrentUser() user: { id: string; clientId: string },
  ) {
    return this.sharesService.create(sheetId, user.clientId, user.id, dto);
  }

  @Get(':sheetId/shares')
  async findBySheet(
    @Param('sheetId') sheetId: string,
    @CurrentUser() user: { clientId: string },
  ) {
    return this.sharesService.findBySheet(sheetId, user.clientId);
  }

  @Post(':sheetId/shares/:shareId/revoke')
  async revoke(
    @Param('shareId') shareId: string,
    @CurrentUser() user: { clientId: string },
  ) {
    await this.sharesService.revoke(shareId, user.clientId);
    return { success: true };
  }

  @Delete(':sheetId/shares/:shareId')
  async remove(
    @Param('shareId') shareId: string,
    @CurrentUser() user: { clientId: string },
  ) {
    await this.sharesService.remove(shareId, user.clientId);
    return { success: true };
  }
}

// Controller separado para rotas PÚBLICAS (sem auth)
@Controller('shared')
export class SharedAccessController {
  constructor(private readonly sharesService: SheetSharesService) {}

  // Acessar ficha via token público
  @Get(':token')
  @SetMetadata('isPublic', true)
  async accessByToken(
    @Param('token') token: string,
    @Query('email') email?: string,
  ) {
    return this.sharesService.accessByToken(token, email);
  }

  // Adicionar comentário via share público
  @Post(':token/comments')
  @SetMetadata('isPublic', true)
  async addComment(
    @Param('token') token: string,
    @Body() dto: ShareCommentDto,
  ) {
    return this.sharesService.addComment(token, dto);
  }

  // Editar dados via share público (permissão 'edit')
  @Post(':token/edit')
  @SetMetadata('isPublic', true)
  async editByToken(
    @Param('token') token: string,
    @Body() dto: ShareEditDto,
  ) {
    return this.sharesService.editByToken(token, dto);
  }
}
