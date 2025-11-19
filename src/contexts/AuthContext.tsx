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

  // ✅ MELHORIA v1.0.103.400 - Carrega usuário com fallback para user_metadata
  // Load user from localStorage on mount, fallback to user_metadata from Supabase
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = localStorage.getItem('rendizy-user');
        const savedOrg = localStorage.getItem('rendizy-organization');
        
        // Carregar usuário do localStorage
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        
        // Carregar organização do localStorage (fonte primária)
        if (savedOrg) {
          setOrganization(JSON.parse(savedOrg));
        } else {
          // ✅ FALLBACK: Se não tiver organização no localStorage, 
          // tentar obter de user_metadata do Supabase
          try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user?.user_metadata?.organization_id) {
              const orgId = session.user.user_metadata.organization_id;
              console.log('✅ [AuthContext] organization_id encontrado em user_metadata:', orgId);
              
              // Buscar organização completa da API
              const { projectId, publicAnonKey } = await import('../utils/supabase/info');
              const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/rendizy-server/organizations/${orgId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${publicAnonKey}`
                  }
                }
              );
              
              if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                  const org: Organization = {
                    id: result.data.id,
                    name: result.data.name,
                    slug: result.data.slug,
                    plan: result.data.plan || 'professional',
                    status: result.data.status || 'active',
                    createdAt: new Date(result.data.created_at || Date.now()),
                    updatedAt: new Date(result.data.updated_at || Date.now())
                  };
                  
                  localStorage.setItem('rendizy-organization', JSON.stringify(org));
                  setOrganization(org);
                  console.log('✅ [AuthContext] Organização carregada de user_metadata:', org);
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ [AuthContext] Erro ao tentar obter organização de user_metadata:', error);
            // Não falhar se não conseguir obter de user_metadata
          }
        }
      } catch (error) {
        console.error('❌ [AuthContext] Error loading user:', error);
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
      const url = `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/auth/login`;
      
      console.log('🔐 AuthContext: URL de login:', url);
      console.log('🔐 AuthContext: Fazendo requisição...');
      
      // ✅ JWT desabilitado - remover Authorization header para permitir acesso direto
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // ✅ REMOVIDO: 'Authorization': `Bearer ${publicAnonKey}` - JWT desabilitado
        },
        body: JSON.stringify({ username, password })
      });
      
      console.log('🔐 AuthContext: Response status:', response.status, response.statusText);
      console.log('🔐 AuthContext: Response headers:', Object.fromEntries(response.headers.entries()));

      // Ler resposta como texto primeiro para ver o conteúdo (só pode ler uma vez)
      const responseText = await response.text();
      console.log('🔐 AuthContext: Response text (primeiros 500 chars):', responseText.substring(0, 500));

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
          console.log('🔐 AuthContext: Error data (JSON):', errorData);
        } catch (e) {
          // Se não for JSON, pode ser HTML de erro do Supabase
          console.error('❌ AuthContext: Resposta de erro não é JSON:', {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            responseText: responseText.substring(0, 500)
          });
          
          // Tentar extrair mensagem de erro do HTML ou usar mensagem padrão
          let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
          
          if (responseText.includes('record "new" has no field "updated_at"')) {
            errorMessage = 'Erro no banco de dados: campo updated_at ausente. Verifique as migrations.';
          } else if (responseText.includes('Internal Server Error')) {
            errorMessage = 'Erro interno do servidor. Verifique os logs do Supabase.';
          } else if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
            errorMessage = 'Servidor retornou HTML em vez de JSON. Verifique se a Edge Function está funcionando.';
          }
          
          throw new Error(errorMessage);
        }
        throw new Error(errorData.error || errorData.message || 'Erro ao fazer login');
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('🔐 AuthContext: Response data:', data);
      } catch (e) {
        console.error('❌ AuthContext: Erro ao fazer parse da resposta JSON:', {
          error: e,
          responseText: responseText.substring(0, 500),
          contentType: response.headers.get('content-type')
        });
        throw new Error(`Resposta inválida do servidor (não é JSON): ${responseText.substring(0, 100)}`);
      }
      
      if (!data || !data.success) {
        console.error('❌ AuthContext: Login falhou:', data);
        throw new Error(data?.error || 'Erro ao fazer login');
      }

      console.log('✅ Login bem-sucedido:', data.user);

      // ✅ MELHORIA v1.0.103.400 - Garantir que user tenha organizationId
      // Converter para formato do User
      const loggedUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.type === 'superadmin' ? 'super_admin' : (data.user.role || 'staff'),
        status: 'active',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        // ✅ Garantir organizationId se existir
        organizationId: data.user.imobiliaria?.id || data.user.organizationId || undefined
      };

      // Salvar token, usuário e organização
      localStorage.setItem('rendizy-token', data.token);
      localStorage.setItem('rendizy-user', JSON.stringify(loggedUser));
      
      // ✅ MELHORIA v1.0.103.400 - Salvar organização se existir
      if (data.user.imobiliaria) {
        const org: Organization = {
          id: data.user.imobiliaria.id,
          name: data.user.imobiliaria.name,
          slug: data.user.imobiliaria.slug,
          plan: 'professional',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        localStorage.setItem('rendizy-organization', JSON.stringify(org));
        setOrganization(org);
      } else if (data.user.organizationId) {
        // Se tiver organizationId mas não imobiliaria, buscar organização
        // (isso será feito no useEffect de loadUser)
        loggedUser.organizationId = data.user.organizationId;
      }

      setUser(loggedUser);

      return { success: true, user: loggedUser };
    } catch (error) {
      console.error('❌ AuthContext: Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('rendizy-token');
      
      if (token) {
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        const url = `https://${projectId}.supabase.co/functions/v1/rendizy-server/auth/logout`;
        
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setUser(null);
      setOrganization(null);
      localStorage.removeItem('rendizy-token');
      localStorage.removeItem('rendizy-user');
      localStorage.removeItem('rendizy-organization');
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
