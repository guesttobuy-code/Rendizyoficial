# 📋 Funil Pré-determinado - Funcionalidades Completas Documentadas

**Data:** 24/11/2025  
**Status:** Documentação Completa - Pronto para Implementação

---

## 🎯 CONCEITO PRINCIPAL

### Sistema Genérico e Flexível
Este **NÃO é um funil específico para vistoria**, mas sim um **sistema genérico de processos pré-determinados** que pode ser usado para:

- ✅ Vistoria de Imóvel (exemplo inicial)
- ✅ Processo de Fechamento e Implantação
- ✅ Check-in/Check-out
- ✅ Processo de Manutenção
- ✅ Processo de Renovação
- ✅ Onboarding de Cliente
- ✅ Aprovação de Anúncios
- ✅ Processo de Venda
- ✅ E **qualquer outro processo** que a imobiliária precisar criar

### Características Essenciais

1. **Ferramentas de Criação Flexíveis** - Permitir criar processos customizados
2. **Visualização Vertical (Wizard)** - Mobile-first, etapas sequenciais
3. **Portal do Cliente** - Cliente acessa via site da imobiliária (área de login)
4. **Gestão Compartilhada** - Imobiliária + Time interno gerenciam, cliente participa
5. **Gatilhos Automáticos** - Pode ser iniciado por eventos (ex: contrato assinado)

---

## 📋 FUNCIONALIDADES CORE (FASE 1 - IMPLEMENTAÇÃO INICIAL)

### 1. Tipo de Funil: `PREDETERMINED`

✅ **JÁ IMPLEMENTADO:**
- Tipo `PREDETERMINED` adicionado ao `FunnelType`
- Módulo `PredeterminedFunnelModule.tsx` criado
- Rota `/crm/predetermined` configurada
- Carregamento de funis do tipo PREDETERMINED

### 2. Visualização Vertical (Wizard View)

❌ **A IMPLEMENTAR:**

**Componente:** `PredeterminedFunnelView.tsx`

**Características:**
- Layout vertical (mobile-first)
- Etapas empilhadas verticalmente
- Indicadores visuais de progresso
- Botões de ação por etapa
- Bloqueio visual de etapas futuras

**Design Visual:**
```
┌─────────────────────────────────────┐
│ 📋 Vistoria de Imóvel - Apt 201    │
│ Progresso: ████████░░ 60%          │
├─────────────────────────────────────┤
│                                     │
│ ✅ ETAPA 1: Vistoria Inicial       │
│    👤 Vistoriador                   │
│    ✅ Concluída em 15/01/2025      │
│    [Ver detalhes]                  │
│                                     │
│ ⏳ ETAPA 2: Aprovação Inquilino    │
│    👤 João Silva (Inquilino)       │
│    ⏳ Aguardando desde 15/01       │
│    [Aguardando ação...]            │
│                                     │
│ 🔒 ETAPA 3: Proposta Orçamento     │
│    🏢 Imobiliária                  │
│    🔒 Bloqueada                    │
│    [Aguardando etapa anterior...]  │
│                                     │
│ 🔒 ETAPA 4: Aprovação Orçamento    │
│    👤 João Silva (Inquilino)       │
│    🔒 Bloqueada                    │
│    [Aguardando etapas anteriores] │
│                                     │
└─────────────────────────────────────┘
```

**Indicadores Visuais:**
- ✅ **Verde** = Etapa concluída
- ⏳ **Amarelo** = Em andamento / Aguardando
- 🔒 **Cinza** = Bloqueada (aguardando etapas anteriores)
- ⚠️ **Laranja** = Requisitos não atendidos
- ❌ **Vermelho** = Rejeitada / Erro

**Componente:** `PredeterminedStageCard.tsx`
- Card individual para cada etapa
- Mostra status, responsável, data
- Botões de ação contextuais
- Indicador de progresso da etapa

### 3. Validação de Etapas

❌ **A IMPLEMENTAR:**

**Componente:** `StageValidation.tsx`

**Sistema de validação que verifica:**
- ✅ Todas as tarefas obrigatórias completas
- ✅ Campos obrigatórios preenchidos
- ✅ Aprovações necessárias recebidas
- ✅ Produtos/orçamento adicionados (se necessário)
- ✅ Progresso mínimo atingido

