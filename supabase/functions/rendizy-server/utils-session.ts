/**
 * UTILS - Session Helpers
 * 
 * Helpers para gerenciamento de sessões de autenticação
 * Centraliza lógica de busca e validação de sessões do KV Store
 * 
 * @version 1.0.103.400
 * @updated 2025-11-17 - Implementação do Passo 1 do Tenancy Middleware
 */

import * as kv from './kv_store.tsx';

/**
 * Interface Session (compatível com routes-auth.ts)
 */
export interface Session {
  id: string;
  userId: string;
  username: string;
  type: 'superadmin' | 'imobiliaria';
  imobiliariaId?: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
}

/**
 * Busca sessão do KV Store a partir do token
 * Valida expiração e atualiza lastActivity automaticamente
 * 
 * @param token - Token de autenticação
 * @returns Promise<Session | null> - Sessão válida ou null se inválida/expirada
 */
export async function getSessionFromToken(token: string | undefined): Promise<Session | null> {
  if (!token) {
    return null;
  }

  try {
    // Buscar sessão do KV Store
    const session = await kv.get<Session>(`session:${token}`);

    if (!session) {
      console.log('⚠️ [getSessionFromToken] Sessão não encontrada para token');
      return null;
    }

    // Validar expiração
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (now > expiresAt) {
      console.log('⚠️ [getSessionFromToken] Sessão expirada, removendo do KV Store');
      await kv.del(`session:${token}`);
      return null;
    }

    // Atualizar lastActivity automaticamente
    session.lastActivity = now.toISOString();
    await kv.set(`session:${token}`, session);

    console.log(`✅ [getSessionFromToken] Sessão válida encontrada: ${session.username} (${session.type})`);

    return session;
  } catch (error) {
    console.error('❌ [getSessionFromToken] Erro ao buscar sessão:', error);
    return null;
  }
}

/**
 * Remove sessão do KV Store (logout)
 * 
 * @param token - Token de autenticação
 * @returns Promise<boolean> - true se removida com sucesso
 */
export async function removeSession(token: string | undefined): Promise<boolean> {
  if (!token) {
    return false;
  }

  try {
    await kv.del(`session:${token}`);
    console.log('✅ [removeSession] Sessão removida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [removeSession] Erro ao remover sessão:', error);
    return false;
  }
}

