<<<<<<< HEAD
/**
 * BroadcastChannel para Sincronização entre Abas
 * ✅ ARQUITETURA OAuth2 v1.0.103.1010: Sincronização de login/logout entre abas
 * 
 * Garante que login/logout em uma aba seja refletido em todas as outras abas
 */

const CHANNEL_NAME = 'rendizy-auth-sync';

export type AuthBroadcastMessage =
  | { type: 'LOGIN'; token: string; user: any }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_REFRESHED'; token: string }
  | { type: 'SESSION_EXPIRED' };

class AuthBroadcastChannel {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<(message: AuthBroadcastMessage) => void>> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    }
  }

  /**
   * Enviar mensagem para todas as abas
   */
  postMessage(message: AuthBroadcastMessage): void {
    if (this.channel) {
      this.channel.postMessage(message);
    }
  }

  /**
   * Registrar listener para tipo de mensagem
   */
  onMessage(type: AuthBroadcastMessage['type'], callback: (message: AuthBroadcastMessage) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // ✅ Retornar função de cleanup
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Remover todos os listeners
   */
  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }

  /**
   * Handler interno para mensagens recebidas
   */
  private handleMessage(message: AuthBroadcastMessage): void {
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error(`❌ [AuthBroadcast] Erro ao executar listener para ${message.type}:`, error);
        }
      });
    }
  }
}

// ✅ Singleton global
let broadcastInstance: AuthBroadcastChannel | null = null;

/**
 * Obter instância singleton do BroadcastChannel
 */
export function getAuthBroadcast(): AuthBroadcastChannel {
  if (!broadcastInstance) {
    broadcastInstance = new AuthBroadcastChannel();
  }
  return broadcastInstance;
}

/**
 * Helpers para enviar mensagens comuns
 */
export const authBroadcast = {
  /**
   * Notificar login em todas as abas
   */
  notifyLogin: (token: string, user: any) => {
    getAuthBroadcast().postMessage({ type: 'LOGIN', token, user });
  },

  /**
   * Notificar logout em todas as abas
   */
  notifyLogout: () => {
    getAuthBroadcast().postMessage({ type: 'LOGOUT' });
  },

  /**
   * Notificar refresh de token em todas as abas
   */
  notifyTokenRefreshed: (token: string) => {
    getAuthBroadcast().postMessage({ type: 'TOKEN_REFRESHED', token });
  },

  /**
   * Notificar expiração de sessão em todas as abas
   */
  notifySessionExpired: () => {
    getAuthBroadcast().postMessage({ type: 'SESSION_EXPIRED' });
  }
};

=======
/**
 * BroadcastChannel para Sincronização entre Abas
 * ✅ ARQUITETURA OAuth2 v1.0.103.1010: Sincronização de login/logout entre abas
 * 
 * Garante que login/logout em uma aba seja refletido em todas as outras abas
 */

const CHANNEL_NAME = 'rendizy-auth-sync';

export type AuthBroadcastMessage =
  | { type: 'LOGIN'; token: string; user: any }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_REFRESHED'; token: string }
  | { type: 'SESSION_EXPIRED' };

class AuthBroadcastChannel {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<(message: AuthBroadcastMessage) => void>> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    }
  }

  /**
   * Enviar mensagem para todas as abas
   */
  postMessage(message: AuthBroadcastMessage): void {
    if (this.channel) {
      this.channel.postMessage(message);
    }
  }

  /**
   * Registrar listener para tipo de mensagem
   */
  onMessage(type: AuthBroadcastMessage['type'], callback: (message: AuthBroadcastMessage) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // ✅ Retornar função de cleanup
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Remover todos os listeners
   */
  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }

  /**
   * Handler interno para mensagens recebidas
   */
  private handleMessage(message: AuthBroadcastMessage): void {
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error(`❌ [AuthBroadcast] Erro ao executar listener para ${message.type}:`, error);
        }
      });
    }
  }
}

// ✅ Singleton global
let broadcastInstance: AuthBroadcastChannel | null = null;

/**
 * Obter instância singleton do BroadcastChannel
 */
export function getAuthBroadcast(): AuthBroadcastChannel {
  if (!broadcastInstance) {
    broadcastInstance = new AuthBroadcastChannel();
  }
  return broadcastInstance;
}

/**
 * Helpers para enviar mensagens comuns
 */
export const authBroadcast = {
  /**
   * Notificar login em todas as abas
   */
  notifyLogin: (token: string, user: any) => {
    getAuthBroadcast().postMessage({ type: 'LOGIN', token, user });
  },

  /**
   * Notificar logout em todas as abas
   */
  notifyLogout: () => {
    getAuthBroadcast().postMessage({ type: 'LOGOUT' });
  },

  /**
   * Notificar refresh de token em todas as abas
   */
  notifyTokenRefreshed: (token: string) => {
    getAuthBroadcast().postMessage({ type: 'TOKEN_REFRESHED', token });
  },

  /**
   * Notificar expiração de sessão em todas as abas
   */
  notifySessionExpired: () => {
    getAuthBroadcast().postMessage({ type: 'SESSION_EXPIRED' });
  }
};

>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
