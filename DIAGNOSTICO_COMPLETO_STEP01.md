# 🔍 DIAGNÓSTICO COMPLETO: Por que Step 01 não está salvando

**Data:** 2025-12-07  
**Problema:** Dados do Step 01 não persistem após refresh

---

## 🔴 PROBLEMA IDENTIFICADO

### **Causa Raiz: `draftPropertyId` não está sendo inicializado em modo EDIÇÃO**

Quando você edita uma propriedade existente (com `property.id`), o `saveStep01` verifica se `draftPropertyId` existe:

```typescript
if (!draftPropertyId) {
  // Cria novo rascunho
} else {
  // Atualiza rascunho existente
}
```

**PROBLEMA:** Em modo edição, `draftPropertyId` pode não estar sendo inicializado com `property.id`, então o código tenta criar um NOVO rascunho ao invés de atualizar o existente!

---

## 🔧 CORREÇÃO NECESSÁRIA

### **1. Inicializar `draftPropertyId` com `property.id` em modo edição**

**Arquivo:** `RendizyPrincipal/components/PropertyEditWizard.tsx`

**Localização:** Onde `draftPropertyId` é declarado (linha ~520)

**Mudança necessária:**

```typescript
// ❌ ATUAL (ERRADO):
const [draftPropertyId, setDraftPropertyId] = useState<string | null>(
  property?.id || null
);

// ✅ CORRETO:
const [draftPropertyId, setDraftPropertyId] = useState<string | null>(
  property?.id || null
);

// ✅ ADICIONAR useEffect para garantir que draftPropertyId seja atualizado quando property.id mudar:
useEffect(() => {
  if (property?.id && !draftPropertyId) {
    console.log("🔄 [Wizard] Inicializando draftPropertyId com property.id:", property.id);
    setDraftPropertyId(property.id);
  }
}, [property?.id, draftPropertyId]);
```

### **2. Corrigir `saveStep01` para usar `property.id` como fallback**

**Arquivo:** `RendizyPrincipal/components/PropertyEditWizard.tsx`

**Localização:** Função `saveStep01` (linha ~932)

**Mudança necessária:**

```typescript
// ❌ ATUAL (ERRADO):
if (!draftPropertyId) {
  // Cria novo rascunho
}

// ✅ CORRETO:
const targetId = draftPropertyId || property?.id;

if (!targetId) {
  // Só criar novo rascunho se realmente não tiver ID
  console.log("🆕 [Step01] Criando rascunho mínimo para Step 01...");
  // ... criar rascunho
} else {
  // Atualizar propriedade existente
  console.log("🔄 [Step01] Atualizando Step 01 na propriedade existente:", targetId);
  const response = await propertiesApi.update(targetId, updateData);
  // ...
}
```

---

## 🧪 TESTE APÓS CORREÇÃO

1. Acesse: `/properties/edit/8efe9eeb-22e7-467b-8350-7586e8e54f58`
2. Preencha Step 01
3. Verifique no console:
   - Deve aparecer: `🔄 [Step01] Atualizando Step 01 na propriedade existente: 8efe9eeb-...`
   - NÃO deve aparecer: `🆕 [Step01] Criando rascunho mínimo...`
4. Recarregue a página
5. Verifique se dados persistem

---

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] `draftPropertyId` é inicializado com `property.id` em modo edição
- [ ] `saveStep01` usa `property.id` como fallback se `draftPropertyId` não existir
- [ ] Console mostra "Atualizando" ao invés de "Criando" em modo edição
- [ ] Dados persistem após refresh
- [ ] Step 01 é marcado como completo quando tem dados mínimos

---

## 🎯 PRÓXIMOS PASSOS

1. Aplicar correções acima
2. Testar manualmente
3. Verificar logs do console
4. Confirmar persistência após refresh


