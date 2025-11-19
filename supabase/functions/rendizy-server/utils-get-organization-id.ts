/**
 * UTILS - Get Organization ID (Híbrido: KV Store + Supabase Auth)
 * 
 * Helper centralizado para obter organization_id do usuário autenticado
 * Compatível com sistema atual (KV Store) e preparado para futuro (Supabase Auth)
 * 
 * PRIORIDADE:
 * 1. KV Store (sistema atual) - via tenancyMiddleware/imobiliariaId
 * 2. Supabase Auth (futuro) - via user_metadata.organization_id
 * 
 * @version 1.0.103.500
 * @updated 2025-11-17 - PASSO 3 - Helper híbrido compatível com KV Store
 */

import { Context } from 'npm:hono';
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getSessionFromToken } from './utils-session.ts';
import { getSupabaseClient } from './kv_store.tsx';

/**
 * Extrai o token do header Authorization do Hono Context
 * 
 * @param c - Context do Hono
 * @returns Token de autenticação ou undefined
 */
function extractTokenFromContext(c: Context): string | undefined {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }
  return authHeader.split(' ')[1];
}

/**
 * Converte imobiliariaId (KV Store) → organizationId (UUID SQL)
 * 
 * Usa função SQL lookup_organization_id_by_imobiliaria_id() para fazer o mapeamento
 * 
 * @param imobiliariaId - ID da imobiliária do KV Store (TEXT)
 * @returns Promise<string | null> - organizationId (UUID) ou null se não encontrado
 */
async function lookupOrganizationIdFromImobiliariaId(imobiliariaId: string | undefined): Promise<string | null> {
  if (!imobiliariaId) {
    return null;
  }

  try {
    const client = getSupabaseClient();
    
    // Tentar usar função SQL RPC primeiro (se disponível)
    try {
      const { data: rpcData, error: rpcError } = await client.rpc('lookup_organization_id_by_imobiliaria_id', {
        p_imobiliaria_id: imobiliariaId
      });

      if (!rpcError && rpcData) {
        // A função retorna UUID diretamente (não em objeto)
        const orgId = typeof rpcData === 'string' ? rpcData : rpcData?.organization_id || rpcData?.id || null;
        
        if (orgId) {
          console.log(`✅ [lookupOrganizationIdFromImobiliariaId] Mapeado via RPC: imobiliariaId=${imobiliariaId} → organizationId=${orgId}`);
          return orgId;
        }
      }
    } catch (rpcErr) {
      console.warn('⚠️ [lookupOrganizationIdFromImobiliariaId] RPC não disponível, usando query direta:', rpcErr);
    }
    
    // Fallback: Query direta na tabela organizations
    const { data, error } = await client
      .from('organizations')
      .select('id')
      .eq('legacy_imobiliaria_id', imobiliariaId)
      .maybeSingle();

    if (error) {
      console.error('❌ [lookupOrganizationIdFromImobiliariaId] Erro ao fazer lookup:', error);
      return null;
    }

    const orgId = data?.id || null;

    if (orgId) {
      console.log(`✅ [lookupOrganizationIdFromImobiliariaId] Mapeado via query: imobiliariaId=${imobiliariaId} → organizationId=${orgId}`);
    } else {
      console.warn(`⚠️ [lookupOrganizationIdFromImobiliariaId] ImobiliariaId não encontrado: ${imobiliariaId}`);
    }

    return orgId;
  } catch (error) {
    console.error('❌ [lookupOrganizationIdFromImobiliariaId] Erro inesperado:', error);
    return null;
  }
}

/**
 * Cria um Supabase client autenticado com o token do usuário
 * (para uso futuro com Supabase Auth)
 * 
 * @param token - Token de autenticação do usuário (Bearer token)
 * @returns SupabaseClient autenticado com o token do usuário
 */
function getAuthenticatedSupabaseClient(token: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || 
                          Deno.env.get('SUPABASE_KEY') ||
                          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY (ou SUPABASE_KEY) devem estar configuradas');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

/**
 * Obtém organization_id via Supabase Auth (fallback para futuro)
 * 
 * Busca organization_id nos metadados do usuário:
 * - user.user_metadata.organization_id
 * - user.raw_user_meta_data.organization_id
 * 
 * @param token - Token de autenticação
 * @returns Promise<string | null> - organization_id ou null se não encontrado
 */
async function getOrganizationIdFromSupabaseAuth(token: string): Promise<string | null> {
  try {
    const supabase = getAuthenticatedSupabaseClient(token);
    
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.warn('⚠️ [getOrganizationIdFromSupabaseAuth] Não foi possível obter usuário via Supabase Auth:', error);
      return null;
    }
    
    // Extrair organization_id dos metadados
    const orgId =
      (user.user_metadata as any)?.organization_id ??
      (user.raw_user_meta_data as any)?.organization_id;
    
    if (orgId) {
      console.log(`✅ [getOrganizationIdFromSupabaseAuth] organization_id encontrado: ${orgId} para usuário ${user.id}`);
    }
    
    return orgId || null;
  } catch (error) {
    console.warn('⚠️ [getOrganizationIdFromSupabaseAuth] Erro ao buscar via Supabase Auth:', error);
    return null;
  }
}

