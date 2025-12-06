import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CRMTasksSidebar from './CRMTasksSidebar';
import CRMTasksDashboard from './CRMTasksDashboard';
import { ModulePlaceholder } from '../ModulePlaceholder';
import AutomationsNaturalLanguageLab from './AutomationsNaturalLanguageLab';
import { AutomationsChatLab } from './AutomationsChatLab';

export default function CRMTasksModule() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar própria do módulo CRM & Tasks */}
      <CRMTasksSidebar />

      {/* Área de trabalho - sub-rotas do CRM/Tasks */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<CRMTasksDashboard />} />

          {/* Seção Clientes (CRM) */}
          <Route path="contatos" element={<ModulePlaceholder module="Contatos" />} />
          <Route path="leads" element={<ModulePlaceholder module="Leads" />} />
          <Route path="proprietarios" element={<ModulePlaceholder module="Proprietários" />} />

          {/* Seção Tarefas (Tasks) */}
          <Route path="minhas-tarefas" element={<ModulePlaceholder module="Minhas Tarefas" />} />
          <Route path="todas-tarefas" element={<ModulePlaceholder module="Todas as Tarefas" />} />
          <Route path="calendario-tarefas" element={<ModulePlaceholder module="Calendário de Tarefas" />} />
          <Route path="equipes" element={<ModulePlaceholder module="Equipes" />} />
          <Route path="prioridades" element={<ModulePlaceholder module="Prioridades" />} />

          {/* Seção Vendas (CRM) */}
          <Route path="pipeline" element={<ModulePlaceholder module="Pipeline de Vendas" />} />
          <Route path="propostas" element={<ModulePlaceholder module="Propostas" />} />
          <Route path="negocios" element={<ModulePlaceholder module="Negócios" />} />

          {/* Seção Comunicação (CRM) */}
          <Route path="emails" element={<ModulePlaceholder module="E-mails" />} />
          <Route path="chamadas" element={<ModulePlaceholder module="Chamadas" />} />
          <Route path="agenda" element={<ModulePlaceholder module="Agenda" />} />

          {/* Seção Análise */}
          <Route path="relatorios" element={<ModulePlaceholder module="Relatórios" />} />
          <Route path="tarefas-arquivadas" element={<ModulePlaceholder module="Tarefas Arquivadas" />} />

          {/* Laboratório de Automações Inteligentes */}
          <Route path="automacoes-lab" element={<AutomationsNaturalLanguageLab />} />
          <Route path="automacoes-chat" element={<AutomationsChatLab />} />

          {/* Configurações */}
          <Route path="configuracoes" element={<ModulePlaceholder module="Configurações CRM & Tasks" />} />

          <Route path="*" element={<Navigate to="/crm" replace />} />
        </Routes>
      </div>
    </div>
  );
}
