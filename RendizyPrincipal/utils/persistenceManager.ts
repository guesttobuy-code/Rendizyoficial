/**
 * PERSISTÊNCIA - Manager
 * Garante que dados sejam persistidos entre navegações e F5 (refresh)
 * Backup automático em localStorage + validação de integridade
 */

// ============================================================================
// TIPOS
// ============================================================================

export interface PersistenceLog {
  step: number;
  stepName: string;
  timestamp: number;
  dataHash: string;
  status: 'saved' | 'verified' | 'failed';
  fieldCount: number;
  notes?: string;
}

export interface PersistenceSnapshot {
  propertyId: string;
  timestamp: number;
  currentStep: number;
  draftData: Record<string, any>;
  logs: PersistenceLog[];
}

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

export class PersistenceManager {
  private propertyId: string;
  private storageKey: string;
  private logsKey: string;
  private checkpointKey: string;

  constructor(propertyId: string) {
    this.propertyId = propertyId;
    this.storageKey = `property-draft-${propertyId}`;
    this.logsKey = `property-logs-${propertyId}`;
    this.checkpointKey = `property-checkpoint-${propertyId}`;
  }

  // ========================================================================
  // MÉTODOS PÚBLICOS
  // ========================================================================

  /**
   * Salva dados de um step no localStorage (backup)
   */
  saveStepBackup(step: number, stepName: string, data: any): void {
    try {
      const snapshot: PersistenceSnapshot = {
        propertyId: this.propertyId,
        timestamp: Date.now(),
        currentStep: step,
        draftData: this._loadDraftData() || {},
        logs: this._loadLogs()
      };

      // Atualizar dados
      snapshot.draftData[this._getDataKeyForStep(step, stepName)] = data;

      // Salvar snapshot
      localStorage.setItem(this.storageKey, JSON.stringify(snapshot));

      // Log
      this._addLog({
        step,
        stepName,
        timestamp: Date.now(),
        dataHash: this._hashData(data),
        status: 'saved',
        fieldCount: Object.keys(data).length,
        notes: `Backup salvo em localStorage`
      });

      console.log(`✅ [Persistência] Step ${step} (${stepName}) salvo em localStorage`, {
        fieldCount: Object.keys(data).length,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      console.error(`❌ [Persistência] Erro ao salvar backup do step ${step}:`, err);
      this._addLog({
        step,
        stepName,
        timestamp: Date.now(),
        dataHash: '',
        status: 'failed',
        fieldCount: 0,
        notes: `Erro: ${err instanceof Error ? err.message : String(err)}`
      });
    }
  }

  /**
   * Recupera dados do localStorage (em caso de F5 ou falha)
   */
  loadStepBackup(step: number, stepName: string): any {
    try {
      const snapshot = this._loadSnapshot();
      if (!snapshot) {
        console.log(`ℹ️ [Persistência] Nenhum backup encontrado para ${stepName}`);
        return null;
      }

      const dataKey = this._getDataKeyForStep(step, stepName);
      const data = snapshot.draftData[dataKey];

      if (data) {
        console.log(`✅ [Persistência] Dados recuperados do localStorage para ${stepName}:`, {
          fieldCount: Object.keys(data).length,
          timestamp: new Date(snapshot.timestamp).toLocaleTimeString()
        });

        this._addLog({
          step,
          stepName,
          timestamp: Date.now(),
          dataHash: this._hashData(data),
          status: 'verified',
          fieldCount: Object.keys(data).length,
          notes: `Recuperado de backup (${new Date(snapshot.timestamp).toLocaleTimeString()})`
        });

        return data;
      }

      console.warn(`⚠️ [Persistência] Backup para ${stepName} não encontrado`);
      return null;
    } catch (err) {
      console.error(`❌ [Persistência] Erro ao carregar backup:`, err);
      return null;
    }
  }

  /**
   * Verifica integridade dos dados (após F5)
   */
  verifyDataIntegrity(step: number, stepName: string, expectedData: any): boolean {
    try {
      const backup = this.loadStepBackup(step, stepName);
      if (!backup) {
        console.warn(`⚠️ [Persistência] Sem backup para verificação: ${stepName}`);
        return false;
      }

      // Verificar se os campos principais existem
      const expectedKeys = Object.keys(expectedData);
      const backupKeys = Object.keys(backup);
      const missingKeys = expectedKeys.filter(k => !backupKeys.includes(k));

      if (missingKeys.length > 0) {
        console.warn(`⚠️ [Persistência] Campos faltando no ${stepName}:`, missingKeys);
        return false;
      }

      console.log(`✅ [Persistência] Integridade verificada para ${stepName}`);
      return true;
    } catch (err) {
      console.error(`❌ [Persistência] Erro na verificação:`, err);
      return false;
    }
  }

  /**
   * Recupera checkpoint (ponto de parada último)
   */
  getCheckpoint(): { step: number; timestamp: number } | null {
    try {
      const checkpoint = localStorage.getItem(this.checkpointKey);
      if (checkpoint) {
        return JSON.parse(checkpoint);
      }
      return null;
    } catch (err) {
      console.error('❌ Erro ao carregar checkpoint:', err);
      return null;
    }
  }

  /**
   * Salva checkpoint (para retomar depois)
   */
  saveCheckpoint(step: number): void {
    try {
      const checkpoint = { step, timestamp: Date.now() };
      localStorage.setItem(this.checkpointKey, JSON.stringify(checkpoint));
      console.log(`✅ Checkpoint salvo: Step ${step}`);
    } catch (err) {
      console.error('❌ Erro ao salvar checkpoint:', err);
    }
  }

  /**
   * Gera relatório de persistência
   */
  getReport(): string {
    const logs = this._loadLogs();
    const snapshot = this._loadSnapshot();

    let report = `
╔════════════════════════════════════════════════════════════════╗
║                    RELATÓRIO DE PERSISTÊNCIA                   ║
╚════════════════════════════════════════════════════════════════╝

🏢 Propriedade ID: ${this.propertyId}

📊 RESUMO:
  • Total de logs: ${logs.length}
  • Salvamentos: ${logs.filter(l => l.status === 'saved').length}
  • Verificações: ${logs.filter(l => l.status === 'verified').length}
  • Falhas: ${logs.filter(l => l.status === 'failed').length}

📅 ÚLTIMO SAVE:
  • Timestamp: ${snapshot ? new Date(snapshot.timestamp).toLocaleString() : 'N/A'}
  • Step: ${snapshot?.currentStep || 'N/A'}

🔍 HISTÓRICO (últimos 10):
`;

    logs.slice(-10).forEach(log => {
      const statusEmoji = log.status === 'saved' ? '✅' : log.status === 'verified' ? '✔️' : '❌';
      const time = new Date(log.timestamp).toLocaleTimeString();
      report += `
  ${statusEmoji} [${time}] Step ${log.step} (${log.stepName})
     └─ ${log.fieldCount} campos | Hash: ${log.dataHash.substring(0, 8)}...
     └─ ${log.notes || 'OK'}`;
    });

    report += `

💾 DADOS SALVOS:
${snapshot ? JSON.stringify(snapshot.draftData, null, 2) : '  Nenhum dado salvo'}

═══════════════════════════════════════════════════════════════════
`;

    return report;
  }

  /**
   * Print relatório no console
   */
  printReport(): void {
    console.log(this.getReport());
  }

  /**
   * Limpar todos os dados (reset)
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.logsKey);
      localStorage.removeItem(this.checkpointKey);
      console.log(`✅ [Persistência] Dados limpos para propriedade ${this.propertyId}`);
    } catch (err) {
      console.error('❌ Erro ao limpar dados:', err);
    }
  }

  /**
   * Exportar dados para análise
   */
  exportData(): any {
    return {
      propertyId: this.propertyId,
      snapshot: this._loadSnapshot(),
      logs: this._loadLogs(),
      exportedAt: new Date().toISOString()
    };
  }

  // ========================================================================
  // MÉTODOS PRIVADOS
  // ========================================================================

  private _loadSnapshot(): PersistenceSnapshot | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('❌ Erro ao carregar snapshot:', err);
      return null;
    }
  }

