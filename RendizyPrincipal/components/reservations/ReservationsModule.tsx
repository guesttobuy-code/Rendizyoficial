// ============================================================================
// 🔒 CADEADO DE ISOLAMENTO - RESERVATIONS MODULE
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
// 2. ✅ Verificar dependências: grep -r "reservations\|ReservationsModule" .
// 3. ✅ Executar: npm run check:critical-routes
// 4. ✅ Testar isoladamente: npm run test:reservations
// 
// ROTAS ISOLADAS (NÃO COMPARTILHADAS):
// - GET /rendizy-server/make-server-67caf26a/reservations
// - POST /rendizy-server/make-server-67caf26a/reservations
// - GET /rendizy-server/make-server-67caf26a/reservations/:id
// - PATCH /rendizy-server/make-server-67caf26a/reservations/:id
// - DELETE /rendizy-server/make-server-67caf26a/reservations/:id
// 
// ENTRELACEAMENTOS DOCUMENTADOS (OK - Sistemas se comunicam):
// - ✅ Calendar Module → Exibe reservas no calendário
// - ✅ Properties Module → Reservas pertencem a propriedades
// - ✅ Guests Module → Reservas têm hóspedes associados
// - ✅ WhatsApp Module → Pode enviar confirmações de reserva
// 
// ⚠️ NUNCA REMOVER ROTAS SEM CRIAR VERSÃO ALTERNATIVA
// ============================================================================

import React from 'react';
import { MainSidebar } from '../MainSidebar';
import { LoadingProgress } from '../LoadingProgress';
import { ReservationsManagement } from '../ReservationsManagement';
import { cn } from '../ui/utils';

interface ReservationsModuleProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  initialLoading: boolean;
  onModuleChange: (moduleId: string) => void;
  onSearchReservation?: (query: string) => Promise<boolean>;
  onAdvancedSearch?: (query: string) => any[];
}

export function ReservationsModule({
  sidebarCollapsed,
  setSidebarCollapsed,
  initialLoading,
  onModuleChange,
  onSearchReservation,
  onAdvancedSearch,
}: ReservationsModuleProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <LoadingProgress isLoading={initialLoading} />

      <MainSidebar
        activeModule="central-reservas"
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
          <ReservationsManagement />
        </div>
      </div>
    </div>
  );
}


