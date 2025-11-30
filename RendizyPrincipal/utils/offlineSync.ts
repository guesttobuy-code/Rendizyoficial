import { ServiceTicket } from '../types/funnels';

export interface OfflineChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'ticket' | 'task';
  entityId: string;
  data: any;
  timestamp: string;
  synced: boolean;
}

class OfflineSyncService {
  private changes: OfflineChange[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Detectar mudanças de conexão
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Carregar mudanças pendentes
    this.loadChanges();
  }

  /**
   * Registra uma mudança offline
   */
  recordChange(
    type: OfflineChange['type'],
    entityType: OfflineChange['entityType'],
    entityId: string,
    data: any
  ): OfflineChange {
    const change: OfflineChange = {
      id: `offline-${Date.now()}-${Math.random()}`,
      type,
      entityType,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    this.changes.push(change);
    this.persistChanges();

    // Tentar sincronizar se online
    if (this.isOnline) {
      this.syncChange(change);
    }

    return change;
  }

  /**
   * Sincroniza uma mudança específica
   */
  private async syncChange(change: OfflineChange): Promise<boolean> {
    try {
      // Simular chamada à API
      // Em produção, fazer chamada real
      console.log('Sincronizando mudança:', change);

      // Marcar como sincronizado
      change.synced = true;
      this.persistChanges();

      return true;
    } catch (error) {
      console.error('Erro ao sincronizar mudança:', error);
      return false;
    }
  }

  /**
   * Sincroniza todas as mudanças pendentes
   */
  async syncPendingChanges(): Promise<{ success: number; failed: number }> {
    const pending = this.changes.filter(c => !c.synced);
    let success = 0;
    let failed = 0;

    for (const change of pending) {
      const result = await this.syncChange(change);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    // Remover mudanças sincronizadas
    this.changes = this.changes.filter(c => !c.synced);
    this.persistChanges();

    return { success, failed };
  }

  /**
   * Obtém mudanças pendentes
   */
  getPendingChanges(): OfflineChange[] {
    return this.changes.filter(c => !c.synced);
  }

  /**
   * Verifica se há mudanças pendentes
   */
  hasPendingChanges(): boolean {
    return this.changes.some(c => !c.synced);
  }

  /**
   * Obtém status da conexão
   */
  getConnectionStatus(): { online: boolean; pendingChanges: number } {
    return {
      online: this.isOnline,
      pendingChanges: this.getPendingChanges().length,
    };
  }

  /**
   * Persiste mudanças no localStorage
   */
  private persistChanges() {
    try {
      localStorage.setItem('rendizy_offline_changes', JSON.stringify(this.changes));
    } catch (error) {
      console.error('Erro ao persistir mudanças offline:', error);
    }
  }

  /**
   * Carrega mudanças do localStorage
   */
  private loadChanges() {
    try {
      const stored = localStorage.getItem('rendizy_offline_changes');
      if (stored) {
        this.changes = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar mudanças offline:', error);
      this.changes = [];
    }
  }

  /**
   * Limpa mudanças sincronizadas
   */
  clearSyncedChanges() {
    this.changes = this.changes.filter(c => !c.synced);
    this.persistChanges();
  }
}

export const offlineSyncService = new OfflineSyncService();

