# 🎯 MAPA VISUAL - Arquitetura de Persistência

## 🏗️ Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERFACE DO USUÁRIO                     │
│              PropertyEditorPage (17 Steps)                  │
└────────┬──────────────────────────┬──────────────────────────┘
         │                          │
         ▼                          ▼
    ┌─────────────┐          ┌──────────────────┐
    │  PropertyStep1OTA      │ PropertyStep2Location │
    │ + usePersistenceAutoSave  │ + usePersistenceAutoSave
    │ → Auto-save 500ms         │ + CEP Auto-Search
    └──────┬──────┘          └────────┬─────────┘
           │                          │
           └──────────────┬───────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │      usePersistenceAutoSave Hook    │
        │  Detecta mudanças → Debounce 500ms │
        └────────┬────────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────────────┐
        │     PersistenceManager              │
        │  saveStepBackup()                  │
        │  loadStepBackup()                  │
        │  verifyDataIntegrity()             │
        │  getReport()                       │
        └────────┬────────────────────────────┘
                 │
        ┌────────┴─────────────────────────┐
        │                                  │
        ▼                                  ▼
    ┌────────────┐                  ┌──────────────┐
    │ localStorage│                  │ Validation   │
    │ Key: property-draft-{id}      │ Hash + Check │
    │ Key: property-logs-{id}       │              │
    │ Key: property-checkpoint-{id} │              │
    └────────────┘                  └──────────────┘
```

---

## 🔄 Fluxo de Auto-Save

```
     Usuário digita campo
            │
            ▼
    onChange() chamado
            │
            ▼
    draftData atualizado
            │
            ▼
    usePersistenceAutoSave detecta
            │
            ▼
    setTimeout(500ms)
            │
            ▼
    500ms decorridos
            │
            ▼
    PersistenceManager.saveStepBackup()
            │
            ▼
    localStorage.setItem()
            │
            ▼
    Log registrado
            │
            ▼
    Console: "✅ Dados salvos"
```

---

## 🔄 Fluxo de CEP Auto-Search

```
   Usuário digita CEP
            │
            ▼
    handleCEPChange()
            │
            ▼
    formatCEP() → XXXXX-XXX
            │
            ▼
    isValidCEP()? (8 dígitos)
     │              │
    SIM            NÃO → Return
     │
     ▼
setTimeout(600ms)
     │
     ▼
searchCEP() → ViaCEP API
     │
     ▼
fetch('viacep.com.br/ws/{cep}/json/')
     │
     ▼
Promise resolves
     │
     ▼
Auto-fill:
├─ street
├─ neighborhood
├─ city
└─ state
     │
     ▼
setSearchingCEP(false)
```

---

## 🔄 Fluxo de Recuperação (F5)

```
     Usuário pressiona F5
            │
            ▼
    Browser recarrega
            │
            ▼
PropertyEditorPage monta
            │
            ▼
    usePersistence(propertyId)
            │
            ▼
    new PersistenceManager(propertyId)
            │
            ▼
    window.persistenceManager = manager
            │
            ▼
PropertyStep carrega (renderStep)
            │
            ▼
    data={draftData.location || property.location}
            │
            ▼
usePersistenceAutoSave executa
            │
            ▼
    loadStepBackup() chamado
            │
            ▼
localStorage.getItem('property-draft-{id}')
            │
            ▼
    Dados encontrados?
     │            │
    SIM          NÃO → Return null
     │
     ▼
Parse JSON
     │
     ▼
Retorna dados
     │
     ▼
Campos preenchidos na UI ✨
```

---

## 📊 Estrutura de Dados no localStorage

```
{
  propertyId: "abc123def456",
  timestamp: 1701234567890,
  currentStep: 2,
  
  draftData: {
    "step_1_basicinfo": {
      propertyType: "APARTMENT",
      otaIntegrations: ["booking_com"],
      allowDirectBooking: true,
      modalities: Set(["residential"])
    },
    
    "step_2_location": {
      zipCode: "20040-020",
      street: "Avenida Rio Branco",
      neighborhood: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      country: "Brasil",
      number: "500",
      complement: "Apt 1001",
      photos: [...]
    }
  },
  
  logs: [
    {
      step: 1,
      stepName: "BasicInfo",
      timestamp: 1701234567890,
      dataHash: "a1b2c3d4",
      status: "saved",
      fieldCount: 3,
      notes: "Backup salvo em localStorage"
    },
    {
      step: 2,
      stepName: "Location",
      timestamp: 1701234568000,
      dataHash: "e5f6g7h8",
      status: "saved",
      fieldCount: 7,
      notes: "Backup salvo em localStorage"
    }
  ]
}
```

---

## 🎯 Dependências Entre Componentes

```
                        useProperties
                              │
                    ┌─────────┴─────────┐
                    │                   │
              property            saveStep()
                    │                   │
                    ├─────────┬─────────┤
                    │         │         │
                PropertyStep1  │    PropertyStep2
                (BasicInfo)    │    (Location)
                    │          │         │
                    └────┬─────┴────┬────┘
                         │         │
                usePersistenceAutoSave
                         │
                         ▼
                PersistenceManager
                         │
              ┌──────────┼──────────┐
              │          │          │
         localStorage   Log      Hash
