/**
 * COMPONENTE - PersistenceStatusBar
 * Mostra status de persistência (saved, saving, error)
 */

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface PersistenceStatusBarProps {
  isVisible?: boolean;
  status?: 'idle' | 'saving' | 'saved' | 'error';
  message?: string;
}

export function PersistenceStatusBar({
  isVisible = true,
  status = 'idle',
  message = ''
}: PersistenceStatusBarProps) {
  const [displayStatus, setDisplayStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(status);
  const [autoHide, setAutoHide] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDisplayStatus(status);

    // Auto-hide success message after 2 seconds
    if (status === 'saved' && autoHide) {
      clearTimeout(autoHide);
    }
    if (status === 'saved') {
      const timer = setTimeout(() => {
        setDisplayStatus('idle');
      }, 2000);
      setAutoHide(timer);
    }

    return () => {
      if (autoHide) clearTimeout(autoHide);
    };
  }, [status]);

  if (!isVisible || displayStatus === 'idle') {
    return null;
  }

  let bgColor = 'bg-blue-50';
  let borderColor = 'border-blue-200';
  let textColor = 'text-blue-800';
  let icon = <Loader className="w-4 h-4 animate-spin" />;

  if (displayStatus === 'saved') {
    bgColor = 'bg-green-50';
    borderColor = 'border-green-200';
    textColor = 'text-green-800';
    icon = <CheckCircle className="w-4 h-4" />;
  } else if (displayStatus === 'error') {
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
    textColor = 'text-red-800';
    icon = <AlertCircle className="w-4 h-4" />;
  }

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded border
        ${bgColor} ${borderColor} ${textColor}
        text-sm font-medium transition-all duration-300
      `}
    >
      {icon}
      <span>
        {displayStatus === 'saving' && 'Salvando em localStorage...'}
        {displayStatus === 'saved' && (message || '✅ Dados salvos com sucesso!')}
        {displayStatus === 'error' && (message || '❌ Erro ao salvar dados')}
      </span>
    </div>
  );
}
