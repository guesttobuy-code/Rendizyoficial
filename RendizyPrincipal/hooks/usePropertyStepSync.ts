/**
 * RENDIZY - Property Step Sync Hook
 * 
 * Hook responsável APENAS por sincronizar um step individual com o backend.
 * - Sincronização automática com timeout
 * - Retry automático em caso de falha
 * - Fallback para localStorage
 * - Status feedback (saving/saved/error)
 * - Garantia de serialização (JSON sanitize)
 * 
 * @version 1.0.104.1
 * @date 2025-12-08
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { propertiesApi } from '../utils/api';

interface UsePropertyStepSyncOptions {
  propertyId: string;
  stepKey: string;
  stepData: any;
  completedSteps?: string[];
  completionPercentage?: number;
  enabled?: boolean;
}

interface SyncStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  error: string | null;
}

/**
 * Hook para sincronizar um step individual com o backend
 * 
 * Garante que:
 * 1. Dados são salvos após 2.5s de inatividade
 * 2. Se falhar, tenta novamente em 5s
 * 3. Fallback para localStorage
 * 4. Serializa dados corretamente (sem funções, undefined, etc)
 * 5. Retorna status para UI feedback
 */
export const usePropertyStepSync = ({
  propertyId,
  stepKey,
  stepData,
  completedSteps = [],
  completionPercentage = 0,
  enabled = true,
}: UsePropertyStepSyncOptions): SyncStatus => {
  const [status, setStatus] = useState<SyncStatus>({
    status: 'idle',
    lastSavedAt: null,
    error: null,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  /**
   * Sanitizar dados antes de enviar (remover undefined, funções, etc)
   */
  const sanitizeData = useCallback((data: any): any => {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch {
      console.warn('⚠️ [usePropertyStepSync] Erro ao sanitizar dados, usando fallback');
      return {};
    }
  }, []);

  /**
   * Fazer upload do step para o backend
   */
  const uploadStep = useCallback(async () => {
    if (!propertyId || !stepData) return;

    setStatus(prev => ({
      ...prev,
      status: 'saving',
      error: null,
    }));

    try {
      const sanitizedStepData = sanitizeData(stepData);
      const sanitizedCompletedSteps = sanitizeData(completedSteps);

      console.log(`📤 [usePropertyStepSync] Uploadando ${stepKey}:`, {
        stepKey,
        hasData: !!sanitizedStepData,
        dataKeys: Object.keys(sanitizedStepData).slice(0, 5),
        completedSteps: sanitizedCompletedSteps,
        completionPercentage,
      });

      const response = await propertiesApi.update(propertyId, {
        wizardData: {
          [stepKey]: sanitizedStepData,
        },
        completedSteps: sanitizedCompletedSteps,
        completionPercentage,
        status: 'draft',
      });

      if (response.success) {
        console.log(`✅ [usePropertyStepSync] ${stepKey} salvo com sucesso`);
        setStatus({
          status: 'saved',
          lastSavedAt: new Date(),
          error: null,
        });
        retryCountRef.current = 0; // Reset retry counter
        return true;
      } else {
        throw new Error(response.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao salvar';
      console.error(`❌ [usePropertyStepSync] Erro ao salvar ${stepKey}:`, errorMsg);

      setStatus(prev => ({
        ...prev,
        status: 'error',
        error: errorMsg,
      }));

      // Fallback: localStorage
      try {
        localStorage.setItem(
          `draft-${propertyId}-${stepKey}`,
          JSON.stringify(sanitizeData(stepData))
        );
        console.log(`💾 [usePropertyStepSync] Fallback localStorage: ${stepKey}`);
      } catch (storageError) {
        console.warn('⚠️ [usePropertyStepSync] localStorage indisponível');
      }

      return false;
    }
  }, [propertyId, stepKey, stepData, completedSteps, completionPercentage, sanitizeData]);

  /**
   * Agendar retry com backoff exponencial
   */
  const scheduleRetry = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRIES) {
      console.error(`❌ [usePropertyStepSync] Max retries (${MAX_RETRIES}) atingido para ${stepKey}`);
      return;
    }

    const delayMs = 5000 * Math.pow(2, retryCountRef.current); // 5s, 10s, 20s
    retryCountRef.current += 1;

    console.log(`🔄 [usePropertyStepSync] Agendando retry #${retryCountRef.current} para ${stepKey} em ${delayMs}ms`);

    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

    retryTimeoutRef.current = setTimeout(async () => {
      const success = await uploadStep();
      if (!success) {
        scheduleRetry();
      }
    }, delayMs);
  }, [stepKey, uploadStep]);

  /**
   * Efeito principal: sincronizar quando stepData muda
   */
  useEffect(() => {
    if (!enabled || !propertyId || !stepKey) return;

    // Limpar timeouts anteriores
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

    // Resetar status para 'saving'
    setStatus(prev => ({
      ...prev,
      status: 'saving',
    }));

    // Agendar salvamento após 2.5s de inatividade
    saveTimeoutRef.current = setTimeout(async () => {
      console.log(`⏰ [usePropertyStepSync] Debounce expirado para ${stepKey}, iniciando upload...`);
      const success = await uploadStep();

      if (!success) {
        scheduleRetry();
      }
    }, 2500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [stepData, enabled, propertyId, stepKey, uploadStep, scheduleRetry, completedSteps, completionPercentage]);

  return status;
};