```

---

## 📈 Estados Possíveis

### **PersistenceManager States**

```
┌──────────────────────┐
│     IDLE             │
│ Nada acontecendo     │
└─────────┬────────────┘
          │ (usuário digita)
          ▼
┌──────────────────────┐
│     DEBOUNCING       │
│ Aguardando 500ms     │
└─────────┬────────────┘
          │ (timeout)
          ▼
┌──────────────────────┐
│     SAVING           │
│ Salvando em storage  │
└─────────┬────────────┘
          │
      ┌───┴───┐
      │       │
    ERRO    SUCESSO
      │       │
      ▼       ▼
┌──────┐  ┌──────┐
│ERROR │  │SAVED │
└──────┘  └──────┘
   │         │
   └────┬────┘
        │ (reset após 2s)
        ▼
    IDLE
```

---

## 🔗 Integração com Steps

```
PropertyEditorPage
├─ PropertyStep1OTA
│  ├─ usePersistenceAutoSave
│  ├─ onChange()
│  └─ onSave()
│
├─ PropertyStep2Location
│  ├─ usePersistenceAutoSave
│  ├─ CEP Auto-Search (ViaCEP)
│  ├─ onChange()
│  └─ onSave()
│
├─ PropertyStep3Rooms
│  └─ onChange() + onSave()
│
├─ PropertyStep4Tour
│  └─ onChange() + onSave()
│
├─ ... (Steps 5-17)
│  └─ onChange() + onSave()
│
└─ usePersistence (no topo)
   └─ PersistenceManager (global)
```

---

## 📋 Fluxo Completo de Salvamento

```
1. USER INTERACTION
   └─ Digita campo em Step 1

2. COMPONENT LAYER
   └─ PropertyStep1OTA.onChange()
   └─ setDraftData({ basicInfo: {...} })

3. HOOK LAYER
   └─ usePersistenceAutoSave detecta mudança
   └─ setTimeout(500ms)

4. BUSINESS LOGIC
   └─ PersistenceManager.saveStepBackup()
   └─ Calcula hash dos dados
   └─ Cria log entry

5. PERSISTENCE LAYER
   └─ localStorage.setItem('property-draft-{id}', JSON)
   └─ localStorage.setItem('property-logs-{id}', JSON)

6. FEEDBACK
   └─ Console: "✅ Step 1 salvo"
   └─ (Optional) Toast notification

7. RECOVERY (após F5)
   └─ usePersistenceAutoSave.loadStepBackup()
   └─ localStorage.getItem('property-draft-{id}')
   └─ Campos preenchidos novamente ✨
```

---

## 🎯 Checklist de Implementação

```
✅ Architecture Design
   ├─ Manager pattern ✅
   ├─ Hook-based integration ✅
   └─ Layered architecture ✅

✅ Core Features
   ├─ Auto-save 500ms ✅
   ├─ localStorage backup ✅
   ├─ F5 recovery ✅
   ├─ Hash validation ✅
   └─ Log system ✅

✅ API Integration
   ├─ ViaCEP integration ✅
   ├─ Auto-format CEP ✅
   ├─ Auto-fill fields ✅
   └─ Error handling ✅

✅ Component Integration
   ├─ PropertyStep1 ✅
   ├─ PropertyStep2 ✅
   ├─ PropertyEditorPage ✅
   └─ Ready for Steps 3-17 ✅

✅ UI/UX
   ├─ Status messages ✅
   ├─ Loading indicators ✅
   ├─ Error messages ✅
   └─ Helper text ✅

✅ Documentation
   ├─ 5 guides ✅
   ├─ Code comments ✅
   ├─ Examples ✅
   └─ Troubleshooting ✅

✅ Testing
   ├─ Rapid tests ✅
   ├─ Complete tests ✅
   ├─ Console commands ✅
   └─ Validation ✅

✅ DevOps
   ├─ Build success ✅
   ├─ Server running ✅
   ├─ Hot reload ✅
   └─ No errors ✅
```

---

## 🚀 Fluxo do Usuário Final

```
START: Usuário abre http://localhost:5173
│
├─ "Criar Nova Propriedade"
│  └─ PropertyEditorPage monta
│
├─ Step 1: "Tipo de Propriedade"
│  ├─ Seleciona APARTMENT
│  ├─ Auto-save 500ms
│  └─ "✅ Dados salvos"
│
├─ "SALVAR E PRÓXIMO"
│  └─ Step 2: "Localização"
│
├─ Step 2: "Localização"
│  ├─ Digita CEP: 20040020
│  ├─ Aguarda 600ms
│  ├─ 🔄 Loader gira
│  ├─ Campos auto-preenchem
│  ├─ Auto-save 500ms
│  └─ "✅ Dados salvos"
│
├─ Usuário pressiona F5
│  └─ Página recarrega
│
├─ Volta para Step 2
│  ├─ localStorage recovered
│  ├─ Campos aparecem preenchidos ✨
│  └─ "✔️ Integridade verificada"
│
└─ END: Tudo funcionando! 🎉
```

---

**Visualização criada:** 2024-12-20
**Status:** ✅ Completa
**Pronto para:** Teste
