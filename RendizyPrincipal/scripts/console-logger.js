/**
 * CONSOLE LOGGER - Captura logs e salva em arquivo para análise
 * Copilot consegue ler este arquivo instantaneamente!
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'console-debug.log');
const MAX_LOG_SIZE = 1024 * 1024; // 1MB

// Garantir que pasta logs existe
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class ConsoleLogger {
  static startCapture() {
    // Limpar arquivo ao iniciar
    fs.writeFileSync(LOG_FILE, `=== RENDIZY CONSOLE LOG ===\nIniciado em: ${new Date().toISOString()}\n\n`, 'utf8');
    
    console.log('📝 Console Logger ativado - salvando em:', LOG_FILE);
  }

  static log(level, ...args) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

    // Escrever no arquivo (append)
    try {
      // Verificar tamanho do arquivo
      const stats = fs.existsSync(LOG_FILE) ? fs.statSync(LOG_FILE) : { size: 0 };
      
      if (stats.size > MAX_LOG_SIZE) {
        // Rotacionar log se muito grande
        fs.renameSync(LOG_FILE, LOG_FILE.replace('.log', '.old.log'));
        fs.writeFileSync(LOG_FILE, `=== LOG ROTACIONADO ===\n${logLine}`, 'utf8');
      } else {
        fs.appendFileSync(LOG_FILE, logLine, 'utf8');
      }
    } catch (err) {
      // Falhou ao escrever - não travar aplicação
      console.error('Erro ao escrever log:', err.message);
    }
  }
}

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConsoleLogger;
}

// Para navegador - substituir console global
if (typeof window !== 'undefined') {
  ConsoleLogger.startCapture();

  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };

  // Interceptar todos os console.*
  console.log = function(...args) {
    ConsoleLogger.log('log', ...args);
    originalConsole.log.apply(console, args);
  };

  console.error = function(...args) {
    ConsoleLogger.log('error', ...args);
    originalConsole.error.apply(console, args);
  };

  console.warn = function(...args) {
    ConsoleLogger.log('warn', ...args);
    originalConsole.warn.apply(console, args);
  };

  console.info = function(...args) {
    ConsoleLogger.log('info', ...args);
    originalConsole.info.apply(console, args);
  };

  console.debug = function(...args) {
    ConsoleLogger.log('debug', ...args);
    originalConsole.debug.apply(console, args);
  };

  // Capturar erros não tratados
  window.addEventListener('error', (event) => {
    ConsoleLogger.log('error', `UNHANDLED ERROR: ${event.message}`, event.filename, event.lineno, event.colno);
  });

  // Capturar promessas rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    ConsoleLogger.log('error', `UNHANDLED PROMISE REJECTION:`, event.reason);
  });
}
