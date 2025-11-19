import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { ensureOrganizationId } from './utils-organization.ts';
import { successResponse, errorResponse } from './utils-response.ts';
import { safeUpsert } from './utils-db-safe.ts';
import { getSupabaseClient } from './kv_store.tsx';
// ✅ REFATORADO v1.0.103.500 - Helper híbrido para organization_id (UUID)
import { getOrganizationIdOrThrow } from './utils-get-organization-id.ts';

const app = new Hono();

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
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch organizations' 
    }, 500);
  }
});

// GET /organizations/:id - Obter organização por ID
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const organization = await kv.get(`org:${id}`);

    if (!organization) {
      return c.json({ 
        success: false, 
        error: 'Organization not found' 
      }, 404);
    }

    return c.json({ 
      success: true, 
      data: organization 
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch organization' 
    }, 500);
  }
});

// GET /organizations/slug/:slug - Obter organização por slug
app.get('/slug/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const organizations = await kv.getByPrefix('org:');
    const organization = organizations.find((org: Organization) => org.slug === slug);

    if (!organization) {
      return c.json({ 
        success: false, 
        error: 'Organization not found' 
      }, 404);
    }

    return c.json({ 
      success: true, 
      data: organization 
    });
  } catch (error) {
    console.error('Error fetching organization by slug:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch organization' 
    }, 500);
  }
});

// POST /organizations - Criar nova organização
app.post('/', async (c) => {
  try {
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

    // Verificar se slug já existe
    const existingOrgs = await kv.getByPrefix('org:');
    while (existingOrgs.some((org: Organization) => org.slug === slug)) {
      slug = `${baseSlug}_${counter}`;
      counter++;
    }

    // Validar slug
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return c.json({ 
        success: false, 
        error: slugValidation.error 
      }, 400);
    }

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
});

// PATCH /organizations/:id - Atualizar organização
app.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const organization = await kv.get(`org:${id}`);
    if (!organization) {
      return c.json({ 
        success: false, 
        error: 'Organization not found' 
      }, 404);
    }

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
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to update organization' 
    }, 500);
  }
});

// DELETE /organizations/:id - Deletar organização
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const organization = await kv.get(`org:${id}`);
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

    return c.json({ 
      success: true, 
      message: 'Organization deleted successfully',
      deletedUsers: orgUsers.length
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to delete organization' 
    }, 500);
  }
});

// GET /organizations/:id/stats - Estatísticas da organização
app.get('/:id/stats', async (c) => {
  try {
    const id = c.req.param('id');

    const organization = await kv.get(`org:${id}`);
    if (!organization) {
      return c.json({ 
        success: false, 
        error: 'Organization not found' 
      }, 404);
    }

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
});

// ============================================================================
// 🔧 SETTINGS ROUTES - /organizations/:id/settings/global
// ✅ CORRIGIDO v1.0.103.400 - Fallback seguro para organizationId
// ============================================================================

// GET /organizations/:id/settings/global - Obter configurações globais
app.get("/:id/settings/global", async (c) => {
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
});

// PUT /organizations/:id/settings/global - Salvar configurações globais
app.put("/:id/settings/global", async (c) => {
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
});

export default app;
