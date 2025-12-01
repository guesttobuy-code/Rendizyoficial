<<<<<<< HEAD
import { Hono, Context } from 'npm:hono';
=======
import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
import { ensureOrganizationId } from './utils-organization.ts';
import { successResponse, errorResponse } from './utils-response.ts';
import { safeUpsert } from './utils-db-safe.ts';
import { getSupabaseClient } from './kv_store.tsx';
// ✅ REFATORADO v1.0.103.500 - Helper híbrido para organization_id (UUID)
import { getOrganizationIdOrThrow } from './utils-get-organization-id.ts';

const app = new Hono();

<<<<<<< HEAD
// ✅ EXPORTAR FUNÇÕES INDIVIDUAIS para registro direto (como locationsRoutes)

=======
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
// Tipos
interface Organization {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone: string;
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  trialEndsAt?: string;
  createdAt: string;
  createdBy: string;
  settings: {
    maxUsers: number;
    maxProperties: number;
    maxReservations: number;
    features: string[];
  };
  billing?: {
    mrr: number;
    billingDate: number;
    paymentMethod?: string;
  };
}

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
  permissions?: string[];
}

// Helper: Gerar ID único
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}_${timestamp}${random}`;
}

// Helper: Gerar slug válido
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Helper: Validar convenção de naming
function validateSlug(slug: string): { valid: boolean; error?: string } {
  // Master: apenas "rendizy"
  if (slug === 'rendizy') {
    return { valid: false, error: 'Slug "rendizy" é reservado para a organização master' };
  }

  // Clientes: deve começar com "rendizy_"
  if (!slug.startsWith('rendizy_')) {
    return { valid: false, error: 'Slug de cliente deve começar com "rendizy_"' };
  }

  // Validar caracteres
  if (!/^rendizy_[a-z0-9_]+$/.test(slug)) {
    return { valid: false, error: 'Slug deve conter apenas letras minúsculas, números e underscore' };
  }

  return { valid: true };
}

// Helper: Obter limites do plano
function getPlanLimits(plan: string) {
  const limits: Record<string, any> = {
    free: {
      maxUsers: 2,
      maxProperties: 5,
      maxReservations: 50,
      features: ['basic_calendar', 'basic_reports']
    },
    basic: {
      maxUsers: 5,
      maxProperties: 20,
      maxReservations: 500,
      features: ['calendar', 'reports', 'integrations']
    },
    professional: {
      maxUsers: 15,
      maxProperties: 100,
      maxReservations: 5000,
      features: ['calendar', 'advanced_reports', 'integrations', 'api_access', 'custom_branding']
    },
    enterprise: {
      maxUsers: -1, // ilimitado
      maxProperties: -1,
      maxReservations: -1,
      features: ['all']
    }
  };

  return limits[plan] || limits.free;
}

// GET /organizations - Listar todas as organizações
<<<<<<< HEAD
// ✅ CORRIGIDO: Usa SQL direto ao invés de KV Store
export async function listOrganizations(c: Context) {
  try {
    const client = getSupabaseClient();
    
    const { data: organizations, error } = await client
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar organizações:', error);
      throw error;
    }

    // Converter formato SQL para formato esperado pelo frontend
    const formatted = (organizations || []).map((org: any) => ({
      id: org.id,
      slug: org.slug,
      name: org.name,
      email: org.email,
      phone: org.phone || '',
      plan: org.plan,
      status: org.status,
      trialEndsAt: org.trial_ends_at,
      createdAt: org.created_at,
      // Converter colunas individuais para formato esperado pelo frontend
      settings: {
        maxUsers: org.settings_max_users ?? org.limits_users ?? -1,
        maxProperties: org.settings_max_properties ?? org.limits_properties ?? -1,
        maxReservations: org.limits_reservations ?? -1,
        features: org.plan === 'enterprise' ? ['all'] : []
      },
      billing: {
        email: org.billing_email || org.email,
        cycle: org.billing_cycle || 'monthly',
        nextBillingDate: org.next_billing_date
      }
    }));

    return c.json({ 
      success: true, 
      data: formatted,
      total: formatted.length 
=======
app.get('/', async (c) => {
  try {
    const organizations = await kv.getByPrefix('org:');
    
    // Ordenar por data de criação (mais recentes primeiro)
    const sorted = organizations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ 
      success: true, 
      data: sorted,
      total: sorted.length 
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch organizations' 
    }, 500);
  }
<<<<<<< HEAD
}

// GET /organizations/:id - Obter organização por ID
// ✅ CORRIGIDO: Usa SQL direto ao invés de KV Store
export async function getOrganization(c: Context) {
  try {
    const id = c.req.param('id');
    const client = getSupabaseClient();
    
    const { data: organization, error } = await client
      .from('organizations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar organização:', error);
      throw error;
    }
=======
});

// GET /organizations/:id - Obter organização por ID
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const organization = await kv.get(`org:${id}`);
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941

    if (!organization) {
      return c.json({ 
        success: false, 
        error: 'Organization not found' 
      }, 404);
    }

<<<<<<< HEAD
    // Converter formato SQL para formato esperado pelo frontend
    const formatted = {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      email: organization.email,
      phone: organization.phone || '',
      plan: organization.plan,
      status: organization.status,
      trialEndsAt: organization.trial_ends_at,
      createdAt: organization.created_at,
      // Converter colunas individuais para formato esperado pelo frontend
      settings: {
        maxUsers: organization.settings_max_users ?? organization.limits_users ?? -1,
        maxProperties: organization.settings_max_properties ?? organization.limits_properties ?? -1,
        maxReservations: organization.limits_reservations ?? -1,
        features: organization.plan === 'enterprise' ? ['all'] : []
      },
      billing: {
        email: organization.billing_email || organization.email,
        cycle: organization.billing_cycle || 'monthly',
        nextBillingDate: organization.next_billing_date
      }
    };

    return c.json({ 
      success: true, 
      data: formatted 
=======
    return c.json({ 
      success: true, 
      data: organization 
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch organization' 
    }, 500);
  }
<<<<<<< HEAD
}

// GET /organizations/slug/:slug - Obter organização por slug
// ✅ CORRIGIDO: Usa SQL direto ao invés de KV Store
export async function getOrganizationBySlug(c: Context) {
  try {
    const slug = c.req.param('slug');
    const client = getSupabaseClient();
    
    const { data: organization, error } = await client
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar organização por slug:', error);
      throw error;
    }
=======
});

// GET /organizations/slug/:slug - Obter organização por slug
app.get('/slug/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const organizations = await kv.getByPrefix('org:');
    const organization = organizations.find((org: Organization) => org.slug === slug);
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941

    if (!organization) {
      return c.json({ 
        success: false, 
        error: 'Organization not found' 
      }, 404);
    }

<<<<<<< HEAD
    // Converter formato SQL para formato esperado pelo frontend
    const formatted = {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      email: organization.email,
      phone: organization.phone || '',
      plan: organization.plan,
      status: organization.status,
      trialEndsAt: organization.trial_ends_at,
      createdAt: organization.created_at,
      // Converter colunas individuais para formato esperado pelo frontend
      settings: {
        maxUsers: organization.settings_max_users ?? organization.limits_users ?? -1,
        maxProperties: organization.settings_max_properties ?? organization.limits_properties ?? -1,
        maxReservations: organization.limits_reservations ?? -1,
        features: organization.plan === 'enterprise' ? ['all'] : []
      },
      billing: {
        email: organization.billing_email || organization.email,
        cycle: organization.billing_cycle || 'monthly',
        nextBillingDate: organization.next_billing_date
      }
    };

    return c.json({ 
      success: true, 
      data: formatted 
=======
    return c.json({ 
      success: true, 
      data: organization 
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
    });
  } catch (error) {
    console.error('Error fetching organization by slug:', error);
    return c.json({ 
      success: false, 
<<<<<<< HEAD
      error: 'Failed to fetch organization by slug' 
    }, 500);
  }
}

// POST /organizations - Criar nova organização
// ✅ CORRIGIDO: Usa SQL direto ao invés de KV Store (seguindo REGRA_KV_STORE_VS_SQL.md)
export async function createOrganization(c: Context) {
  try {
    console.log('🚨 [createOrganization] === FUNÇÃO CHAMADA ===');
    console.log('🚨 [createOrganization] Path:', c.req.path);
    console.log('🚨 [createOrganization] Method:', c.req.method);
    console.log('🚨 [createOrganization] URL:', c.req.url);
=======
      error: 'Failed to fetch organization' 
    }, 500);
  }
});

// POST /organizations - Criar nova organização
app.post('/', async (c) => {
  try {
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
    console.log('📥 Recebendo requisição POST /organizations');
    
    const body = await c.req.json();
    console.log('📦 Body recebido:', JSON.stringify(body, null, 2));
    
    const { name, email, phone, plan = 'free', createdBy } = body;

    // Validações
    if (!name || !email || !createdBy) {
      console.log('❌ Validação falhou:', { name, email, createdBy });
      return c.json({ 
        success: false, 
        error: 'Name, email, and createdBy are required' 
      }, 400);
    }
    
    console.log('✅ Validação passou, criando organização...');

    // Gerar slug
    const baseSlug = `rendizy_${generateSlug(name)}`;
    let slug = baseSlug;
    let counter = 1;

<<<<<<< HEAD
    // ✅ CORRIGIDO: Verificar se slug já existe no SQL
    const client = getSupabaseClient();
    let existingOrg = await client
      .from('organizations')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();
    
    // Se encontrou organização com esse slug, incrementar contador
    while (existingOrg.data) {
      slug = `${baseSlug}_${counter}`;
      counter++;
      existingOrg = await client
        .from('organizations')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle();
=======
    // Verificar se slug já existe
    const existingOrgs = await kv.getByPrefix('org:');
    while (existingOrgs.some((org: Organization) => org.slug === slug)) {
      slug = `${baseSlug}_${counter}`;
      counter++;
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
    }

    // Validar slug
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return c.json({ 
        success: false, 
        error: slugValidation.error 
      }, 400);
    }

<<<<<<< HEAD
    // Obter limites do plano
    const limits = getPlanLimits(plan);
    const now = new Date().toISOString();
    const trialEndsAt = plan === 'free' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
      : null;

    // ✅ CORRIGIDO: Criar organização no SQL usando estrutura REAL da tabela
    // A tabela usa colunas individuais, não JSONB para settings/billing
    const { data: organization, error: insertError } = await client
      .from('organizations')
      .insert({
        name,
        slug,
        email,
        phone: phone || null,
        plan,
        status: plan === 'free' ? 'trial' : 'active',
        trial_ends_at: trialEndsAt,
        is_master: false,
        // Limites do plano (usar -1 para ilimitado)
        limits_users: limits.maxUsers === -1 ? -1 : limits.maxUsers,
        limits_properties: limits.maxProperties === -1 ? -1 : limits.maxProperties,
        limits_reservations: limits.maxReservations === -1 ? -1 : limits.maxReservations,
        limits_storage: -1, // Ilimitado por padrão
        // Settings individuais
        settings_max_users: limits.maxUsers === -1 ? -1 : limits.maxUsers,
        settings_max_properties: limits.maxProperties === -1 ? -1 : limits.maxProperties,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir no SQL:', insertError);
      throw new Error(insertError.message || 'Failed to create organization in database');
    }

    console.log(`✅ Organization created: ${slug} (${organization.id})`);

    // Converter formato SQL para formato esperado pelo frontend
    const responseData = {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      email: organization.email,
      phone: organization.phone || '',
      plan: organization.plan,
      status: organization.status,
      trialEndsAt: organization.trial_ends_at,
      createdAt: organization.created_at,
      // Converter colunas individuais para formato esperado pelo frontend
      settings: {
        maxUsers: organization.settings_max_users ?? organization.limits_users ?? -1,
        maxProperties: organization.settings_max_properties ?? organization.limits_properties ?? -1,
        maxReservations: organization.limits_reservations ?? -1,
        features: organization.plan === 'enterprise' ? ['all'] : []
      },
      billing: {
        email: organization.billing_email || organization.email,
        cycle: organization.billing_cycle || 'monthly',
        nextBillingDate: organization.next_billing_date
      }
    };

    return c.json({ 
      success: true, 
      data: responseData 
=======
    // Criar organização
    const id = generateId('org');
    const now = new Date().toISOString();
    const limits = getPlanLimits(plan);

    const organization: Organization = {
      id,
      slug,
      name,
      email,
      phone: phone || '',
      plan,
      status: plan === 'free' ? 'trial' : 'active',
      trialEndsAt: plan === 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      createdAt: now,
      createdBy,
      settings: {
        maxUsers: limits.maxUsers,
        maxProperties: limits.maxProperties,
        maxReservations: limits.maxReservations,
        features: limits.features
      },
      billing: {
        mrr: 0,
        billingDate: 1
      }
    };

    // Salvar no KV store
    await kv.set(`org:${id}`, organization);

    console.log(`✅ Organization created: ${slug} (${id})`);

    return c.json({ 
      success: true, 
      data: organization 
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
    }, 201);
  } catch (error) {
    console.error('❌ Error creating organization:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create organization',
      details: error instanceof Error ? error.stack : String(error)
    }, 500);
  }
<<<<<<< HEAD
}

// PATCH /organizations/:id - Atualizar organização
// ✅ CORRIGIDO: Usa SQL direto ao invés de KV Store
export async function updateOrganization(c: Context) {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const client = getSupabaseClient();

    // Verificar se organização existe
    const { data: existing, error: fetchError } = await client
      .from('organizations')
      .select('id, slug, created_at')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Erro ao buscar organização:', fetchError);
      throw fetchError;
    }

    if (!existing) {
=======
});

// PATCH /organizations/:id - Atualizar organização
app.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const organization = await kv.get(`org:${id}`);
    if (!organization) {
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
      return c.json({ 
        success: false, 
        error: 'Organization not found' 
      }, 404);
    }

<<<<<<< HEAD
    // Preparar dados para atualização (remover campos que não podem ser alterados)
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString()
    };
    
    // Remover campos que não podem ser alterados
    delete updateData.id;
    delete updateData.slug;
    delete updateData.created_at;

    // Atualizar no SQL
    const { data: updated, error: updateError } = await client
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar organização:', updateError);
      throw updateError;
    }

    console.log(`✅ Organization updated: ${updated.slug} (${id})`);

    // Converter formato SQL para formato esperado pelo frontend
    const formatted = {
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      email: updated.email,
      phone: updated.phone || '',
      plan: updated.plan,
      status: updated.status,
      trialEndsAt: updated.trial_ends_at,
      createdAt: updated.created_at,
      // Converter colunas individuais para formato esperado pelo frontend
      settings: {
        maxUsers: updated.settings_max_users ?? updated.limits_users ?? -1,
        maxProperties: updated.settings_max_properties ?? updated.limits_properties ?? -1,
        maxReservations: updated.limits_reservations ?? -1,
        features: updated.plan === 'enterprise' ? ['all'] : []
      },
      billing: {
        email: updated.billing_email || updated.email,
        cycle: updated.billing_cycle || 'monthly',
        nextBillingDate: updated.next_billing_date
      }
    };

    return c.json({ 
      success: true, 
      data: formatted 
=======
    // Atualizar campos permitidos
    const updated = {
      ...organization,
      ...body,
      id: organization.id, // Não permitir mudar ID
      slug: organization.slug, // Não permitir mudar slug
      createdAt: organization.createdAt, // Não permitir mudar data de criação
      updatedAt: new Date().toISOString()
    };

    await kv.set(`org:${id}`, updated);

    console.log(`✅ Organization updated: ${updated.slug} (${id})`);

    return c.json({ 
      success: true, 
      data: updated 
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to update organization' 
    }, 500);
  }
<<<<<<< HEAD
}

// DELETE /organizations/:id - Deletar organização
// ✅ CORRIGIDO: Usa SQL direto ao invés de KV Store
export async function deleteOrganization(c: Context) {
  try {
    const id = c.req.param('id');
    const client = getSupabaseClient();

    // Verificar se organização existe
    const { data: organization, error: fetchError } = await client
      .from('organizations')
      .select('id, slug')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Erro ao buscar organização:', fetchError);
      throw fetchError;
    }

=======
});

// DELETE /organizations/:id - Deletar organização
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const organization = await kv.get(`org:${id}`);
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
    if (!organization) {
      return c.json({ 
        success: false, 
        error: 'Organization not found' 
      }, 404);
    }

    // Não permitir deletar organização master
    if (organization.slug === 'rendizy') {
      return c.json({ 
        success: false, 
        error: 'Cannot delete master organization' 
      }, 403);
    }

<<<<<<< HEAD
    // Contar usuários da organização (serão deletados em cascade pela foreign key)
    const { data: users, error: usersError } = await client
      .from('users')
      .select('id')
      .eq('organization_id', id);

    if (usersError) {
      console.error('❌ Erro ao contar usuários:', usersError);
    }

    const usersCount = users?.length || 0;

    // Deletar organização (usuários serão deletados em cascade pela foreign key)
    const { error: deleteError } = await client
      .from('organizations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Erro ao deletar organização:', deleteError);
      throw deleteError;
    }

    console.log(`✅ Organization deleted: ${organization.slug} (${id})`);
    console.log(`✅ Deleted ${usersCount} users from organization (cascade)`);
=======
    // Deletar usuários da organização
    const users = await kv.getByPrefix(`user:`);
    const orgUsers = users.filter((u: User) => u.organizationId === id);
    
    for (const user of orgUsers) {
      await kv.del(`user:${user.id}`);
    }

    // Deletar organização
    await kv.del(`org:${id}`);

    console.log(`✅ Organization deleted: ${organization.slug} (${id})`);
    console.log(`✅ Deleted ${orgUsers.length} users from organization`);
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941

    return c.json({ 
      success: true, 
      message: 'Organization deleted successfully',
<<<<<<< HEAD
      deletedUsers: usersCount
=======
      deletedUsers: orgUsers.length
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to delete organization' 
    }, 500);
  }
<<<<<<< HEAD
}

// GET /organizations/:id/stats - Estatísticas da organização
// ✅ CORRIGIDO: Usa SQL direto ao invés de KV Store
export async function getOrganizationStats(c: Context) {
  try {
    const id = c.req.param('id');
    const client = getSupabaseClient();

    // Verificar se organização existe
    const { data: organization, error: orgError } = await client
      .from('organizations')
      .select('id, limits_users, limits_properties, limits_reservations, plan')
      .eq('id', id)
      .maybeSingle();

    if (orgError) {
      console.error('❌ Erro ao buscar organização:', orgError);
      throw orgError;
    }

=======
});

// GET /organizations/:id/stats - Estatísticas da organização
app.get('/:id/stats', async (c) => {
  try {
    const id = c.req.param('id');

    const organization = await kv.get(`org:${id}`);
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
    if (!organization) {
      return c.json({ 
        success: false, 
        error: 'Organization not found' 
      }, 404);
    }

<<<<<<< HEAD
    // Contar usuários da organização
    const { data: users, error: usersError } = await client
      .from('users')
      .select('id, status')
      .eq('organization_id', id);

    if (usersError) {
      console.error('❌ Erro ao contar usuários:', usersError);
    }

    const usersList = users || [];
    const stats = {
      users: {
        total: usersList.length,
        active: usersList.filter((u: any) => u.status === 'active').length,
        invited: usersList.filter((u: any) => u.status === 'invited').length
      },
      properties: {
        total: 0, // TODO: Buscar do banco quando tabela properties estiver em SQL
        active: 0
      },
      reservations: {
        total: 0, // TODO: Buscar do banco quando tabela reservations estiver em SQL
        thisMonth: 0
      },
      limits: {
        maxUsers: organization.limits_users ?? -1,
        maxProperties: organization.limits_properties ?? -1,
        maxReservations: organization.limits_reservations ?? -1
      }
=======
    // Contar usuários
    const allUsers = await kv.getByPrefix('user:');
    const users = allUsers.filter((u: User) => u.organizationId === id);

    // Stats mockadas (em produção viriam do banco real)
    const stats = {
      users: {
        total: users.length,
        active: users.filter((u: User) => u.status === 'active').length,
        invited: users.filter((u: User) => u.status === 'invited').length
      },
      properties: {
        total: Math.floor(Math.random() * 50),
        active: Math.floor(Math.random() * 40)
      },
      reservations: {
        total: Math.floor(Math.random() * 200),
        thisMonth: Math.floor(Math.random() * 50)
      },
      limits: organization.settings
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
    };

    return c.json({ 
      success: true, 
      data: stats 
    });
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch stats' 
    }, 500);
  }
<<<<<<< HEAD
}
=======
});
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941

// ============================================================================
// 🔧 SETTINGS ROUTES - /organizations/:id/settings/global
// ✅ CORRIGIDO v1.0.103.400 - Fallback seguro para organizationId
// ============================================================================

// GET /organizations/:id/settings/global - Obter configurações globais
<<<<<<< HEAD
export async function getOrganizationSettings(c: Context) {
=======
app.get("/:id/settings/global", async (c) => {
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
  // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de ensureOrganizationId
  const orgId = await getOrganizationIdOrThrow(c);
  const client = getSupabaseClient();

  const { data } = await client
    .from("organization_channel_config")
    .select("*")
    .eq("organization_id", orgId)
    .maybeSingle();

  return c.json(
    successResponse(
      data ?? {
        organization_id: orgId,
        whatsapp_enabled: false
      }
    )
  );
<<<<<<< HEAD
}

// PUT /organizations/:id/settings/global - Salvar configurações globais
export async function updateOrganizationSettings(c: Context) {
=======
});

// PUT /organizations/:id/settings/global - Salvar configurações globais
app.put("/:id/settings/global", async (c) => {
>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
  const client = getSupabaseClient();
  // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de ensureOrganizationId
  const orgId = await getOrganizationIdOrThrow(c);
  const body = await c.req.json();

  const dbData = {
    organization_id: orgId,
    whatsapp_enabled: body.whatsapp?.enabled ?? false,
    whatsapp_api_url: body.whatsapp?.api_url ?? "",
    whatsapp_instance_name: body.whatsapp?.instance_name ?? "",
  };

  const { data, error } = await safeUpsert(
    client,
    "organization_channel_config",
    dbData,
    { onConflict: "organization_id" },
    "organization_id, whatsapp_enabled, whatsapp_api_url, whatsapp_instance_name"
  );

  if (error) return c.json(errorResponse(error.message), 500);

  return c.json(successResponse(data));
<<<<<<< HEAD
}

// ✅ MANTER COMPATIBILIDADE: Exportar app também para uso com app.route()
=======
});

>>>>>>> c4731a74413e3c6ac95533edb8b5c5ea1726e941
export default app;
