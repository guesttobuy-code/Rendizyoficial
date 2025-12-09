# 🔍 DIAGNÓSTICO COMPLETO - PERSISTÊNCIA DE DADOS

**Data:** 2025-01-27  
**Status:** 🔴 **PROBLEMA CRÍTICO IDENTIFICADO**  
**Prioridade:** 🔴 **MÁXIMA**

---

## 📊 RESUMO EXECUTIVO

### 🚨 **PROBLEMA PRINCIPAL:**
**"Quando acerta em um lado, desmonta o outro lado"**

O sistema está salvando dados em **múltiplos lugares simultaneamente**, causando:
- ❌ Dados inconsistentes
- ❌ Perda de dados ao alternar entre métodos
- ❌ Conflitos entre SQL, localStorage e KV Store
- ❌ Normalização duplicada em diferentes lugares

---

## 🔴 PROBLEMAS IDENTIFICADOS

### **1. MÚLTIPLOS PONTOS DE SALVAMENTO**

#### **Propriedades (Properties):**
```
Frontend (PropertyWizardPage.tsx)
  ↓ normalizeWizardData() [normalização 1]
  ↓ propertiesApi.create/update()
  ↓ Backend (routes-properties.ts)
    ↓ normalizeWizardData() [normalização 2 - DUPLICADA!]
    ↓ propertyToSql()
    ↓ SQL INSERT/UPDATE
    ↓ localStorage (useAutoSave.ts) [SALVAMENTO PARALELO!]
```

**Problemas:**
- ❌ Normalização duplicada (frontend E backend)
- ❌ localStorage salvando em paralelo ao SQL
- ❌ Dados podem ficar inconsistentes entre SQL e localStorage
- ❌ Quando corrige frontend, quebra backend (e vice-versa)

#### **Contatos (Evolution Contacts):**
```
EvolutionContactsService
  ↓ saveContacts()
    ↓ SQL (evolution_contacts) [TENTATIVA 1]
      ↓ Se falhar → localStorage [FALLBACK]
    ↓ localStorage [SALVAMENTO PARALELO]
```

**Problemas:**
- ❌ Fallback para localStorage quebra regra estabelecida
- ❌ Dados podem estar só no localStorage (perdidos ao limpar cache)
- ❌ Multi-tenant quebrado quando usa localStorage

---

### **2. NORMALIZAÇÃO DUPLICADA**

#### **Frontend:**
```typescript
// RendizyPrincipal/pages/PropertyWizardPage.tsx:74
const normalizeWizardData = (wizardData: any): any => {
  // Normaliza dados do wizard
  // Achatamento de estrutura aninhada
}
```

#### **Backend:**
```typescript
// routes-properties.ts:1294
function normalizeWizardData(wizardData: any, existing?: Property): any {
  // Normaliza dados do wizard (NOVAMENTE!)
  // Achatamento de estrutura aninhada (DUPLICADO!)
}
```

**Problemas:**
- ❌ Lógica duplicada (viola DRY)
- ❌ Mudanças precisam ser feitas em 2 lugares
- ❌ Fácil de ficar inconsistente
- ❌ Quando corrige um, pode quebrar o outro

---

### **3. SALVAMENTO PARALELO (SQL + localStorage)**

#### **useAutoSave.ts:**
```typescript
// Linha 52: Salva no backend (SQL)
await onSave(data);

// Linha 56: Salva no localStorage (PARALELO!)
localStorage.setItem(`property_draft_${propertyId}`, JSON.stringify(data));
```

**Problemas:**
- ❌ Dados salvos em 2 lugares simultaneamente
- ❌ Se SQL falhar, localStorage tem dados diferentes
- ❌ Se localStorage falhar, usuário não sabe
- ❌ Dificulta debug (onde está a verdade?)

---

### **4. MERGE DE DADOS COMPLEXO**

#### **Backend (routes-properties.ts:1692-1737):**
```typescript
// Deep merge de wizardData
const existingWizardData = existing.wizardData || {};
const mergedWizardData = deepMerge(existingWizardData, rawWizardData);
normalized.wizardData = mergedWizardData;
```

**Problemas:**
- ❌ Merge profundo pode mesclar dados incorretos
- ❌ Arrays substituídos, objetos mesclados (lógica complexa)
- ❌ Fácil de perder dados em atualizações parciais
- ❌ Dificulta entender o que será salvo

---

### **5. FALLBACKS QUE CAUSAM CONFUSÃO**

#### **EvolutionContactsService:**
```typescript
// Tenta SQL primeiro
if (organizationId) {
  try {
    await supabase.from('evolution_contacts').upsert(...);
  } catch {
    // Fallback para localStorage (QUEBRA REGRA!)
    this.saveContactsToLocalStorage(contacts);
  }
}
```