**Configuração:**
```typescript
export interface StageRequirement {
  stageId: string;
  requiredTasks?: string[]; // IDs de tarefas obrigatórias
  requiredFields?: string[]; // Campos obrigatórios
  requiredApproval?: boolean; // Precisa aprovação
  requiredProducts?: boolean; // Precisa ter produtos/orçamento
  minProgress?: number; // Progresso mínimo (0-100)
}
```

**Comportamento:**
- Validação automática ao completar tarefas
- Bloqueio de avanço se requisitos não atendidos
- Mensagem clara sobre o que falta
- Botão "Validar" manual (opcional)

### 4. Responsáveis por Etapa

❌ **A IMPLEMENTAR:**

**Tipos de Responsável:**
- **Fixo** (ex: "Vistoriador", "Cliente", "Imobiliária")
- **Dinâmico** (baseado em relacionamentos do ticket)
- **Múltiplos** (ex: "Cliente OU Proprietário")

**Configuração:**
```typescript
export interface PredeterminedStage extends FunnelStage {
  responsibleType: 'internal' | 'client' | 'agency' | 'dynamic' | 'multiple';
  responsibleIds?: string[]; // IDs de usuários/pessoas
  // ...
}
```

**Comportamento:**
- Notificação automática ao responsável quando etapa é desbloqueada
- Badge visual mostrando responsável
- Filtro por responsável

### 5. Sistema de Aprovações

❌ **A IMPLEMENTAR:**

**Componente:** `StageApproval.tsx`

**Funcionalidades:**
- Botão "Aprovar" / "Rejeitar" na etapa
- Comentário obrigatório ao rejeitar
- Notificação para responsável da próxima etapa
- Histórico de aprovações
- Assinatura digital (futuro)

**Fluxo:**
1. Responsável completa tarefas da etapa
2. Clica em "Aprovar Etapa"
3. Sistema valida requisitos
4. Se válido: desbloqueia próxima etapa
5. Notifica responsável da próxima etapa

---

## 🛠️ FERRAMENTAS DE CRIAÇÃO (FASE 2)

### 6. Construtor Visual de Processos

❌ **A IMPLEMENTAR:**

**Componente:** `PredeterminedFunnelBuilder.tsx`

**Interface:**
- Editor drag-and-drop para criar processos
- Adicionar/remover/reordenar etapas
- Configurar cada etapa
- Preview do processo

**Funcionalidades:**
- Nome do processo
- Descrição
- Etapas do processo (drag & drop)
- Configuração de cada etapa
- Gatilhos automáticos
- Regras de negócio

### 7. Configuração de Etapa

❌ **A IMPLEMENTAR:**

**Componente:** `StageConfigModal.tsx`

**Campos de Configuração:**
- Nome da etapa
- Descrição
- Responsável (tipo e IDs)
- Tarefas desta etapa
- Requisitos para avançar
- Ações ao concluir
- Visibilidade (imobiliária, time interno, cliente)

**Requisitos para Avançar:**
- ☑ Todas as tarefas obrigatórias completas
- ☑ Aprovação do responsável
- ☐ Produtos/orçamento adicionados
- ☐ Progresso mínimo: [80]%

**Ações ao Concluir:**
- ☑ Notificar responsável da próxima etapa
- ☑ Enviar email ao cliente
- ☐ Criar tarefa em outro funil
- ☐ Trigger em automação

### 8. Gatilhos Automáticos

❌ **A IMPLEMENTAR:**

**Componente:** `ProcessTriggerConfig.tsx`

**Tipos de Gatilho:**
- ✅ Quando contrato é assinado
- ✅ Quando reserva é confirmada
- ✅ Quando ticket é criado
- ✅ Manualmente
- ✅ Em data específica
- ✅ Quando automação é acionada

**Configuração:**
```typescript
export interface ProcessTrigger {
  type: 'contract_signed' | 'reservation_confirmed' | 'manual' | 'date' | 'automation';
  config: TriggerConfig;
}
```

---

## 🌐 PORTAL DO CLIENTE (FASE 3)

### 9. Área de Login do Cliente

❌ **A IMPLEMENTAR:**

**Componente:** `ClientProcessView.tsx`

