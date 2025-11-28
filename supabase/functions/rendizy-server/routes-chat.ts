import { Hono } from 'npm:hono';
import { ChannelConfigRepository } from './repositories/channel-config-repository.ts';
import { getOrganizationIdOrThrow } from './utils-get-organization-id.ts';

const app = new Hono();

// ============================================================================
// CHANNEL CONFIGURATION ROUTES
// ============================================================================

/**
 * GET /channels/config
 * Busca configuração de canais para uma organização
 * 
 * Rota completa: /rendizy-server/chat/channels/config
 */
app.get('/channels/config', async (c) => {
  try {
    const organizationId = await getOrganizationIdOrThrow(c);
    const repo = new ChannelConfigRepository();
    
    const config = await repo.findByOrganizationId(organizationId);
    
    if (!config) {
      return c.json({ 
        success: false, 
        error: 'Configuração não encontrada',
        data: null 
      }, 404);
    }
    
    // Converter formato DB para formato API
    const apiConfig = {
      whatsapp: {
        enabled: config.whatsapp_enabled || false,
        api_url: config.whatsapp_api_url || '',
        instance_name: config.whatsapp_instance_name || '',
        api_key: config.whatsapp_api_key || '',
        instance_token: config.whatsapp_instance_token || '',
        connected: config.whatsapp_connected || false,
        phone_number: config.whatsapp_phone_number || null,
        qr_code: config.whatsapp_qr_code || null,
        connection_status: config.whatsapp_connection_status || 'disconnected',
        last_connected_at: config.whatsapp_last_connected_at || null,
        error_message: config.whatsapp_error_message || null,
      },
      sms: {
        enabled: config.sms_enabled || false,
        account_sid: config.sms_account_sid || '',
        auth_token: config.sms_auth_token || '',
        phone_number: config.sms_phone_number || '',
        credits_used: config.sms_credits_used || 0,
        last_recharged_at: config.sms_last_recharged_at || null,
      },
    };
    
    return c.json({ success: true, data: apiConfig });
  } catch (error: any) {
    console.error('[Chat] Erro ao buscar configuração:', error);
    if (error.message?.includes('organization')) {
      return c.json({ success: false, error: error.message }, 401);
    }
    return c.json({ success: false, error: 'Erro ao buscar configuração' }, 500);
  }
});

/**
 * PATCH /channels/config
 * Atualiza configuração de canais para uma organização
 * 
 * Rota completa: /rendizy-server/chat/channels/config
 */
app.patch('/channels/config', async (c) => {
  try {
    const organizationId = await getOrganizationIdOrThrow(c);
    const body = await c.req.json();
    
    console.log('📥 [Chat] Recebendo atualização de configuração:', {
      organization_id: organizationId,
      has_whatsapp: !!body.whatsapp,
      has_sms: !!body.sms,
    });
    
    const repo = new ChannelConfigRepository();
    
    // Buscar configuração existente
    const existing = await repo.findByOrganizationId(organizationId);
    
    // Preparar dados para salvar (formato DB)
    const configToSave: any = {
      organization_id: organizationId,
    };
    
    // WhatsApp
    if (body.whatsapp) {
      configToSave.whatsapp_enabled = body.whatsapp.enabled ?? existing?.whatsapp_enabled ?? false;
      configToSave.whatsapp_api_url = body.whatsapp.api_url || existing?.whatsapp_api_url || '';
      configToSave.whatsapp_instance_name = body.whatsapp.instance_name || existing?.whatsapp_instance_name || '';
      configToSave.whatsapp_api_key = body.whatsapp.api_key || existing?.whatsapp_api_key || '';
      configToSave.whatsapp_instance_token = body.whatsapp.instance_token || existing?.whatsapp_instance_token || '';
      
      // Preservar campos de conexão se não foram fornecidos
      configToSave.whatsapp_connected = body.whatsapp.connected ?? existing?.whatsapp_connected ?? false;
      configToSave.whatsapp_phone_number = body.whatsapp.phone_number ?? existing?.whatsapp_phone_number ?? null;
      configToSave.whatsapp_qr_code = body.whatsapp.qr_code ?? existing?.whatsapp_qr_code ?? null;
      configToSave.whatsapp_connection_status = body.whatsapp.connection_status || existing?.whatsapp_connection_status || 'disconnected';
      configToSave.whatsapp_last_connected_at = body.whatsapp.last_connected_at ?? existing?.whatsapp_last_connected_at ?? null;
      configToSave.whatsapp_error_message = body.whatsapp.error_message ?? existing?.whatsapp_error_message ?? null;
    }
    
    // SMS
    if (body.sms) {
      configToSave.sms_enabled = body.sms.enabled ?? existing?.sms_enabled ?? false;
      configToSave.sms_account_sid = body.sms.account_sid || existing?.sms_account_sid || '';
      configToSave.sms_auth_token = body.sms.auth_token || existing?.sms_auth_token || '';
      configToSave.sms_phone_number = body.sms.phone_number || existing?.sms_phone_number || '';
      configToSave.sms_credits_used = body.sms.credits_used ?? existing?.sms_credits_used ?? 0;
      configToSave.sms_last_recharged_at = body.sms.last_recharged_at ?? existing?.sms_last_recharged_at ?? null;
    }
    
    console.log('💾 [Chat] Salvando configuração:', {
      organization_id: organizationId,
      whatsapp_enabled: configToSave.whatsapp_enabled,
      has_api_url: !!configToSave.whatsapp_api_url,
      has_instance_name: !!configToSave.whatsapp_instance_name,
      has_api_key: !!configToSave.whatsapp_api_key,
      has_instance_token: !!configToSave.whatsapp_instance_token,
    });
    
    // Salvar no banco
    const result = await repo.upsert(configToSave);
    
    if (!result.success) {
      console.error('❌ [Chat] Erro ao salvar:', result.error);
      return c.json({ success: false, error: result.error || 'Erro ao salvar configuração' }, 500);
    }
    
    // Buscar configuração salva para retornar
    const saved = await repo.findByOrganizationId(organizationId);
    
    if (!saved) {
      return c.json({ success: false, error: 'Configuração não encontrada após salvar' }, 500);
    }
    
    // Converter para formato API
    const apiConfig = {
      whatsapp: {
        enabled: saved.whatsapp_enabled || false,
        api_url: saved.whatsapp_api_url || '',
        instance_name: saved.whatsapp_instance_name || '',
        api_key: saved.whatsapp_api_key || '',
        instance_token: saved.whatsapp_instance_token || '',
        connected: saved.whatsapp_connected || false,
        phone_number: saved.whatsapp_phone_number || null,
        qr_code: saved.whatsapp_qr_code || null,
        connection_status: saved.whatsapp_connection_status || 'disconnected',
        last_connected_at: saved.whatsapp_last_connected_at || null,
        error_message: saved.whatsapp_error_message || null,
      },
      sms: {
        enabled: saved.sms_enabled || false,
        account_sid: saved.sms_account_sid || '',
        auth_token: saved.sms_auth_token || '',
        phone_number: saved.sms_phone_number || '',
        credits_used: saved.sms_credits_used || 0,
        last_recharged_at: saved.sms_last_recharged_at || null,
      },
    };
    
    console.log('✅ [Chat] Configuração salva com sucesso');
    
    return c.json({ success: true, data: apiConfig });
  } catch (error: any) {
    console.error('[Chat] Erro ao atualizar configuração:', error);
    if (error.message?.includes('organization')) {
      return c.json({ success: false, error: error.message }, 401);
    }
    return c.json({ success: false, error: 'Erro ao atualizar configuração' }, 500);
  }
});

export default app;
