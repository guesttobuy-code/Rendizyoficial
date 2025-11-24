import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { createClient } from '@jsr/supabase__supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// ✅ MELHORIA v1.0.103.400 - Usa user_metadata do Supabase como fallback
// Cria cliente Supabase para verificar user_metadata se necessário
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, publicAnonKey);

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOrganization?: boolean;
  redirectTo?: string;
}

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = ['/login', '/signup', '/reset-password'];

/**
 * ProtectedRoute - Componente de proteção de rotas
 * 
 * Adaptado da lógica do middleware Next.js para React Router
 * 
 * Funcionalidades:
 * - Verifica autenticação
 * - Verifica organização (onboarding)
 * - Gerencia rotas públicas
 * - Redirecionamentos inteligentes
 * 
 * @version 1.0.103.323
 * @date 2025-11-06
 */
export default function ProtectedRoute({ 
  children, 
  requireAuth = true,
  requireOrganization = true,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, organization, user } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const [checkingMetadata, setCheckingMetadata] = useState(false);

  // ✅ CORREÇÃO CRÍTICA v1.0.103.1004: Aguardar validação se houver token
  // Se tem token no localStorage, SEMPRE aguardar validação completar antes de redirecionar
  // Isso resolve o problema de logout ao navegar diretamente via URL
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('rendizy-token') : false;
  
  // ✅ BOAS PRÁTICAS MUNDIAIS: SEMPRE aguardar validação se houver token
  // Mesmo que isLoading seja false, se tem token e não tem user, pode estar em processo de validação
  // Aguardar um tempo razoável (até 5 segundos) antes de redirecionar
  const [validationTimeout, setValidationTimeout] = React.useState(false);
  
  React.useEffect(() => {
    if (hasToken && !user && !isLoading) {
      // Se tem token mas não tem user e não está carregando, pode estar em processo de validação
      // Aguardar até 5 segundos antes de considerar que realmente não tem sessão
      const timeout = setTimeout(() => {
        setValidationTimeout(true);
      }, 5000); // 5 segundos de tolerância
      
      return () => clearTimeout(timeout);
    } else {
      setValidationTimeout(false);
    }
  }, [hasToken, user, isLoading]);
  
  // ✅ CORREÇÃO: Mostrar loading enquanto verifica autenticação
  // Se está carregando E (tem token OU tem user), aguardar validação completar
  // OU se tem token mas ainda não validou (dentro do timeout de 5s)
  if (isLoading && (hasToken || user)) {
    // ✅ Se tem token ou user, aguardar validação completar (não redirecionar imediatamente)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }
  
  // ✅ Se tem token mas ainda não validou (dentro do timeout), aguardar
  if (hasToken && !user && !isLoading && !validationTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  // 1. Rotas públicas → liberado
  if (PUBLIC_ROUTES.includes(path)) {
    // Se já está autenticado e tenta acessar login, redireciona para home
    if (isAuthenticated && path === '/login') {
      console.log('🔓 Já autenticado: redirecionando para home');
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  // 2. ✅ CORREÇÃO CRÍTICA v1.0.103.1004: Sem sessão → redireciona para login
  // MAS apenas se realmente não tiver token E não estiver carregando E não tiver user
  // E já passou o timeout de validação (5 segundos)
  // Se tem token, aguardar validação completar (não redirecionar durante validação)
  if (requireAuth && !isAuthenticated && !user && !isLoading && !hasToken) {
    console.log('🔒 [ProtectedRoute] Rota protegida: redirecionando para login (sem token)');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  // ✅ CORREÇÃO: Se tem token mas ainda não validou após timeout, considerar inválido
  // Mas apenas se realmente passou o timeout (5 segundos)
  if (requireAuth && !isAuthenticated && !user && !isLoading && hasToken && validationTimeout) {
    console.log('🔒 [ProtectedRoute] Token não validado após timeout - redirecionando para login');
    // Limpar token inválido antes de redirecionar
    localStorage.removeItem('rendizy-token');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 3. ✅ CORREÇÃO CRÍTICA v1.0.103.1002 - NÃO deslogar ao verificar organização
  // Se for usuário de imobiliária (não superadmin) e não tiver organização, redirecionar para onboarding
  // MAS apenas se realmente não tiver organização (não durante validação)
  if (requireOrganization && isAuthenticated && path !== '/onboarding' && path !== '/login') {
    // ✅ CORREÇÃO: Apenas verificar organização se usuário não for superadmin
    // E apenas se realmente não tiver organização (não durante carregamento)
    if (user && user.role !== 'super_admin' && !organization && !user.organizationId) {
      // ✅ CORREÇÃO: Não fazer reload que pode causar logout
      // Apenas redirecionar para onboarding se realmente não tiver organização
      // O AuthContext já carrega organização, então se não tem aqui, realmente não tem
      console.log('🏢 [ProtectedRoute] Usuário sem organização: redirecionando para onboarding');
      return <Navigate to="/onboarding" replace />;
    }
  }

  // 4. Se não requer autenticação e está autenticado, redirecionar para home
  if (!requireAuth && isAuthenticated) {
    console.log('🔓 Já autenticado: redirecionando para home');
    return <Navigate to="/" replace />;
  }

  // 5. Usuário ok, seguir
  return <>{children}</>;
}
