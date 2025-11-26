/**
 * Serviço de Autenticação
 * ✅ ARQUITETURA OAuth2 v1.0.103.1010: Access/Refresh Tokens
 * 
 * Gerencia login, refresh, logout e validação de tokens
 */

import { projectId } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/rendizy-server`;

export interface LoginResponse {
  success: boolean;
  accessToken?: string;
  token?: string; // ✅ COMPATIBILIDADE: token antigo
  user?: {
    id: string;
    username: string;
    name: string;
    email: string;
    type: string;
    status: string;
    organizationId?: string;
  };
  expiresAt?: string;
  refreshExpiresAt?: string;
  error?: string;
}

export interface RefreshResponse {
  success: boolean;
  accessToken?: string;
  token?: string; // ✅ COMPATIBILIDADE: token antigo
  expiresAt?: string;
  refreshExpiresAt?: string;
  error?: string;
}

export interface UserResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    name: string;
    email: string;
    type: string;
    status: string;
    organizationId?: string;
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  error?: string;
}

/**
 * Faz login e retorna access token
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // ✅ Importante para cookies HttpOnly
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (data.success && data.accessToken) {
      // ✅ Salvar access token no localStorage (temporário, até migrar para cookie)
      localStorage.setItem('rendizy-token', data.accessToken);
      // ✅ COMPATIBILIDADE: Se não tem accessToken mas tem token, usar token
      if (!data.accessToken && data.token) {
        localStorage.setItem('rendizy-token', data.token);
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ [authService] Erro no login:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao fazer login'
    };
  }
}

/**
 * Renova access token usando refresh token (cookie HttpOnly)
 */
export async function refreshToken(): Promise<RefreshResponse> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // ✅ Importante para enviar cookie HttpOnly
    });

    const data = await response.json();
    
    if (data.success && data.accessToken) {
      // ✅ Atualizar access token no localStorage
      localStorage.setItem('rendizy-token', data.accessToken);
      // ✅ COMPATIBILIDADE: Se não tem accessToken mas tem token, usar token
      if (!data.accessToken && data.token) {
        localStorage.setItem('rendizy-token', data.token);
      }
    } else {
      // ✅ Se refresh falhou, limpar token
      localStorage.removeItem('rendizy-token');
    }
    
    return data;
  } catch (error) {
    console.error('❌ [authService] Erro no refresh:', error);
    localStorage.removeItem('rendizy-token');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao renovar token'
    };
  }
}

/**
 * Busca dados do usuário atual
 */
export async function getCurrentUser(): Promise<UserResponse> {
  try {
    const token = localStorage.getItem('rendizy-token');
    
    if (!token) {
      return {
        success: false,
        error: 'Token não encontrado'
      };
    }

    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (response.status === 401) {
      // ✅ Token expirado, tentar refresh
      const refreshResult = await refreshToken();
      if (refreshResult.success && refreshResult.accessToken) {
        // ✅ Tentar novamente com novo token
        const newToken = refreshResult.accessToken || refreshResult.token;
        if (newToken) {
          const retryResponse = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
      }
      
      // ✅ Se refresh falhou, limpar token
      localStorage.removeItem('rendizy-token');
      return {
        success: false,
        error: 'Sessão expirada'
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: 'Erro ao buscar usuário'
      };
    }

    return await response.json();
  } catch (error) {
    console.error('❌ [authService] Erro ao buscar usuário:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar usuário'
    };
  }
}

/**
 * Faz logout
 */
export async function logout(): Promise<void> {
  try {
    const token = localStorage.getItem('rendizy-token');
    
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
    }
  } catch (error) {
    console.error('❌ [authService] Erro no logout:', error);
  } finally {
    // ✅ Sempre limpar token local
    localStorage.removeItem('rendizy-token');
  }
}

