// ============================================================================
// 🔒 CADEADO DE ISOLAMENTO - SETTINGS MODULE (Mínimo)
// ============================================================================
// ⚠️ ESTA CÁPSULA ESTÁ FUNCIONANDO - NÃO MODIFICAR SEM DESBLOQUEAR
// 
// ISOLAMENTO GARANTIDO:
// - ✅ Não depende de detalhes internos de outras cápsulas
// - ✅ Usa apenas APIs públicas (rotas registradas)
// - ✅ Tem sua própria rota isolada: /settings
// 
// ENTRELACEAMENTOS DOCUMENTADOS (OK - Sistemas se comunicam):
// - ✅ Todas as cápsulas → Podem usar configurações globais
// 
// ANTES DE MODIFICAR: Ler FUNCIONALIDADES_CRITICAS.md
// ============================================================================

import React from 'react';
import { MainSidebar } from '../MainSidebar';
import { LoadingProgress } from '../LoadingProgress';
import { SettingsManager } from '../SettingsManager';
import { cn } from '../ui/utils';

interface SettingsModuleProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  initialLoading: boolean;
  onModuleChange: (moduleId: string) => void;
  onSearchReservation?: (query: string) => Promise<boolean>;
  onAdvancedSearch?: (query: string) => any[];
}

export function SettingsModule({
  sidebarCollapsed,
  setSidebarCollapsed,
  initialLoading,
  onModuleChange,
  onSearchReservation,
  onAdvancedSearch,
}: SettingsModuleProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <LoadingProgress isLoading={initialLoading} />

      <MainSidebar
        activeModule="configuracoes"
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
          <SettingsManager />
        </div>
      </div>
    </div>
  );
}


