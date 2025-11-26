/**
 * RENDIZY - Integração com Provedor de IA
 *
 * Permite configurar um provedor (ex.: OpenAI) para uso interno (Automações, Assistentes, etc.)
 * Persistência segura (backend) e teste remoto com o provedor real.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import {
  Activity,
  Bot,
  CheckCircle2,
  Info,
  Link,
  MessageSquare,
  RefreshCcw,
  Shield,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { integrationsApi, type AIProviderConfigResponse } from '../utils/api';

type ProviderId = 'openai' | 'azure-openai' | 'huggingface' | 'deepseek' | 'anthropic' | 'google-gemini' | 'groq' | 'together' | 'custom';

interface ProviderMeta {
  id: ProviderId;
  name: string;
  description: string;
  baseUrl: string;
  defaultModel: string;
  docsUrl: string;
  labelVariant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning';
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    description: 'Ideal para qualidade máxima (GPT-4o, GPT-4.1, GPT-3.5, etc.)',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    docsUrl: 'https://platform.openai.com/docs/introduction',
    labelVariant: 'success',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Modelo de IA de alta performance e custo-benefício (DeepSeek Chat, DeepSeek Coder).',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    docsUrl: 'https://platform.deepseek.com/docs',
    labelVariant: 'success',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Claude 3.5 Sonnet, Opus e Haiku - modelos avançados da Anthropic.',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    docsUrl: 'https://docs.anthropic.com/claude/reference/getting-started-with-the-api',
    labelVariant: 'success',
  },
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    description: 'Modelos Gemini Pro e Ultra da Google (Gemini 1.5 Pro, Flash, etc.).',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-1.5-pro',
    docsUrl: 'https://ai.google.dev/docs',
    labelVariant: 'secondary',
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Inferência ultra-rápida com modelos Llama, Mixtral e outros (gratuito até certo limite).',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.1-70b-versatile',
    docsUrl: 'https://console.groq.com/docs',
    labelVariant: 'default',
  },
  {
    id: 'together',
    name: 'Together AI',
    description: 'Acesso a modelos open-source (Llama, Mistral, Mixtral) com preços competitivos.',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3-70b-chat-hf',
    docsUrl: 'https://docs.together.ai',
    labelVariant: 'default',
  },
  {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    description: 'Hospedagem Microsoft com redes privadas, compliance e modelos GPT.',
    baseUrl: 'https://YOUR-RESOURCE-NAME.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT',
    defaultModel: 'gpt-4o',
    docsUrl: 'https://learn.microsoft.com/azure/ai-services/openai/',
    labelVariant: 'secondary',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face Inference',
    description: 'Modelos open-source (Llama 3, Mistral, etc.) via Inference API.',
    baseUrl: 'https://api-inference.huggingface.co',
    defaultModel: 'meta-llama/Meta-Llama-3-8B-Instruct',
    docsUrl: 'https://huggingface.co/docs/api-inference/en/index',
    labelVariant: 'default',
  },
  {
    id: 'custom',
    name: 'Provider Personalizado',
    description: 'Use qualquer endpoint compatível com OpenAI / Chat Completions.',
    baseUrl: '',
    defaultModel: '',
    docsUrl: 'https://platform.openai.com/docs/api-reference/chat/create',
    labelVariant: 'outline',
  },
];

interface AIIntegrationConfig {
  enabled: boolean;
  provider: ProviderId;
  baseUrl: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  promptTemplate: string;
  lastUpdated?: string;
  notes?: string;
}

const DEFAULT_PROMPT = 'Você é o copiloto oficial do Rendizy. Responda sempre em português brasileiro.';

const DEFAULT_STATE: AIIntegrationConfig = {
  enabled: false,
  provider: 'openai',
  baseUrl: PROVIDERS.find((p) => p.id === 'openai')?.baseUrl || '',
  defaultModel: PROVIDERS.find((p) => p.id === 'openai')?.defaultModel || '',
  temperature: 0.2,
  maxTokens: 512,
  promptTemplate: DEFAULT_PROMPT,
  lastUpdated: undefined,
  notes: '',
};

export function AIIntegration() {
  const [config, setConfig] = useState<AIIntegrationConfig>(DEFAULT_STATE);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasRemoteApiKey, setHasRemoteApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastTestResult, setLastTestResult] = useState<{
    status: 'success' | 'error' | 'idle';
    message?: string;
    testedAt?: string;
  }>({
    status: 'idle',
  });

  const providerMeta = useMemo(
    () => PROVIDERS.find((p) => p.id === config.provider) || PROVIDERS[0],
    [config.provider],
  );

  // Desabilitar inputs durante carregamento, salvamento ou teste
  const disableInputs = isLoadingConfig || isSaving || isTesting;
  const disableTest = isLoadingConfig || isSaving || isTesting;

  const mapResponseToConfig = useCallback((data?: AIProviderConfigResponse): AIIntegrationConfig => {
    const providerId = (data?.provider as ProviderId) || 'openai';
    const defaults = PROVIDERS.find((p) => p.id === providerId) || PROVIDERS[0];
    return {
      enabled: data?.enabled ?? data?.exists ?? false,
      provider: providerId,
      baseUrl: data?.base_url || defaults.baseUrl,
      defaultModel: data?.default_model || defaults.defaultModel,
      temperature: data?.temperature ?? 0.2,
      maxTokens: data?.max_tokens ?? 512,
      promptTemplate: data?.prompt_template || DEFAULT_PROMPT,
      lastUpdated: data?.updated_at,
      notes: data?.notes ?? '',
    };
  }, []);

  const loadRemoteConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    setLoadError(null);
    try {
      const response = await integrationsApi.ai.getConfig();
      if (!response.success) {
        throw new Error(response.error || 'Falha ao carregar configuração de IA');
      }
      const nextConfig = mapResponseToConfig(response.data);
      setConfig(nextConfig);
      setHasRemoteApiKey(Boolean(response.data?.hasApiKey));
      setApiKeyInput('');
      setLoadError(null);
    } catch (error: any) {
      console.error('❌ [AIIntegration] Erro ao carregar config:', error);
      setLoadError(error?.message || 'Erro ao carregar configuração de IA');
    } finally {
      setIsLoadingConfig(false);
    }
  }, [mapResponseToConfig]);

  useEffect(() => {
    loadRemoteConfig();
  }, [loadRemoteConfig]);

  const handleChange = <K extends keyof AIIntegrationConfig>(field: K, value: AIIntegrationConfig[K]) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProviderChange = (providerId: ProviderId) => {
    const meta = PROVIDERS.find((p) => p.id === providerId);
    if (!meta) return;

    setConfig((prev) => ({
      ...prev,
      provider: providerId,
      baseUrl: meta.baseUrl,
      defaultModel: meta.defaultModel,
    }));
  };

  const handleSave = async () => {
    if (isLoadingConfig) return;
    setIsSaving(true);
    try {
      const response = await integrationsApi.ai.upsertConfig({
        provider: config.provider,
        baseUrl: config.baseUrl,
        defaultModel: config.defaultModel,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        promptTemplate: config.promptTemplate,
        notes: config.notes,
        enabled: config.enabled,
        apiKey: apiKeyInput || undefined,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Falha ao salvar configuração de IA');
      }

      const nextConfig = mapResponseToConfig(response.data);
      setConfig(nextConfig);
      setHasRemoteApiKey(true);
      setApiKeyInput('');
      toast.success('Integração de IA atualizada');
    } catch (error: any) {
      console.error('❌ [AIIntegration] Erro ao salvar:', error);
      toast.error(error?.message || 'Falha ao salvar configuração de IA');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setLastTestResult({
      status: 'idle',
    });

    try {
      const response = await integrationsApi.ai.testConfig();

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Falha ao testar provedor de IA');
      }

      setLastTestResult({
        status: 'success',
        message: `Status ${response.data.httpStatus} - ${
          response.data.modelsCount !== undefined
            ? `${response.data.modelsCount} modelos listados`
            : 'resposta válida'
        }`,
        testedAt: response.data.testedAt,
      });

      toast.success('Conexão com o provedor de IA validada com sucesso');
    } catch (error: any) {
      console.error('❌ [AIIntegration] Erro ao testar provedor:', error);
      setLastTestResult({
        status: 'error',
        message: error?.message || 'Erro desconhecido ao testar integração',
        testedAt: new Date().toISOString(),
      });
      toast.error('Falha ao conectar com o provedor de IA');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 text-white">
        <Bot className="h-4 w-4" />
        <AlertTitle>Copiloto Rendizy</AlertTitle>
        <AlertDescription className="text-slate-200 text-sm">
          Configure um provedor de IA para alimentar automações, assistentes e análises dentro do Rendizy. Você pode
          usar sua assinatura do ChatGPT ou qualquer endpoint compatível com o padrão OpenAI.
        </AlertDescription>
      </Alert>

      {loadError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar configuração</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>{loadError}</span>
            <Button
              variant="secondary"
              size="sm"
              className="w-fit"
              onClick={loadRemoteConfig}
            >
              Recarregar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-500" />
            Provedor de IA
          </CardTitle>
          <CardDescription>Selecione o provedor principal que abastecerá os módulos inteligentes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="text-sm font-medium text-foreground">Integração Habilitada</p>
              <p className="text-xs text-muted-foreground">
                Quando ativado, os módulos do sistema poderão solicitar respostas a este provedor.
              </p>
            </div>
            <Switch
              checked={config.enabled}
              disabled={disableInputs}
              onCheckedChange={(value) => handleChange('enabled', value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provedor</Label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={config.provider}
                disabled={disableInputs}
                onChange={(event) => handleProviderChange(event.target.value as ProviderId)}
              >
                {PROVIDERS.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                {providerMeta.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Modelo Padrão</Label>
              <Input
                placeholder="gpt-4o-mini, gpt-4.1, llama3-8b-instruct, etc."
                value={config.defaultModel}
                disabled={disableInputs}
                onChange={(event) => handleChange('defaultModel', event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Esse modelo será usado por padrão em automações. Você pode sobrescrever em cada fluxo.
              </p>
            </div>

            <div className="space-y-2">
              <Label>API Key / Token</Label>
              <Input
                type="password"
                placeholder="Cole aqui sua API Key"
                value={apiKeyInput}
                disabled={disableInputs}
                onChange={(event) => setApiKeyInput(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {hasRemoteApiKey
                  ? 'API Key já armazenada com segurança. Informe um novo valor apenas se quiser substituí-la.'
                  : 'Sua chave será criptografada no backend Rendizy.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                placeholder="https://api.openai.com/v1"
                value={config.baseUrl}
                disabled={disableInputs}
                onChange={(event) => handleChange('baseUrl', event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Use endpoint completo para provedores personalizados.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Temperature</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={config.temperature}
                disabled={disableInputs}
                onChange={(event) => handleChange('temperature', Number(event.target.value))}
              />
              <p className="text-xs text-muted-foreground">0 = respostas determinísticas, 1 = mais criativas.</p>
            </div>

            <div className="space-y-2">
              <Label>Máx. Tokens de Resposta</Label>
              <Input
                type="number"
                min="64"
                max="4096"
                value={config.maxTokens}
                disabled={disableInputs}
                onChange={(event) => handleChange('maxTokens', Number(event.target.value))}
              />
              <p className="text-xs text-muted-foreground">Limite máximo por resposta.</p>
            </div>

            <div className="space-y-2">
              <Label>Notas Internas</Label>
              <Input
                placeholder="Ex.: usar apenas para relatórios críticos."
                value={config.notes || ''}
                disabled={disableInputs}
                onChange={(event) => handleChange('notes', event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prompt Base / Persona</Label>
            <Textarea
              rows={4}
              value={config.promptTemplate}
              disabled={disableInputs}
              onChange={(event) => handleChange('promptTemplate', event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Texto injetado antes de cada chamada. Use para definir personalidade, idioma e políticas.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Chaves criptografadas via AES-GCM no backend. Em breve: múltiplos provedores por organização.
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              onClick={handleSave}
              disabled={disableInputs}
              className="min-w-[160px]"
            >
              {isSaving ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={disableTest}
              className="min-w-[180px]"
            >
              {isTesting ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Testando conexão...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Testar provedor
                </>
              )}
            </Button>
          </div>

          {config.lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Última atualização: {new Date(config.lastUpdated).toLocaleString('pt-BR')}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Resultado do Teste
          </CardTitle>
          <CardDescription>Verifique se o provedor respondeu corretamente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {lastTestResult.status === 'idle' && (
            <Alert variant="default">
              <Info className="h-4 w-4" />
              <AlertDescription>Aguardando teste.</AlertDescription>
            </Alert>
          )}

          {lastTestResult.status === 'success' && (
            <Alert className="border-green-500/40 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-500">Conexão validada</AlertTitle>
              <AlertDescription className="text-green-400">
                {lastTestResult.message || 'Provedor respondeu corretamente.'}
                {lastTestResult.testedAt && (
                  <span className="block text-xs mt-1">
                    Último teste: {new Date(lastTestResult.testedAt).toLocaleString()}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {lastTestResult.status === 'error' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Falha na conexão</AlertTitle>
              <AlertDescription>
                {lastTestResult.message || 'Não foi possível validar o provedor.'}
                {lastTestResult.testedAt && (
                  <span className="block text-xs mt-1">
                    Tentativa: {new Date(lastTestResult.testedAt).toLocaleString()}
                  </span>
                )}
                <span className="block text-xs mt-2">
                  Dica: confirme a API Key, URL/base e permissões do provedor. Consulte os logs do backend para mais
                  detalhes.
                </span>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              Provider: {providerMeta.name}
            </Badge>
            {config.defaultModel && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Link className="h-3 w-3" />
                Modelo: {config.defaultModel}
              </Badge>
            )}
            {config.lastUpdated && (
              <Badge variant="outline">
                Atualizado em {new Date(config.lastUpdated).toLocaleString()}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


