<<<<<<< HEAD
// ============================================================================
// 🔒 CADEADO DE ISOLAMENTO - CHAT MODULE (WhatsApp Integration)
// ============================================================================
// ⚠️ ESTA CÁPSULA ESTÁ FUNCIONANDO - NÃO MODIFICAR SEM DESBLOQUEAR
// 
// ISOLAMENTO GARANTIDO:
// - ✅ Não depende de detalhes internos de outras cápsulas
// - ✅ Usa apenas APIs públicas (rotas registradas)
// - ✅ Não compartilha estado global mutável
// - ✅ Tem suas próprias rotas isoladas
// 
// ANTES DE MODIFICAR:
// 1. ✅ Ler: FUNCIONALIDADES_CRITICAS.md
// 2. ✅ Verificar dependências: grep -r "chat\|whatsapp" .
// 3. ✅ Executar: npm run check:critical-routes
// 4. ✅ Testar isoladamente: npm run test:whatsapp
// 
// ROTAS ISOLADAS (NÃO COMPARTILHADAS):
// - /chat/channels/whatsapp/connect
// - /chat/channels/whatsapp/status
// - /chat/channels/whatsapp/disconnect
// - /whatsapp/status
// - /whatsapp/qr-code
// 
// ENTRELACEAMENTOS DOCUMENTADOS (OK - Sistemas se comunicam):
// - ✅ CRM Module → Pode usar WhatsApp para enviar notificações
// - ✅ Reservations Module → Pode usar WhatsApp para confirmações
// - ✅ Guests Module → Pode usar WhatsApp para boas-vindas
// 
// ⚠️ NUNCA REMOVER ROTAS SEM CRIAR VERSÃO ALTERNATIVA
// ============================================================================

=======
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
import React from 'react';
import { MainSidebar } from '../MainSidebar';
import { LoadingProgress } from '../LoadingProgress';
import { ChatInboxWithEvolution } from '../ChatInboxWithEvolution';
import { cn } from '../ui/utils';

interface ChatModuleProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  initialLoading: boolean;
  onModuleChange: (moduleId: string) => void;
  onSearchReservation?: (query: string) => Promise<boolean>;
  onAdvancedSearch?: (query: string) => any[];
}

export function ChatModule({
  sidebarCollapsed,
  setSidebarCollapsed,
  initialLoading,
  onModuleChange,
  onSearchReservation,
  onAdvancedSearch,
}: ChatModuleProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <LoadingProgress isLoading={initialLoading} />

      <MainSidebar
        activeModule="central-mensagens"
        onModuleChange={onModuleChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSearchReservation={onSearchReservation}
        onAdvancedSearch={onAdvancedSearch}
      />

      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72',
        )}
      >
        <div className="flex-1 overflow-hidden">
          <ChatInboxWithEvolution />
        </div>
      </div>
    </div>
  );
}


