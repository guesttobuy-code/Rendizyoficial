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

Regras:
1. Sempre retorne um JSON válido seguindo o schema:
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
2. Use sempre ` + '`snake_case`' + ` para campos e valores chave.
3. Se faltar informação, faça suposições razoáveis e indique em metadata.requiresApproval = true.
4. Use o campo metadata.notifyChannels para avisar canais (ex.: ["chat", "email"]).
5. Nunca inclua texto fora do JSON.
`;

export async function interpretAutomationNaturalLanguage(c: Context) {
  try {
    const body = await c.req.json<NaturalLanguageAutomationRequest>();
    if (!body?.input || body.input.trim().length < 10) {
      return c.json(validationErrorResponse('Descreva melhor a automação. Utilize pelo menos 10 caracteres.'), 400);
    }

    const organizationId = await getOrganizationIdForRequest(c);
    logInfo(`[AutomationsAI] Interpretando automação para org ${organizationId}`);

    const messages: AIChatMessage[] = [
      {
        role: 'system',
        content: AUTOMATION_SCHEMA_PROMPT,
      },
      {
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
      },
    ];

    const result = await generateAIChat({
      organizationId,
      messages,
      temperature: 0.1,
      maxTokens: 800,
    });

    let definition: AutomationDefinition | null = null;
    try {
      definition = JSON.parse(result.text);
    } catch (error) {
      logError('[AutomationsAI] Falha ao converter resposta em JSON', { text: result.text, error });
      return c.json(
        errorResponse('IA retornou um formato inválido. Tente reformular o pedido ou forneça mais detalhes.'),
        422,
      );
    }

    if (!definition?.name || !definition?.trigger || !definition?.actions?.length) {
      return c.json(
        validationErrorResponse('A IA não conseguiu definir a automação. Tente ser mais específico.'),
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




