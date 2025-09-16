import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';
import { Operation } from '../subscriptions/entities/operation.entity';

export interface PlanLimits {
  plan: {
    id: string;
    name: string;
    maxOperations: number;
    maxLabelsPerMonth: number;
    maxUsers: number;
  };
  usage: {
    operations: number;
    labelsThisMonth: number;
    users: number;
  };
  available: {
    operations: number;
    labelsThisMonth: number;
    users: number;
  };
}

@Injectable()
export class LimitsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private plansRepository: Repository<Plan>,
    @InjectRepository(Operation)
    private operationsRepository: Repository<Operation>,
  ) {}

  async getClientLimits(clientId: string): Promise<PlanLimits> {
    // Buscar cliente
    const client = await this.clientsRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    // Buscar assinatura ativa do cliente
    const subscription = await this.subscriptionsRepository.findOne({
      where: { 
        clientId,
        status: 'active'
      },
      relations: ['plan'],
    });

    if (!subscription || !subscription.plan) {
      // Se não tem assinatura ativa, usar plano padrão
      const defaultPlan = await this.plansRepository.findOne({
        where: { name: 'Plano Básico' }
      });

      if (!defaultPlan) {
        // Criar plano padrão se não existir
        const plan = this.plansRepository.create({
          name: 'Plano Básico',
          description: 'Plano básico com limites padrão',
          maxOperations: 10,
          maxLabelsPerMonth: 100,
          maxUsers: 3,
          price: 0,
          isActive: true,
        });
        await this.plansRepository.save(plan);

        return this.createLimitsResponse(plan, 0, 0, 0);
      }

      return this.createLimitsResponse(defaultPlan, 0, 0, 0);
    }

    // Contar operações do cliente
    const operationsCount = await this.operationsRepository.count({
      where: { clientId }
    });

    // Contar etiquetas do mês atual (simulado - você pode implementar uma tabela de etiquetas)
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Por enquanto, vamos simular o uso de etiquetas baseado nas operações
    const labelsThisMonth = Math.min(operationsCount * 2, 50); // Simulação: 2 etiquetas por operação, máximo 50

    // Contar usuários do cliente (simulado - você pode implementar uma tabela de usuários do cliente)
    const usersCount = 1; // Por enquanto, sempre 1 usuário

    return this.createLimitsResponse(
      subscription.plan,
      operationsCount,
      labelsThisMonth,
      usersCount
    );
  }

  private createLimitsResponse(
    plan: Plan,
    operationsCount: number,
    labelsThisMonth: number,
    usersCount: number
  ): PlanLimits {
    return {
      plan: {
        id: plan.id,
        name: plan.name,
        maxOperations: plan.maxOperations,
        maxLabelsPerMonth: plan.maxLabelsPerMonth,
        maxUsers: plan.maxUsers,
      },
      usage: {
        operations: operationsCount,
        labelsThisMonth,
        users: usersCount,
      },
      available: {
        operations: Math.max(0, plan.maxOperations - operationsCount),
        labelsThisMonth: Math.max(0, plan.maxLabelsPerMonth - labelsThisMonth),
        users: Math.max(0, plan.maxUsers - usersCount),
      },
    };
  }
}