**Funcionalidades:**
- Cliente acessa via site da imobiliária (dentro do Rendizy)
- Visualização simplificada
- Apenas etapas onde ele é responsável
- Formulários simplificados
- Aprovações com um clique
- Visualização de progresso geral

**Interface:**
```
┌─────────────────────────────────────────────┐
│ Área do Cliente - Imobiliária XYZ          │
├─────────────────────────────────────────────┤
│                                             │
│ Olá, João Silva 👤                          │
│                                             │
│ MEUS PROCESSOS ATIVOS:                      │
│ ┌─────────────────────────────────────┐   │
│ │ 📋 Processo de Implantação - Apt 201 │   │
│ │ Progresso: ████████░░ 60%            │   │
│ │                                     │   │
│ │ ✅ Etapa 1: Análise do Contrato     │   │
│ │ ⏳ Etapa 2: Aprovação do Anúncio    │   │
│ │    [Ação Necessária] ← Clique aqui  │   │
│ │ 🔒 Etapa 3: Definição de Preço     │   │
│ │ 🔒 Etapa 4: Onboarding              │   │
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 10. Interface do Cliente na Etapa

❌ **A IMPLEMENTAR:**

**Componente:** `ClientStageView.tsx`

**Funcionalidades:**
- Formulários simplificados
- Upload de arquivos
- Aprovação/rejeição com comentário
- Visualização de anúncios/documentos
- Assistir vídeos (se tarefa tipo VIDEO)
- Assinatura digital (futuro)

---

## 🔧 FUNCIONALIDADES AVANÇADAS (FASE 4)

### 11. Templates de Processos

❌ **A IMPLEMENTAR:**

**Biblioteca de templates prontos:**
- "Processo de Implantação"
- "Vistoria Inicial e Final"
- "Check-in de Imóvel"
- "Check-out de Imóvel"
- "Processo de Manutenção"
- "Onboarding de Cliente"
- "Aprovação de Anúncios"
- "Processo de Renovação"

**Funcionalidades:**
- Criar template a partir de processo
- Usar template para criar novo processo
- Templates globais (apenas super_admin)
- Editar templates

### 12. Tipos de Tarefas Especiais

❌ **A IMPLEMENTAR:**

**Novos tipos além dos existentes (STANDARD, FORM, ATTACHMENT):**
- ✅ Tarefas VIDEO (link para vídeo)
- ✅ Tarefas APPROVAL (aprovação/rejeição)
- ✅ Tarefas SIGNATURE (assinatura digital)

**Configuração:**
```typescript
export type TaskType = 
  | 'STANDARD' 
  | 'FORM' 
  | 'ATTACHMENT' 
  | 'VIDEO'      // NOVO
  | 'APPROVAL'   // NOVO
  | 'SIGNATURE'; // NOVO
