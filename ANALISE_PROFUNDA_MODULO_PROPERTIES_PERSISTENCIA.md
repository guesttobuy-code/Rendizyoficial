# 🔍 ANÁLISE PROFUNDA - MÓDULO PROPERTIES - PERSISTÊNCIA DE DADOS

**Data:** 2025-01-27  
**Status:** 🔴 **ANÁLISE COMPLETA - PROBLEMAS IDENTIFICADOS**  
**Foco:** Entender por que dados se perdem ao dar refresh

---

## 📊 RESUMO EXECUTIVO

### 🚨 **PROBLEMA PRINCIPAL:**
**"Um refresh perde todos os dados"**

O módulo Properties tem um wizard complexo com 14 steps em 3 blocos. Os dados são salvos em múltiplas camadas, mas há falhas críticas que causam perda de dados ao recarregar a página.

---

## 🏗️ ARQUITETURA ATUAL DO MÓDULO PROPERTIES

### **1. ESTRUTURA DO WIZARD**

```
PropertyWizardPage.tsx (Página)
  └── PropertyEditWizard.tsx (Componente Wizard)
      ├── 3 Blocos
      │   ├── Bloco 1: Conteúdo (7 steps)
      │   ├── Bloco 2: Financeiro (4 steps)
      │   └── Bloco 3: Configurações (3 steps)
      └── Total: 14 steps
```

### **2. FLUXO DE DADOS - JORNADA COMPLETA**

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - PropertyEditWizard.tsx                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. Usuário preenche Step 1 (Tipo e Identificação)          │
│    └── formData.contentType = { ... }                       │
│                                                              │
│ 2. Auto-save dispara (debounce 1200ms)                     │
│    └── saveDraftToBackend()                                 │
│        ├── Se draftPropertyId existe:                       │
│        │   └── propertiesApi.update(draftPropertyId, data)  │
│        └── Se NÃO existe:                                   │
│            └── propertiesApi.create(minimalDraft)          │
│                └── Backend retorna ID                       │
│                    └── setDraftPropertyId(newId)            │
│                                                              │
│ 3. Dados também salvos no localStorage (backup)             │
│    └── localStorage.setItem(`property_draft_${id}`, ...)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ API CLIENT - utils/api.ts                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ propertiesApi.update(id, data)                              │
│   └── PUT /rendizy-server/properties/:id                   │
│       Headers: {                                            │
│         Authorization: "Bearer <publicAnonKey>",            │
│         X-Auth-Token: "<userToken>"                         │
│       }                                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND - routes-properties.ts                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ updateProperty(c: Context)                                  │
│   1. Busca propriedade existente do SQL                     │
│      └── client.from("properties").select(...).eq("id", id)  │
│                                                              │
│   2. Normaliza dados do wizard                               │
│      └── normalizeWizardData(rawWizardData, existing)        │
│          ├── Extrai campos aninhados                        │
│          ├── Achatamento de estrutura                        │
│          └── Gera name/code se não existir                 │
│                                                              │
│   3. MERGE de wizardData (deep merge)                       │
│      └── deepMerge(existingWizardData, rawWizardData)       │
│          └── Evita perda de dados em atualizações parciais │
│                                                              │
│   4. Converte para formato SQL                              │
│      └── propertyToSql(updated, organizationId)             │
│          └── wizard_data: mergedWizardData (JSONB)          │
│                                                              │
│   5. UPDATE no SQL                                           │
│      └── client.from("properties")                           │
│          .update(sqlData).eq("id", id)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ BANCO DE DADOS - Supabase SQL                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Tabela: properties                                          │
│   - id: TEXT (primary key)                                  │
│   - organization_id: UUID                                    │
│   - wizard_data: JSONB (dados completos do wizard)          │
│   - completion_percentage: INTEGER                          │
│   - completed_steps: JSONB (array de step IDs)             │
│   - status: TEXT ('draft', 'active', ...)                   │
│   - ... (outros campos achatados)                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### **PROBLEMA 1: DADOS NÃO CARREGAM AO RECARREGAR PÁGINA**

#### **Cenário:**
1. Usuário preenche Step 1, Step 2, Step 3
2. Dados são salvos no backend (SQL)
3. Usuário dá refresh (F5)
4. **Dados se perdem** ❌

