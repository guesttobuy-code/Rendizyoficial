import type { Context } from 'npm:hono';
import { getSupabaseClient } from './kv_store.tsx';
import { getOrganizationIdForRequest } from './utils-multi-tenant.ts';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  logInfo,
  logError,
} from './utils.ts';
import { encryptSensitive, decryptSensitive } from './utils-crypto.ts';

interface UpsertAIConfigPayload {
  provider: string;
  baseUrl: string;
  defaultModel: string;
  temperature?: number;
  maxTokens?: number;
  promptTemplate?: string;
  notes?: string;
  apiKey?: string;
}

export async function getAIProviderConfig(c: Context) {
  try {
    const client = getSupabaseClient();
    const organizationId = await getOrganizationIdForRequest(c);

    logInfo(`[AI] Buscando configuração para org ${organizationId}`);

    const { data, error } = await client
      .from('ai_provider_configs')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      logError('[AI] Erro ao buscar config', error);
      return c.json(errorResponse('Erro ao buscar configuração de IA', { details: error.message }), 500);
    }

    if (!data) {
      return c.json(successResponse({
        exists: false,
        organizationId,
      }));
    }

    const { api_key_encrypted, ...rest } = data;

    return c.json(successResponse({
      ...rest,
      organizationId,
      hasApiKey: Boolean(api_key_encrypted),
      exists: true,
    }));
  } catch (error: any) {
    logError('[AI] Erro inesperado ao buscar config', error);
    return c.json(errorResponse('Erro ao buscar configuração de IA', { details: error.message }), 500);
  }
}

export async function upsertAIProviderConfig(c: Context) {
  try {
    const body = await c.req.json<UpsertAIConfigPayload>();
    const client = getSupabaseClient();
    const organizationId = await getOrganizationIdForRequest(c);

    logInfo(`[AI] Salvando configuração para org ${organizationId}: ${body.provider}`);

    if (!body.provider || !body.baseUrl || !body.defaultModel) {
      return c.json(validationErrorResponse('provider, baseUrl e defaultModel são obrigatórios'), 400);
    }

    const { data: existing } = await client
      .from('ai_provider_configs')
      .select('id, api_key_encrypted')
      .eq('organization_id', organizationId)
      .maybeSingle();

    let apiKeyEncrypted = existing?.api_key_encrypted || null;
    if (body.apiKey) {
      apiKeyEncrypted = await encryptSensitive(body.apiKey);
    }

    if (!apiKeyEncrypted) {
      return c.json(validationErrorResponse('Informe uma API Key para o provedor selecionado'), 400);
    }

    const payload = {
      organization_id: organizationId,
      provider: body.provider,
      base_url: body.baseUrl,
      default_model: body.defaultModel,
      temperature: body.temperature ?? 0.2,
      max_tokens: body.maxTokens ?? 512,
      prompt_template: body.promptTemplate ?? 'Você é o copiloto oficial do Rendizy. Responda sempre em português brasileiro.',
      notes: body.notes ?? null,
      api_key_encrypted: apiKeyEncrypted,
    };

    const { data, error } = await client
      .from('ai_provider_configs')
      .upsert(payload, { onConflict: 'organization_id' })
      .select('*')
      .single();

    if (error) {
      logError('[AI] Erro ao salvar config', error);
      return c.json(errorResponse('Erro ao salvar configuração de IA', { details: error.message }), 500);
    }

    const { api_key_encrypted, ...rest } = data;

    return c.json(successResponse({
      ...rest,
      organizationId,
      hasApiKey: true,
    }));
  } catch (error: any) {
    logError('[AI] Erro inesperado ao salvar config', error);
    return c.json(errorResponse('Erro ao salvar configuração de IA', { details: error.message }), 500);
  }
}

function buildProviderHeaders(provider: string, apiKey: string) {
  if (provider === 'azure-openai') {
    return {
      'api-key': apiKey,
    };
  }

  if (provider === 'huggingface') {
    return {
      Authorization: `Bearer ${apiKey}`,
    };
  }

  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

function sanitizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '');
}

function buildModelsUrl(provider: string, baseUrl: string) {
  const sanitized = sanitizeBaseUrl(baseUrl);

  if (provider === 'huggingface') {
    // huggingface inference usa /models
    return `${sanitized}/models`;
  }

  if (provider === 'anthropic') {
    // Anthropic não tem endpoint de listagem de modelos público
    // Retornamos a URL base para teste
    return sanitized;
  }

  if (provider === 'google-gemini') {
    // Gemini usa /models para listar modelos
    return `${sanitized}/models`;
  }

  if (provider === 'azure-openai') {
    // azure deployments usam /models mas podem exigir api-version
    const hasQuery = sanitized.includes('?');
    return hasQuery ? sanitized : `${sanitized}/models`;
  }

  // OpenAI-compatible (OpenAI, DeepSeek, Groq, Together, etc.)
  return `${sanitized}/models`;
}

export async function testAIProviderConfig(c: Context) {
  try {
    const client = getSupabaseClient();
    const organizationId = await getOrganizationIdForRequest(c);

    logInfo(`[AI] Testando provedor para org ${organizationId}`);

    const { data, error } = await client
      .from('ai_provider_configs')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      logError('[AI] Erro ao buscar config para teste', error);
      return c.json(errorResponse('Erro ao testar provedor de IA', { details: error.message }), 500);
    }

    if (!data) {
      return c.json(validationErrorResponse('Configure um provedor antes de testar'), 400);
    }

    if (!data.api_key_encrypted) {
      return c.json(validationErrorResponse('API Key não encontrada. Salve novamente a integração.'), 400);
    }

    const apiKey = await decryptSensitive(data.api_key_encrypted);
    const headers = {
      'Content-Type': 'application/json',
      ...buildProviderHeaders(data.provider, apiKey),
    };

    let url = buildModelsUrl(data.provider, data.base_url);
    
    // Google Gemini precisa da API key na URL
    if (data.provider === 'google-gemini') {
      url = `${url}?key=${apiKey}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: data.provider === 'google-gemini' ? { 'Content-Type': 'application/json' } : headers,
    });

    if (!response.ok) {
      const text = await response.text();
      return c.json(errorResponse('Falha ao contatar provedor de IA', {
        status: response.status,
        statusText: response.statusText,
        details: text,
      }), response.status);
    }

    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const modelsCount = Array.isArray(payload?.data) ? payload.data.length : undefined;

    return c.json(successResponse({
      provider: data.provider,
      url,
      httpStatus: response.status,
      modelsCount,
      testedAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    logError('[AI] Erro inesperado ao testar provedor', error);
    return c.json(errorResponse('Erro ao testar provedor de IA', { details: error.message }), 500);
  }
}

