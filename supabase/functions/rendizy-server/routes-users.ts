import { Hono } from 'npm:hono';
import { createHash } from 'node:crypto';
import * as kv from './kv_store.tsx';
import { getSupabaseClient } from './kv_store.tsx';

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

// Helper: Hash de senha (SHA256)
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
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
    const supabase = getSupabaseClient();

    // Construir query base
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtrar por organização se fornecido
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: sqlUsers, error: queryError } = await query;

    if (queryError) {
      console.error('❌ Erro ao buscar usuários no SQL:', queryError);
      return c.json({
        success: false,
        error: `Erro ao buscar usuários: ${queryError.message}`
      }, 500);
    }

    // Converter para formato esperado pelo frontend
    // Mapear 'type' para 'role' (type: 'imobiliaria' -> role: 'owner' ou 'admin', type: 'staff' -> role: 'staff')
    const users: User[] = (sqlUsers || []).map((sqlUser: any) => {
      // Mapear type para role
      let role: 'owner' | 'admin' | 'manager' | 'staff' | 'readonly' = 'staff';
      if (sqlUser.type === 'imobiliaria') {
        role = 'admin'; // Por padrão, imobiliaria é admin
      } else if (sqlUser.type === 'superadmin') {
        role = 'owner'; // SuperAdmin é owner
      } else {
        role = 'staff';
      }

      return {
        id: sqlUser.id,
        organizationId: sqlUser.organization_id,
        name: sqlUser.name,
        email: sqlUser.email,
        role,
        status: sqlUser.status as 'active' | 'invited' | 'suspended',
        createdAt: sqlUser.created_at,
        createdBy: sqlUser.created_by || '',
        permissions: getDefaultPermissions(role)
      };
    });

    return c.json({
      success: true,
      data: users,
      total: users.length
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
    const supabase = getSupabaseClient();

    // Try SQL first
    const { data: sqlUser, error: sqlError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (sqlError) {
      console.error('❌ Erro ao buscar usuário no SQL:', sqlError);
    }

    if (sqlUser) {
      const mapped = {
        id: sqlUser.id,
        organizationId: sqlUser.organization_id,
        name: sqlUser.name,
        email: sqlUser.email,
        role: sqlUser.type === 'imobiliaria' ? 'admin' : 'staff',
        status: sqlUser.status,
        createdAt: sqlUser.created_at,
        createdBy: sqlUser.created_by || ''
      };

      return c.json({ success: true, data: mapped });
    }

    // Fallback to KV for backward compatibility
    const kvUser = await kv.get(`user:${id}`);
    if (!kvUser) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({ success: true, data: kvUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ success: false, error: 'Failed to fetch user' }, 500);
  }
});

