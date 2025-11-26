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
  // ✅ CORREÇÃO v1.0.103.1005: Estado reativo para token (evita problemas com F5)
  const [hasTokenState, setHasTokenState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('rendizy-token');
    }
    return false;
  });

  // ✅ ARQUITETURA SQL v1.0.103.950 - SEMPRE valida token no backend SQL
  // ✅ BOAS PRÁTICAS v1.0.103.1000 - Validação periódica + Refresh automático
  // ✅ CORREÇÃO CRÍTICA v1.0.103.1001 - NUNCA limpar token em validações periódicas por erros de rede
  // NÃO usa localStorage como fonte de verdade - sempre busca do banco
  useEffect(() => {
    let isMounted = true; // Flag para evitar atualizações após desmontar
    
    // ✅ CORREÇÃO MANUS.IM: Simplificar loadUser - reduzir retries para 1
    const loadUser = async (retries = 1, skipDelay = false, isPeriodicCheck = false) => {
      try {
        // ✅ SOLUÇÃO SIMPLES: Token no header Authorization (não cookie)
        if (!isPeriodicCheck) {
          console.log('🔐 [AuthContext] Verificando sessão via token no header...');
        }

        // ✅ SEMPRE validar token no backend SQL via /auth/me
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        const token = localStorage.getItem('rendizy-token'); // ✅ Token salvo no localStorage
        
        // ✅ CORREÇÃO v1.0.103.1005: Atualizar estado do token
        if (token) {
          setHasTokenState(true);
        } else {
          setHasTokenState(false);
        }
        
        // ✅ CORREÇÃO MANUS.IM: Verificar token curto/legado antes de fazer requisição
        if (token && token.length < 80) {
          console.warn(`⚠️ [AuthContext] Token muito curto (${token.length} chars). Limpando e solicitando novo login.`);
          localStorage.removeItem('rendizy-token');
          if (isMounted && !isPeriodicCheck) {
            setUser(null);
            setOrganization(null);
            setIsLoading(false);
          }
          return;
        }
        
        if (!token) {
          if (!isPeriodicCheck) {
            console.log('⚠️ [AuthContext] Token não encontrado no localStorage');
          }
          // ✅ CORREÇÃO: Não limpar user imediatamente - pode estar em navegação
          // Apenas marcar como não carregando se não for periódica
          if (isMounted && !isPeriodicCheck) {
            // Não limpar user aqui - pode estar em transição de navegação
            setIsLoading(false);
            // ✅ CORREÇÃO v1.0.103.1003: Se não tem token e não tem user, limpar user
            // Mas apenas se realmente não for uma navegação em andamento
            if (!user) {
              setUser(null);
            }
          }
          return;
        }
        
        // ✅ CORREÇÃO CRÍTICA: Aguardar um pouco após login para garantir que sessão foi commitada no banco
        // Mas apenas na primeira chamada (não em validações periódicas)
        if (!skipDelay) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Adicionado este delay
        }
        
        // ✅ CORREÇÃO CRÍTICA: URL correta sem make-server-67caf26a
        // Usar a rota padrão /auth/me que está funcionando no backend
        const url = `https://${projectId}.supabase.co/functions/v1/rendizy-server/auth/me`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token, // ✅ Usar APENAS header customizado para evitar validação JWT automática do Supabase
            'apikey': publicAnonKey // ✅ Adicionar apikey para Supabase Edge Functions
            // ❌ REMOVIDO: Authorization header (causa validação JWT automática do Supabase)
          },
          credentials: 'omit' // ✅ EXPLÍCITO: não enviar credentials (resolve CORS com origin: "*")
        });

        // Ler resposta como texto primeiro
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ [AuthContext] Erro ao parsear resposta:', parseError);
          console.error('❌ [AuthContext] Resposta:', responseText.substring(0, 200));
          
          // ✅ CORREÇÃO MANUS.IM: Para erros de parse, apenas logar e retornar (sem retry infinito)
          // Erros de parse geralmente indicam problema no backend, não vale retentar
          console.error('❌ [AuthContext] Erro ao parsear resposta - problema no backend');
          
          // ✅ CORREÇÃO CRÍTICA: Em validações periódicas, NUNCA limpar token por erro de parse/rede
          // Pode ser erro transitório de rede - manter sessão ativa
          if (isMounted && !isPeriodicCheck) {
            setIsLoading(false);
          }
          return;
        }

        // ✅ Verificar se sessão é válida
        if (!response.ok || !data || !data.success) {
          // ✅ CORREÇÃO MANUS.IM: 401 = token inválido definitivo - limpar imediatamente SEM retry
          // ✅ CORREÇÃO v1.0.103.1005: Mas apenas se NÃO for validação periódica (evita limpar token durante digitação)
          if (response.status === 401) {
            // ✅ CRÍTICO: Em validações periódicas, NÃO limpar token imediatamente por 401
            // Pode ser erro temporário de rede ou sessão ainda não commitada
            if (isPeriodicCheck) {
              console.warn('⚠️ [AuthContext] 401 em validação periódica - mantendo token (pode ser erro temporário)');
              if (isMounted) {
                setIsLoading(false);
              }
              return;
            }
            
            console.log('❌ [AuthContext] Sessão inválida/expirada (401) - limpando token e resetando estado');
            localStorage.removeItem('rendizy-token');
            setHasTokenState(false);
            if (isMounted) {
              setUser(null);
              setOrganization(null);
              setIsLoading(false);
            }
            // Não redirecionar automaticamente - deixar ProtectedRoute fazer isso
            return;
          }
          
          // ✅ CORREÇÃO MANUS.IM: Para outros erros (rede, etc), tentar retry apenas UMA vez
          if (retries > 0 && !isPeriodicCheck) {
            console.warn(`⚠️ [AuthContext] Erro de rede, tentando novamente... (${retries} tentativa restante)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return loadUser(retries - 1, true, isPeriodicCheck);
          }
          
          // Se chegou aqui, todas as tentativas falharam
          if (isMounted && !isPeriodicCheck) {
            setIsLoading(false);
          }
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

        if (isMounted) {
          setUser(loggedUser);
        }

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
          if (isMounted) {
            setOrganization(org);
          }
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
                },
                credentials: 'omit' // ✅ EXPLÍCITO: não enviar credentials (resolve CORS com origin: "*")
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
                if (isMounted) {
                  setOrganization(org);
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ [AuthContext] Erro ao buscar organização:', error);
          }
        }

        // ✅ BOAS PRÁTICAS: Verificar se sessão está próxima de expirar e renovar automaticamente
        if (data.session && data.session.expiresAt) {
          const expiresAt = new Date(data.session.expiresAt);
          const timeUntilExpiry = expiresAt.getTime() - Date.now();
          const ONE_HOUR = 60 * 60 * 1000;
          
          // Se falta menos de 1 hora, sessão será renovada automaticamente pelo backend
          // (getSessionFromToken já faz isso com sliding expiration)
          if (timeUntilExpiry < ONE_HOUR) {
            console.log('✅ [AuthContext] Sessão próxima de expirar - renovada automaticamente pelo backend');
          }
        }

        if (!isPeriodicCheck) {
          console.log('✅ [AuthContext] Usuário carregado do backend SQL:', loggedUser);
        }
        
        // ✅ CRÍTICO: Sempre marcar como não carregando após sucesso
        if (isMounted && !isPeriodicCheck) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ [AuthContext] Erro ao carregar usuário:', error);
        // ✅ CORREÇÃO CRÍTICA: Em validações periódicas, NUNCA limpar token por erro de rede
        // Pode ser erro transitório - manter sessão ativa
        if (isMounted && !isPeriodicCheck) {
          setIsLoading(false);
        }
        // ✅ Em validação periódica, apenas logar o erro mas NÃO fazer nada
        // Isso evita deslogar o usuário durante digitação por erros de rede
      } finally {
        // ✅ CRÍTICO: Garantir que isLoading seja false após tentativa (mesmo em erro)
        // Isso evita que ProtectedRoute fique esperando indefinidamente
        if (isMounted && !isPeriodicCheck) {
          // Já foi setado acima, mas garantir aqui também
        }
      }
    };

    // ✅ CORREÇÃO MANUS.IM: Validar imediatamente ao montar (1 retry apenas)
    loadUser(1, false, false); // 1 retry, com delay, não é periódica

    // ✅ BOAS PRÁTICAS MUNDIAIS: Validação periódica (a cada 5 minutos)
    const periodicInterval = setInterval(() => {
      if (isMounted) {
        const token = localStorage.getItem('rendizy-token');
        if (token) {
          console.log('🔄 [AuthContext] Validação periódica da sessão...');
          loadUser(1, true, true); // 1 retry apenas, sem delay, é periódica
        }
      }
    }, 5 * 60 * 1000); // 5 minutos

    // ✅ BOAS PRÁTICAS MUNDIAIS: Visibility API - Revalidar quando aba volta ao foco
    const handleVisibilityChange = () => {
      if (isMounted && !document.hidden) {
        const token = localStorage.getItem('rendizy-token');
        if (token) {
          console.log('👁️ [AuthContext] Aba voltou ao foco - revalidando sessão...');
          loadUser(1, true, true); // Revalidar sessão
        }
      }
    };

    // ✅ BOAS PRÁTICAS MUNDIAIS: Window Focus - Revalidar quando janela ganha foco
    const handleWindowFocus = () => {
      if (isMounted) {
        const token = localStorage.getItem('rendizy-token');
        if (token) {
          console.log('🪟 [AuthContext] Janela ganhou foco - revalidando sessão...');
          loadUser(1, true, true); // Revalidar sessão
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    // Cleanup ao desmontar
    return () => {
      isMounted = false;
      clearInterval(periodicInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
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
        setHasTokenState(true); // ✅ CORREÇÃO v1.0.103.1005: Atualizar estado do token
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
              },
              credentials: 'omit' // ✅ EXPLÍCITO: não enviar credentials (resolve CORS com origin: "*")
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
          },
          credentials: 'omit' // ✅ EXPLÍCITO: não enviar credentials (resolve CORS com origin: "*")
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
      setHasTokenState(false); // ✅ CORREÇÃO v1.0.103.1005: Atualizar estado do token
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
    // ✅ CORREÇÃO v1.0.103.1005: isAuthenticated deve considerar token também (evita deslogar durante validação)
    // Usar hasTokenState ao invés de localStorage.getItem para ser reativo
    isAuthenticated: !!user || hasTokenState,
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
