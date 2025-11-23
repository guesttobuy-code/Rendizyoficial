// routes-client-sites.ts
// Sistema de gerenciamento de sites customizados por cliente
// Permite importar sites de v0.dev, Bolt.ai, Figma, etc e integrá-los ao RENDIZY

import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
// ✅ REFATORADO v1.0.103.500 - Helper híbrido para organization_id (UUID)
import { getOrganizationIdOrThrow } from './utils-get-organization-id.ts';

const app = new Hono();

// ============================================================
// TIPOS
// ============================================================

interface ClientSiteConfig {
  organizationId: string;
  siteName: string;
  template: 'custom' | 'moderno' | 'classico' | 'luxo';
  domain?: string; // domínio customizado (ex: www.imobiliaria.com)
  subdomain: string; // subdomínio RENDIZY (ex: imobiliaria.rendizy.app)
  
  // Customizações visuais
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  
  // Assets
  logo?: string;
  favicon?: string;
  
  // Configurações do site
  siteConfig: {
    title: string;
    description: string;
    slogan?: string;
    contactEmail: string;
    contactPhone: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      whatsapp?: string;
    };
  };
  
  // Modalidades ativas
  features: {
    shortTerm: boolean; // Temporada
    longTerm: boolean;  // Locação
    sale: boolean;      // Venda
  };
  
  // Código do site (HTML/React serializado)
  siteCode?: string; // Código importado de v0.dev, Bolt, etc
  
  // Metadados
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// ============================================================
// HELPERS
// ============================================================

