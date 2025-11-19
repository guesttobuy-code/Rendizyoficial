import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { createHash } from 'node:crypto';

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

// Inicializar SuperAdmins (se não existirem)
async function initializeSuperAdmin() {
  try {
    const superAdmins = [
      {
        id: 'superadmin_rppt',
        username: 'rppt',
        passwordHash: hashPassword('root'),
        name: 'Super Administrador',
        email: 'admin@rendizy.com',
        type: 'superadmin' as const,
        status: 'active' as const,
        createdAt: new Date().toISOString()
      },
      {
        id: 'superadmin_admin',
        username: 'admin',
        passwordHash: hashPassword('root'),
        name: 'Administrador',
        email: 'root@rendizy.com',
        type: 'superadmin' as const,
        status: 'active' as const,
        createdAt: new Date().toISOString()
      }
    ];

    let initialized = 0;

    for (const superAdmin of superAdmins) {
      const existing = await kv.get(`superadmin:${superAdmin.username}`);
      
      if (!existing) {
        await kv.set(`superadmin:${superAdmin.username}`, superAdmin);
        console.log(`✅ SuperAdmin inicializado: ${superAdmin.username} / root`);
        initialized++;
      }
    }

    if (initialized > 0) {
      console.log(`✅ ${initialized} SuperAdmin(s) inicializado(s) com sucesso`);
    } else {
      console.log('ℹ️ SuperAdmins já existem, nenhuma inicialização necessária');
    }
    
    return superAdmins[0];
  } catch (error) {
    console.error('❌ Erro ao inicializar SuperAdmins:', error);
    throw error;
  }
}

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

    // 1. Verificar se é SuperAdmin
    const superAdmin = await kv.get(`superadmin:${username}`);
    
    if (superAdmin && superAdmin.type === 'superadmin') {
      if (!verifyPassword(password, superAdmin.passwordHash)) {
        console.log('❌ Senha incorreta para SuperAdmin');
        return c.json({
          success: false,
          error: 'Usuário ou senha incorretos'
        }, 401);
      }

      if (superAdmin.status !== 'active') {
        console.log('❌ SuperAdmin suspenso');
        return c.json({
          success: false,
          error: 'Usuário suspenso'
        }, 403);
      }

      // Criar sessão
      const sessionId = generateSessionId();
      const token = generateToken();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas

      const session: Session = {
        id: sessionId,
        userId: superAdmin.id,
        username: superAdmin.username,
        type: 'superadmin',
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        lastActivity: now.toISOString()
      };

      await kv.set(`session:${token}`, session);

      // Atualizar lastLogin
      superAdmin.lastLogin = now.toISOString();
      await kv.set(`superadmin:${username}`, superAdmin);

      console.log('✅ Login SuperAdmin bem-sucedido:', username);

      return c.json({
        success: true,
        token,
        user: {
          id: superAdmin.id,
          username: superAdmin.username,
          name: superAdmin.name,
          email: superAdmin.email,
          type: 'superadmin',
          status: superAdmin.status
        },
        expiresAt: expiresAt.toISOString()
      });
    }

    // 2. Verificar se é usuário de imobiliária
    const allUsers = await kv.getByPrefix('usuario_imobiliaria:');
    const user = allUsers.find((u: UsuarioImobiliaria) => u.username === username);

    if (user) {
      if (!verifyPassword(password, user.passwordHash)) {
        console.log('❌ Senha incorreta para usuário de imobiliária');
        return c.json({
          success: false,
          error: 'Usuário ou senha incorretos'
        }, 401);
      }

      if (user.status !== 'active') {
        console.log('❌ Usuário suspenso');
        return c.json({
          success: false,
          error: 'Usuário suspenso'
        }, 403);
      }

      // Criar sessão
      const sessionId = generateSessionId();
      const token = generateToken();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas

      const session: Session = {
        id: sessionId,
        userId: user.id,
        username: user.username,
        type: 'imobiliaria',
        imobiliariaId: user.imobiliariaId,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        lastActivity: now.toISOString()
      };

      await kv.set(`session:${token}`, session);

      // Atualizar lastLogin
      user.lastLogin = now.toISOString();
      await kv.set(`usuario_imobiliaria:${user.id}`, user);

      // Buscar dados da imobiliária
      const imobiliaria = await kv.get(`imobiliaria:${user.imobiliariaId}`);

      console.log('✅ Login usuário imobiliária bem-sucedido:', username);

      return c.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          type: 'imobiliaria',
          role: user.role,
          status: user.status,
          imobiliariaId: user.imobiliariaId,
          imobiliaria: imobiliaria ? {
            id: imobiliaria.id,
            name: imobiliaria.name,
            slug: imobiliaria.slug
          } : null,
          permissions: user.permissions || []
        },
        expiresAt: expiresAt.toISOString()
      });
    }

    // Usuário não encontrado
    console.log('❌ Usuário não encontrado:', username);
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
// ✅ MELHORIA v1.0.103.400 - Usa removeSession do utils-session
app.post('/logout', async (c) => {
  try {
    // ✅ Usar helper removeSession ao invés de código manual
    const { removeSession } = await import('./utils-session.ts');
    const token = c.req.header('Authorization')?.split(' ')[1];

    if (!token) {
      return c.json({
        success: false,
        error: 'Token não fornecido'
      }, 400);
    }

    const removed = await removeSession(token);
    
    if (!removed) {
      return c.json({
        success: false,
        error: 'Erro ao fazer logout'
      }, 500);
    }

    console.log('✅ Logout bem-sucedido');

    return c.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao fazer logout'
    }, 500);
  }
});