#### **Causa Raiz:**

**PropertyWizardPage.tsx (linha 31-71):**
```typescript
useEffect(() => {
  const loadProperty = async () => {
    if (!isEditMode) {
      setLoading(false);
      return; // ❌ PROBLEMA: Modo criação não carrega nada!
    }
    // ... carrega apenas se isEditMode === true
  };
  loadProperty();
}, [id, isEditMode, navigate]);
```

**PropertyEditWizard.tsx (linha 572-650):**
```typescript
const [formData, setFormData] = useState<any>(() => {
  // Modo EDIÇÃO: usar dados da propriedade existente
  if (property?.id) {
    const wd = property.wizardData || {};
    // ... restaura dados
  }
  // ❌ PROBLEMA: Modo CRIAÇÃO retorna createEmptyFormData()
  // Não tenta carregar rascunho do backend!
});
```

#### **O Que Acontece:**
- **Modo CRIAÇÃO** (`id === "new"` ou sem `id`):
  - `isEditMode = false`
  - `loadProperty()` retorna cedo, não carrega nada
  - `formData` inicializa vazio
  - **Rascunho existe no backend, mas não é carregado!**

- **Modo EDIÇÃO** (`id` existe):
  - `isEditMode = true`
  - `loadProperty()` busca do backend
  - `formData` inicializa com `property.wizardData`
  - ✅ Funciona corretamente

#### **Solução Necessária:**
1. **Modo CRIAÇÃO deve verificar se há rascunho no backend**
2. **Se `draftPropertyId` existe no localStorage, carregar do backend**
3. **Ou: Buscar rascunhos recentes do usuário e oferecer continuar**

---

### **PROBLEMA 2: draftPropertyId PERDIDO NO REFRESH**

#### **Cenário:**
1. Usuário preenche Step 1
2. `saveDraftToBackend()` cria rascunho no backend
3. Backend retorna `id: "abc-123"`
4. `setDraftPropertyId("abc-123")` salva no state
5. Usuário dá refresh
6. **`draftPropertyId` volta para `null`** ❌

#### **Causa Raiz:**

**PropertyEditWizard.tsx (linha 476-487):**
```typescript
const [draftPropertyId, setDraftPropertyId] = useState<string | null>(
  property?.id || null // ❌ PROBLEMA: Só inicializa se property.id existe
);

useEffect(() => {
  if (property?.id && !draftPropertyId) {
    setDraftPropertyId(property.id);
  }
}, [property?.id]); // ❌ Não restaura do localStorage!
```

#### **O Que Acontece:**
- `draftPropertyId` é apenas **state do React**
- Ao dar refresh, state é perdido
- Não há persistência do `draftPropertyId` no localStorage
- Wizard tenta criar novo rascunho ao invés de continuar existente

#### **Solução Necessária:**
1. **Salvar `draftPropertyId` no localStorage**
2. **Ao inicializar, restaurar `draftPropertyId` do localStorage**
3. **Se `draftPropertyId` existe, carregar rascunho do backend**

---

### **PROBLEMA 3: wizardData NÃO É CARREGADO CORRETAMENTE**

#### **Cenário:**
1. Dados são salvos no backend com `wizard_data` (JSONB)
2. Ao carregar, `sqlToProperty()` converte para `wizardData`
3. **Mas `wizardData` pode vir como string ao invés de objeto** ❌

#### **Causa Raiz:**

**utils-property-mapper.ts (linha 241):**
```typescript
wizardData: row.wizard_data || undefined,
```

**Backend pode estar salvando como string:**
- Supabase JSONB pode retornar como string se não for parseado
- Frontend espera objeto, mas recebe string

**usePropertyV2.ts (linha 42-50) - CORREÇÃO JÁ EXISTE:**
```typescript
if (typeof loadedProperty.wizardData === 'string') {
  try {
    loadedProperty.wizardData = JSON.parse(loadedProperty.wizardData);
  } catch (e) {
    console.error("❌ Failed to parse wizardData:", e);
  }
}
```

**MAS:** `PropertyWizardPage.tsx` não usa `usePropertyV2`, usa `propertiesApi.get()` diretamente!

