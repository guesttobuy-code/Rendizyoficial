## ⚡ INÍCIO RÁPIDO - Testar Persistência em 5 Minutos

### Pré-requisitos
- Servidor rodando: http://localhost:5173 (ou 3002)
- F12 aberto (Developer Tools)
- Console ativa (aba Console)

---

### ✅ TESTE RÁPIDO 1: Auto-Save Funciona?

**Passo 1:** Crie uma propriedade
```
Clique em "Criar Nova Propriedade"
Entra em Step 1
```

**Passo 2:** Preencha um campo
```
Selecione: propertyType = APARTMENT
Aguarde 500ms
```

**Passo 3:** Verifique console
```
Você verá: ✅ Step 1 (BasicInfo) salvo em localStorage
Cor: Azul (info)
```

✅ **SUCESSO:** Se viu a mensagem, auto-save está funcionando!

---

### ✅ TESTE RÁPIDO 2: F5 Recupera Dados?

**Passo 1:** Preencha Step 2 (Localização)
```
Selecione um CEP válido ou qualquer endereço
Clique "SALVAR E PRÓXIMO"
```

**Passo 2:** Pressione F5
```
Aguarde página recarregar
```

**Passo 3:** Verifique
```
A página deve voltar para Step 2
Os dados devem estar preenchidos
```

✅ **SUCESSO:** Se dados aparecerem após F5, persistência está OK!

---

### ✅ TESTE RÁPIDO 3: CEP Auto-Search?

**Passo 1:** Vá para Step 2
```
Localize o campo CEP
```

**Passo 2:** Digite CEP válido
```
Type: 20040020  (Avenida Rio Branco - RJ)
Aguarde 600ms
```

**Passo 3:** Observe
```
Verá um loader girando
Após buscar, vê:
  Street: Avenida Rio Branco
  Neighborhood: Centro
  City: Rio de Janeiro
  State: RJ
```

✅ **SUCESSO:** Se campos auto-preencheram, CEP API está OK!

---

### 🔍 TESTE RÁPIDO 4: Ver Relatório

**No console, execute:**
```javascript
persistenceManager.printReport()
```

**Você verá algo como:**
```
╔════════════════════════════════════════════════════════════════╗
║                    RELATÓRIO DE PERSISTÊNCIA                   ║
╚════════════════════════════════════════════════════════════════╝

🏢 Propriedade ID: abc123def456

📊 RESUMO:
  • Total de logs: 2
  • Salvamentos: 2 ✅
  • Verificações: 0
  • Falhas: 0

🔍 HISTÓRICO (últimos 10):
  ✅ [14:30:45] Step 1 (BasicInfo)
     └─ 3 campos | Hash: a1b2c3d4...
     └─ Backup salvo em localStorage

  ✅ [14:31:12] Step 2 (Location)
     └─ 7 campos | Hash: e5f6g7h8...
     └─ Backup salvo em localStorage
```

✅ **SUCESSO:** Se viu relatório com 2+ salvamentos, está funcionando!

---

### 🎯 Resumo Rápido

Se todos os 4 testes passarem ✅:

| Teste | Esperado | Resultado |
|-------|----------|-----------|
| 1. Auto-Save | Mensagem azul no console | ✅ Passou |
| 2. F5 Recupera | Dados aparecem após refresh | ✅ Passou |
| 3. CEP Auto-Search | Campos auto-preenchem | ✅ Passou |
| 4. Relatório | printReport() mostra histórico | ✅ Passou |

---

### ❌ Se Algo Não Funcionar

**Auto-save não mostra mensagem:**
- Abra F12
- Procure por erros vermelhos
- Execute: `persistenceManager` (deve mostrar objeto)

**F5 perde dados:**
- Verifique localStorage: `localStorage.key(0)`
- Se vazio, localStorage não funciona no browser

**CEP não busca:**
- Tente outro CEP: `01310100` (São Paulo)
- Se não funcionar, ViaCEP API pode estar down

**Relatório não funciona:**
- Execute: `window.persistenceManager`
- Deve retornar um objeto PersistenceManager

---

### 📞 Próximo Passo

Se todos os testes passarem ✅:
- Prossiga para testar os 17 steps completos
- Veja arquivo: `TESTE_PERSISTENCIA_F5_SAFE.md` para teste completo

Se algum teste falhar ❌:
- Tome screenshot de erros
- Verifique console completo
- Compare com valores esperados

---

**Status:** Pronto para testar! 🚀
