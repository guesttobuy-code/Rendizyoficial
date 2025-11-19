import React from 'react';

interface LogoProps {
  /**
   * Tamanho do logo (pequeno, médio, grande)
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Mostrar apenas o ícone (sem o texto)
   */
  iconOnly?: boolean;
  /**
   * Mostrar apenas o texto (sem o ícone)
   */
  textOnly?: boolean;
  /**
   * Orientação: horizontal (padrão) ou vertical
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Classe CSS adicional
   */
  className?: string;
  /**
   * Usar logo customizada do localStorage
   */
  useCustom?: boolean;
}

/**
 * Componente Logo da RENDIZY
 * Exibe o logo com ícone de casa e texto "RENDIZY"
 * Pode ser usado de forma modular (ícone separado do texto)
 */
export function Logo({
  size = 'md',
  iconOnly = false,
  textOnly = false,
  orientation = 'horizontal',
  className = '',
  useCustom = false
}: LogoProps) {
  // Tamanhos predefinidos
  const sizeClasses = {
    sm: {
      icon: 'h-8 w-8',
      text: 'text-xl',
      gap: 'gap-2'
    },
    md: {
      icon: 'h-12 w-12',
      text: 'text-2xl',
      gap: 'gap-3'
    },
    lg: {
      icon: 'h-16 w-16',
      text: 'text-3xl',
      gap: 'gap-4'
    },
    xl: {
      icon: 'h-20 w-20',
      text: 'text-4xl',
      gap: 'gap-5'
    }
  };

  const currentSize = sizeClasses[size];

  // Tentar carregar logo customizada do localStorage
  const [customLogo, setCustomLogo] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (useCustom) {
      const savedLogo = localStorage.getItem('rendizy-logo');
      if (savedLogo) {
        setCustomLogo(savedLogo);
      }
      
      // Listener para mudanças no localStorage
      const handleStorageChange = () => {
        const logo = localStorage.getItem('rendizy-logo');
        setCustomLogo(logo);
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [useCustom]);

  // Se houver logo customizada e useCustom=true, usar ela
  if (customLogo && useCustom) {
    return (
      <img 
        src={customLogo} 
        alt="RENDIZY" 
        className={`object-contain ${currentSize.icon} ${className}`}
      />
    );
  }

  // Container flex baseado na orientação
  const containerClass = orientation === 'horizontal' 
    ? `flex items-center ${currentSize.gap} ${className}`
    : `flex flex-col items-center ${currentSize.gap} ${className}`;

  return (
    <div className={containerClass}>
      {/* Ícone - Casa */}
      {!textOnly && (
        <div className={`${currentSize.icon} flex-shrink-0`}>
          {/* SVG do ícone de casa - Logo oficial RENDIZY (azul escuro) */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Casa - Base retangular */}
            <rect
              x="20"
              y="55"
              width="60"
              height="25"
              fill="none"
              stroke="#1e3a8a"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Telhado triangular */}
            <path
              d="M50 30 L15 55 L85 55 Z"
              fill="none"
              stroke="#1e3a8a"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Janela quadrada no centro */}
            <rect
              x="40"
              y="60"
              width="20"
              height="20"
              fill="none"
              stroke="#1e3a8a"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Texto - RENDIZY */}
      {!iconOnly && (
        <span 
          className={`font-bold uppercase tracking-tight text-blue-900 dark:text-blue-300 ${currentSize.text}`}
        >
          RENDIZY
        </span>
      )}
    </div>
  );
}

/**
 * Componente LogoIcon - Apenas o ícone
 */
export function LogoIcon({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  return <Logo iconOnly size={size} className={className} />;
}

/**
 * Componente LogoText - Apenas o texto
 */
export function LogoText({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  return <Logo textOnly size={size} className={className} />;
}