#### **Solução Necessária:**
1. **Garantir que backend sempre retorna `wizardData` como objeto**
2. **Ou: Adicionar parse no `PropertyWizardPage` ao carregar**

---

### **PROBLEMA 4: NORMALIZAÇÃO DUPLICADA CAUSA PERDA DE DADOS**

#### **Cenário:**
1. Frontend normaliza dados antes de enviar (`normalizeWizardData`)
2. Backend normaliza novamente (`normalizeWizardData`)
3. **Dados podem ser perdidos na dupla normalização** ❌

#### **Causa Raiz:**

**PropertyWizardPage.tsx (linha 74-245):**
```typescript
const normalizeWizardData = (wizardData: any): any => {
  // Normaliza estrutura aninhada
  // Achatamento de campos
  // Gera name/code se não existir
  return { ...wizardData, name, code, ... };
};
```

**routes-properties.ts (linha 1294-1500):**
```typescript
function normalizeWizardData(wizardData: any, existing?: Property): any {
  // Normaliza novamente!
  // Pode sobrescrever dados do frontend
}
```

#### **O Que Acontece:**
- Frontend envia: `{ contentType: { internalName: "Casa" } }`
- Frontend normaliza: `{ name: "Casa", contentType: { internalName: "Casa" } }`
- Backend recebe e normaliza novamente
- **Pode perder campos que frontend já normalizou**

#### **Solução Necessária:**
1. **Frontend envia dados RAW do wizard (sem normalizar)**
2. **Backend faz toda a normalização (single source of truth)**
3. **Ou: Frontend normaliza, backend apenas valida**

---

### **PROBLEMA 5: MERGE PROFUNDO PODE CAUSAR CONFLITOS**

#### **Cenário:**
1. Step 1 salva: `{ contentType: { internalName: "Casa" } }`
2. Step 2 salva: `{ contentLocation: { address: { city: "RJ" } } }`
3. Backend faz merge profundo
4. **Se merge falhar, dados podem ser perdidos** ❌

#### **Causa Raiz:**

**routes-properties.ts (linha 1704-1737):**
```typescript
const deepMerge = (target: any, source: any): any => {
  // Merge profundo de objetos
  // Arrays são substituídos (não mesclados)
  // Pode causar perda se estrutura mudar
};
```

#### **Problemas Potenciais:**
- Arrays são substituídos (não mesclados)
- Se estrutura mudar entre steps, merge pode falhar
- Objetos aninhados podem ser sobrescritos incorretamente

---

## 📋 ESTRUTURA DO BANCO DE DADOS

### **Tabela: `properties`**

```sql
CREATE TABLE properties (
  id TEXT PRIMARY KEY,                    -- UUID ou "draft-*"
  organization_id UUID,                   -- Multi-tenant
  owner_id UUID,
  location_id UUID,
  
  -- Identificação
  name TEXT,
  code TEXT,
  type TEXT,
  status TEXT DEFAULT 'draft',            -- 'draft', 'active', 'inactive'
  
  -- Endereço (achatado)
  address_street TEXT,
  address_number TEXT,
  address_city TEXT,
  address_state TEXT,
  ...
  
  -- Dados do Wizard (JSONB)
  wizard_data JSONB DEFAULT '{}',         -- ✅ DADOS COMPLETOS DO WIZARD
  completion_percentage INTEGER DEFAULT 0,
  completed_steps JSONB DEFAULT '[]',     -- Array de step IDs
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Campos Críticos para Persistência:**

1. **`wizard_data` (JSONB):**
   - Armazena estrutura completa do wizard
   - Deve conter TODOS os steps preenchidos
   - Formato: `{ contentType: {...}, contentLocation: {...}, ... }`

2. **`completion_percentage` (INTEGER):**
   - 0-100, indica progresso do wizard
   - Usado para mostrar barra de progresso

3. **`completed_steps` (JSONB):**
   - Array de step IDs completados
   - Ex: `["content-type", "content-location", "content-rooms"]`

4. **`status` (TEXT):**
   - `'draft'`: Rascunho (não finalizado)
   - `'active'`: Finalizado e ativo

---

## 🔄 FLUXO DE SALVAMENTO ATUAL (DETALHADO)

### **Modo CRIAÇÃO (Novo Anúncio):**

```
1. Usuário acessa /properties/new
   └── PropertyWizardPage renderiza
       └── property = null
       └── isEditMode = false
       └── formData = createEmptyFormData() (vazio)

