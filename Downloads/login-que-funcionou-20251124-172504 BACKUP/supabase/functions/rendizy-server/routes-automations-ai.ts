import type { Context } from 'npm:hono';
import { getOrganizationIdForRequest } from './utils-multi-tenant.ts';
import { validationErrorResponse, successResponse, errorResponse, logInfo, logError } from './utils.ts';
import { generateAIChat, type AIChatMessage } from './services/ai-service.ts';

interface NaturalLanguageAutomationRequest {
  input: string;
  module?: string;
  channel?: 'whatsapp' | 'email' | 'sms' | 'dashboard';
  priority?: 'baixa' | 'media' | 'alta';
  language?: string;
  conversationMode?: boolean; // Novo: modo conversacional
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>; // Histórico da conversa
}

interface AutomationAction {
  type: string;
  channel?: string;
  template?: string;
  payload?: Record<string, unknown>;
}

interface AutomationDefinition {
  name: string;
  description?: string;
  trigger: {
    type: string;
    field?: string;
    operator?: string;
    value?: unknown;
    schedule?: string;
    threshold?: number;
  };
  conditions?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  actions: AutomationAction[];
  metadata?: {
    priority?: 'baixa' | 'media' | 'alta';
    requiresApproval?: boolean;
    notifyChannels?: string[];
  };
}

const AUTOMATION_SCHEMA_PROMPT = `
Você é o copiloto responsável por converter comandos em linguagem natural em automações configuráveis dentro do sistema Rendizy.

Você está em uma conversa com o usuário. Seu objetivo é entender completamente o que ele quer automatizar antes de gerar a automação.

REGRAS IMPORTANTES:
1. Se você precisa de mais informações ou algo não está claro, responda de forma CONVERSACIONAL (texto livre, sem JSON) fazendo perguntas específicas.
2. Quando tiver TODAS as informações necessárias, SEMPRE retorne APENAS um JSON válido (sem texto adicional) seguindo este schema:
{
  "name": string,
  "description": string,
  "trigger": {
    "type": string,
    "field": string | null,
    "operator": string | null,
    "value": any,
    "schedule": string | null,
    "threshold": number | null
  },
  "conditions": [
    {
      "field": string,
      "operator": string,
      "value": any
    }
  ],
  "actions": [
    {
      "type": string,
      "channel": string | null,
      "template": string | null,
      "payload": Record<string, any>
    }
  ],
  "metadata": {
    "priority": "baixa" | "media" | "alta",
    "requiresApproval": boolean,
    "notifyChannels": string[]
  }
}
3. Use sempre ` + '`snake_case`' + ` para campos e valores chave.
4. Se faltar informação crítica, NÃO gere JSON. Faça perguntas conversacionais.
5. Se faltar informação não-crítica, faça suposições razoáveis e indique em metadata.requiresApproval = true.
6. Use o campo metadata.notifyChannels para avisar canais (ex.: ["chat", "email"]).
7. IMPORTANTE: Se você retornar JSON, retorne APENAS o JSON, sem texto antes ou depois.
8. IMPORTANTE: Se você retornar resposta conversacional, NÃO inclua JSON, apenas texto livre.
`;

export async function interpretAutomationNaturalLanguage(c: Context) {
  try {
    const body = await c.req.json<NaturalLanguageAutomationRequest>();
    if (!body?.input || body.input.trim().length < 10) {
      return c.json(validationErrorResponse('Descreva melhor a automação. Utilize pelo menos 10 caracteres.'), 400);
    }

    const organizationId = await getOrganizationIdForRequest(c);
    logInfo(`[AutomationsAI] Interpretando automação para org ${organizationId}`, { 
      conversationMode: body.conversationMode,
      hasHistory: !!body.conversationHistory?.length 
    });

    // Construir mensagens com histórico se disponível
    const messages: AIChatMessage[] = [
      {
        role: 'system',
        content: AUTOMATION_SCHEMA_PROMPT + (body.conversationMode ? '\n\nVocê está em uma conversa. Pode fazer perguntas antes de gerar a automação final. Seja conversacional e amigável.' : ''),
      },
    ];

    // Adicionar histórico da conversa se disponível
    if (body.conversationHistory && body.conversationHistory.length > 0) {
      // Adicionar apenas últimas 10 mensagens para não exceder limite
      const recentHistory = body.conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Adicionar mensagem atual
    messages.push({
      role: 'user',
      content: `
Contexto:
- Módulo: ${body.module || 'financeiro'}
- Canal desejado: ${body.channel || 'chat'}
- Prioridade: ${body.priority || 'media'}
- Idioma esperado: ${body.language || 'pt-BR'}

Pedido do usuário:
"""
${body.input.trim()}
"""
      `.trim(),
    });

    // Ajustar temperatura e tokens baseado no modo
    const temperature = body.conversationMode ? 0.3 : 0.1; // Mais criativo em modo conversacional
    const maxTokens = body.conversationMode ? 1000 : 800; // Mais tokens para conversas

    const result = await generateAIChat({
      organizationId,
      messages,
      temperature,
      maxTokens,
    });

    // Tentar parsear como JSON (automação completa)
    let definition: AutomationDefinition | null = null;
    let isConversational = false;
    
    try {
      definition = JSON.parse(result.text);
      // Verificar se é uma automação válida
      if (!definition?.name || !definition?.trigger || !definition?.actions?.length) {
        isConversational = true; // Não é automação completa, é resposta conversacional
        definition = null;
      }
    } catch (error) {
      // Não é JSON, é resposta conversacional
      isConversational = true;
      logInfo('[AutomationsAI] Resposta conversacional (não JSON)', { text: result.text.substring(0, 100) });
    }

    // Se for modo conversacional e não gerou automação, retornar resposta conversacional
    if (body.conversationMode && isConversational) {
      return c.json(
        successResponse({
          definition: null,
          conversationalResponse: result.text,
          provider: result.provider,
          model: result.model,
          rawText: result.text,
        }),
      );
    }

    // Se não for modo conversacional e não gerou automação, retornar erro
    if (!definition) {
      return c.json(
        errorResponse('IA retornou um formato inválido. Tente reformular o pedido ou forneça mais detalhes.'),
        422,
      );
    }

    return c.json(
      successResponse({
        definition,
        provider: result.provider,
        model: result.model,
        rawText: result.text,
      }),
    );
  } catch (error: any) {
    logError('[AutomationsAI] Erro inesperado', error);
    return c.json(
      errorResponse('Falha ao interpretar automação em linguagem natural', {
        details: error?.message,
      }),
      500,
    );
  }
}




