# 🎯 PLANO: INDIVIDUALIZAÇÃO DO STEP 01

**Data:** 2025-01-27  
**Objetivo:** Fazer o Step 01 salvar sozinho, fatiando o wizard em pedaços menores

---

## 📋 ESTRATÉGIA

### **O Que Vamos Fazer:**

1. ✅ **Manter UI igual** - Usuário vê o wizard normal
2. ✅ **Step 01 salva sozinho** - Automaticamente quando preenchido
3. ✅ **Salvamento individual** - Apenas dados do Step 01 (não sobrescreve outros steps)
4. ✅ **Merge profundo no backend** - Garante que outros steps não sejam perdidos

---

## 🔄 FLUXO PROPOSTO

### **Antes (Monolítico):**
```
Usuário preenche Step 01
  └── Dados ficam apenas no state (formData)
  └── Só salva quando clica "Salvar e Avançar" (todos os steps juntos)
  └── ❌ Refresh perde tudo
```

### **Depois (Individualizado):**
```
Usuário preenche Step 01
  └── Auto-save dispara (debounce 2s)
  └── Salva APENAS dados do Step 01 no backend
  └── Backend faz merge com dados existentes
  └── ✅ Refresh mantém dados do Step 01
```

---

## 🛠️ IMPLEMENTAÇÃO

### **1. Criar Função de Salvamento Individual do Step 01**

**Localização:** `PropertyEditWizard.tsx`

**Função:**
```typescript
// Salvar APENAS dados do Step 01 (contentType)
const saveStep01 = useCallback(async (step01Data: any) => {
  try {
    // Se não tem draftPropertyId, criar rascunho mínimo primeiro
    if (!draftPropertyId) {
      const minimalDraft = {
        status: "draft",
        wizardData: { contentType: step01Data },
        completionPercentage: 0,
        completedSteps: [],
      };
      const response = await propertiesApi.create(minimalDraft);
      if (response.success && response.data?.id) {
        setDraftPropertyId(response.data.id);
        return response.data.id;
      }
    }

    // Se já tem ID, atualizar APENAS o contentType
    const updateData = {
      wizardData: {
        contentType: step01Data, // Apenas dados do Step 01
      },
      // Não tocar em outros campos
    };

    const response = await propertiesApi.update(draftPropertyId, updateData);
    if (response.success) {
      console.log("✅ [Step01] Dados salvos individualmente");
      return true;
    }
  } catch (error) {
    console.error("❌ [Step01] Erro ao salvar:", error);
    return false;
  }
}, [draftPropertyId]);
```

### **2. Auto-save no ContentTypeStep**

**Localização:** `PropertyEditWizard.tsx` (onde renderiza ContentTypeStep)

**Modificação:**
```typescript
<ContentTypeStep
  data={formData?.contentType || {}}
  onChange={(data) => {
    // Atualizar formData local
    setFormData((prev) => ({
      ...prev,
      contentType: data,
    }));
    
    // 🆕 NOVO: Salvar Step 01 automaticamente
    saveStep01(data);
  }}
/>
```

### **3. Debounce para Evitar Muitos Saves**

**Localização:** `PropertyEditWizard.tsx`

**Implementação:**
```typescript
const step01SaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// No onChange do ContentTypeStep:
onChange={(data) => {
  setFormData((prev) => ({
    ...prev,
    contentType: data,
  }));
  
  // Debounce: salvar após 2 segundos de inatividade
  if (step01SaveTimeoutRef.current) {
    clearTimeout(step01SaveTimeoutRef.current);
  }
  
  step01SaveTimeoutRef.current = setTimeout(() => {
    saveStep01(data);
  }, 2000);
}}
```

### **4. Salvar ao Marcar Step como Completo**

**Localização:** `PropertyEditWizard.tsx` - `handleSaveAndNext`

**Modificação:**
```typescript
const handleSaveAndNext = async () => {
  const step = getCurrentStep();
  
  // 🆕 NOVO: Se for Step 01, salvar individualmente antes
  if (step.id === "content-type") {
    await saveStep01(formData.contentType);
  }
  
  // ... resto do código existente
};
```

### **5. Salvar ao Navegar para Outro Step**

**Localização:** `PropertyEditWizard.tsx` - `handleStepClick`

**Modificação:**
```typescript
const handleStepClick = async (blockId: string, stepIndex: number) => {
  const currentStep = getCurrentStep();
  
  // 🆕 NOVO: Se estiver saindo do Step 01, salvar antes
  if (currentStep.id === "content-type") {
    await saveStep01(formData.contentType);
  }
  
  // ... resto do código existente
};
```

---

## 🔧 BACKEND - MERGE PROFUNDO

### **Verificar se Backend Já Faz Merge**

**Localização:** `routes-properties.ts` - `updateProperty`

**Status:** ✅ **JÁ IMPLEMENTADO** (linha 1704-1737)

O backend já faz merge profundo:
```typescript
const deepMerge = (target: any, source: any): any => {
  // Merge profundo de objetos
  // Arrays são substituídos
  // Objetos aninhados são mesclados
};

let mergedWizardData = deepMerge(existingWizardData, rawWizardData);
```

**✅ Não precisa alterar backend!**

---

## 📊 ESTRUTURA DE DADOS

### **O Que Será Salvo:**

```json
{
  "wizardData": {
    "contentType": {
      "internalName": "Apt Copacabana 202",
      "propertyTypeId": "loc_apartamento",
      "accommodationTypeId": "acc_apartamento",
      "subtipo": "entire_place",
      "modalidades": ["short_term_rental"],
      "registrationNumber": "123456",
      "propertyType": "individual",
      "financialData": {...}
    }
  }
}
```

### **Backend Faz Merge:**

Se já existir:
```json
{
  "wizardData": {
    "contentType": {...},  // Será atualizado
    "contentLocation": {...},  // Será preservado
    "contentRooms": {...}  // Será preservado
  }
}
```

---

## ✅ BENEFÍCIOS

1. ✅ **Resistente a refresh** - Step 01 salvo no backend
2. ✅ **Menos monolítico** - Cada step salva sozinho
3. ✅ **UI igual** - Usuário não percebe diferença
4. ✅ **Progressivo** - Podemos fazer o mesmo para outros steps depois
5. ✅ **Seguro** - Merge profundo garante que outros steps não sejam perdidos

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Implementar `saveStep01`
2. ✅ Adicionar auto-save no `onChange` do ContentTypeStep
3. ✅ Adicionar debounce
4. ✅ Salvar ao marcar como completo
5. ✅ Salvar ao navegar para outro step
6. ✅ Testar salvamento individual
7. ✅ Testar refresh (dados devem persistir)

---

**FIM DO PLANO**

