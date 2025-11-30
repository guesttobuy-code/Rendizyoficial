import React from 'react';
import { Outlet } from 'react-router-dom';
import CRMTasksSidebar from './CRMTasksSidebar';

export default function CRMTasksModule() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar própria do módulo CRM & Tasks */}
      <CRMTasksSidebar />
      
      {/* Área de trabalho - renderiza as sub-rotas */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
