/**
 * Navigation Guard - Previne loops infinitos de navegação
 * 
 * Protege contra travamentos quando o usuário usa o botão voltar do navegador
 * 
 * @version 1.0.103.500
 */

let navigationBlocked = false;
let lastNavigationTime = 0;
const NAVIGATION_COOLDOWN = 1000; // 1 segundo entre navegações

export const navigationGuard = {
  /**
   * Verifica se a navegação está bloqueada (cooldown)
   */
  canNavigate(): boolean {
    const now = Date.now();
    if (now - lastNavigationTime < NAVIGATION_COOLDOWN) {
      console.warn('⚠️ [NavigationGuard] Navegação bloqueada - cooldown ativo');
      return false;
    }
    return !navigationBlocked;
  },

  /**
   * Bloqueia navegação temporariamente
   */
  block(): void {
    navigationBlocked = true;
    console.log('🔒 [NavigationGuard] Navegação bloqueada');
  },

  /**
   * Libera navegação
   */
  unblock(): void {
    navigationBlocked = false;
    lastNavigationTime = Date.now();
    console.log('🔓 [NavigationGuard] Navegação liberada');
  },

  /**
   * Registra uma navegação
   */
  recordNavigation(): void {
    lastNavigationTime = Date.now();
  },

  /**
   * Força navegação segura para uma URL
   */
  safeNavigate(url: string): void {
    if (!this.canNavigate()) {
      console.warn('⚠️ [NavigationGuard] Navegação bloqueada, redirecionando para dashboard');
      window.location.href = '/dashboard';
      return;
    }

    this.block();
    this.recordNavigation();

    try {
      // Usar replace para evitar adicionar ao histórico
      window.location.replace(url);
    } catch (error) {
      console.error('❌ [NavigationGuard] Erro na navegação:', error);
      // Fallback: ir para dashboard
      window.location.href = '/dashboard';
    } finally {
      // Liberar após 2 segundos (tempo suficiente para navegação)
      setTimeout(() => {
        this.unblock();
      }, 2000);
    }
  }
};

// Prevenir loops infinitos no botão voltar
if (typeof window !== 'undefined') {
  let backButtonPressed = false;
  let backButtonTimeout: NodeJS.Timeout | null = null;

  window.addEventListener('popstate', (event) => {
    console.log('🔙 [NavigationGuard] Botão voltar pressionado');
    
    if (backButtonPressed) {
      console.warn('⚠️ [NavigationGuard] Botão voltar já processado, ignorando');
      event.preventDefault();
      return;
    }

    backButtonPressed = true;

    // Resetar flag após 1 segundo
    if (backButtonTimeout) {
      clearTimeout(backButtonTimeout);
    }
    backButtonTimeout = setTimeout(() => {
      backButtonPressed = false;
    }, 1000);

    // Se a navegação está bloqueada, prevenir
    if (!navigationGuard.canNavigate()) {
      console.warn('⚠️ [NavigationGuard] Navegação bloqueada, prevenindo voltar');
      event.preventDefault();
      // Forçar navegação para dashboard
      navigationGuard.safeNavigate('/dashboard');
    }
  });

  // Prevenir múltiplos cliques rápidos
  let lastClickTime = 0;
  window.addEventListener('click', (event) => {
    const now = Date.now();
    if (now - lastClickTime < 300) {
      // Muito rápido, pode ser duplo clique acidental
      console.warn('⚠️ [NavigationGuard] Clique muito rápido detectado');
    }
    lastClickTime = now;
  });
}