2. Usuário preenche Step 1 (Tipo)
   └── formData.contentType = { internalName: "Casa", ... }
   └── setFormData({ ...formData, contentType: {...} })

3. Auto-save dispara (1200ms após mudança)
   └── saveDraftToBackend()
       ├── draftPropertyId = null (ainda não existe)
       ├── Cria rascunho mínimo:
       │   └── propertiesApi.create({
       │       status: "draft",
       │       wizardData: formData,
       │       completionPercentage: 10,
       │       completedSteps: ["content-type"]
       │     })
       ├── Backend retorna: { success: true, data: { id: "abc-123" } }
       ├── setDraftPropertyId("abc-123")
       └── Salva no localStorage (backup)

4. Usuário preenche Step 2 (Localização)
   └── formData.contentLocation = { address: {...}, ... }
   └── Auto-save dispara
       └── saveDraftToBackend()
           ├── draftPropertyId = "abc-123" (existe!)
           ├── Atualiza rascunho:
           │   └── propertiesApi.update("abc-123", {
           │       wizardData: formData,  // Dados completos
           │       completionPercentage: 20,
           │       completedSteps: ["content-type", "content-location"]
           │     })
           └── Salva no localStorage

5. Usuário dá REFRESH (F5) ❌
   └── PropertyWizardPage re-renderiza
       ├── property = null (não carrega nada em modo criação)
       ├── draftPropertyId = null (state perdido)
       ├── formData = createEmptyFormData() (vazio)
       └── ❌ DADOS PERDIDOS! Rascunho existe no backend mas não é carregado
```

### **Modo EDIÇÃO (Editar Anúncio Existente):**

```
1. Usuário acessa /properties/abc-123
   └── PropertyWizardPage renderiza
       ├── isEditMode = true
       ├── loadProperty() busca do backend
       │   └── propertiesApi.get("abc-123")
       │       └── Backend retorna: { wizardData: {...}, ... }
       ├── property = response.data
       └── formData = property.wizardData (restaurado) ✅

2. Usuário edita Step 1
   └── formData.contentType.internalName = "Casa Nova"
   └── Auto-save dispara
       └── saveDraftToBackend()
           ├── draftPropertyId = "abc-123" (já existe)
           ├── Atualiza no backend:
           │   └── propertiesApi.update("abc-123", {
           │       wizardData: formData
           │     })
           └── ✅ Funciona corretamente

3. Usuário dá REFRESH (F5) ✅
   └── PropertyWizardPage re-renderiza
       ├── loadProperty() busca do backend novamente
       ├── property = response.data (com wizardData atualizado)
       └── formData = property.wizardData (restaurado) ✅
```

---

## 🎯 PONTOS DE FALHA IDENTIFICADOS

### **1. Modo Criação Não Carrega Rascunho**
- **Localização:** `PropertyWizardPage.tsx` linha 31-71
- **Problema:** `loadProperty()` retorna cedo se `!isEditMode`
- **Impacto:** Rascunho existe no backend mas não é carregado

### **2. draftPropertyId Não Persiste**
- **Localização:** `PropertyEditWizard.tsx` linha 476-487
- **Problema:** `draftPropertyId` é apenas state, perdido no refresh
- **Impacto:** Wizard tenta criar novo rascunho ao invés de continuar

### **3. wizardData Pode Vir Como String**
- **Localização:** `utils-property-mapper.ts` linha 241
- **Problema:** JSONB pode retornar como string
- **Impacto:** Frontend não consegue acessar dados aninhados

### **4. Normalização Duplicada**
- **Localização:** `PropertyWizardPage.tsx` + `routes-properties.ts`
- **Problema:** Dados são normalizados duas vezes
- **Impacto:** Pode perder dados na dupla normalização

### **5. Merge Profundo Pode Falhar**
- **Localização:** `routes-properties.ts` linha 1704-1737
- **Problema:** Arrays são substituídos, não mesclados
- **Impacto:** Dados de steps anteriores podem ser perdidos

---

## ✅ SOLUÇÕES PROPOSTAS (NÃO IMPLEMENTAR AINDA)

### **SOLUÇÃO 1: Carregar Rascunho em Modo Criação**

**Mudança em `PropertyWizardPage.tsx`:**
```typescript
useEffect(() => {
  const loadProperty = async () => {
    if (!isEditMode) {
      // 🆕 NOVO: Verificar se há rascunho no localStorage
      const savedDraftId = localStorage.getItem('property_draft_id');
      if (savedDraftId) {
        // Carregar rascunho do backend
        const response = await propertiesApi.get(savedDraftId);
        if (response.success && response.data) {
          setProperty(response.data);
          // Atualizar URL para incluir ID
          navigate(`/properties/${savedDraftId}`, { replace: true });
        }
      }
      setLoading(false);
      return;
    }
    // ... resto do código (modo edição)
  };
  loadProperty();
}, [id, isEditMode, navigate]);
```

### **SOLUÇÃO 2: Persistir draftPropertyId**

**Mudança em `PropertyEditWizard.tsx`:**
```typescript
// Salvar draftPropertyId no localStorage
useEffect(() => {
  if (draftPropertyId) {
    localStorage.setItem('property_draft_id', draftPropertyId);
  }
}, [draftPropertyId]);