```

### 13. Regras de Negócio Customizáveis

❌ **A IMPLEMENTAR:**

**Tipos de Regras:**
- **Condições:** "Se cliente aprovar → Etapa 3, senão → Volta para Etapa 1"
- **Ações:** "Ao concluir Etapa 4 → Criar boleto automaticamente"
- **Timeouts:** "Se etapa não concluída em 7 dias → Notificar supervisor"
- **Paralelismo:** "Etapas 2 e 3 podem ser feitas simultaneamente"

**Configuração:**
```typescript
export interface BusinessRule {
  type: 'condition' | 'action' | 'timeout' | 'parallel';
  config: RuleConfig;
}
```

### 14. Timeline Visual

❌ **A IMPLEMENTAR:**

**Componente:** `StageTimeline.tsx`

**Funcionalidades:**
- Mostrar linha do tempo
- Quando cada etapa foi iniciada/concluída
- Tempo gasto em cada etapa
- Prazo estimado vs real
- Gráfico de progresso

### 15. Relatórios e Analytics

❌ **A IMPLEMENTAR:**

**Métricas:**
- Tempo médio por etapa
- Taxa de aprovação/rejeição
- Etapas que mais demoram
- Gargalos no processo
- Taxa de conclusão
- Tempo médio total do processo

---

## 🔄 INTEGRAÇÃO COM FUNCIONALIDADES EXISTENTES

### Reutilizar (JÁ IMPLEMENTADO):

1. ✅ **Tarefas** - Cada etapa pode ter tarefas específicas
2. ✅ **Produtos/Orçamento** - Usar na etapa de orçamento
3. ✅ **Relacionamentos** - Pessoas, imóveis, automações
4. ✅ **Templates** - Criar templates de funis pré-determinados
5. ✅ **Chat IA** - Assistente para ajudar no processo
6. ✅ **Formulários** - Tarefas do tipo FORM
7. ✅ **Anexos** - Tarefas do tipo ATTACHMENT
8. ✅ **Histórico** - Audit log de todas as ações

### Novos Componentes (A IMPLEMENTAR):

1. 🆕 **PredeterminedFunnelView** - Visualização vertical
2. 🆕 **PredeterminedStageCard** - Card de etapa
3. 🆕 **StageValidation** - Validação de requisitos
4. 🆕 **StageApproval** - Sistema de aprovações
5. 🆕 **StageProgress** - Indicador de progresso por etapa
6. 🆕 **StageTimeline** - Timeline visual
7. 🆕 **PredeterminedFunnelBuilder** - Construtor visual
8. 🆕 **StageConfigModal** - Configurar etapa
9. 🆕 **ProcessTriggerConfig** - Configurar gatilhos
10. 🆕 **ClientProcessView** - Visualização do cliente
11. 🆕 **ClientStageView** - Etapa do cliente

---

## 🔗 INTEGRAÇÃO COM MÓDULO FINANCEIRO

### 16. Trigger Financeiro

❌ **A IMPLEMENTAR:**

**Quando etapa final é concluída:**
- Trigger para módulo financeiro
- Gerar boletos/links de pagamento
- Vincular ao ticket/orçamento
- Enviar notificação ao cliente

**Configuração:**
- Campo na última etapa: "Gerar boleto ao concluir"
- Valor do boleto (do orçamento do ticket)
- Data de vencimento
- Descrição do boleto

---

## 📊 ESTRUTURA DE DADOS

### Tipos TypeScript Necessários

```typescript
export type FunnelType = 'SALES' | 'SERVICES' | 'PREDETERMINED'; // ✅ JÁ EXISTE

export interface PredeterminedFunnelConfig {
  isSequential: boolean; // true = só avança sequencialmente
  allowSkip: boolean; // false = não pode pular etapas
  requireValidation: boolean; // true = precisa validar requisitos
  visibility: 'internal' | 'shared' | 'public'; // Quem pode ver
  stageRequirements?: StageRequirement[]; // Requisitos por etapa
}

export interface StageRequirement {
  stageId: string;
  requiredTasks?: string[]; // IDs de tarefas obrigatórias
  requiredFields?: string[]; // Campos obrigatórios
  requiredApproval?: boolean; // Precisa aprovação
  requiredProducts?: boolean; // Precisa ter produtos/orçamento
  minProgress?: number; // Progresso mínimo (0-100)
}

export interface PredeterminedStage extends FunnelStage {
  responsibleType: 'internal' | 'client' | 'agency' | 'dynamic' | 'multiple';
  responsibleIds?: string[]; // IDs de usuários/pessoas
  tasks: ServiceTask[]; // Tarefas específicas desta etapa
  requirements: StageRequirement;
  visibility: {
    agency: boolean;
    internal: boolean;
    client: boolean;
  };
  actions: StageAction[]; // Ações ao concluir
}

export interface ProcessTrigger {
  type: 'contract_signed' | 'reservation_confirmed' | 'manual' | 'date' | 'automation';
  config: TriggerConfig;
}

