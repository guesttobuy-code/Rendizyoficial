import { Hono } from 'npm:hono';
import { createHash } from 'node:crypto';
// ✅ ARQUITETURA SQL: Importar Supabase Client
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
// ✅ Usar getSessionFromToken que já funciona em outras rotas
import { getSessionFromToken } from './utils-session.ts';

// Helper: Obter cliente Supabase
// ✅ DESABILITADO JWT VALIDATION - Usar SERVICE_ROLE_KEY que bypassa JWT
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  // ✅ SOLUÇÃO: SERVICE_ROLE_KEY bypassa completamente validação JWT
  // Não precisa de configurações especiais - SERVICE_ROLE_KEY já ignora JWT
  return createClient(supabaseUrl, serviceRoleKey);
}

const app = new Hono();

// Tipos
interface SuperAdmin {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  email: string;
  type: 'superadmin';
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin?: string;
}

interface UsuarioImobiliaria {
  id: string;
  imobiliariaId: string;
  username: string;
  passwordHash: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'readonly';
  type: 'imobiliaria';
  status: 'active' | 'invited' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  permissions?: string[];
}

interface Session {
  id: string;
  userId: string;
  username: string;
  type: 'superadmin' | 'imobiliaria';
  imobiliariaId?: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
}

// Helper: Gerar hash de senha
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Helper: Verificar senha
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Helper: Gerar ID de sessão
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}${random}`;
}

// Helper: Gerar token de sessão
function generateToken(): string {
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random1}_${random2}`;
}

// ❌ REMOVIDO: initializeSuperAdmin() - SuperAdmins agora são criados na migration SQL
// Ver: supabase/migrations/20241120_create_users_table.sql

