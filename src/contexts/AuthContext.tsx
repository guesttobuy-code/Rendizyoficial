import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization, Permission, PermissionCheck, DEFAULT_PERMISSIONS } from '../types/tenancy';
import { createClient } from '@jsr/supabase__supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// ✅ MELHORIA v1.0.103.400 - Usa user_metadata do Supabase como fallback
// Cria cliente Supabase para acessar user_metadata
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, publicAnonKey);

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Auth actions
  login: (username: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  
  // Permission checks
  hasPermission: (check: PermissionCheck) => boolean;
  canCreate: (resource: string) => boolean;
  canRead: (resource: string) => boolean;
  canUpdate: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canExport: (resource: string) => boolean;
  
  // Role checks
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ ARQUITETURA SQL v1.0.103.950 - SEMPRE valida token no backend SQL
  // NÃO usa localStorage como fonte de verdade - sempre busca do banco
  useEffect(() => {
    const loadUser = async () => {
      try {
        // ✅ Buscar token do localStorage (apenas como referência)
        const token = localStorage.getItem('rendizy-token');
        
        if (!token) {
          console.log('⚠️ [AuthContext] Nenhum token encontrado - usuário não autenticado');
          setIsLoading(false);
          return;
        }

        // ✅ SEMPRE validar token no backend SQL via /auth/me
        console.log('🔐 [AuthContext] Validando token no backend SQL...');
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        const url = `https://${projectId}.supabase.co/functions/v1/rendizy-server/auth/me`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        // Ler resposta como texto primeiro
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ [AuthContext] Erro ao parsear resposta:', parseError);
          console.error('❌ [AuthContext] Resposta:', responseText.substring(0, 200));
          // Token inválido - limpar localStorage
          localStorage.removeItem('rendizy-token');
          setIsLoading(false);
          return;
        }

        // ✅ Verificar se sessão é válida
        if (!response.ok || !data || !data.success) {
          console.log('❌ [AuthContext] Sessão inválida ou expirada:', data?.error);
          // Token inválido/expirado - limpar localStorage
          localStorage.removeItem('rendizy-token');
          setIsLoading(false);
          return;
        }

        // ✅ Carregar dados do usuário do backend SQL (fonte da verdade)
        console.log('✅ [AuthContext] Sessão válida - carregando dados do backend SQL');
        
        const backendUser = data.user;
        const loggedUser: User = {
          id: backendUser.id,
          email: backendUser.email,
          name: backendUser.name,
          username: backendUser.username,
          role: backendUser.type === 'superadmin' ? 'super_admin' : (backendUser.role || 'staff'),
          status: backendUser.status || 'active',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          organizationId: backendUser.organizationId || backendUser.organization?.id || undefined
        };

        setUser(loggedUser);

        // ✅ Carregar organização do backend SQL se existir
        if (backendUser.organization) {
          const org: Organization = {
            id: backendUser.organization.id,
            name: backendUser.organization.name,
            slug: backendUser.organization.slug,
            plan: 'professional',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          setOrganization(org);
          console.log('✅ [AuthContext] Organização carregada do backend SQL:', org);
        } else if (backendUser.organizationId) {
          // Buscar organização se tiver apenas o ID
          try {
            const orgResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/rendizy-server/organizations/${backendUser.organizationId}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            
            if (orgResponse.ok) {
              const orgResult = await orgResponse.json();
              if (orgResult.success && orgResult.data) {
                const org: Organization = {
                  id: orgResult.data.id,
                  name: orgResult.data.name,
                  slug: orgResult.data.slug,
                  plan: orgResult.data.plan || 'professional',
                  status: orgResult.data.status || 'active',
                  createdAt: new Date(orgResult.data.created_at || Date.now()),
                  updatedAt: new Date(orgResult.data.updated_at || Date.now())
                };
                setOrganization(org);
              }
            }
          } catch (error) {
            console.warn('⚠️ [AuthContext] Erro ao buscar organização:', error);
          }
        }

        console.log('✅ [AuthContext] Usuário carregado do backend SQL:', loggedUser);
      } catch (error) {
        console.error('❌ [AuthContext] Erro ao carregar usuário:', error);
        // Em caso de erro, limpar localStorage
        localStorage.removeItem('rendizy-token');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('🔐 AuthContext: Fazendo login...', { username });
      
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const url = `https://${projectId}.supabase.co/functions/v1/rendizy-server/auth/login`;
      
      console.log('🔐 AuthContext: URL de login:', url);
      console.log('🔐 AuthContext: Fazendo requisição...');
      
      // ✅ CORREÇÃO DEFINITIVA: Usar APENAS apikey header SEM Authorization Bearer
      // O Supabase Edge Functions valida JWT automaticamente no gateway se Authorization estiver presente.
      // Ao remover Authorization e usar apenas apikey, permitimos que a requisição chegue ao nosso código.
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': publicAnonKey // ✅ Usar APENAS apikey, sem Authorization Bearer
        },
        body: JSON.stringify({ username, password })
      });
      
      // ✅ ARQUITETURA CORRETA: Ler body apenas UMA vez
      console.log('🔐 AuthContext: Response status:', response.status, response.statusText);

      // Ler resposta como texto primeiro (para poder fazer JSON.parse depois se necessário)
      const responseText = await response.text();
      console.log('🔐 AuthContext: Response text (primeiros 500 chars):', responseText.substring(0, 500));

      // Tentar parsear como JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('🔐 AuthContext: Response data (parsed):', data);
      } catch (parseError) {
        // Se falhou JSON, logar erro completo
        console.error('❌ AuthContext: Erro ao parsear JSON:', parseError);
        console.error('❌ AuthContext: Resposta completa:', responseText.substring(0, 500));
        throw new Error(`Erro HTTP ${response.status}: Resposta não é JSON válido - ${responseText.substring(0, 200)}`);
      }

      // Verificar se resposta é sucesso HTTP
      if (!response.ok) {
        console.error('❌ AuthContext: Login falhou - HTTP não OK:', { status: response.status, data });
        throw new Error(data?.error || data?.message || `Erro HTTP ${response.status}: ${response.statusText}`);
      }

      // Verificar se resposta indica sucesso
      if (!data || !data.success) {
        console.error('❌ AuthContext: Login falhou - success=false:', data);
        throw new Error(data?.error || data?.message || 'Erro ao fazer login');
      }

      // ✅ Login bem-sucedido!
      console.log('✅ AuthContext: Login bem-sucedido - sessão criada no backend SQL');

      // ✅ ARQUITETURA SQL v1.0.103.950 - Salvar APENAS token no localStorage
      // Dados do usuário vêm SEMPRE do backend SQL via /auth/me
      localStorage.setItem('rendizy-token', data.token);
      
      // ❌ NÃO salvar dados do usuário no localStorage
      // ✅ Buscar dados do usuário do backend SQL (fonte da verdade)
      console.log('🔐 [AuthContext] Buscando dados do usuário do backend SQL...');
      const meUrl = `https://${projectId}.supabase.co/functions/v1/rendizy-server/auth/me`;
      const meResponse = await fetch(meUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        }
      });

      // ✅ ARQUITETURA CORRETA: Ler body apenas UMA vez
      const meResponseText = await meResponse.text();
      console.log('🔐 [AuthContext] /auth/me Response status:', meResponse.status, meResponse.statusText);
      console.log('🔐 [AuthContext] /auth/me Response text (primeiros 500 chars):', meResponseText.substring(0, 500));

      let meData;
      try {
        meData = JSON.parse(meResponseText);
        console.log('🔐 [AuthContext] /auth/me Response data (parsed):', meData);
      } catch (parseError) {
        console.error('❌ [AuthContext] Erro ao parsear /auth/me JSON:', parseError);
        console.error('❌ [AuthContext] Resposta completa:', meResponseText.substring(0, 500));
        throw new Error(`Erro HTTP ${meResponse.status}: Resposta não é JSON válido - ${meResponseText.substring(0, 200)}`);
      }

      if (!meResponse.ok) {
        console.error('❌ [AuthContext] /auth/me falhou - HTTP não OK:', { status: meResponse.status, data: meData });
        throw new Error(meData?.error || meData?.message || `Erro HTTP ${meResponse.status}: ${meResponse.statusText}`);
      }

      if (!meData || !meData.success || !meData.user) {
        console.error('❌ [AuthContext] /auth/me falhou - success=false ou user ausente:', meData);
        throw new Error(meData?.error || meData?.message || 'Erro ao obter dados do usuário do backend');
      }

      // ✅ Carregar dados do usuário do backend SQL
      const backendUser = meData.user;
      const loggedUser: User = {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.name,
        username: backendUser.username,
        role: backendUser.type === 'superadmin' ? 'super_admin' : (backendUser.role || 'staff'),
        status: backendUser.status || 'active',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        organizationId: backendUser.organizationId || backendUser.organization?.id || undefined
      };

      setUser(loggedUser);

      // ✅ Carregar organização do backend SQL se existir
      if (backendUser.organization) {
        const org: Organization = {
          id: backendUser.organization.id,
          name: backendUser.organization.name,
          slug: backendUser.organization.slug,
          plan: 'professional',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setOrganization(org);
        console.log('✅ [AuthContext] Organização carregada do backend SQL:', org);
      } else if (backendUser.organizationId) {
        // Buscar organização se tiver apenas o ID
        try {
          const orgResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/rendizy-server/organizations/${backendUser.organizationId}`,
            {
              headers: {
                'Authorization': `Bearer ${data.token}`
              }
            }
          );
          
          if (orgResponse.ok) {
            const orgResult = await orgResponse.json();
            if (orgResult.success && orgResult.data) {
              const org: Organization = {
                id: orgResult.data.id,
                name: orgResult.data.name,
                slug: orgResult.data.slug,
                plan: orgResult.data.plan || 'professional',
                status: orgResult.data.status || 'active',
                createdAt: new Date(orgResult.data.created_at || Date.now()),
                updatedAt: new Date(orgResult.data.updated_at || Date.now())
              };
              setOrganization(org);
            }
          }
        } catch (error) {
          console.warn('⚠️ [AuthContext] Erro ao buscar organização:', error);
        }
      }

      console.log('✅ [AuthContext] Usuário carregado do backend SQL:', loggedUser);

      // ✅ Retornar user com type para compatibilidade com LoginPage
      return { 
        success: true, 
        user: {
          ...loggedUser,
          type: backendUser.type, // Manter type original da API para LoginPage
          username: backendUser.username // Manter username também
        }
      };
    } catch (error) {
      console.error('❌ AuthContext: Erro no login:', error);
      // ✅ CORREÇÃO: Sempre retornar objeto com success: false, nunca retornar undefined
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao fazer login';
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('rendizy-token');
      
      // ✅ ARQUITETURA SQL v1.0.103.950 - Remover sessão do backend SQL
      if (token) {
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        const url = `https://${projectId}.supabase.co/functions/v1/rendizy-server/auth/logout`;
        
        try {
          await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('✅ [AuthContext] Sessão removida do backend SQL');
        } catch (error) {
          console.warn('⚠️ [AuthContext] Erro ao remover sessão do backend (continuando logout):', error);
        }
      }
    } catch (error) {
      console.error('❌ [AuthContext] Erro ao fazer logout:', error);
    } finally {
      // ✅ Limpar estado local
      setUser(null);
      setOrganization(null);
      
      // ✅ Limpar token do localStorage (único item salvo)
      localStorage.removeItem('rendizy-token');
      
      // ❌ NÃO há mais rendizy-user ou rendizy-organization no localStorage
      console.log('✅ [AuthContext] Logout completo - estado limpo');
    }
  };

  const switchOrganization = async (organizationId: string) => {
    // TODO: Implementar troca de organização para super_admin
    console.log('Switching to organization:', organizationId);
  };

  const getUserPermissions = (): Permission[] => {
    if (!user) return [];
    
    // Custom permissions override default role permissions
    if (user.customPermissions && user.customPermissions.length > 0) {
      return user.customPermissions;
    }
    
    // Return default permissions for role
    return DEFAULT_PERMISSIONS[user.role] || [];
  };

  const hasPermission = ({ resource, action, resourceId }: PermissionCheck): boolean => {
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.role === 'super_admin') return true;
    
    const permissions = getUserPermissions();
    
    const permission = permissions.find(p => p.resource === resource);
    if (!permission) return false;
    
    // Check if action is allowed
    if (!permission.actions.includes(action)) return false;
    
    // Check conditions if present
    if (permission.conditions) {
      if (permission.conditions.own_only && resourceId) {
        // TODO: Implement ownership check
        return true;
      }
      
      if (permission.conditions.properties && resourceId) {
        return permission.conditions.properties.includes(resourceId);
      }
    }
    
    return true;
  };

  const canCreate = (resource: string) => 
    hasPermission({ resource: resource as any, action: 'create' });
  
  const canRead = (resource: string) => 
    hasPermission({ resource: resource as any, action: 'read' });
  
  const canUpdate = (resource: string) => 
    hasPermission({ resource: resource as any, action: 'update' });
  
  const canDelete = (resource: string) => 
    hasPermission({ resource: resource as any, action: 'delete' });
  
  const canExport = (resource: string) => 
    hasPermission({ resource: resource as any, action: 'export' });

  const value: AuthContextType = {
    user,
    organization,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    switchOrganization,
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExport,
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Retorna valores padrão ao invés de lançar erro
    // Isso permite que componentes usem useAuth mesmo se não estiverem
    // dentro de um AuthProvider (útil para desenvolvimento e testes)
    // console.warn('useAuth usado fora do AuthProvider - retornando valores padrão'); // SILENCIADO v1.0.103.299
    return {
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => {},
      logout: async () => {},
      switchOrganization: async () => {},
      hasPermission: () => false,
      canCreate: () => false,
      canRead: () => false,
      canUpdate: () => false,
      canDelete: () => false,
      canExport: () => false,
      isSuperAdmin: false,
      isAdmin: false,
      isManager: false,
    };
  }
  return context;
}
