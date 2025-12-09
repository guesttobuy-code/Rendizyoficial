/**
 * HOOK - usePersistenceAutoSave
 * Salva dados automaticamente em localStorage enquanto o usuário edita
 * Simples, direto ao ponto
 */

import { useEffect, useRef } from 'react';
import { PersistenceManager } from '../utils/persistenceManager';

export function usePersistenceAutoSave(
  propertyId: string | undefined,
  currentStep: number,
  stepName: string,
  data: any,
  enabled: boolean = true
) {
  const managerRef = useRef<PersistenceManager | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    managerRef.current = new PersistenceManager(propertyId);
  }, [propertyId]);

  // Auto-save com debounce (500ms)
  useEffect(() => {
    if (!enabled || !managerRef.current || !data || Object.keys(data).length === 0) return;

    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Iniciar novo timer
    debounceTimerRef.current = setTimeout(() => {
      if (managerRef.current) {
        managerRef.current.saveStepBackup(currentStep, stepName, data);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, currentStep, stepName, enabled]);

  return {
    manager: managerRef.current,
    saveNow: () => {
      if (managerRef.current) {
        managerRef.current.saveStepBackup(currentStep, stepName, data);
      }
    }
  };
}
