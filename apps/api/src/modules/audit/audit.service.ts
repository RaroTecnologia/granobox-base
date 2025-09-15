import { Injectable, Logger } from '@nestjs/common';

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export',
  IMPORT = 'import',
}

export interface AuditLog {
  userId: string;
  userEmail: string;
  userType: 'system' | 'client';
  clientId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  log(auditLog: Omit<AuditLog, 'timestamp'>): void {
    const logEntry: AuditLog = {
      ...auditLog,
      timestamp: new Date(),
    };

    // Log estruturado para facilitar análise
    this.logger.log(JSON.stringify(logEntry, null, 2));

    // Em produção, você pode enviar para um serviço de logging como:
    // - Elasticsearch
    // - CloudWatch
    // - Datadog
    // - Sistema próprio de auditoria
  }

  logLogin(userId: string, userEmail: string, userType: 'system' | 'client', clientId?: string, ipAddress?: string, userAgent?: string): void {
    this.log({
      userId,
      userEmail,
      userType,
      clientId,
      action: AuditAction.LOGIN,
      resource: 'auth',
      ipAddress,
      userAgent,
    });
  }

  logLogout(userId: string, userEmail: string, userType: 'system' | 'client', clientId?: string, ipAddress?: string, userAgent?: string): void {
    this.log({
      userId,
      userEmail,
      userType,
      clientId,
      action: AuditAction.LOGOUT,
      resource: 'auth',
      ipAddress,
      userAgent,
    });
  }

  logAction(
    userId: string,
    userEmail: string,
    userType: 'system' | 'client',
    action: AuditAction,
    resource: string,
    resourceId?: string,
    details?: any,
    clientId?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.log({
      userId,
      userEmail,
      userType,
      clientId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });
  }
}
