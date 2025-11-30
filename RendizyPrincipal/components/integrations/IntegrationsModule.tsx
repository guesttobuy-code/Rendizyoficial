// ============================================================================
// 🔒 CADEADO DE ISOLAMENTO - INTEGRATIONS MODULE (Mínimo)
// ============================================================================
// ⚠️ ESTA CÁPSULA ESTÁ FUNCIONANDO - NÃO MODIFICAR SEM DESBLOQUEAR
// 
// ISOLAMENTO GARANTIDO:
// - ✅ Não depende de detalhes internos de outras cápsulas
// - ✅ Usa apenas APIs públicas (rotas registradas)
// - ✅ Tem sua própria rota isolada: /integrations
// 
// ENTRELACEAMENTOS DOCUMENTADOS (OK - Sistemas se comunicam):
// - ✅ Reservations Module → Pode sincronizar reservas via Booking.com
// 
// ANTES DE MODIFICAR: Ler FUNCIONALIDADES_CRITICAS.md
// ============================================================================

import React from 'react';
import { MainSidebar } from '../MainSidebar';
import { LoadingProgress } from '../LoadingProgress';
import { BookingComIntegration } from '../BookingComIntegration';
import { cn } from '../ui/utils';

interface IntegrationsModuleProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  initialLoading: boolean;
  onModuleChange: (moduleId: string) => void;
  onSearchReservation?: (query: string) => Promise<boolean>;
  onAdvancedSearch?: (query: string) => any[];
}

export function IntegrationsModule({
  sidebarCollapsed,
  setSidebarCollapsed,
  initialLoading,
  onModuleChange,
  onSearchReservation,
  onAdvancedSearch,
}: IntegrationsModuleProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <LoadingProgress isLoading={initialLoading} />

      <MainSidebar
        activeModule="integracoes-bookingcom"
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
          <BookingComIntegration />
        </div>
      </div>
    </div>
  );
}
