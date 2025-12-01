<<<<<<< HEAD
// ============================================================================
// 🔒 CADEADO DE ISOLAMENTO - PROPERTIES MODULE
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
// 2. ✅ Verificar dependências: grep -r "properties\|PropertiesModule" .
// 3. ✅ Executar: npm run check:critical-routes
// 4. ✅ Testar isoladamente: npm run test:properties
// 
// ROTAS ISOLADAS (NÃO COMPARTILHADAS):
// - GET /rendizy-server/make-server-67caf26a/properties
// - POST /rendizy-server/make-server-67caf26a/properties
// - GET /rendizy-server/make-server-67caf26a/properties/:id
// - PATCH /rendizy-server/make-server-67caf26a/properties/:id
// - DELETE /rendizy-server/make-server-67caf26a/properties/:id
// - /properties (rota principal)
// - /properties/new (criar novo)
// - /properties/:id/edit (editar)
// - /properties/:id/diagnostico (diagnóstico)
// 
// ENTRELACEAMENTOS DOCUMENTADOS (OK - Sistemas se comunicam):
// - ✅ Reservations Module → Reservas pertencem a propriedades
// - ✅ Calendar Module → Exibe propriedades no calendário
// - ✅ Locations Module → Propriedades pertencem a locais
// - ✅ Pricing Module → Aplica preços em propriedades
// 
// ⚠️ NUNCA REMOVER ROTAS SEM CRIAR VERSÃO ALTERNATIVA
// ============================================================================

import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { MainSidebar } from '../MainSidebar';
import { LoadingProgress } from '../LoadingProgress';
import { PropertiesManagement } from '../PropertiesManagement';
import { PropertyWizardPage } from '../../pages/PropertyWizardPage';
import DiagnosticoImovelPage from '../../pages/DiagnosticoImovelPage';
=======
import React from 'react';
import { MainSidebar } from '../MainSidebar';
import { LoadingProgress } from '../LoadingProgress';
import { PropertiesManagement } from '../PropertiesManagement';
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
import { cn } from '../ui/utils';

interface PropertiesModuleProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  initialLoading: boolean;
  onModuleChange: (moduleId: string) => void;
  onSearchReservation?: (query: string) => Promise<boolean>;
  onAdvancedSearch?: (query: string) => any[];
}

<<<<<<< HEAD
// Componente wrapper para o layout da cápsula
function PropertiesModuleLayout({
=======
export function PropertiesModule({
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
  sidebarCollapsed,
  setSidebarCollapsed,
  initialLoading,
  onModuleChange,
  onSearchReservation,
  onAdvancedSearch,
}: PropertiesModuleProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <LoadingProgress isLoading={initialLoading} />

      <MainSidebar
        activeModule="imoveis"
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
<<<<<<< HEAD
          <Outlet />
=======
          <PropertiesManagement />
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
        </div>
      </div>
    </div>
  );
}

<<<<<<< HEAD
// Componente principal que gerencia as rotas
export function PropertiesModule(props: PropertiesModuleProps) {
  return (
    <Routes>
      <Route element={<PropertiesModuleLayout {...props} />}>
        <Route index element={<PropertiesManagement />} />
        <Route path="new" element={<PropertyWizardPage />} />
        <Route path=":id/edit" element={<PropertyWizardPage />} />
        <Route path=":id/diagnostico" element={
          <div className="p-8">
            <div className="max-w-6xl mx-auto w-full">
              <DiagnosticoImovelPage />
            </div>
          </div>
        } />
      </Route>
    </Routes>
  );
}

=======
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941