// GET /auth/me - Verificar sessão atual
// ✅ MELHORIA v1.0.103.400 - Usa getSessionFromToken do utils-session
app.get('/me', async (c) => {
  try {
    // ✅ Usar helper getSessionFromToken ao invés de código manual
    const { getSessionFromToken } = await import('./utils-session.ts');
    const token = c.req.header('Authorization')?.split(' ')[1];

    if (!token) {
      return c.json({
        success: false,
        error: 'Token não fornecido'
      }, 401);
    }

    const session = await getSessionFromToken(token);

    if (!session) {
      return c.json({
        success: false,
        error: 'Sessão inválida ou expirada'
      }, 401);
    }

    // Buscar dados do usuário
    let user;
    if (session.type === 'superadmin') {
      user = await kv.get(`superadmin:${session.username}`);
    } else {
      const allUsers = await kv.getByPrefix('usuario_imobiliaria:');
      user = allUsers.find((u: UsuarioImobiliaria) => u.id === session.userId);
    }

    if (!user) {
      return c.json({
        success: false,
        error: 'Usuário não encontrado'
      }, 404);
    }

    // Se for usuário de imobiliária, buscar dados da imobiliária
    let imobiliaria = null;
    if (session.type === 'imobiliaria' && session.imobiliariaId) {
      imobiliaria = await kv.get(`imobiliaria:${session.imobiliariaId}`);
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        type: user.type,
        role: user.role,
        status: user.status,
        imobiliariaId: session.imobiliariaId,
        imobiliaria: imobiliaria ? {
          id: imobiliaria.id,
          name: imobiliaria.name,
          slug: imobiliaria.slug
        } : null,
        permissions: user.permissions || []
      },
      session: {
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        lastActivity: session.lastActivity
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

// POST /auth/init - Inicializar SuperAdmins (rota de setup)
app.post('/init', async (c) => {
  try {
    console.log('🔧 Inicializando SuperAdmins...');
    
    await initializeSuperAdmin();

    // Buscar todos os SuperAdmins
    const rpptAdmin = await kv.get('superadmin:rppt');
    const rootAdmin = await kv.get('superadmin:admin');

    return c.json({
      success: true,
      message: 'SuperAdmins inicializados com sucesso',
      superAdmins: [
        rpptAdmin ? {
          username: rpptAdmin.username,
          name: rpptAdmin.name,
          email: rpptAdmin.email
        } : null,
        rootAdmin ? {
          username: rootAdmin.username,
          name: rootAdmin.name,
          email: rootAdmin.email
        } : null
      ].filter(Boolean)
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar SuperAdmins:', error);
    return c.json({
      success: false,
      error: 'Erro ao inicializar SuperAdmins'
    }, 500);
  }
});

// Inicializar SuperAdmin ao carregar o módulo
initializeSuperAdmin().catch(console.error);

export default app;
