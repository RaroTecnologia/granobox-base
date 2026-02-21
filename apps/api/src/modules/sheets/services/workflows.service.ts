import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalWorkflow, ApprovalWorkflowStage } from '../entities/approval-workflow.entity';
import { CreateWorkflowDto, UpdateWorkflowDto } from '../dto/workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(ApprovalWorkflow)
    private workflowsRepository: Repository<ApprovalWorkflow>,
    @InjectRepository(ApprovalWorkflowStage)
    private stagesRepository: Repository<ApprovalWorkflowStage>,
  ) {}

  async findAll(clientId: string): Promise<ApprovalWorkflow[]> {
    return this.workflowsRepository.find({
      where: { clientId, active: true },
      relations: ['stages', 'schema'],
      order: { isDefault: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: string, clientId: string): Promise<ApprovalWorkflow> {
    const workflow = await this.workflowsRepository.findOne({
      where: { id, clientId },
      relations: ['stages', 'schema'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow com ID ${id} não encontrado`);
    }

    // Ordenar stages por order
    if (workflow.stages) {
      workflow.stages.sort((a, b) => a.order - b.order);
    }

    return workflow;
  }

  async findBySchemaId(schemaId: string, clientId: string): Promise<ApprovalWorkflow | null> {
    // Primeiro tenta encontrar workflow específico do schema
    let workflow = await this.workflowsRepository.findOne({
      where: { schemaId, clientId, active: true },
      relations: ['stages'],
    });

    // Se não encontrar, usa o workflow padrão
    if (!workflow) {
      workflow = await this.workflowsRepository.findOne({
        where: { clientId, isDefault: true, active: true },
        relations: ['stages'],
      });
    }

    if (workflow?.stages) {
      workflow.stages.sort((a, b) => a.order - b.order);
    }

    return workflow;
  }

  async getDefaultWorkflow(clientId: string): Promise<ApprovalWorkflow | null> {
    const workflow = await this.workflowsRepository.findOne({
      where: { clientId, isDefault: true, active: true },
      relations: ['stages'],
    });

    if (workflow?.stages) {
      workflow.stages.sort((a, b) => a.order - b.order);
    }

    return workflow;
  }

  async create(clientId: string, dto: CreateWorkflowDto): Promise<ApprovalWorkflow> {
    // Se for default, remover default de outros
    if (dto.isDefault) {
      await this.workflowsRepository.update(
        { clientId, isDefault: true },
        { isDefault: false },
      );
    }

    // Criar workflow
    const workflow = this.workflowsRepository.create({
      name: dto.name,
      description: dto.description,
      clientId,
      schemaId: dto.schemaId,
      isDefault: dto.isDefault || false,
    });

    const savedWorkflow = await this.workflowsRepository.save(workflow);

    // Criar estágios
    if (dto.stages?.length) {
      for (const stageDto of dto.stages) {
        const stage = this.stagesRepository.create({
          workflowId: savedWorkflow.id,
          name: stageDto.name,
          stageType: stageDto.stageType as ApprovalWorkflowStage['stageType'],
          order: stageDto.order,
          description: stageDto.description,
          assignedToUserId: stageDto.assignedToUserId,
          assignedToRole: stageDto.assignedToRole,
          required: stageDto.required ?? true,
          autoApprove: stageDto.autoApprove ?? false,
          deadlineDays: stageDto.deadlineDays,
        });
        await this.stagesRepository.save(stage);
      }
    }

    return this.findOne(savedWorkflow.id, clientId);
  }

  async update(id: string, clientId: string, dto: UpdateWorkflowDto): Promise<ApprovalWorkflow> {
    const workflow = await this.findOne(id, clientId);

    // Se estiver tornando default, remover de outros
    if (dto.isDefault && !workflow.isDefault) {
      await this.workflowsRepository.update(
        { clientId, isDefault: true },
        { isDefault: false },
      );
    }

    // Atualizar workflow
    await this.workflowsRepository.update(id, {
      name: dto.name ?? workflow.name,
      description: dto.description ?? workflow.description,
      schemaId: dto.schemaId,
      isDefault: dto.isDefault ?? workflow.isDefault,
      active: dto.active ?? workflow.active,
    });

    // Atualizar estágios se fornecidos
    if (dto.stages) {
      // Remover estágios antigos
      await this.stagesRepository.delete({ workflowId: id });

      // Criar novos estágios
      for (const stageDto of dto.stages) {
        const stage = this.stagesRepository.create({
          workflowId: id,
          name: stageDto.name,
          stageType: stageDto.stageType as ApprovalWorkflowStage['stageType'],
          order: stageDto.order,
          description: stageDto.description,
          assignedToUserId: stageDto.assignedToUserId,
          assignedToRole: stageDto.assignedToRole,
          required: stageDto.required ?? true,
          autoApprove: stageDto.autoApprove ?? false,
          deadlineDays: stageDto.deadlineDays,
        });
        await this.stagesRepository.save(stage);
      }
    }

    return this.findOne(id, clientId);
  }

  async remove(id: string, clientId: string): Promise<void> {
    const workflow = await this.findOne(id, clientId);

    if (workflow.isDefault) {
      throw new BadRequestException('Não é possível excluir o workflow padrão');
    }

    await this.workflowsRepository.delete(id);
  }

  // Templates pré-definidos
  getTemplates(): { id: string; name: string; description: string; stages: any[] }[] {
    return [
      {
        id: 'simple',
        name: 'Simples',
        description: 'Apenas aprovação final',
        stages: [
          { name: 'Aprovação Final', stageType: 'final_approval', order: 1, required: true },
        ],
      },
      {
        id: 'standard',
        name: 'Padrão',
        description: 'Revisão técnica + Qualidade + Aprovação final',
        stages: [
          { name: 'Revisão Técnica', stageType: 'technical_review', order: 1, required: true },
          { name: 'Revisão de Qualidade', stageType: 'quality_review', order: 2, required: true },
          { name: 'Aprovação Final', stageType: 'final_approval', order: 3, required: true },
        ],
      },
      {
        id: 'complete',
        name: 'Completo',
        description: 'Todos os estágios incluindo regulatório e impressão',
        stages: [
          { name: 'Revisão Técnica', stageType: 'technical_review', order: 1, required: true },
          { name: 'Revisão de Qualidade', stageType: 'quality_review', order: 2, required: true },
          { name: 'Revisão Regulatória', stageType: 'regulatory_review', order: 3, required: true },
          { name: 'Aprovação Final', stageType: 'final_approval', order: 4, required: true },
          { name: 'Aprovação para Impressão', stageType: 'print_approval', order: 5, required: true },
        ],
      },
    ];
  }
}