// POST /auth/login - Login
app.post('/login', async (c) => {
  try {
    console.log('🔐 POST /auth/login - Tentativa de login');
    
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({
        success: false,
        error: 'Usuário e senha são obrigatórios'
      }, 400);
    }

    console.log('👤 Login attempt:', { username });

    // ✅ ARQUITETURA SQL: Buscar usuário da tabela SQL ao invés de KV Store
    const supabase = getSupabaseClient();
    
    // Verificar se tabela users existe (debug)
    const { data: allUsers, error: checkError } = await supabase
      .from('users')
      .select('id, username, type')
      .limit(5);
    
    if (checkError) {
      console.error('❌ ERRO CRÍTICO: Tabela users não existe ou erro de acesso:', checkError);
      return c.json({
        success: false,
        error: `Erro ao acessar tabela users: ${checkError.message}`,
        details: checkError.code || 'UNKNOWN_ERROR'
      }, 500);
    }
    
    console.log('✅ Tabela users acessível. Usuários encontrados:', allUsers?.length || 0);
    
    // Buscar usuário na tabela SQL
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return c.json({
        success: false,
        error: `Erro ao buscar usuário: ${userError.message}`,
        details: userError.code || 'QUERY_ERROR'
      }, 500);
    }
    
    // Se não encontrou usuário, retornar erro
    if (!user) {
      console.log('❌ Usuário não encontrado:', username);
      console.log('📋 Usuários disponíveis na tabela:', allUsers?.map(u => u.username) || []);
      return c.json({
        success: false,
        error: 'Usuário ou senha incorretos'
      }, 401);
    }
    
    console.log('✅ Usuário encontrado na tabela SQL:', { id: user.id, username: user.username, type: user.type });
    
    // 1. Verificar se é SuperAdmin ou usuário de organização
    if (user.type === 'superadmin' || user.type === 'imobiliaria' || user.type === 'staff') {
      // ✅ ARQUITETURA SQL: Verificar senha usando hash do banco
      console.log('🔍 Verificando senha:', { 
        username, 
        passwordHashLength: user.password_hash?.length,
        passwordHashPrefix: user.password_hash?.substring(0, 20),
        computedHash: hashPassword(password),
        storedHash: user.password_hash
      });
      
      if (!verifyPassword(password, user.password_hash)) {
        console.log('❌ Senha incorreta para usuário:', username);
        console.log('🔍 Debug senha:', {
          computed: hashPassword(password),
          stored: user.password_hash,
          match: hashPassword(password) === user.password_hash
        });
        return c.json({
          success: false,
          error: 'Usuário ou senha incorretos'
        }, 401);
      }
      
      console.log('✅ Senha verificada com sucesso!');

      if (user.status !== 'active') {
        console.log('❌ Usuário suspenso:', username);
        return c.json({
          success: false,
          error: 'Usuário suspenso'
        }, 403);
      }

      // ✅ ARQUITETURA SQL: Atualizar last_login_at no banco
      const now = new Date();
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login_at: now.toISOString() })
        .eq('id', user.id);
      
      if (updateError) {
        console.warn('⚠️ Erro ao atualizar last_login_at:', updateError);
        // Não bloquear login se falhar atualização
      }

      // ✅ ARQUITETURA SQL: Gerar token e criar sessão no SQL
      const token = generateToken();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas

      // Salvar sessão no SQL
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert({
          token,
          user_id: user.id,
          username: user.username,
          type: user.type,
          organization_id: user.organization_id || null,
          expires_at: expiresAt.toISOString(),
          last_activity: now.toISOString()
        });

      if (sessionError) {
        console.warn('⚠️ Erro ao criar sessão no SQL:', sessionError);
        // Não bloquear login se falhar criar sessão, mas logar para debug
      } else {
        console.log('✅ Sessão criada no SQL com sucesso');
      }

      console.log('✅ Login bem-sucedido:', { username, type: user.type });

      // ✅ SOLUÇÃO SIMPLES - Token no JSON (como estava funcionando ontem)
      // Cookie HttpOnly pode ser adicionado depois, por enquanto token no JSON funciona
      console.log('✅ Login bem-sucedido - token retornado no JSON');

      return c.json({
        success: true,
        // ✅ Manter token no JSON para compatibilidade durante migração
        // Frontend ainda pode usar temporariamente, mas cookie é a fonte da verdade
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          type: user.type,
          status: user.status,
          organizationId: user.organization_id || undefined
        },
        expiresAt: expiresAt.toISOString()
      });
    }

    // ✅ ARQUITETURA SQL: Código unificado - todos os tipos de usuário já foram tratados acima
    // Se chegou aqui, usuário não foi encontrado ou tipo não suportado
    console.log('❌ Usuário não encontrado ou tipo não suportado:', username);
    return c.json({
      success: false,
      error: 'Usuário ou senha incorretos'
    }, 401);

  } catch (error) {
    console.error('❌ Erro no login:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao fazer login'
    }, 500);
  }
});

// POST /auth/logout - Logout
// ✅ ARQUITETURA SQL: Remove sessão do SQL
// ✅ MIGRAÇÃO COOKIES HTTPONLY v1.0.103.980 - Limpar cookie também
app.post('/logout', async (c) => {
  try {
    // ✅ MIGRAÇÃO: Tentar obter token do cookie primeiro, depois do header (compatibilidade)
    const cookieHeader = c.req.header('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    let token = cookies['rendizy-token'];
    
    // Fallback para header (compatibilidade durante migração)
    if (!token) {
      token = c.req.header('Authorization')?.split(' ')[1];
    }

    if (token) {
      // ✅ ARQUITETURA SQL: Remover sessão do SQL
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('token', token);

      if (error) {
        console.error('❌ Erro ao remover sessão:', error);
      } else {
        console.log('✅ Sessão removida do SQL');
      }
    }

    // ✅ MIGRAÇÃO COOKIES HTTPONLY: Limpar cookie
    c.header('Set-Cookie', 'rendizy-token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict');
    console.log('✅ Cookie limpo com sucesso');

    return c.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    // Mesmo com erro, limpar cookie
    c.header('Set-Cookie', 'rendizy-token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict');
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao fazer logout'
    }, 500);
  }
});

