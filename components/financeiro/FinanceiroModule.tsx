import React from 'react';
import { Outlet } from 'react-router-dom';
import FinanceiroSidebar from './FinanceiroSidebar';

export default function FinanceiroModule() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar própria do módulo financeiro */}
      <FinanceiroSidebar />
      
      {/* Área de trabalho - renderiza as sub-rotas */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
