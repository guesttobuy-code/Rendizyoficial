/**
 * TOAST SYSTEM - Sistema de notificações
 * Substituir implementações internas com um sistema centralizado
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Singleton para gerenciar toasts
class ToastManager {
  private listeners: Set<(toasts: Toast[]) => void> = new Set();
  private toasts: Toast[] = [];
  private nextId = 0;

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  show(message: string, type: ToastType = 'info', duration = 4000) {
    const id = `toast-${this.nextId++}`;
    const toast: Toast = { id, message, type, duration };

    this.toasts.push(toast);
    this.notify();

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  success(message: string, duration?: number) {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    return this.show(message, 'error', duration ?? 6000);
  }

  warning(message: string, duration?: number) {
    return this.show(message, 'warning', duration ?? 5000);
  }

  info(message: string, duration?: number) {
    return this.show(message, 'info', duration);
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  dismissAll() {
    this.toasts = [];
    this.notify();
  }

  getAll(): Toast[] {
    return [...this.toasts];
  }
}

export const toastManager = new ToastManager();

/**
 * Hook React para usar o toast system
 */
export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return {
    toasts,
    show: (message: string, type?: ToastType, duration?: number) => toastManager.show(message, type, duration),
    success: (message: string, duration?: number) => toastManager.success(message, duration),
    error: (message: string, duration?: number) => toastManager.error(message, duration),
    warning: (message: string, duration?: number) => toastManager.warning(message, duration),
    info: (message: string, duration?: number) => toastManager.info(message, duration),
    dismiss: (id: string) => toastManager.dismiss(id),
    dismissAll: () => toastManager.dismissAll()
  };
}

/**
 * Componente Toast Container - render todos os toasts
 */
import React from 'react';
import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };

  const getColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-lg border animate-in fade-in slide-in-from-right-2 ${getColors(
            toast.type
          )}`}
        >
          <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>
          <div className="flex-1 text-sm font-medium">{toast.message}</div>
          <button
            onClick={() => dismiss(toast.id)}
            className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * Helpers para formatar feedback de operações
 */
export const toastHelpers = {
  // Salvar step
  savingStep: (stepName: string) => toastManager.info(`Salvando ${stepName}...`),
  stepSaved: (stepName: string) => toastManager.success(`${stepName} salvo com sucesso!`),
  stepSaveError: (stepName: string, error?: string) =>
    toastManager.error(`Erro ao salvar ${stepName}. ${error || ''}`),

  // Upload
  uploadStarted: () => toastManager.info('Iniciando upload...'),
  uploadProgress: (percent: number) => toastManager.info(`Upload: ${percent}%`),
  uploadSuccess: () => toastManager.success('Arquivo enviado com sucesso!'),
  uploadError: (error?: string) => toastManager.error(`Erro no upload. ${error || ''}`),

  // Validação
  validationError: (errors: string[]) =>
    toastManager.error(
      errors.length === 1
        ? errors[0]
        : `${errors.length} erros encontrados:\n${errors.join('\n')}`
    ),

  // Sincronização
  syncStarted: () => toastManager.info('Sincronizando...'),
  syncSuccess: () => toastManager.success('Dados sincronizados!'),
  syncError: (error?: string) => toastManager.error(`Erro na sincronização. ${error || ''}`),

  // Publicação
  publishing: () => toastManager.info('Publicando propriedade...'),
  publishSuccess: () => toastManager.success('Propriedade publicada com sucesso!'),
  publishError: (error?: string) => toastManager.error(`Erro ao publicar. ${error || ''}`)
};
