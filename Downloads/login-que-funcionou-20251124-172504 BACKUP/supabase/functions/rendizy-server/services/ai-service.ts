import { getSupabaseClient } from '../kv_store.tsx';
import { decryptSensitive } from '../utils-crypto.ts';
import { logInfo, logError } from '../utils.ts';

export type AIChatRole = 'system' | 'user' | 'assistant';

export interface AIChatMessage {
  role: AIChatRole;
  content: string;
}

export interface AIResolvedConfig {
  organizationId: string;
  provider: string;
  baseUrl: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  promptTemplate: string;
  apiKey: string;
}

export interface GenerateAIChatOptions {
  organizationId: string;
  messages: AIChatMessage[];
  temperature?: number;
  maxTokens?: number;
  modelOverride?: string;
  providerOverride?: string;
  baseUrlOverride?: string;
  apiKeyOverride?: string;
}

export interface AIChatResult {
  provider: string;
  model: string;
  text: string;
  httpStatus: number;
  rawResponse?: any;
}

const DEFAULT_PROMPT = 'Você é o copiloto oficial do Rendizy. Responda sempre em português brasileiro.';

async function fetchAIConfig(organizationId: string): Promise<AIResolvedConfig> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('ai_provider_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    logError('[AIService] Erro ao buscar configuração', error);
    throw new Error('Erro ao buscar configuração de IA');
  }

  if (!data) {
    throw new Error('Nenhum provedor de IA configurado para esta organização');
  }

  if (!data.api_key_encrypted) {
    throw new Error('Provedor configurado sem API Key armazenada');
  }

  const apiKey = await decryptSensitive(data.api_key_encrypted);

  return {
    organizationId,
    provider: data.provider,
    baseUrl: data.base_url,
    defaultModel: data.default_model,
    temperature: Number(data.temperature ?? 0.2),
    maxTokens: Number(data.max_tokens ?? 512),
    promptTemplate: data.prompt_template || DEFAULT_PROMPT,
    apiKey,
  };
}

function ensureSystemPrompt(messages: AIChatMessage[], promptTemplate: string): AIChatMessage[] {
  const hasSystem = messages.some((msg) => msg.role === 'system');
  if (hasSystem) {
    return messages;
  }
  return [
    { role: 'system', content: promptTemplate || DEFAULT_PROMPT },
    ...messages,
  ];
}

function sanitizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

function buildChatUrl(provider: string, baseUrl: string, model: string) {
  const sanitized = sanitizeBaseUrl(baseUrl);

  if (provider === 'huggingface') {
    const encodedModel = encodeURIComponent(model);
    return `${sanitized}/models/${encodedModel}`;
  }

  if (provider === 'azure-openai') {
    if (sanitized.includes('/chat/completions')) {
      return sanitized;
    }
    const hasQuery = sanitized.includes('?');
    const apiVersion = hasQuery ? '' : '?api-version=2024-02-01';
    return `${sanitized}/chat/completions${apiVersion}`;
  }

  return sanitized.endsWith('/chat/completions')
    ? sanitized
    : `${sanitized}/chat/completions`;
}

function buildProviderHeaders(provider: string, apiKey: string) {
  if (provider === 'azure-openai') {
    return {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    };
  }

  if (provider === 'huggingface') {
    return {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

function flattenMessages(messages: AIChatMessage[]): string {
  return messages
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n');
}

export async function generateAIChat(options: GenerateAIChatOptions): Promise<AIChatResult> {
  const config = await fetchAIConfig(options.organizationId);
  const provider = options.providerOverride || config.provider;
  const baseUrl = options.baseUrlOverride || config.baseUrl;
  const model = options.modelOverride || config.defaultModel;
  const temperature = options.temperature ?? config.temperature ?? 0.2;
  const maxTokens = options.maxTokens ?? config.maxTokens ?? 512;
  const apiKey = options.apiKeyOverride || config.apiKey;
  const messages = ensureSystemPrompt(options.messages, config.promptTemplate);

  logInfo(`[AIService] Gerando resposta com provider ${provider} para org ${options.organizationId}`);

  const url = buildChatUrl(provider, baseUrl, model);
  const headers = buildProviderHeaders(provider, apiKey);

  let response: Response;
  let payload: any;

  if (provider === 'huggingface') {
    payload = {
      inputs: flattenMessages(messages),
      parameters: {
        temperature,
        max_new_tokens: maxTokens,
        return_full_text: false,
      },
    };
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } else {
    payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }

  const httpStatus = response.status;
  const textBody = await response.text();
  let json: any = null;
  try {
    json = textBody ? JSON.parse(textBody) : null;
  } catch {
    json = textBody;
  }

  if (!response.ok) {
    logError('[AIService] Erro ao chamar provider', { status: httpStatus, body: json });
    throw new Error(typeof json === 'string' ? json : json?.error?.message || 'Falha ao chamar provedor de IA');
  }

  let text = '';
  if (provider === 'huggingface') {
    if (Array.isArray(json)) {
      text = json[0]?.generated_text || '';
    } else if (typeof json?.generated_text === 'string') {
      text = json.generated_text;
    } else {
      text = typeof json === 'string' ? json : JSON.stringify(json);
    }
  } else {
    text = json?.choices?.[0]?.message?.content?.trim() || '';
  }

  if (!text) {
    text = typeof json === 'string' ? json : JSON.stringify(json);
  }

  return {
    provider,
    model,
    text,
    httpStatus,
    rawResponse: json,
  };
}




