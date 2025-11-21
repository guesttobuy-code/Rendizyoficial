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

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
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

  // 2. Sem sessão → redireciona para login
  if (requireAuth && !isAuthenticated) {
    console.log('🔒 Rota protegida: redirecionando para login');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 3. ✅ MELHORIA v1.0.103.400 - Regra multi-tenant: redirecionar para /onboarding se não tiver organização
  // Se for usuário de imobiliária (não superadmin) e não tiver organização, redirecionar para onboarding
  if (requireOrganization && isAuthenticated && path !== '/onboarding') {
    // Verificar se é usuário de imobiliária (não superadmin) e não tem organização
    if (user && user.role !== 'super_admin' && !organization && !user.organizationId) {
      // ✅ MELHORIA v1.0.103.400 - Verificar user_metadata do Supabase como fallback
      if (!checkingMetadata) {
        setCheckingMetadata(true);
        
        // Verificar se organization_id está em user_metadata
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.user_metadata?.organization_id) {
            const orgId = session.user.user_metadata.organization_id;
            console.log('✅ [ProtectedRoute] organization_id encontrado em user_metadata:', orgId);
            
            // Recarregar página para AuthContext carregar organização de user_metadata
            // Isso aciona o useEffect do AuthContext que já tem o fallback implementado
            window.location.reload();
          } else {
            console.log('🏢 [ProtectedRoute] Sem organização no contexto nem em user_metadata: redirecionando para onboarding');
          }
        }).catch((error) => {
          console.warn('⚠️ [ProtectedRoute] Erro ao verificar user_metadata:', error);
        });
        
        // Mostrar loading enquanto verifica
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600 dark:text-gray-400">
                Verificando organização...
              </p>
            </div>
          </div>
        );
      }
      
      // Se já verificou e não tem organização, redirecionar para onboarding
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
