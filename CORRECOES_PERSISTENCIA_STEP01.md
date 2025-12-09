# 🔧 CORREÇÕES: PERSISTÊNCIA STEP 01

**Data:** 2025-01-27  
**Problema:** Dados do Step 01 somem após refresh

---

## 🐛 PROBLEMAS IDENTIFICADOS

### **1. wizardData Não Era Parseado**
- Backend pode retornar `wizardData` como string (JSONB)
- Frontend não estava parseando antes de usar

### **2. formData Não Era Atualizado Quando Property Carregava**
- `formData` era inicializado no `useState` antes de `property` ser carregado
- Quando `property` chegava (assíncrono), `formData` não era atualizado

### **3. completedSteps Não Era Restaurado**
- `completedSteps` do backend não era restaurado no state local
- Step não aparecia como completo após refresh

### **4. completedSteps Não Era Parseado**
- Backend pode retornar `completedSteps` como string (JSONB)
- Frontend não estava parseando

---

## ✅ CORREÇÕES APLICADAS

### **1. Parse wizardData em PropertyWizardPage**

**Arquivo:** `PropertyWizardPage.tsx` linha 45-58

```typescript
// 🆕 INDIVIDUALIZAÇÃO STEP 01: Parse wizardData se for string
if (typeof response.data.wizardData === 'string') {
  try {
    console.log("📦 [PropertyWizardPage] Parseando wizardData de string para objeto...");
    response.data.wizardData = JSON.parse(response.data.wizardData);
    console.log("✅ [PropertyWizardPage] wizardData parseado:", response.data.wizardData);
  } catch (e) {
    console.error("❌ [PropertyWizardPage] Erro ao parsear wizardData:", e);
    response.data.wizardData = {};
  }
}

// 🆕 INDIVIDUALIZAÇÃO STEP 01: Parse completedSteps se for string
if (response.data.completedSteps && typeof response.data.completedSteps === 'string') {
  try {
    console.log("📦 [PropertyWizardPage] Parseando completedSteps de string para array...");
    response.data.completedSteps = JSON.parse(response.data.completedSteps);
    console.log("✅ [PropertyWizardPage] completedSteps parseado:", response.data.completedSteps);
  } catch (e) {
    console.error("❌ [PropertyWizardPage] Erro ao parsear completedSteps:", e);
    response.data.completedSteps = [];
  }
}
```

### **2. Atualizar formData Quando Property Carrega**

**Arquivo:** `PropertyEditWizard.tsx` linha 647-710

```typescript
// 🆕 INDIVIDUALIZAÇÃO STEP 01: Atualizar formData quando property for carregado
useEffect(() => {
  if (property?.id && property?.wizardData) {
    // Parse wizardData se for string
    let wizardData = property.wizardData;
    if (typeof wizardData === 'string') {
      try {
        wizardData = JSON.parse(wizardData);
      } catch (e) {
        console.error("❌ [Wizard] Erro ao parsear wizardData:", e);
        wizardData = {};
      }
    }
    
    const wd = wizardData || {};
    const ct = wd.contentType || {};
    
    // 🆕 Restaurar completedSteps do backend
    if (property.completedSteps && Array.isArray(property.completedSteps)) {
      console.log("✅ [Wizard] Restaurando completedSteps do backend:", property.completedSteps);
      setCompletedSteps(new Set(property.completedSteps));
    }
    
    // Atualizar formData com dados do property
    setFormData((prev) => ({
      ...prev,
      id: property.id,
      contentType: {
        // ... dados do Step 01
        internalName: ct.internalName || prev.contentType?.internalName || property.internalName || property.name || "",
        // ...
      },
    }));
  }
}, [property?.id, property?.wizardData, property?.completedSteps]);
```

### **3. Parse completedSteps no Backend**

**Arquivo:** `utils-property-mapper.ts` linha 243

```typescript
// ✅ Parse completed_steps se for string (JSONB pode retornar como string)
completedSteps: (() => {
  const steps = row.completed_steps || [];
  if (typeof steps === 'string') {
    try {
      return JSON.parse(steps);
    } catch (e) {
      console.warn("⚠️ [sqlToProperty] Erro ao parsear completed_steps:", e);
      return [];
    }
  }
  return Array.isArray(steps) ? steps : [];
})(),
```

### **4. Marcar Step como Completo ao Salvar**

**Arquivo:** `PropertyEditWizard.tsx` linha 965-985

```typescript
// Se tem dados mínimos e step não está completo, marcar como completo
if (shouldMarkComplete) {
  updateData.completedSteps = [...currentCompletedSteps, "content-type"];
  const newPercentage = Math.round((updateData.completedSteps.length / totalSteps) * 100);
  updateData.completionPercentage = newPercentage;
  console.log("✅ [Step01] Marcando step como completo:", updateData.completedSteps);
  // Marcar no state local também
  setCompletedSteps((prev) => new Set(prev).add("content-type"));
}
```

---

## 🧪 TESTE NOVAMENTE

1. **Acesse:** `/properties/8efe9eeb-22e7-467b-8350-7586e8e54f58/edit`
2. **Preencha Step 01:**
   - Nome Interno: "Teste 06 Rafa"
   - Tipo do Local: Qualquer opção
   - Tipo de Acomodação: Qualquer opção
   - Subtipo: Qualquer opção
   - Modalidades: Marque pelo menos uma
   - Número de Registro: Qualquer valor
3. **Aguarde 2 segundos** (auto-save)
4. **Verifique console:** Deve aparecer "✅ [Step01] Step 01 salvo individualmente"
5. **Dê refresh (F5)**
6. **Verifique:**
   - ✅ Dados do Step 01 devem estar preenchidos
   - ✅ Step 01 deve estar marcado como completo (verdinho)

---

## 📊 LOGS ESPERADOS

### **Ao Carregar:**
```
📦 [PropertyWizardPage] Parseando wizardData de string para objeto...
✅ [PropertyWizardPage] wizardData parseado: {...}
📦 [PropertyWizardPage] Parseando completedSteps de string para array...
✅ [PropertyWizardPage] completedSteps parseado: ["content-type"]
🔄 [Wizard] Atualizando formData com dados do property carregado...
✅ [Wizard] Restaurando completedSteps do backend: ["content-type"]
```

### **Ao Salvar:**
```
💾 [Step01] Salvando Step 01 individualmente...
🔄 [Step01] Atualizando Step 01 no rascunho existente: ...
✅ [Step01] Step 01 salvo individualmente
✅ [Step01] Marcando step como completo: ["content-type"]
```

---

**CORREÇÕES APLICADAS - TESTE NOVAMENTE!**