// ✅ Helper para parsear cookies
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
  });
  return cookies;
}

// GET /auth/me - Verificar sessão atual
// ✅ ARQUITETURA SQL: Busca sessão e usuário do SQL
// ✅ SOLUÇÃO SIMPLES - Token do header Authorization (como estava funcionando ontem)
app.get('/me', async (c) => {
  console.log('🚀 [auth/me] ROTA CHAMADA - URL:', c.req.url);
  console.log('🚀 [auth/me] MÉTODO:', c.req.method);
  console.log('🚀 [auth/me] PATH:', c.req.path);
  
  try {
    console.log('🔍 [auth/me] Requisição recebida - Headers:', {
      'X-Auth-Token': c.req.header('X-Auth-Token') ? 'present (' + c.req.header('X-Auth-Token')?.substring(0, 20) + '...)' : 'missing',
      'Authorization': c.req.header('Authorization') ? 'present' : 'missing',
      'apikey': c.req.header('apikey') ? 'present' : 'missing'
    });
    
    // ✅ SOLUÇÃO: Token do header customizado X-Auth-Token (evita validação JWT automática)
    // Fallback para Authorization para compatibilidade
    let token = c.req.header('X-Auth-Token');
    if (!token) {
      const authHeader = c.req.header('Authorization');
      console.log('🔍 [auth/me] Authorization header:', authHeader ? authHeader.substring(0, 30) + '...' : 'NONE');
      token = authHeader?.split(' ')[1];
    }
    
    console.log('🔍 [auth/me] Token extraído:', token ? token.substring(0, 20) + '...' : 'NONE');

    if (!token) {
      return c.json({
        success: false,
        error: 'Token não fornecido'
      }, 401);
    }

    // ✅ Usar getSessionFromToken que já funciona em outras rotas
    console.log('🔍 [auth/me] Buscando sessão com token:', token?.substring(0, 20) + '...');
    const session = await getSessionFromToken(token);
    
    if (!session) {
      console.log('❌ [auth/me] Sessão não encontrada ou inválida');
      return c.json({
        success: false,
        error: 'Sessão inválida ou expirada',
        code: 'SESSION_NOT_FOUND'
      }, 401);
    }
    
    console.log('✅ [auth/me] Sessão encontrada:', session.userId);

    // ✅ ARQUITETURA SQL: Buscar dados do usuário do SQL
    const supabase = getSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .single();

    if (userError || !user) {
      console.error('❌ Usuário não encontrado:', userError);
      return c.json({
        success: false,
        error: 'Usuário não encontrado'
      }, 404);
    }

    // ✅ ARQUITETURA SQL: Buscar organização se houver
    let organization = null;
    if (session.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('id', session.organization_id)
        .single();
      
      if (org) {
        organization = org;
      }
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        type: user.type,
        status: user.status,
        organizationId: session.organization_id || undefined,
        organization: organization ? {
          id: organization.id,
          name: organization.name,
          slug: organization.slug
        } : null
      },
      session: {
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        lastActivity: session.last_activity
      }
    });
  } catch (error) {
    console.error('❌ Erro ao verificar sessão:', error);
    return c.json({
      success: false,
      error: 'Erro ao verificar sessão'
    }, 500);
  }
});

// ❌ REMOVIDO: POST /auth/init - SuperAdmins agora são criados na migration SQL
// Ver: supabase/migrations/20241120_create_users_table.sql
// Se necessário verificar SuperAdmins, use: GET /auth/verify-users-table

// ============================================================================
// ROTA TEMPORÁRIA: Verificar tabela users (após migration)
// ============================================================================
app.get('/verify-users-table', async (c) => {
  try {
    const supabase = getSupabaseClient();
    
    // Buscar todos os SuperAdmins
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('type', 'superadmin');

    if (error) {
      return c.json({
        success: false,
        error: error.message,
        details: error
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Tabela users verificada com sucesso',
      count: users?.length || 0,
      users: users || []
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao verificar tabela users'
    }, 500);
  }
});

export default app;
