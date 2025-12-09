/**
 * Singleton do Supabase Client
 * ✅ ARQUITETURA OAuth2 v1.0.103.1010: Evita múltiplas instâncias
 * 
 * Benefícios:
 * - Elimina warning de múltiplos GoTrueClient
 * - Estado único de sessão
 * - Evita corridas de storage
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info.tsx';

let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Obtém instância singleton do Supabase client
 * Usa publicAnonKey por padrão, mas permite sobrescrita para testes
 */
export function getSupabaseClient(forceServiceRole: boolean = false) {
  if (!supabaseClient) {
    const supabaseUrl = `https://${projectId}.supabase.co`;
    
    // Para testes/desenvolvimento, você pode usar SERVICE_ROLE_KEY aqui
    // IMPORTANTE: NUNCA exponha a Service Role Key no código frontend em produção!
    const apiKey = publicAnonKey;
    
    supabaseClient = createClient(supabaseUrl, apiKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
  }
  return supabaseClient;
}

/**
 * Define o token de autenticação no cliente Supabase
 * Chamado após login para autorizar requisições RLS-protegidas
 */
export function setSupabaseToken(token: string) {
  const client = getSupabaseClient();
  if (client && token) {
    // Define o header Authorization com o Bearer token
    client.auth.setSession({
      access_token: token,
      refresh_token: '',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: {
        id: '',
        aud: 'authenticated',
        role: 'authenticated',
        email: '',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }).catch(err => console.error('Erro ao definir token Supabase:', err));
  }
}

/**
 * Reseta o singleton (útil para testes ou logout completo)
 */
export function resetSupabaseClient() {
  supabaseClient = null;
}

