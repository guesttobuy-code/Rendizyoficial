/**
 * UTILS - Session Helpers
 * 
 * Helpers para gerenciamento de sessões de autenticação
 * ✅ ARQUITETURA SQL v1.0.103.950 - Busca sessões da tabela sessions do SQL
 * 
 * @version 1.0.103.950
 * @updated 2025-11-20 - Migrado para tabela sessions do SQL
 */

import { getSupabaseClient, del as kvDel } from './kv_store.tsx';

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
 * ✅ ARQUITETURA SQL v1.0.103.950 - Busca da tabela sessions do SQL
 * 
 * @param token - Token de autenticação
 * @returns Promise<Session | null> - Sessão válida ou null se inválida/expirada
 */
export async function getSessionFromToken(token: string | undefined): Promise<Session | null> {
  if (!token) {
    return null;
  }

  try {
    // ✅ ARQUITETURA SQL: Buscar sessão da tabela sessions do SQL
    console.log(`🔍 [getSessionFromToken] Buscando sessão na tabela SQL com token: ${token.substring(0, 20)}...`);
    const client = getSupabaseClient();
    
    // ✅ IMPORTANTE: SERVICE_ROLE_KEY não valida JWT - query direta na tabela
    const { data: sessionRow, error: sessionError } = await client
      .from('sessions')
      .select('*')
      .eq('token', token)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log(`🔍 [getSessionFromToken] Query result:`, {
      hasSession: !!sessionRow,
      hasError: !!sessionError,
      errorCode: sessionError?.code,
      errorMessage: sessionError?.message
    });

    if (sessionError || !sessionRow) {
      console.log('⚠️ [getSessionFromToken] Sessão não encontrada na tabela SQL');
      
      // ✅ Se erro for "Invalid JWT", pode ser que Supabase esteja validando automaticamente
      if (sessionError?.message?.includes('JWT') || sessionError?.message?.includes('jwt') || sessionError?.code === 'PGRST301') {
        console.error('❌ [getSessionFromToken] ERRO: Supabase retornou erro JWT (não deveria com SERVICE_ROLE_KEY)');
      }
      
      return null;
    }

    // ✅ Verificar se sessão expirou
    const now = new Date();
    const expiresAt = new Date(sessionRow.expires_at);
    if (now > expiresAt) {
      console.log('⚠️ [getSessionFromToken] Sessão expirada');
      return null;
    }

    // ✅ SLIDING EXPIRATION: Atualizar last_activity e estender expires_at se usuário está ativo
    const INACTIVITY_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 dias de inatividade
    const lastActivity = new Date(sessionRow.last_activity || sessionRow.created_at);
    const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
    
    // Se usuário está ativo (última atividade há menos de 7 dias), estender sessão
    if (timeSinceLastActivity < INACTIVITY_THRESHOLD) {
      const newExpiresAt = new Date(now.getTime() + INACTIVITY_THRESHOLD);
      
      // Atualizar last_activity e expires_at no banco (silenciosamente, não bloquear se falhar)
      client
        .from('sessions')
        .update({
          last_activity: now.toISOString(),
          expires_at: newExpiresAt.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('token', token)
        .then(({ error }) => {
          if (error) {
            console.warn('⚠️ [getSessionFromToken] Erro ao atualizar sessão (não crítico):', error);
          } else {
            console.log('✅ [getSessionFromToken] Sessão estendida automaticamente');
          }
        })
        .catch(err => {
          console.warn('⚠️ [getSessionFromToken] Erro ao atualizar sessão (não crítico):', err);
        });
    }

    // ✅ Buscar dados do usuário para montar Session
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, username, type, organization_id')
      .eq('id', sessionRow.user_id)
      .maybeSingle();

    if (userError || !user) {
      console.error('❌ [getSessionFromToken] Erro ao buscar usuário:', userError);
      return null;
    }

    // ✅ Montar Session compatível com interface (usar valores atualizados se foram atualizados)
    const session: Session = {
      id: sessionRow.id,
      userId: sessionRow.user_id,
      username: user.username,
      type: user.type === 'superadmin' ? 'superadmin' : 'imobiliaria',
      imobiliariaId: user.organization_id || undefined,
      createdAt: sessionRow.created_at,
      expiresAt: timeSinceLastActivity < INACTIVITY_THRESHOLD 
        ? new Date(now.getTime() + INACTIVITY_THRESHOLD).toISOString()
        : sessionRow.expires_at,
      lastActivity: now.toISOString()
    };

    console.log(`✅ [getSessionFromToken] Sessão válida encontrada no SQL: ${session.username}`);
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
    await kvDel(`session:${token}`);
    console.log('✅ [removeSession] Sessão removida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [removeSession] Erro ao remover sessão:', error);
    return false;
  }
}