**Problemas:**
- ❌ Fallback silencioso (usuário não sabe)
- ❌ Dados podem estar só no localStorage
- ❌ Quebra regra estabelecida (SQL para dados permanentes)
- ❌ Multi-tenant quebrado

---

## 🎯 CAUSA RAIZ

### **1. ARQUITETURA FRAGMENTADA**
- Múltiplos pontos de salvamento sem coordenação
- Cada parte do código salva "do seu jeito"
- Sem uma fonte única de verdade

### **2. FALTA DE COORDENAÇÃO**
- Frontend normaliza dados
- Backend normaliza dados novamente
- localStorage salva em paralelo
- Ninguém sabe qual é a "verdade"

### **3. FALLBACKS MAL IMPLEMENTADOS**
- Fallbacks silenciosos
- Fallbacks que quebram regras
- Fallbacks que criam dados inconsistentes

### **4. NORMALIZAÇÃO DUPLICADA**
- Mesma lógica em 2 lugares
- Fácil de ficar inconsistente
- Mudanças precisam ser feitas em 2 lugares

---

## ✅ SOLUÇÃO PROPOSTA

### **PRINCÍPIO FUNDAMENTAL:**
> **"UMA FONTE ÚNICA DE VERDADE"**
> 
> - ✅ **SQL é a fonte única de verdade**
> - ✅ **Frontend apenas envia dados brutos**
> - ✅ **Backend normaliza e salva (UMA VEZ)**
> - ✅ **localStorage apenas para rascunhos temporários (não paralelo)**

---

### **FASE 1: REMOVER NORMALIZAÇÃO DUPLICADA**

#### **1.1 Remover normalização do Frontend**
```typescript
// ❌ REMOVER: normalizeWizardData do frontend
// ✅ ENVIAR: Dados brutos do wizard para o backend
const handleSave = async (data: any) => {
  // Enviar dados brutos (sem normalizar)
  const response = await propertiesApi.create(data);
};
```

#### **1.2 Manter normalização apenas no Backend**
```typescript
// ✅ MANTER: normalizeWizardData apenas no backend
// ✅ ÚNICA FONTE de normalização
export async function createProperty(c: Context) {
  const body = await c.req.json();
  const normalized = normalizeWizardData(body); // ÚNICA normalização
  // ... salvar no SQL
}
```

**Benefícios:**
- ✅ Lógica de normalização em um só lugar
- ✅ Mudanças feitas uma vez
- ✅ Consistência garantida

---

### **FASE 2: REMOVER SALVAMENTO PARALELO**

#### **2.1 Remover localStorage de useAutoSave**
```typescript
// ❌ REMOVER: Salvamento paralelo no localStorage
// ✅ MANTER: Apenas salvamento no backend (SQL)

const performSave = useCallback(async () => {
  setSaveStatus('saving');
  
  // ✅ APENAS backend (SQL)
  await onSave(data);
  
  // ❌ REMOVER: localStorage.setItem(...)
  
  setSaveStatus('saved');
}, [data, onSave]);
```

#### **2.2 localStorage apenas para rascunhos (antes de criar)**
```typescript
// ✅ localStorage APENAS para rascunhos (quando ainda não tem ID)
// ✅ Quando propriedade é criada, limpar localStorage
const handleSave = async (data: any) => {
  if (!data.id) {
    // Rascunho: salvar no localStorage
    localStorage.setItem('property_draft', JSON.stringify(data));
  } else {
    // Propriedade existente: salvar apenas no SQL
    await propertiesApi.update(data.id, data);
    // Limpar rascunho
    localStorage.removeItem('property_draft');
  }
};
```

**Benefícios:**
- ✅ SQL é a fonte única de verdade
- ✅ localStorage apenas para rascunhos temporários
- ✅ Sem conflitos entre SQL e localStorage

---

### **FASE 3: REMOVER FALLBACKS SILENCIOSOS**

#### **3.1 Remover fallback para localStorage em contatos**
```typescript
// ❌ REMOVER: Fallback silencioso para localStorage
// ✅ ERRO EXPLÍCITO: Se SQL falhar, mostrar erro

async saveContacts(contacts: LocalContact[], organizationId: string): Promise<void> {
  if (!organizationId) {
    throw new Error('organizationId é obrigatório');
  }
  
  const { error } = await supabase
    .from('evolution_contacts')
    .upsert(contacts);
  
  if (error) {
    // ✅ ERRO EXPLÍCITO (não fallback silencioso)
    throw new Error(`Erro ao salvar contatos: ${error.message}`);
  }
}
```

