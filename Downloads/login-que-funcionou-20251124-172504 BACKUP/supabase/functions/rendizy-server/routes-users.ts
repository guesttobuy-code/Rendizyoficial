import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Tipos
interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'readonly';
  status: 'active' | 'invited' | 'suspended';
  invitedAt?: string;
  joinedAt?: string;
  createdAt: string;
  createdBy: string;
  permissions?: string[];
  avatar?: string;
}

// Helper: Gerar ID único
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}_${timestamp}${random}`;
}

// Helper: Obter permissões padrão por role
function getDefaultPermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    owner: ['*'], // Todas as permissões
    admin: [
      'properties:*',
      'reservations:*',
      'guests:*',
      'calendar:*',
      'reports:view',
      'users:view',
      'users:invite',
      'settings:view'
    ],
    manager: [
      'properties:view',
      'properties:edit',
      'reservations:*',
      'guests:*',
      'calendar:*',
      'reports:view'
    ],
    staff: [
      'properties:view',
      'reservations:view',
      'reservations:create',
      'reservations:edit',
      'guests:view',
      'guests:create',
      'calendar:view'
    ],
    readonly: [
      'properties:view',
      'reservations:view',
      'guests:view',
      'calendar:view',
      'reports:view'
    ]
  };

  return permissions[role] || permissions.readonly;
}

// Helper: Validar email
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// GET /users - Listar todos os usuários (opcional: filtrar por organização)
app.get('/', async (c) => {
  try {
    const organizationId = c.req.query('organizationId');
    
    let users = await kv.getByPrefix('user:');

    // Filtrar por organização se fornecido
    if (organizationId) {
      users = users.filter((u: User) => u.organizationId === organizationId);
    }

    // Ordenar por data de criação (mais recentes primeiro)
    const sorted = users.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ 
      success: true, 
      data: sorted,
      total: sorted.length 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch users' 
    }, 500);
  }
});

// GET /users/:id - Obter usuário por ID
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = await kv.get(`user:${id}`);

    if (!user) {
      return c.json({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }

    return c.json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch user' 
    }, 500);
  }
});

// GET /users/email/:email - Obter usuário por email
app.get('/email/:email', async (c) => {
  try {
    const email = c.req.param('email').toLowerCase();
    const users = await kv.getByPrefix('user:');
    const user = users.find((u: User) => u.email.toLowerCase() === email);

    if (!user) {
      return c.json({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }

    return c.json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch user' 
    }, 500);
  }
});

// POST /users - Criar novo usuário
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      organizationId, 
      name, 
      email, 
      role = 'staff', 
      status = 'invited',
      createdBy 
    } = body;

    // Validações
    if (!organizationId || !name || !email || !createdBy) {
      return c.json({ 
        success: false, 
        error: 'organizationId, name, email, and createdBy are required' 
      }, 400);
    }

    // Validar email
    if (!isValidEmail(email)) {
      return c.json({ 
        success: false, 
        error: 'Invalid email format' 
      }, 400);
    }

    // Verificar se organização existe
    const organization = await kv.get(`org:${organizationId}`);
    if (!organization) {
      return c.json({ 
        success: false, 
        error: 'Organization not found' 
      }, 404);
    }

    // Verificar se email já existe na organização
    const existingUsers = await kv.getByPrefix('user:');
    const emailExists = existingUsers.some((u: User) => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.organizationId === organizationId
    );

    if (emailExists) {
      return c.json({ 
        success: false, 
        error: 'User with this email already exists in this organization' 
      }, 409);
    }

    // Verificar limites do plano
    const orgUsers = existingUsers.filter((u: User) => u.organizationId === organizationId);
    const maxUsers = organization.settings.maxUsers;
    
    if (maxUsers !== -1 && orgUsers.length >= maxUsers) {
      return c.json({ 
        success: false, 
        error: `Organization has reached the maximum number of users (${maxUsers})` 
      }, 403);
    }

    // Criar usuário
    const id = generateId('user');
    const now = new Date().toISOString();

    const user: User = {
      id,
      organizationId,
      name,
      email: email.toLowerCase(),
      role,
      status,
      createdAt: now,
      createdBy,
      permissions: getDefaultPermissions(role)
    };

    // Se for convite, adicionar data de convite
    if (status === 'invited') {
      user.invitedAt = now;
    }

    // Se for ativo, adicionar data de entrada
    if (status === 'active') {
      user.joinedAt = now;
    }

    // Salvar no KV store
    await kv.set(`user:${id}`, user);

    console.log(`✅ User created: ${email} in org ${organization.slug} (${id})`);

    return c.json({ 
      success: true, 
      data: user 
    }, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to create user' 
    }, 500);
  }
});

// PATCH /users/:id - Atualizar usuário
app.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const user = await kv.get(`user:${id}`);
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }

    // Atualizar campos permitidos
    const updated = {
      ...user,
      ...body,
      id: user.id, // Não permitir mudar ID
      organizationId: user.organizationId, // Não permitir mudar organização
      email: user.email, // Não permitir mudar email
      createdAt: user.createdAt, // Não permitir mudar data de criação
      updatedAt: new Date().toISOString()
    };

    // Se mudou role, atualizar permissões
    if (body.role && body.role !== user.role) {
      updated.permissions = getDefaultPermissions(body.role);
    }

    // Se mudou status para active, adicionar joinedAt
    if (body.status === 'active' && user.status !== 'active' && !updated.joinedAt) {
      updated.joinedAt = new Date().toISOString();
    }

    await kv.set(`user:${id}`, updated);

    console.log(`✅ User updated: ${updated.email} (${id})`);

    return c.json({ 
      success: true, 
      data: updated 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to update user' 
    }, 500);
  }
});

// DELETE /users/:id - Deletar usuário
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const user = await kv.get(`user:${id}`);
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }

    // Não permitir deletar owners (deve ter pelo menos 1 owner por org)
    if (user.role === 'owner') {
      const allUsers = await kv.getByPrefix('user:');
      const orgOwners = allUsers.filter((u: User) => 
        u.organizationId === user.organizationId && u.role === 'owner'
      );

      if (orgOwners.length <= 1) {
        return c.json({ 
          success: false, 
          error: 'Cannot delete the last owner of an organization' 
        }, 403);
      }
    }

    await kv.del(`user:${id}`);

    console.log(`✅ User deleted: ${user.email} (${id})`);

    return c.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to delete user' 
    }, 500);
  }
});

// POST /users/:id/resend-invite - Reenviar convite
app.post('/:id/resend-invite', async (c) => {
  try {
    const id = c.req.param('id');

    const user = await kv.get(`user:${id}`);
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }

    if (user.status !== 'invited') {
      return c.json({ 
        success: false, 
        error: 'User is not in invited status' 
      }, 400);
    }

    // Atualizar data do convite
    const updated = {
      ...user,
      invitedAt: new Date().toISOString()
    };

    await kv.set(`user:${id}`, updated);

    console.log(`✅ Invite resent: ${user.email} (${id})`);

    return c.json({ 
      success: true, 
      data: updated,
      message: 'Invite resent successfully' 
    });
  } catch (error) {
    console.error('Error resending invite:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to resend invite' 
    }, 500);
  }
});

// POST /users/:id/activate - Ativar usuário (aceitar convite)
app.post('/:id/activate', async (c) => {
  try {
    const id = c.req.param('id');

    const user = await kv.get(`user:${id}`);
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }

    if (user.status === 'active') {
      return c.json({ 
        success: false, 
        error: 'User is already active' 
      }, 400);
    }

    // Ativar usuário
    const updated = {
      ...user,
      status: 'active',
      joinedAt: new Date().toISOString()
    };

    await kv.set(`user:${id}`, updated);

    console.log(`✅ User activated: ${user.email} (${id})`);

    return c.json({ 
      success: true, 
      data: updated,
      message: 'User activated successfully' 
    });
  } catch (error) {
    console.error('Error activating user:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to activate user' 
    }, 500);
  }
});

export default app;