// GET /users/email/:email - Obter usuário por email
app.get('/email/:email', async (c) => {
  try {
    const email = c.req.param('email').toLowerCase();
    const supabase = getSupabaseClient();

    // Try SQL first
    const { data: sqlUser, error: sqlError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (sqlError) console.error('❌ Erro ao buscar usuário por email no SQL:', sqlError);

    if (sqlUser) {
      const mapped = {
        id: sqlUser.id,
        organizationId: sqlUser.organization_id,
        name: sqlUser.name,
        email: sqlUser.email,
        role: sqlUser.type === 'imobiliaria' ? 'admin' : 'staff',
        status: sqlUser.status,
        createdAt: sqlUser.created_at,
        createdBy: sqlUser.created_by || ''
      };

      return c.json({ success: true, data: mapped });
    }

    // Fallback to KV
    const users = await kv.getByPrefix('user:');
    const user = users.find((u: User) => u.email.toLowerCase() === email);

    if (!user) return c.json({ success: false, error: 'User not found' }, 404);

    return c.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return c.json({ success: false, error: 'Failed to fetch user' }, 500);
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
      username, // Novo: username opcional (se não fornecido, usa email)
      password, // Novo: senha opcional (se fornecido, cria como 'active')
      role = 'staff',
      status, // Se password fornecido, será 'active', senão 'invited'
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

    // Verificar se organização existe no SQL
    const supabase = getSupabaseClient();
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, limits_users')
      .eq('id', organizationId)
      .maybeSingle();

    if (orgError || !organization) {
      console.error('❌ Erro ao buscar organização:', orgError);
      return c.json({
        success: false,
        error: 'Organization not found'
      }, 404);
    }

    // Verificar se email já existe na organização no SQL
    const { data: existingUserByEmail, error: userByEmailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (userByEmailError) {
      console.error('❌ Erro ao verificar email existente:', userByEmailError);
      return c.json({
        success: false,
        error: 'Database error checking email'
      }, 500);
    }

    if (existingUserByEmail) {
      return c.json({
        success: false,
        error: 'User with this email already exists in this organization'
      }, 409);
    }

    // Verificar limites do plano
    const { data: orgUsersCount, error: countError } = await supabase
      .from('users')
      .select('count', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (countError) {
      console.error('❌ Erro ao contar usuários:', countError);
      return c.json({
        success: false,
        error: 'Database error counting users'
      }, 500);
    }

    const maxUsers = organization.limits_users;

    if (maxUsers !== -1 && (orgUsersCount?.count || 0) >= maxUsers) {
      return c.json({
        success: false,
        error: `Organization has reached the maximum number of users (${maxUsers})`
      }, 403);
    }

    // ✅ NOVO: Determinar status e username
    const finalStatus = password ? 'active' : (status || 'invited');
    const finalUsername = username || email.split('@')[0]; // Usa email se username não fornecido

    // ✅ NOVO: Se password fornecido, criar no SQL com senha hashada
    if (password) {
      const passwordHash = hashPassword(password);
      const now = new Date().toISOString();

      // Verificar se username já existe
      const { data: existingUserByUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', finalUsername)
        .maybeSingle();

      if (existingUserByUsername) {
        return c.json({
          success: false,
          error: 'Username já está em uso'
        }, 409);
      }

      // Criar no SQL
      const { data: sqlUser, error: sqlError } = await supabase
        .from('users')
        .insert({
          username: finalUsername,
          email: email.toLowerCase(),
          name,
          password_hash: passwordHash,
          type: role === 'owner' ? 'imobiliaria' : 'staff',
          status: finalStatus,
          organization_id: organizationId,
          created_by: createdBy,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (sqlError) {
        console.error('❌ Erro ao criar usuário no SQL:', sqlError);
        return c.json({
          success: false,
          error: `Erro ao criar usuário: ${sqlError.message}`
        }, 500);
      }

      console.log(`✅ User created in SQL: ${email} in org ${organization.slug} (${sqlUser.id})`);

      // Converter para formato esperado pelo frontend
      const user: User = {
        id: sqlUser.id,
        organizationId: sqlUser.organization_id,
        name: sqlUser.name,
        email: sqlUser.email,
        role,
        status: sqlUser.status as 'active' | 'invited' | 'suspended',
        createdAt: sqlUser.created_at,
        createdBy: sqlUser.created_by || createdBy,
        permissions: getDefaultPermissions(role)
      };

      return c.json({
        success: true,
        data: user
      }, 201);
    }

    // Se não tem password, criar no KV Store (compatibilidade)
    const id = generateId('user');
    const now = new Date().toISOString();

    const user: User = {
      id,
      organizationId,
      name,
      email: email.toLowerCase(),
      role,
      status: finalStatus,
      createdAt: now,
      createdBy,
      permissions: getDefaultPermissions(role)
    };

    // Se for convite, adicionar data de convite
    if (finalStatus === 'invited') {
      user.invitedAt = now;
    }

    // Se for ativo, adicionar data de entrada
    if (finalStatus === 'active') {
      user.joinedAt = now;
    }

    // Salvar no SQL (preferível) — manter id gerado para compatibilidade
    const { data: sqlUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id,
        username: finalUsername,
        email: user.email,
        name: user.name,
        type: role === 'owner' || role === 'admin' ? 'imobiliaria' : 'staff',
        status: user.status,
        organization_id: organizationId,
        invited_at: user.invitedAt || null,
        joined_at: user.joinedAt || null,
        created_at: user.createdAt,
        created_by: createdBy,
        updated_at: user.createdAt
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar usuário no SQL (fallback para KV):', insertError);

      // Fallback to KV if SQL fails
      await kv.set(`user:${id}`, user);
      console.log(`⚠️ User saved to KV due to SQL error: ${email} (${id})`);

      return c.json({ success: true, data: user }, 201);
    }

    console.log(`✅ User created in SQL: ${email} in org ${organization.slug} (${sqlUser.id})`);

    const mapped = {
      id: sqlUser.id,
      organizationId: sqlUser.organization_id,
      name: sqlUser.name,
      email: sqlUser.email,
      role,
      status: sqlUser.status,
      createdAt: sqlUser.created_at,
      createdBy: sqlUser.created_by || createdBy,
      permissions: getDefaultPermissions(role)
    };

    return c.json({ success: true, data: mapped }, 201);
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
    const supabase = getSupabaseClient();

    console.log(`[PATCH] Updating user ${id}`, body);

    // 1. Tentar atualizar no SQL
    const { data: sqlUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (sqlUser) {
      // Preparar updates para SQL
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      if (body.name) updates.name = body.name;
      if (body.status) updates.status = body.status;

      // Mapeamento reverso de role para type
      if (body.role) {
        if (body.role === 'owner' || body.role === 'admin') {
          updates.type = 'imobiliaria';
        } else {
          updates.type = 'staff';
        }
      }

      // Se password foi enviada (reset de senha)
      if (body.password) {
        updates.password_hash = hashPassword(body.password);
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao atualizar usuário no SQL:', updateError);
        return c.json({
          success: false,
          error: `Failed to update user in SQL: ${updateError.message}`
        }, 500);
      }

      return c.json({
        success: true,
        data: updatedUser, // Retorna objeto SQL raw ou poderia mapear
        message: 'User updated in SQL'
      });
    }

    // 2. Fallback para KV (se não achou no SQL)
    const user = await kv.get(`user:${id}`);
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found in SQL or KV'
      }, 404);
    }

    // Atualizar campos permitidos no KV
    const updated = {
      ...user,
      ...body,
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: new Date().toISOString()
    };

    // Se mudou role, atualizar permissões
    if (body.role && body.role !== user.role) {
      updated.permissions = getDefaultPermissions(body.role);
    }

    await kv.set(`user:${id}`, updated);
    console.log(`✅ User updated in KV: ${updated.email} (${id})`);

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
    const supabase = getSupabaseClient();

    // Try to delete from SQL first
    const { data: sqlUser } = await supabase.from('users').select('*').eq('id', id).maybeSingle();

    if (!sqlUser) {
      // fallback to KV
      const kvUser = await kv.get(`user:${id}`);
      if (!kvUser) return c.json({ success: false, error: 'User not found' }, 404);

      if (kvUser.role === 'owner') {
        const allUsers = await kv.getByPrefix('user:');
        const orgOwners = allUsers.filter((u: User) => u.organizationId === kvUser.organizationId && u.role === 'owner');
        if (orgOwners.length <= 1) return c.json({ success: false, error: 'Cannot delete the last owner of an organization' }, 403);
      }

      await kv.del(`user:${id}`);
      console.log(`✅ User deleted (KV): ${kvUser.email} (${id})`);
      return c.json({ success: true, message: 'User deleted successfully (KV)' });
    }

    // If SQL user exists, ensure not deleting last owner
    if (sqlUser.type === 'imobiliaria' || sqlUser.role === 'owner') {
      const { data: owners, error: ownersErr } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', sqlUser.organization_id)
        .eq('type', 'imobiliaria');

      if (ownersErr) {
        console.error('Error checking org owners:', ownersErr);
      } else if ((owners || []).length <= 1) {
        return c.json({ success: false, error: 'Cannot delete the last owner of an organization' }, 403);
      }

    }

    const { error: delErr } = await supabase.from('users').delete().eq('id', id);
    if (delErr) {
      console.error('Error deleting user in SQL:', delErr);
      return c.json({ success: false, error: 'Failed to delete user' }, 500);
    }

    console.log(`✅ User deleted (SQL): ${sqlUser.email} (${id})`);
    return c.json({ success: true, message: 'User deleted successfully (SQL)' });
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
    const supabase = getSupabaseClient();

    // Try SQL first
    const { data: sqlUser, error: sqlErr } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (sqlErr) console.error('Error fetching user in SQL for resend-invite:', sqlErr);

    if (sqlUser) {
      if (sqlUser.status !== 'invited') return c.json({ success: false, error: 'User is not in invited status' }, 400);
      const { data: updated, error: updErr } = await supabase.from('users').update({ invited_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (updErr) {
        console.error('Error updating invite in SQL:', updErr);
        return c.json({ success: false, error: 'Failed to resend invite' }, 500);
      }
      console.log(`✅ Invite resent (SQL): ${updated.email} (${id})`);
      return c.json({ success: true, data: updated, message: 'Invite resent successfully (SQL)' });
    }

    // Fallback to KV
    const user = await kv.get(`user:${id}`);
    if (!user) return c.json({ success: false, error: 'User not found' }, 404);
    if (user.status !== 'invited') return c.json({ success: false, error: 'User is not in invited status' }, 400);
    const updated = { ...user, invitedAt: new Date().toISOString() };
    await kv.set(`user:${id}`, updated);
    console.log(`✅ Invite resent (KV): ${user.email} (${id})`);
    return c.json({ success: true, data: updated, message: 'Invite resent successfully (KV)' });
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
    const supabase = getSupabaseClient();

    // Try SQL first
    const { data: sqlUser, error: sqlErr } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (sqlErr) console.error('Error fetching user in SQL for activate:', sqlErr);

    if (sqlUser) {
      if (sqlUser.status === 'active') return c.json({ success: false, error: 'User is already active' }, 400);
      const { data: activated, error: actErr } = await supabase.from('users').update({ status: 'active', joined_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (actErr) {
        console.error('Error activating user in SQL:', actErr);
        return c.json({ success: false, error: 'Failed to activate user' }, 500);
      }
      console.log(`✅ User activated (SQL): ${activated.email} (${id})`);
      return c.json({ success: true, data: activated, message: 'User activated successfully (SQL)' });
    }

    // Fallback to KV
    const user = await kv.get(`user:${id}`);
    if (!user) return c.json({ success: false, error: 'User not found' }, 404);
    if (user.status === 'active') return c.json({ success: false, error: 'User is already active' }, 400);
    const updated = { ...user, status: 'active', joinedAt: new Date().toISOString() };
    await kv.set(`user:${id}`, updated);
    console.log(`✅ User activated (KV): ${user.email} (${id})`);
    return c.json({ success: true, data: updated, message: 'User activated successfully (KV)' });
  } catch (error) {
    console.error('Error activating user:', error);
    return c.json({
      success: false,
      error: 'Failed to activate user'
    }, 500);
  }
});

export default app;