**Benefícios:**
- ✅ Erros explícitos (não silenciosos)
- ✅ Usuário sabe quando algo falha
- ✅ Não quebra regras estabelecidas

---

### **FASE 4: SIMPLIFICAR MERGE DE DADOS**

#### **4.1 Estratégia de merge mais simples**
```typescript
// ✅ ESTRATÉGIA SIMPLES: Substituir wizardData completo
// ✅ Se precisa de merge parcial, frontend envia dados completos

export async function updateProperty(c: Context) {
  const body = await c.req.json();
  const existing = await getProperty(id);
  
  // ✅ ESTRATÉGIA SIMPLES: Substituir wizardData completo
  // Frontend sempre envia wizardData completo (não parcial)
  const updated = {
    ...existing,
    ...body, // Campos achatados
    wizardData: body.wizardData || existing.wizardData, // Substituir completo
  };
  
  await saveToSQL(updated);
}
```

**Benefícios:**
- ✅ Lógica simples (fácil de entender)
- ✅ Sem merge complexo
- ✅ Frontend responsável por enviar dados completos

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### **PRIORIDADE 1: CRÍTICO (FAZER AGORA)**

1. ✅ **Remover normalização duplicada do frontend**
   - Remover `normalizeWizardData` de `PropertyWizardPage.tsx`
   - Enviar dados brutos para o backend
   - Testar salvamento de propriedades

2. ✅ **Remover salvamento paralelo do localStorage**
   - Remover `localStorage.setItem` de `useAutoSave.ts`
   - Manter apenas salvamento no backend
   - Testar que dados persistem no SQL

3. ✅ **Remover fallback silencioso de contatos**
   - Remover fallback para localStorage em `EvolutionContactsService`
   - Mostrar erro explícito se SQL falhar
   - Testar salvamento de contatos

### **PRIORIDADE 2: ALTO (FAZER EM BREVE)**

4. ✅ **Simplificar merge de dados**
   - Substituir merge complexo por substituição simples
   - Frontend sempre envia dados completos
   - Testar atualizações parciais

5. ✅ **Consolidar lógica de salvamento**
   - Criar função única `saveProperty()` no backend
   - Remover código duplicado
   - Testar todos os fluxos

### **PRIORIDADE 3: MÉDIO (QUANDO DER TEMPO)**

6. ✅ **Documentar fluxo de salvamento**
   - Criar diagrama de fluxo
   - Documentar regras de normalização
   - Documentar estratégia de merge

---

## 🧪 TESTES NECESSÁRIOS

### **Teste 1: Salvamento de Propriedade Nova**
- [ ] Criar propriedade no wizard
- [ ] Verificar que salva apenas no SQL
- [ ] Verificar que não salva no localStorage (exceto rascunho)
- [ ] Verificar que dados persistem após reload

### **Teste 2: Atualização de Propriedade Existente**
- [ ] Editar propriedade existente
- [ ] Verificar que atualiza apenas no SQL
- [ ] Verificar que não salva no localStorage
- [ ] Verificar que dados persistem após reload

### **Teste 3: Salvamento de Contatos**
- [ ] Salvar contatos do Evolution
- [ ] Verificar que salva apenas no SQL
- [ ] Verificar que não salva no localStorage
- [ ] Verificar multi-tenant (isolamento por organização)

### **Teste 4: Erro de Salvamento**
- [ ] Simular erro no SQL
- [ ] Verificar que mostra erro explícito
- [ ] Verificar que não salva no localStorage (fallback)
- [ ] Verificar que dados não ficam inconsistentes

---

## 📝 CHECKLIST DE VALIDAÇÃO

### **Antes de Considerar Resolvido:**
- [ ] Normalização apenas no backend
- [ ] localStorage apenas para rascunhos (não paralelo)
- [ ] SQL é fonte única de verdade
- [ ] Sem fallbacks silenciosos
- [ ] Erros explícitos quando SQL falha
- [ ] Dados persistem após reload
- [ ] Multi-tenant funcionando
- [ ] Testes passando

---

## 🎯 RESULTADO ESPERADO

### **ANTES (Problema):**
```
Frontend normaliza → Backend normaliza → SQL salva → localStorage salva
❌ Dados inconsistentes
❌ Quando corrige um, quebra outro
```

### **DEPOIS (Solução):**
```
Frontend envia dados brutos → Backend normaliza → SQL salva
✅ Dados consistentes
✅ Uma fonte única de verdade
✅ Fácil de manter
```

---

**Última atualização:** 2025-01-27  
**Status:** 🔴 **AGUARDANDO IMPLEMENTAÇÃO**