// Restaurar draftPropertyId do localStorage
const [draftPropertyId, setDraftPropertyId] = useState<string | null>(() => {
  // Tentar property.id primeiro
  if (property?.id) return property.id;
  // Tentar localStorage
  const saved = localStorage.getItem('property_draft_id');
  return saved || null;
});
```

### **SOLUÇÃO 3: Garantir wizardData Como Objeto**

**Mudança em `PropertyWizardPage.tsx`:**
```typescript
useEffect(() => {
  const loadProperty = async () => {
    // ... código existente ...
    if (response.success && response.data) {
      // 🆕 NOVO: Parse wizardData se for string
      if (typeof response.data.wizardData === 'string') {
        try {
          response.data.wizardData = JSON.parse(response.data.wizardData);
        } catch (e) {
          console.error('Erro ao parsear wizardData:', e);
        }
      }
      setProperty(response.data);
    }
  };
  loadProperty();
}, [id, isEditMode, navigate]);
```

### **SOLUÇÃO 4: Frontend Envia Dados RAW**

**Mudança em `PropertyWizardPage.tsx`:**
```typescript
const handleSave = async (data: any) => {
  // ❌ REMOVER: normalizeWizardData(data)
  // ✅ ENVIAR: dados RAW do wizard
  const response = await propertiesApi.update(id, {
    wizardData: data, // Dados completos sem normalização
    status: isEditMode ? data.status : 'draft'
  });
  // Backend faz toda a normalização
};
```

### **SOLUÇÃO 5: Melhorar Merge Profundo**

**Mudança em `routes-properties.ts`:**
```typescript
const deepMerge = (target: any, source: any): any => {
  const result = { ...target };
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      // Arrays: substituir (comportamento atual)
      if (Array.isArray(source[key])) {
        result[key] = source[key];
      }
      // Objetos: merge profundo
      else if (
        source[key] &&
        typeof source[key] === 'object' &&
        target[key] &&
        typeof target[key] === 'object'
      ) {
        result[key] = deepMerge(target[key], source[key]);
      }
      // Primitivos: substituir
      else {
        result[key] = source[key];
      }
    }
  }
  return result;
};
```

---

## 📊 CHECKLIST DE VERIFICAÇÃO

### **Antes de Implementar:**

- [ ] Entender impacto de cada solução
- [ ] Testar cenários de refresh em modo criação
- [ ] Testar cenários de refresh em modo edição
- [ ] Verificar se há outros pontos que dependem do comportamento atual
- [ ] Garantir que localStorage não quebra multi-tenant
- [ ] Validar que backend sempre retorna wizardData como objeto

---

## 🎯 PRÓXIMOS PASSOS

1. **Revisar soluções propostas com usuário**
2. **Priorizar problemas mais críticos**
3. **Implementar soluções uma por vez**
4. **Testar cada solução isoladamente**
5. **Documentar mudanças**

---

**FIM DA ANÁLISE**

