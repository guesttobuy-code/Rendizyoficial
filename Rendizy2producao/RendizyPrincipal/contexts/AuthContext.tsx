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
    const loadUser = async (retries = 1) => {
      try {
        // ✅ SOLUÇÃO SIMPLES: Token no header Authorization (não cookie)
        console.log('🔐 [AuthContext] Verificando sessão via token no header...');

        // ✅ SEMPRE validar token no backend SQL via /auth/me
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        const token = localStorage.getItem('rendizy-token'); // ✅ Token salvo no localStorage

        // ❗ Validação defensiva: tokens curtos (<80 chars) indicam sessão legada/truncada
        // que o backend atual não reconhece (retorna 401 em /auth/me). Limpar para forçar
        // um novo login com token longo (128+ chars) e evitar loops infinitos de retry.
        if (token && token.length < 80) {
          console.warn('⚠️ [AuthContext] Token legada/truncada detectada. Limpando para reautenticar.');
          localStorage.removeItem('rendizy-token');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        if (!token) {
          console.log('⚠️ [AuthContext] Token não encontrado no localStorage');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        // ✅ CORREÇÃO CRÍTICA: Aguardar um pouco após login para garantir que sessão foi commitada no banco
        // await new Promise(resolve => setTimeout(resolve, 500)); // Removido delay, agora o backend garante o commit
        
        // ✅ SOLUÇÃO DEFINITIVA: Usar o mesmo padrão das outras rotas (com make-server-67caf26a)
        // Isso garante que funcione igual às outras rotas que já estão funcionando
        const url = `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/auth/me`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token, // ✅ Usar APENAS header customizado para evitar validação JWT automática do Supabase
            'apikey': publicAnonKey // ✅ Adicionar apikey para Supabase Edge Functions
            // ❌ REMOVIDO: Authorization header (causa validação JWT automática do Supabase)
          }
          // ❌ REMOVIDO: credentials: 'include' (não funciona com origin: "*")
        });

        // Ler resposta como texto primeiro
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ [AuthContext] Erro ao parsear resposta:', parseError);
          console.error('❌ [AuthContext] Resposta:', responseText.substring(0, 200));
          
          // ✅ RETRY: Se erro de parse e ainda há retries, tentar novamente
          if (retries > 0) {
            console.warn(`⚠️ [AuthContext] Erro ao parsear JSON, tentando novamente... (${retries} tentativas restantes)`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Aumentado para 2s
            return loadUser(retries - 1);
          }
          
          // ✅ Se já temos usuário no estado, manter (pode ser problema temporário de rede)
          if (!user) {
            localStorage.removeItem('rendizy-token');
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        // ✅ Verificar se sessão é válida
        if (!response.ok || !data || !data.success) {
          // ❌ CORREÇÃO LOOP INFINITO: Não fazer retry para erro 401 - token inválido é definitivo
          // Apenas limpar estado e forçar novo login
          if (response.status === 401) {
            console.log('❌ [AuthContext] Sessão inválida/expirada (401) - limpando token e resetando estado');
            localStorage.removeItem('rendizy-token');
            setUser(null);
            setOrganization(null);
            setIsLoading(false);
            return;
          }
          
          // Para outros erros (rede, etc), tentar retry apenas uma vez
          if (retries > 0) {
            console.warn(`⚠️ [AuthContext] Erro de rede, tentando novamente... (${retries} tentativas restantes)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return loadUser(retries - 1);
          }
          
          console.log('❌ [AuthContext] Erro após retries:', data?.error);
          // Limpar estado se não houver usuário logado
          if (!user) {
            localStorage.removeItem('rendizy-token');
            setUser(null);
            setOrganization(null);
          }
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
                  'X-Auth-Token': token,
                  'apikey': publicAnonKey
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
        // ✅ MIGRAÇÃO: Cookie será limpo pelo backend se inválido
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
      
      // ✅ CORREÇÃO DEFINITIVA: Usar Authorization Bearer com anon key
      // O Supabase Edge Functions requer Authorization header para permitir requisições.
      // O backend (routes-auth.ts) não valida JWT para a rota /auth/login, então o anon key é aceito.
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': publicAnonKey,
          'Authorization': `Bearer ${publicAnonKey}` // ✅ Usar Authorization Bearer com anon key
        },
        body: JSON.stringify({ username, password }),
        // ✅ GARANTIR que credentials não seja usado
        credentials: 'omit' // ✅ Explícito: não enviar credentials
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
      console.log('✅ AuthContext: Login bem-sucedido - token recebido do backend');
      
      // ✅ SOLUÇÃO SIMPLES: Salvar token no localStorage e usar no header
      const token = data.token || data.data?.token;
      if (token) {
        localStorage.setItem('rendizy-token', token);
        console.log('✅ Token salvo no localStorage');
      }
      
      // ✅ SOLUÇÃO: Usar dados do usuário que já vêm na resposta do login
      // Não chamar /auth/me para evitar problema de validação JWT do Supabase
      console.log('✅ [AuthContext] Usando dados do usuário da resposta do login (evita problema JWT)');
      
      // ✅ Carregar dados do usuário da resposta do login (já vem completo)
      const backendUser = data.user || data.data?.user;
      
      if (!backendUser) {
        console.error('❌ [AuthContext] Dados do usuário não encontrados na resposta do login:', data);
        throw new Error('Dados do usuário não encontrados na resposta do login');
      }
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
                'X-Auth-Token': data.token,
                'apikey': publicAnonKey
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
      // ✅ SOLUÇÃO SIMPLES: Token no header Authorization (não cookie)
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const url = `https://${projectId}.supabase.co/functions/v1/rendizy-server/auth/logout`;
      const token = localStorage.getItem('rendizy-token');
      
      try {
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token || '', // ✅ Usar header customizado para evitar validação JWT
            'apikey': publicAnonKey
          }
          // ❌ REMOVIDO: credentials: 'include' (não funciona com origin: "*")
        });
        console.log('✅ [AuthContext] Sessão removida do backend SQL');
        } catch (error) {
          console.warn('⚠️ [AuthContext] Erro ao remover sessão do backend (continuando logout):', error);
      }
    } catch (error) {
      console.error('❌ [AuthContext] Erro ao fazer logout:', error);
    } finally {
      // ✅ Limpar estado local e token
      localStorage.removeItem('rendizy-token');
      setUser(null);
      setOrganization(null);
      
      console.log('✅ [AuthContext] Logout completo - estado e token limpos');
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
