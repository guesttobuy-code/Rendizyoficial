/**
 * TOAST HELPERS - Wrapper simplificado para sonner toast
 * Padroniza mensagens de sucesso, erro, etc para a aplicação
 */

import { toast } from 'sonner';

export const toastHelpers = {
  // ============================================================================
  // SALVAR STEP
  // ============================================================================
  savingStep: (stepName: string) => {
    return toast.loading(`Salvando ${stepName}...`);
  },

  stepSaved: (stepName: string) => {
    toast.success(`${stepName} salvo com sucesso!`, {
      duration: 3000
    });
  },

  stepSaveError: (stepName: string, error?: string) => {
    toast.error(
      `Erro ao salvar ${stepName}${error ? ': ' + error : ''}`,
      {
        duration: 5000
      }
    );
  },

  // ============================================================================
  // VALIDAÇÃO
  // ============================================================================
  validationError: (message: string) => {
    toast.error(message, {
      duration: 5000
    });
  },

  validationErrors: (errors: string[]) => {
    if (errors.length === 0) return;
    
    if (errors.length === 1) {
      toast.error(errors[0], { duration: 5000 });
    } else {
      toast.error(
        `${errors.length} erros encontrados:\n• ${errors.join('\n• ')}`,
        {
          duration: 6000
        }
      );
    }
  },

  requiredFieldsMissing: () => {
    toast.error('Campos obrigatórios não preenchidos', {
      duration: 4000
    });
  },

  // ============================================================================
  // UPLOAD
  // ============================================================================
  uploadStarted: (fileName: string) => {
    return toast.loading(`Enviando ${fileName}...`);
  },

  uploadSuccess: (fileName: string) => {
    toast.success(`${fileName} enviado com sucesso!`, {
      duration: 3000
    });
  },

  uploadError: (fileName: string, error?: string) => {
    toast.error(
      `Erro ao enviar ${fileName}${error ? ': ' + error : ''}`,
      {
        duration: 5000
      }
    );
  },

  // ============================================================================
  // SINCRONIZAÇÃO
  // ============================================================================
  syncStarted: (source: string) => {
    return toast.loading(`Sincronizando com ${source}...`);
  },

  syncSuccess: (source: string) => {
    toast.success(`Sincronizado com ${source}!`, {
      duration: 3000
    });
  },

  syncError: (source: string, error?: string) => {
    toast.error(
      `Erro ao sincronizar com ${source}${error ? ': ' + error : ''}`,
      {
        duration: 5000
      }
    );
  },

  // ============================================================================
  // PUBLICAÇÃO
  // ============================================================================
  publishing: () => {
    return toast.loading('Publicando propriedade...');
  },

  publishSuccess: () => {
    toast.success('Propriedade publicada com sucesso!', {
      duration: 4000
    });
  },

  publishError: (error?: string) => {
    toast.error(
      `Erro ao publicar${error ? ': ' + error : ''}`,
      {
        duration: 5000
      }
    );
  },

  // ============================================================================
  // GERAL
  // ============================================================================
  success: (message: string, duration = 3000) => {
    toast.success(message, { duration });
  },

  error: (message: string, duration = 5000) => {
    toast.error(message, { duration });
  },

  warning: (message: string, duration = 4000) => {
    toast.warning(message, { duration });
  },

  info: (message: string, duration = 3000) => {
    toast.info(message, { duration });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  dismiss: (toastId?: string | number) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }
};

/**
 * Hook React para usar toastHelpers
 */
import { useCallback } from 'react';

export function useToastHelpers() {
  const savingStep = useCallback((stepName: string) => {
    return toastHelpers.savingStep(stepName);
  }, []);

  const stepSaved = useCallback((stepName: string) => {
    toastHelpers.stepSaved(stepName);
  }, []);

  const stepSaveError = useCallback((stepName: string, error?: string) => {
    toastHelpers.stepSaveError(stepName, error);
  }, []);

  return {
    ...toastHelpers,
    savingStep,
    stepSaved,
    stepSaveError
  };
}