export interface StageAction {
  type: 'notify' | 'email' | 'create_task' | 'trigger_automation' | 'create_bill';
  config: ActionConfig;
}
```

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### FASE 1: Visualização Vertical (PRIORIDADE ALTA)
1. ✅ Criar `PredeterminedFunnelView.tsx`
2. ✅ Criar `PredeterminedStageCard.tsx`
3. ✅ Implementar indicadores visuais
4. ✅ Implementar bloqueio de etapas
5. ✅ Integrar com tickets existentes

### FASE 2: Validação e Aprovações (PRIORIDADE ALTA)
1. ✅ Criar `StageValidation.tsx`
2. ✅ Implementar sistema de validação
3. ✅ Criar `StageApproval.tsx`
4. ✅ Implementar aprovações/rejeições
5. ✅ Histórico de aprovações

### FASE 3: Construtor de Processos (PRIORIDADE MÉDIA)
1. ✅ Criar `PredeterminedFunnelBuilder.tsx`
2. ✅ Criar `StageConfigModal.tsx`
3. ✅ Implementar drag & drop de etapas
4. ✅ Implementar configuração de etapas
5. ✅ Implementar gatilhos

### FASE 4: Portal do Cliente (PRIORIDADE MÉDIA)
1. ✅ Criar `ClientProcessView.tsx`
2. ✅ Criar `ClientStageView.tsx`
3. ✅ Implementar interface simplificada
4. ✅ Implementar aprovações do cliente
5. ✅ Implementar uploads do cliente

### FASE 5: Funcionalidades Avançadas (PRIORIDADE BAIXA)
1. ✅ Templates de processos
2. ✅ Tipos de tarefas especiais (VIDEO, APPROVAL, SIGNATURE)
3. ✅ Regras de negócio customizáveis
4. ✅ Timeline visual
5. ✅ Relatórios e analytics
6. ✅ Integração com módulo financeiro

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1 - Visualização Vertical
- [ ] `PredeterminedFunnelView.tsx` criado
- [ ] `PredeterminedStageCard.tsx` criado
- [ ] Layout vertical implementado
- [ ] Indicadores visuais (✅ ⏳ 🔒 ⚠️ ❌)
- [ ] Progresso geral do processo
- [ ] Bloqueio visual de etapas futuras
- [ ] Integração com tickets existentes
- [ ] Responsivo (mobile-first)

### FASE 2 - Validação e Aprovações
- [ ] `StageValidation.tsx` criado
- [ ] Validação de tarefas obrigatórias
- [ ] Validação de campos obrigatórios
- [ ] Validação de aprovações
- [ ] Validação de produtos/orçamento
- [ ] `StageApproval.tsx` criado
- [ ] Botões aprovar/rejeitar
- [ ] Comentários obrigatórios
- [ ] Histórico de aprovações
- [ ] Notificações automáticas

### FASE 3 - Construtor
- [ ] `PredeterminedFunnelBuilder.tsx` criado
- [ ] `StageConfigModal.tsx` criado
- [ ] Drag & drop de etapas
- [ ] Configuração de responsáveis
- [ ] Configuração de requisitos
- [ ] Configuração de ações
- [ ] `ProcessTriggerConfig.tsx` criado
- [ ] Configuração de gatilhos

### FASE 4 - Portal do Cliente
- [ ] `ClientProcessView.tsx` criado
- [ ] `ClientStageView.tsx` criado
- [ ] Interface simplificada
- [ ] Apenas etapas do cliente
- [ ] Formulários simplificados
- [ ] Upload de arquivos
- [ ] Aprovações com um clique

### FASE 5 - Avançado
- [ ] Templates de processos
- [ ] Tipos VIDEO, APPROVAL, SIGNATURE
- [ ] Regras de negócio
- [ ] Timeline visual
- [ ] Relatórios
- [ ] Integração financeiro

---

## 📝 NOTAS IMPORTANTES

### Preservar Ideias Principais:
1. ✅ **Sistema Genérico** - Não é só para vistoria, serve para qualquer processo
2. ✅ **Ferramentas de Criação** - Construtor visual flexível
3. ✅ **Portal do Cliente** - Cliente acessa via site da imobiliária
4. ✅ **Gestão Compartilhada** - Imobiliária + Time interno + Cliente
5. ✅ **Gatilhos Automáticos** - Iniciar por eventos
6. ✅ **Reutilização** - Usa tarefas, produtos, relacionamentos existentes
7. ✅ **Visualização Vertical** - Mobile-first, wizard-like
8. ✅ **Validação Sequencial** - Não pode pular etapas sem validar

### Exemplos Confirmados:
- ✅ Processo de Implantação (exemplo detalhado)
- ✅ Vistoria de Imóvel (exemplo inicial)
- ✅ Check-in/Check-out
- ✅ Processo de Manutenção
- ✅ Onboarding de Cliente
- ✅ E qualquer outro processo que a imobiliária criar

---

**Documento criado em:** 24/11/2025  
**Versão:** 1.0  
**Status:** ✅ Documentação Completa - Pronto para Implementação
