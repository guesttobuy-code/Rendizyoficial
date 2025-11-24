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

  // ✅ CORREÇÃO CRÍTICA: Mostrar loading enquanto verifica autenticação
  // MAS se já tem user, não bloquear navegação (pode estar em validação periódica)
  if (isLoading && !user) {
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

  // 2. ✅ CORREÇÃO CRÍTICA: Sem sessão → redireciona para login
  // MAS apenas se realmente não tiver user (não durante validação)
  if (requireAuth && !isAuthenticated && !user && !isLoading) {
    console.log('🔒 Rota protegida: redirecionando para login');
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
