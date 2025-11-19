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
          {/* SVG do ícone de casa - Logo oficial RENDIZY (minimalista, azul escuro) */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Parede esquerda (vertical) */}
            <line
              x1="25"
              y1="50"
              x2="25"
              y2="75"
              stroke="#1e3a8a"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Telhado - lado esquerdo (inclinado até o pico) */}
            <line
              x1="25"
              y1="50"
              x2="50"
              y2="25"
              stroke="#1e3a8a"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Telhado - lado direito (inclinado do pico até a parede direita) */}
            <line
              x1="50"
              y1="25"
              x2="75"
              y2="50"
              stroke="#1e3a8a"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Parede direita (vertical) */}
            <line
              x1="75"
              y1="50"
              x2="75"
              y2="75"
              stroke="#1e3a8a"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Base esquerda (horizontal curta - gap no meio) */}
            <line
              x1="25"
              y1="75"
              x2="38"
              y2="75"
              stroke="#1e3a8a"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Base direita (horizontal curta - gap no meio) */}
            <line
              x1="62"
              y1="75"
              x2="75"
              y2="75"
              stroke="#1e3a8a"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Texto - RENDIZY */}
      {!iconOnly && (
        <span 
          className={`font-bold uppercase tracking-tight ${currentSize.text} ${className}`}
          style={{ color: '#1e3a8a' }}
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
