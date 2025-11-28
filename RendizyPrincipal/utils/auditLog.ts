import { ServiceTicket, ServiceTask } from '../types/funnels';

export type AuditAction = 
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'TICKET_DELETED'
  | 'TICKET_STAGE_CHANGED'
  | 'TICKET_STATUS_CHANGED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'TASK_COMPLETED'
  | 'TASK_ASSIGNED'
  | 'TASK_DUE_DATE_CHANGED'
  | 'COMMENT_ADDED'
  | 'FILE_UPLOADED'
  | 'TEMPLATE_APPLIED';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entityType: 'ticket' | 'task' | 'comment' | 'file';
  entityId: string;
  ticketId?: string;
  taskId?: string;
  userId: string;
  userName: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogService {
  private logs: AuditLogEntry[] = [];

  /**
   * Registra uma ação no log de auditoria
   */
  log(
    action: AuditAction,
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    userId: string,
    userName: string,
    changes?: AuditLogEntry['changes'],
    metadata?: AuditLogEntry['metadata']
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random()}`,
      action,
      entityType,
      entityId,
      userId,
      userName,
      changes,
      metadata,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(entry);
    
    // Persistir no localStorage
    this.persist();

    return entry;
  }

  /**
   * Busca logs por ticket
   */
  getLogsByTicket(ticketId: string): AuditLogEntry[] {
    return this.logs.filter(log => log.ticketId === ticketId || log.entityId === ticketId);
  }

  /**
   * Busca logs por tarefa
   */
  getLogsByTask(taskId: string): AuditLogEntry[] {
    return this.logs.filter(log => log.taskId === taskId || log.entityId === taskId);
  }

  /**
   * Busca logs por usuário
   */
  getLogsByUser(userId: string): AuditLogEntry[] {
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Busca logs por ação
   */
  getLogsByAction(action: AuditAction): AuditLogEntry[] {
    return this.logs.filter(log => log.action === action);
  }

  /**
   * Busca logs em um período
   */
  getLogsByDateRange(from: Date, to: Date): AuditLogEntry[] {
    return this.logs.filter(log => {
      const timestamp = new Date(log.timestamp);
      return timestamp >= from && timestamp <= to;
    });
  }

  /**
   * Persiste logs no localStorage
   */
  private persist() {
    try {
      localStorage.setItem('rendizy_audit_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Erro ao persistir logs de auditoria:', error);
    }
  }

  /**
   * Carrega logs do localStorage
   */
  load() {
    try {
      const stored = localStorage.getItem('rendizy_audit_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
      this.logs = [];
    }
  }

  /**
   * Limpa logs antigos (mais de 90 dias)
   */
  cleanOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    this.logs = this.logs.filter(log => {
      const timestamp = new Date(log.timestamp);
      return timestamp >= cutoffDate;
    });
    
    this.persist();
  }

  /**
   * Exporta logs para JSON
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const auditLogService = new AuditLogService();

// Carregar logs ao inicializar
if (typeof window !== 'undefined') {
  auditLogService.load();
}

