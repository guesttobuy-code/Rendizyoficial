/**
 * BROWSER LOG COLLECTOR - Envia logs do navegador para servidor
 * Copilot consegue ler via endpoint HTTP!
 */

// Tipos para o sistema de logs
interface LogEntry {
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
}

interface LogFilter {
  level?: string;
  search?: string;
  last?: number;
}

// Declarar tipos no Window
declare global {
  interface Window {
    __RENDIZY_LOGS__: LogEntry[];
    clearRendizyLogs: () => void;
    exportRendizyLogs: () => void;
    BrowserLogCollector: typeof BrowserLogCollector;
  }
}

// Array global para armazenar logs
window.__RENDIZY_LOGS__ = [];
const MAX_LOGS = 1000;

class BrowserLogCollector {
  static init() {
    console.log('📝 Browser Log Collector ativado!');
    
    // Interceptar console.log
    const originalLog = console.log;
    console.log = function(...args) {
      BrowserLogCollector.capture('log', args);
      originalLog.apply(console, args);
    };

    // Interceptar console.error
    const originalError = console.error;
    console.error = function(...args) {
      BrowserLogCollector.capture('error', args);
      originalError.apply(console, args);
    };

    // Interceptar console.warn
    const originalWarn = console.warn;
    console.warn = function(...args) {
      BrowserLogCollector.capture('warn', args);
      originalWarn.apply(console, args);
    };

    // Interceptar erros não tratados
    window.addEventListener('error', (event) => {
      BrowserLogCollector.capture('error', [
        `UNHANDLED ERROR: ${event.message}`,
        `File: ${event.filename}:${event.lineno}:${event.colno}`,
        event.error?.stack
      ]);
    });

    // Interceptar promessas rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      BrowserLogCollector.capture('error', [
        'UNHANDLED PROMISE REJECTION:',
        event.reason
      ]);
    });

    // Expor função global para limpar logs
    window.clearRendizyLogs = () => {
      window.__RENDIZY_LOGS__ = [];
      console.log('🧹 Logs limpos!');
    };

    // Expor função global para exportar logs
    window.exportRendizyLogs = () => {
      const logs = window.__RENDIZY_LOGS__;
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rendizy-logs-${Date.now()}.json`;
      a.click();
      console.log(`📥 ${logs.length} logs exportados!`);
    };

    // Mostrar resumo a cada 30 segundos
    setInterval(() => {
      const logs = window.__RENDIZY_LOGS__;
      const errors = logs.filter((l: LogEntry) => l.level === 'error').length;
      const warns = logs.filter((l: LogEntry) => l.level === 'warn').length;
      console.log(`📊 Logs capturados: ${logs.length} total (${errors} erros, ${warns} avisos)`);
    }, 30000);
  }

  static capture(level: 'log' | 'error' | 'warn' | 'info' | 'debug', args: any[]) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: args.map((arg: any) => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ')
    };

    window.__RENDIZY_LOGS__.push(entry);

    // Limitar tamanho do array
    if (window.__RENDIZY_LOGS__.length > MAX_LOGS) {
      window.__RENDIZY_LOGS__.shift(); // Remove o mais antigo
    }
  }

  static getLogs(filter: LogFilter = {}) {
    let logs = window.__RENDIZY_LOGS__;

    if (filter.level) {
      logs = logs.filter((l: LogEntry) => l.level === filter.level);
    }

    if (filter.search) {
      logs = logs.filter((l: LogEntry) => l.message.toLowerCase().includes(filter.search!.toLowerCase()));
    }

    if (filter.last) {
      logs = logs.slice(-filter.last);
    }

    return logs;
  }
}

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  BrowserLogCollector.init();
}

// Exportar para uso em console
window.BrowserLogCollector = BrowserLogCollector;