/**
 * Obtém organization_id do usuário autenticado (HÍBRIDO)
 * 
 * PRIORIDADE:
 * 1. KV Store (sistema atual) - via session.imobiliariaId → lookup SQL
 * 2. Supabase Auth (futuro) - via user_metadata.organization_id
 * 
 * @param c - Context do Hono (para extrair token)
 * @returns Promise<string> - organization_id (UUID) do usuário
 * @throws Error se usuário não estiver autenticado ou não tiver organization_id
 * 
 * @example
 * ```typescript
 * app.get('/route', async (c) => {
 *   const orgId = await getOrganizationIdOrThrow(c);
 *   // usar orgId (UUID)...
 * });
 * ```
 */
export async function getOrganizationIdOrThrow(c: Context): Promise<string> {
  try {
    // 1. Extrair token do header Authorization
    const token = extractTokenFromContext(c);
    
    if (!token) {
      console.error('❌ [getOrganizationIdOrThrow] Token ausente no header Authorization');
      throw new Error('Usuário não autenticado');
    }

    // 2. PRIORIDADE 1: Tentar buscar do KV Store (sistema atual)
    // Buscar sessão do KV Store via getSessionFromToken
    const session = await getSessionFromToken(token);
    
    if (session && session.imobiliariaId) {
      console.log(`🔍 [getOrganizationIdOrThrow] Tentando lookup via KV Store: imobiliariaId=${session.imobiliariaId}`);
      
      // Converter imobiliariaId → organizationId (UUID) via SQL
      const orgId = await lookupOrganizationIdFromImobiliariaId(session.imobiliariaId);
      
      if (orgId) {
        console.log(`✅ [getOrganizationIdOrThrow] organization_id encontrado via KV Store: ${orgId}`);
        return orgId;
      }
      
      console.warn(`⚠️ [getOrganizationIdOrThrow] ImobiliariaId não mapeado para organizationId: ${session.imobiliariaId}`);
    }

    // 3. PRIORIDADE 2: Tentar buscar do Supabase Auth (fallback para futuro)
    console.log('🔍 [getOrganizationIdOrThrow] Tentando buscar via Supabase Auth...');
    const orgIdFromAuth = await getOrganizationIdFromSupabaseAuth(token);
    
    if (orgIdFromAuth) {
      console.log(`✅ [getOrganizationIdOrThrow] organization_id encontrado via Supabase Auth: ${orgIdFromAuth}`);
      return orgIdFromAuth;
    }

    // 4. Nenhum método funcionou - retornar erro
    console.error('❌ [getOrganizationIdOrThrow] Não foi possível obter organization_id', {
      hasSession: !!session,
      hasImobiliariaId: session?.imobiliariaId || false,
      imobiliariaId: session?.imobiliariaId,
    });
    
    throw new Error('Usuário sem organização vinculada');
  } catch (error) {
    console.error('❌ [getOrganizationIdOrThrow] Erro ao obter organization_id:', error);
    throw error;
  }
}

/**
 * Obtém organization_id do usuário autenticado via Supabase Auth (versão que retorna undefined ao invés de throw)
 * 
 * Útil quando você quer tratar o caso de ausência de organization_id sem lançar exceção
 * 
 * @param c - Context do Hono (para extrair token)
 * @returns Promise<string | undefined> - organization_id do usuário ou undefined
 * 
 * @example
 * ```typescript
 * app.get('/route', async (c) => {
 *   const orgId = await getOrganizationId(c);
 *   if (!orgId) {
 *     return c.json({ error: 'Usuário sem organização' }, 403);
 *   }
 *   // usar orgId...
 * });
 * ```
 */
export async function getOrganizationId(c: Context): Promise<string | undefined> {
  try {
    return await getOrganizationIdOrThrow(c);
  } catch (error) {
    console.warn('⚠️ [getOrganizationId] Não foi possível obter organization_id:', error);
    return undefined;
  }
}