  private _loadDraftData(): Record<string, any> | null {
    const snapshot = this._loadSnapshot();
    return snapshot?.draftData || null;
  }

  private _loadLogs(): PersistenceLog[] {
    try {
      const logs = localStorage.getItem(this.logsKey);
      return logs ? JSON.parse(logs) : [];
    } catch (err) {
      console.error('❌ Erro ao carregar logs:', err);
      return [];
    }
  }

  private _addLog(log: PersistenceLog): void {
    try {
      const logs = this._loadLogs();
      logs.push(log);
      // Manter apenas últimos 100 logs
      if (logs.length > 100) {
        logs.shift();
      }
      localStorage.setItem(this.logsKey, JSON.stringify(logs));
    } catch (err) {
      console.error('❌ Erro ao adicionar log:', err);
    }
  }

  private _getDataKeyForStep(step: number, stepName: string): string {
    return `step_${step}_${stepName.toLowerCase()}`;
  }

  private _hashData(data: any): string {
    try {
      const str = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16);
    } catch {
      return 'error';
    }
  }
}

// ============================================================================
// HOOK REACT
// ============================================================================

import { useEffect, useRef } from 'react';

export function usePersistence(propertyId: string | undefined) {
  const managerRef = useRef<PersistenceManager | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    managerRef.current = new PersistenceManager(propertyId);

    // Expor globalmente para testes
    (window as any).persistenceManager = managerRef.current;

    console.log(`✅ PersistenceManager iniciado para propriedade: ${propertyId}`);

    return () => {
      delete (window as any).persistenceManager;
    };
  }, [propertyId]);

  return managerRef.current;
}

// ============================================================================
// EXPORT
// ============================================================================

export default PersistenceManager;
