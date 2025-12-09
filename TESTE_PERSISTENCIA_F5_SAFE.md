## 📋 GUIA PRÁTICO - Teste de Persistência de Dados (F5 Safe)

### 🎯 Objetivo
Verificar se os dados são salvos corretamente em cada step e **sobrevivem a um refresh (F5)**.

---

### 🚀 PASSO A PASSO - Teste Completo

#### **PASSO 1: Preparar o Ambiente**
```bash
# Terminal (já rodando, se não estiver):
npm run dev
# Deve estar rodando em http://localhost:3002
```

#### **PASSO 2: Abrir Navegador e Developer Tools**
1. Abra http://localhost:3002
2. Pressione `F12` (ou `Ctrl+Shift+I` / `Cmd+Option+I`)
3. Vá para aba **"Console"**

---

### 📝 TESTE 1: Step 1 - Tipo de Propriedade

#### **2.1 Criar Nova Propriedade**
- Clique em "Criar Nova Propriedade" ou "+Adicionar"
- Você entrará no **Step 1 - Tipo de Propriedade**

#### **2.2 Preencher Dados**
```
Tipo de Propriedade: Selecione qualquer opção (ex: APARTMENT)
OTA Integrations: Ative Booking.com (clique no checkbox)
Permitir Booking Direto: Clique para ativar
```

#### **2.3 Salvar**
- Clique em **"SALVAR E PRÓXIMO"**
- No console, você verá:
  ```
  ✅ [Persistência] Step 1 (BasicInfo) salvo em localStorage
  ```

#### **2.4 Teste de Refresh (CRÍTICO!)**
- **Pressione F5** (refresh de página)
- Você volta automaticamente para **Step 1**
- ✅ **ESPERADO**: Os dados que digitou aparecem nos campos

---

### 📝 TESTE 2: Step 2 - Localização

#### **2.1 Avançar para Step 2**
- Clique em "SALVAR E PRÓXIMO" (se dados ainda estão no Step 1)
- Você entra em **Step 2 - Localização**

#### **2.2 Testar CEP Auto-Search** (Novo!)
```
Campo CEP: Digite "20040020" (Rio de Janeiro)
```
- Enquanto digita, verá: 💡 "Digite o CEP para buscar..."
- Após 600ms, aparecerá um **loader** (ícone girando)
- Após buscar, os campos preenchem automaticamente:
  ```
  Street: Avenida Rio Branco
  Neighborhood: Centro
  City: Rio de Janeiro
  State: RJ
  ```

#### **2.3 Completar Localização**
```
Street: Avenida Rio Branco (auto-preenchido)
Number: 500
Neighborhood: Centro (auto-preenchido)
City: Rio de Janeiro (auto-preenchido)
State: RJ (auto-preenchido)
Country: Brasil
Complement: Apt 1001
```

#### **2.4 Salvar**
- Clique em **"SALVAR E PRÓXIMO"**
- Console mostra:
  ```
  ✅ [Persistência] Step 2 (Location) salvo em localStorage
  ```

#### **2.5 Teste de Persistência**
- No console, execute:
  ```javascript
  persistenceManager.printReport()
  ```
- Você verá um relatório como:
  ```
  ╔════════════════════════════════════════════════════════════════╗
  ║                    RELATÓRIO DE PERSISTÊNCIA                   ║
  ╚════════════════════════════════════════════════════════════════╝

  🏢 Propriedade ID: {UUID}

  📊 RESUMO:
    • Total de logs: 2
    • Salvamentos: 2 ✅
    • Verificações: 0
    • Falhas: 0

  🔍 HISTÓRICO (últimos 10):
    ✅ [HH:MM:SS] Step 1 (BasicInfo)
       └─ 3 campos | Hash: a1b2c3d4...
       └─ Backup salvo em localStorage

    ✅ [HH:MM:SS] Step 2 (Location)
       └─ 7 campos | Hash: e5f6g7h8...
       └─ Backup salvo em localStorage
  ```

#### **2.6 Teste F5 em Step 2**
- **Pressione F5**
- ✅ **ESPERADO**: 
  - Volta para Step 2
  - Todos os campos de localização aparecem preenchidos
  - CEP: `20040-020`
  - Street: `Avenida Rio Branco`
  - Tudo igual ao que digitou

---

### 📝 TESTE 3: Step 3 - Quartos

#### **3.1 Avançar para Step 3**
- Clique **"SALVAR E PRÓXIMO"** no Step 2
- Entra em **Step 3 - Quartos**

#### **3.2 Preencher Quartos**
```
Total de Quartos: 3
Total de Quartos Dormitórios: 2
Total de Banheiros: 2
Detalhes dos Quartos: Adicione um quarto com 1 cama dupla
```