function generateSubdomain(organizationName: string): string {
  return organizationName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================
// ROTAS
// ============================================================

// GET /make-server-67caf26a/client-sites
// Lista todos os sites ou busca por organizationId
app.get('/', async (c) => {
  try {
    // ✅ REFATORADO v1.0.103.500 - Usar helper híbrido ao invés de query param
    const orgId = await getOrganizationIdOrThrow(c);
    
    if (orgId) {
      // Buscar site específico
      const site = await kv.get<ClientSiteConfig>(`client_site:${orgId}`);
      
      if (!site) {
        return c.json({ 
          success: false, 
          error: 'Site não encontrado para esta organização' 
        }, 404);
      }
      
      return c.json({ success: true, data: site });
    }
    
    // Listar todos os sites
    const sites = await kv.getByPrefix<ClientSiteConfig>('client_site:');
    
    return c.json({ 
      success: true, 
      data: sites,
      count: sites.length 
    });
    
  } catch (error) {
    console.error('[CLIENT-SITES] Erro ao buscar sites:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// POST /make-server-67caf26a/client-sites
// Criar novo site para cliente
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { organizationId, siteName, template, domain, theme, siteConfig, features } = body;
    
    // Validações
    if (!organizationId) {
      return c.json({ 
        success: false, 
        error: 'organizationId é obrigatório' 
      }, 400);
    }
    
    if (!siteName) {
      return c.json({ 
        success: false, 
        error: 'siteName é obrigatório' 
      }, 400);
    }
    
    // Verificar se já existe site para esta organização
    const existing = await kv.get<ClientSiteConfig>(`client_site:${organizationId}`);
    if (existing) {
      return c.json({ 
        success: false, 
        error: 'Organização já possui um site configurado. Use PUT para atualizar.' 
      }, 409);
    }
    
    // Gerar subdomínio automático
    const subdomain = generateSubdomain(siteName);
    
    // Criar configuração do site
    const siteData: ClientSiteConfig = {
      organizationId,
      siteName,
      template: template || 'moderno',
      subdomain,
      domain: domain || undefined,
      theme: theme || {
        primaryColor: '#3B82F6',
        secondaryColor: '#1F2937',
        accentColor: '#10B981',
        fontFamily: 'Inter, sans-serif'
      },
      siteConfig: siteConfig || {
        title: siteName,
        description: `Site oficial de ${siteName}`,
        contactEmail: '',
        contactPhone: ''
      },
      features: features || {
        shortTerm: true,
        longTerm: false,
        sale: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    // Salvar no KV
    await kv.set(`client_site:${organizationId}`, siteData);
    
    console.log(`[CLIENT-SITES] Site criado para ${organizationId}:`, subdomain);
    
    return c.json({ 
      success: true, 
      data: siteData,
      message: `Site criado com sucesso! Acesse em: ${subdomain}.rendizy.app`
    }, 201);
    
  } catch (error) {
    console.error('[CLIENT-SITES] Erro ao criar site:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// PUT /make-server-67caf26a/client-sites/:organizationId
// Atualizar configurações do site
app.put('/:organizationId', async (c) => {
  try {
    const { organizationId } = c.req.param();
    const updates = await c.req.json();
    
    // Buscar site existente
    const existing = await kv.get<ClientSiteConfig>(`client_site:${organizationId}`);
    
    if (!existing) {
      return c.json({ 
        success: false, 
        error: 'Site não encontrado' 
      }, 404);
    }
    
    // Atualizar dados
    const updated: ClientSiteConfig = {
      ...existing,
      ...updates,
      organizationId, // Garantir que não seja alterado
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`client_site:${organizationId}`, updated);
    
    console.log(`[CLIENT-SITES] Site atualizado:`, organizationId);
    
    return c.json({ 
      success: true, 
      data: updated,
      message: 'Site atualizado com sucesso!'
    });
    
  } catch (error) {
    console.error('[CLIENT-SITES] Erro ao atualizar site:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// POST /make-server-67caf26a/client-sites/:organizationId/upload-code
// Upload do código do site (importado de v0.dev, Bolt, Figma, etc)
app.post('/:organizationId/upload-code', async (c) => {
  try {
    const { organizationId } = c.req.param();
    const { siteCode } = await c.req.json();
    
    if (!siteCode) {
      return c.json({ 
        success: false, 
        error: 'siteCode é obrigatório' 
      }, 400);
    }
    
    // Buscar site existente
    const existing = await kv.get<ClientSiteConfig>(`client_site:${organizationId}`);
    
    if (!existing) {
      return c.json({ 
        success: false, 
        error: 'Site não encontrado. Crie o site primeiro.' 
      }, 404);
    }
    
    // Atualizar com o código
    const updated: ClientSiteConfig = {
      ...existing,
      siteCode,
      template: 'custom', // Marcar como customizado
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`client_site:${organizationId}`, updated);
    
    console.log(`[CLIENT-SITES] Código do site atualizado:`, organizationId);
    
    return c.json({ 
      success: true, 
      data: updated,
      message: 'Código do site enviado com sucesso!'
    });
    
  } catch (error) {
    console.error('[CLIENT-SITES] Erro ao fazer upload do código:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// GET /make-server-67caf26a/client-sites/by-domain/:domain
// Buscar site por domínio (para roteamento)
app.get('/by-domain/:domain', async (c) => {
  try {
    const { domain } = c.req.param();
    
    // Buscar todos os sites
    const sites = await kv.getByPrefix<ClientSiteConfig>('client_site:');
    
    // Procurar por domínio customizado ou subdomínio
    const site = sites.find(s => 
      s.domain === domain || 
      `${s.subdomain}.rendizy.app` === domain ||
      s.subdomain === domain.replace('.rendizy.app', '')
    );
    
    if (!site) {
      return c.json({ 
        success: false, 
        error: 'Site não encontrado para este domínio' 
      }, 404);
    }
    
    return c.json({ success: true, data: site });
    
  } catch (error) {
    console.error('[CLIENT-SITES] Erro ao buscar site por domínio:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// DELETE /make-server-67caf26a/client-sites/:organizationId
// Desativar site (soft delete)
app.delete('/:organizationId', async (c) => {
  try {
    const { organizationId } = c.req.param();
    
    const existing = await kv.get<ClientSiteConfig>(`client_site:${organizationId}`);
    
    if (!existing) {
      return c.json({ 
        success: false, 
        error: 'Site não encontrado' 
      }, 404);
    }
    
    // Desativar (soft delete)
    const updated: ClientSiteConfig = {
      ...existing,
      isActive: false,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`client_site:${organizationId}`, updated);
    
    console.log(`[CLIENT-SITES] Site desativado:`, organizationId);
    
    return c.json({ 
      success: true, 
      message: 'Site desativado com sucesso!' 
    });
    
  } catch (error) {
    console.error('[CLIENT-SITES] Erro ao desativar site:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

export default app;
