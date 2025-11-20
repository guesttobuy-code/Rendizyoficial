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
 * Busca sessão a partir do token
 * ✅ SIMPLIFICADO: Valida token decodificando (formato: timestamp_random1_random2)
 * Se não encontrar no KV, valida direto do SuperAdmin
 * 
 * @param token - Token de autenticação
 * @returns Promise<Session | null> - Sessão válida ou null se inválida/expirada
 */
export async function getSessionFromToken(token: string | undefined): Promise<Session | null> {
  if (!token) {
    return null;
  }

  try {
    // Tentar buscar sessão do KV Store (pode não existir se login foi simplificado)
    let session = await kv.get<Session>(`session:${token}`).catch(() => null);

    if (session) {
      // Validar expiração se sessão existe no KV
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);

      if (now > expiresAt) {
        console.log('⚠️ [getSessionFromToken] Sessão expirada, removendo do KV Store');
        await kv.del(`session:${token}`).catch(() => null);
        return null;
      }

      // Atualizar lastActivity
      try {
        session.lastActivity = now.toISOString();
        await kv.set(`session:${token}`, session).catch(() => null);
      } catch (e) {
        // Ignorar erro ao atualizar
      }

      console.log(`✅ [getSessionFromToken] Sessão válida encontrada no KV: ${session.username}`);
      return session;
    }

    // ✅ SIMPLIFICADO: Se não encontrou no KV, decodificar token e buscar SuperAdmin
    // Formato token: timestamp_random1_random2
    const parts = token.split('_');
    if (parts.length >= 3) {
      const timestamp = parseInt(parts[0]);
      const now = Date.now();
      const expiresAt = timestamp + (24 * 60 * 60 * 1000); // 24 horas

      // Verificar se token ainda é válido (menos de 24 horas)
      if (now < expiresAt) {
        // Tentar extrair username do token (últimos caracteres podem indicar)
        // Por enquanto, buscar todos SuperAdmins e tentar validar
        // TODO: Melhorar decodificação do token
        console.log('⚠️ [getSessionFromToken] Token válido mas sem sessão no KV, criando sessão temporária');
        
        // Retornar null para forçar re-login ou buscar SuperAdmin direto
        // Por enquanto, retornar null para segurança
        return null;
      }
    }

    console.log('⚠️ [getSessionFromToken] Sessão não encontrada para token');
    return null;
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