#### **3.3 Salvar e Verificar**
- Clique **"SALVAR E PRÓXIMO"**
- Execute no console:
  ```javascript
  persistenceManager.getCheckpoint()
  ```
  - Retorna: `{step: 3, timestamp: 1701234567890}`

#### **3.4 Voltar para Step 1 (Teste de Navegação)**
- Na navegação esquerda, clique em **"Step 1"**
- ✅ **ESPERADO**: Dados de Step 1 aparecem preenchidos

#### **3.5 Voltar para Step 3 e Verificar**
- Clique em **"Step 3"**
- ✅ **ESPERADO**: Dados de Step 3 aparecem preenchidos

#### **3.6 Teste F5 em Step 3**
- **Pressione F5**
- ✅ **ESPERADO**:
  - Volta para Step 3
  - Total de Quartos: `3`
  - Total de Banheiros: `2`
  - Dados de quartos adicionados aparecem

---

### 🔍 TESTES RÁPIDOS NO CONSOLE

```javascript
// Ver relatório completo de persistência
persistenceManager.printReport()

// Verificar se tem dados salvos
persistenceManager.exportData()

// Ver checkpoint (último ponto de parada)
persistenceManager.getCheckpoint()

// Salvar checkpoint manualmente
persistenceManager.saveCheckpoint(3)

// Limpar todos os dados de teste (ATENÇÃO: deleta tudo!)
persistenceManager.clearAll()
```

---

### ✅ CHECKLIST DE SUCESSO

Marque ✅ conforme testa:

**Step 1 - Tipo de Propriedade:**
- [ ] Dados aparecem quando voltar a Step 1
- [ ] Após F5, dados ainda estão presentes

**Step 2 - Localização:**
- [ ] CEP auto-busca (tipo: 20040020, aparece Avenida Rio Branco)
- [ ] Campos auto-preenchem (street, neighborhood, city, state)
- [ ] Dados persistem ao navegar para outro step
- [ ] Após F5, localização volta completa

**Step 3 - Quartos:**
- [ ] Dados de quartos são salvos
- [ ] Números de quartos/banheiros persistem
- [ ] Dados de quartos adicionados aparecem após voltar

**Navegação:**
- [ ] Pode voltar para Step 1, 2, 3 e dados estão lá
- [ ] Ordem de navegação não importa

**Refresh (F5):**
- [ ] Após F5 em qualquer step, dados aparecem
- [ ] Step correto é restaurado automaticamente

**Console:**
- [ ] `persistenceManager.printReport()` mostra histórico
- [ ] Sem erros vermelhos no console

---

### ❌ Se Algo Não Funcionar

**Problema: Dados desaparecem após voltar para outro step**
```
✓ Verifique no console se há erros vermelhos
✓ Execute: persistenceManager.printReport()
✓ Procure por "❌" (status failed)
```

**Problema: Dados sumem após F5**
```
✓ Abra F12 > Application > Local Storage
✓ Procure por chaves começando com "property-draft-"
✓ Se estiver vazio, o localStorage não está funcionando
✓ Verifique permissões do browser
```

**Problema: CEP não busca automático**
```
✓ Verifique console por erros de rede
✓ Teste manual: digite 20040020 e aguarde 1 segundo
✓ Se ainda não funcionar, a API ViaCEP pode estar fora
✓ Tente outro CEP: 01310100 (São Paulo)
```

---

### 📊 Resultados Esperados

```
✅ SUCESSO TOTAL:
- Todos os fields aparecem preenchidos quando volta
- Após F5, está no step correto com dados
- Console mostra histórico completo
- Sem erros vermelhos

⚠️ PARCIAL:
- Alguns fields persistem, outros não
- Após F5, perde alguns dados
- Alguns steps funcionam, outros não

❌ FALHA TOTAL:
- Nada persiste
- Após F5, tudo vazio
- Muitos erros vermelhos no console
```

---

### 📞 Feedback

Após terminar os testes, compartilhe:

1. **Screenshot do console** (F12 > Console)
2. **Output de:** `persistenceManager.printReport()`
3. **Quais testes passaram:**
   - [ ] Step 1-7 (Conteúdo)
   - [ ] Step 8-12 (Financeiro)
   - [ ] Step 13-17 (Configurações)
4. **Problemas encontrados:**
   - [ ] Dados perdidos
   - [ ] Campos específicos que não salvam
   - [ ] Erros após F5

---

### 🎉 Parabéns!

Se tudo passou ✅, a persistência está funcionando perfeitamente!

Próximo passo: Implementar na aplicação real (Supabase) e fazer testes de carga.
