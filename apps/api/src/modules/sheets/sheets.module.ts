import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Sheet, SheetSchema, SheetVersion, SheetApproval, ApprovalWorkflow, ApprovalWorkflowStage, SheetTemplate, SheetSku, SheetShare, SheetGroup } from './entities';
import { SheetsService, SchemasService } from './services';
import { WorkflowsService } from './services/workflows.service';
import { SheetTemplatesService } from './services/sheet-templates.service';
import { SheetSharesService } from './services/sheet-shares.service';
import { SheetGroupsService } from './services/sheet-groups.service';
import { SheetsController, SchemasController, SheetSharesController, SharedAccessController, SheetGroupsController } from './controllers';
import { WorkflowsController } from './controllers/workflows.controller';
import { SheetTemplatesController } from './controllers/sheet-templates.controller';
import { TemplatesModule } from '../templates/templates.module';
import { UploadModule } from '../../upload/upload.module';
import { CanvasRendererModule } from '../canvas-renderer/canvas-renderer.module';
import { ImagesModule } from '../images/images.module';
import { BasesModule } from '../bases/bases.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sheet,
      SheetSchema,
      SheetVersion,
      SheetApproval,
      ApprovalWorkflow,
      ApprovalWorkflowStage,
      SheetTemplate,
      SheetSku,
      SheetShare,
      SheetGroup,
    ]),
    TemplatesModule,
    UploadModule,
    CanvasRendererModule,
    ImagesModule,
    BasesModule,
  ],
  controllers: [WorkflowsController, SchemasController, SheetTemplatesController, SheetGroupsController, SheetsController, SheetSharesController, SharedAccessController],
  providers: [SheetsService, SchemasService, WorkflowsService, SheetTemplatesService, SheetGroupsService, SheetSharesService],
  exports: [SheetsService, SchemasService, WorkflowsService, SheetTemplatesService, SheetGroupsService, SheetSharesService],
})
export class SheetsModule {}
