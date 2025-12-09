# 🔍 VERIFICAÇÃO: STEP 01 - ESTRUTURA DO BANCO DE DADOS

**Data:** 2025-01-27  
**Objetivo:** Verificar se o banco de dados está preparado para receber todos os dados do Step 01

---

## 📊 CAMPOS QUE O STEP 01 ENVIA

### **ContentTypeStep.tsx - Dados Coletados:**

```typescript
interface FormData {
  // Identificação
  internalName?: string;              // Nome interno do imóvel
  
  // Tipos
  propertyTypeId?: string;            // ID do tipo de local (ex: "loc_casa")
  accommodationTypeId?: string;       // ID do tipo de acomodação (ex: "acc_apartamento")
  subtipo?: "entire_place" | "private_room" | "shared_room";
  
  // Modalidades (múltipla escolha)
  modalidades?: Array<"short_term_rental" | "buy_sell" | "residential_rental">;
  
  // Registro
  registrationNumber?: string;        // Número de registro do imóvel
  
  // Estrutura
  propertyType?: "individual" | "location-linked";
  
  // Dados Financeiros (opcional, condicionais)
  financialData?: {
    monthlyRent?: number;            // Locação residencial
    iptu?: number;
    condo?: number;
    fees?: number;
    salePrice?: number;              // Compra e venda
  };
}
```

### **Estrutura Final Enviada ao Backend:**

O Step 01 envia os dados dentro de `contentType`:

```json
{
  "contentType": {
    "internalName": "Apt Copacabana 202",
    "propertyTypeId": "loc_apartamento",
    "accommodationTypeId": "acc_apartamento",
    "subtipo": "entire_place",
    "modalidades": ["short_term_rental", "buy_sell"],
    "registrationNumber": "123456",
    "propertyType": "individual",
    "financialData": {
      "monthlyRent": 5000,
      "salePrice": 500000
    }
  }
}
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### **Tabela: `properties`**

**Colunas Principais:**
```sql
CREATE TABLE properties (
  id TEXT PRIMARY KEY,
  organization_id UUID,
  owner_id UUID,
  location_id UUID,
  
  -- Identificação (campos achatados)
  name TEXT,                    -- Nome público
  code TEXT,                     -- Código único
  type TEXT,                     -- Tipo (ex: "individual")
  status TEXT DEFAULT 'draft',   -- Status do rascunho
  
  -- Dados do Wizard (JSONB) ✅ CAMPO CRÍTICO
  wizard_data JSONB DEFAULT '{}',           -- Dados completos do wizard
  completion_percentage INTEGER DEFAULT 0,  -- Progresso 0-100
  completed_steps JSONB DEFAULT '[]',        -- Array de step IDs completados
  
  -- Outros campos...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Campo Crítico: `wizard_data` (JSONB)**

Este é o campo onde **TODOS os dados do wizard são salvos**, incluindo o Step 01.

**Estrutura Esperada:**
```json
{
  "contentType": {
    "internalName": "...",
    "propertyTypeId": "...",
    "accommodationTypeId": "...",
    "subtipo": "...",
    "modalidades": [...],
    "registrationNumber": "...",
    "propertyType": "...",
    "financialData": {...}
  },
  "contentLocation": {...},
  "contentRooms": {...},
  ...
}
```

---

## ✅ VERIFICAÇÃO: CAMPOS DO STEP 01 vs BANCO

| Campo Step 01 | Tipo | Onde é Salvo | Status |
|--------------|------|--------------|--------|
| `internalName` | string | `wizard_data.contentType.internalName` | ✅ OK |
| `propertyTypeId` | string | `wizard_data.contentType.propertyTypeId` | ✅ OK |
| `accommodationTypeId` | string | `wizard_data.contentType.accommodationTypeId` | ✅ OK |
| `subtipo` | string | `wizard_data.contentType.subtipo` | ✅ OK |
| `modalidades` | array | `wizard_data.contentType.modalidades` | ✅ OK |
| `registrationNumber` | string | `wizard_data.contentType.registrationNumber` | ✅ OK |
| `propertyType` | string | `wizard_data.contentType.propertyType` | ✅ OK |
| `financialData` | object | `wizard_data.contentType.financialData` | ✅ OK |

### **Campos Achatados (Normalizados):**

Alguns campos também são salvos em colunas separadas (normalização):

| Campo Step 01 | Coluna SQL | Status |
|--------------|------------|--------|
| `internalName` | `name` (normalizado) | ✅ OK |
| `accommodationTypeId` ou `propertyTypeId` | `type` (normalizado) | ✅ OK |

---

## 🔍 VERIFICAÇÃO NO CÓDIGO

### **1. Como os Dados são Salvos:**

**Backend - routes-properties.ts (linha 139):**
```typescript
wizard_data: property.wizardData || null, // Dados completos do wizard em JSONB
```

**Backend - routes-properties.ts (linha 1737):**
```typescript
normalized.wizardData = mergedWizardData; // Merge profundo dos dados do wizard
```

### **2. Como os Dados são Carregados:**

**Backend - utils-property-mapper.ts (linha 241):**
```typescript
wizardData: row.wizard_data || undefined,
```

**Frontend - usePropertyV2.ts (linha 42-50):**
```typescript
if (typeof loadedProperty.wizardData === 'string') {
  try {
    loadedProperty.wizardData = JSON.parse(loadedProperty.wizardData);
  } catch (e) {
    console.error("❌ Failed to parse wizardData:", e);
  }
}
```

---

## ✅ CONCLUSÃO

### **BANCO DE DADOS ESTÁ PREPARADO!**

1. ✅ **Coluna `wizard_data` (JSONB) existe** e pode armazenar todos os dados do Step 01
2. ✅ **Estrutura JSONB suporta objetos aninhados** (`contentType`, `financialData`, etc.)
3. ✅ **Arrays são suportados** (`modalidades` como array)
4. ✅ **Campos opcionais são suportados** (todos os campos do Step 01 são opcionais)

### **Estrutura de Dados Esperada no `wizard_data`:**

```json
{
  "contentType": {
    "internalName": "Apt Copacabana 202",
    "propertyTypeId": "loc_apartamento",
    "accommodationTypeId": "acc_apartamento",
    "subtipo": "entire_place",
    "modalidades": ["short_term_rental", "buy_sell"],
    "registrationNumber": "123456",
    "propertyType": "individual",
    "financialData": {
      "monthlyRent": 5000,
      "iptu": 500,
      "condo": 300,
      "fees": 100,
      "salePrice": 500000
    }
  }
}
```

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Banco está OK** - Não precisa de alterações
2. ⚠️ **Verificar se o salvamento está funcionando** - Testar criar um rascunho
3. ⚠️ **Verificar se o carregamento está funcionando** - Testar recarregar página após salvar

---

**FIM DA VERIFICAÇÃO**

