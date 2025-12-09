# 🧪 Guia Completo de Testes - usePropertyStepSync v1.0.104.3

## Status: ✅ PRONTO PARA EXECUÇÃO

---

## 📍 Estrutura dos Testes

### Hierarquia de Testes
```
Testes de Unidade (Hook isolado)
  ├─ Sanitização
  ├─ Debounce
  ├─ Retry com Exponencial
  └─ localStorage Fallback

Testes de Integração (Hook + Componente)
  ├─ Ciclo Completo Save + Reload
  ├─ Multi-Step Persistence
  ├─ Status Indicators
  └─ Error Handling

Testes End-to-End (Fluxo Completo)
  ├─ Novo Rascunho (draftPropertyId)
  ├─ Edição Existente (property?.id)
  ├─ Cenários Offline
  └─ Mudanças Rápidas

Testes de Performance
  ├─ Debounce Evita Over-posting
  ├─ Memory Leaks
  └─ Latência de Sync
```

---

## 🧬 TESTE 1: Sanitização de Dados

### Objetivo
Verificar que dados não-serializáveis são removidos antes do upload

### Dados de Entrada
```json
{
  "propertyName": "Casa Bonita",
  "description": "Uma casa",
  "dateCreated": Date.now(),
  "handler": function() {},
  "files": [File, File],
  "nested": {
    "validField": "value",
    "asyncFunction": async () => {},
    "someDate": new Date()
  }
}
```

### Passos
1. Abrir PropertyEditWizard em modo criação (sem property?.id)
2. Preencher Step 01 (content-type) com dados acima
3. Abrir Network DevTools (F12 → Network)
4. Esperar debounce 2.5s
5. Observar POST request para `/api/properties/{id}`

### Resultados Esperados
✅ Request payload contém APENAS:
```json
{
  "wizardData": {
    "contentType": {
      "propertyName": "Casa Bonita",
      "description": "Uma casa",
      "nested": {
        "validField": "value"
      }
    }
  },
  "completedSteps": ["contentType"],
  "completionPercentage": X%
}
```

❌ Request NUNCA contém:
- `"dateCreated": "2025-12-08T..."`
- `"handler": "[Function]"`
- `"files": "[Object]"`
- Objetos circufarence

### Validação
```javascript
// No console do navegador, depois de sync
JSON.stringify(payload); // deve ser válido JSON, sem exceções
```

---

## 🧬 TESTE 2: Debounce Evita Over-posting

### Objetivo
Verificar que múltiplas mudanças rápidas = apenas 1 upload

### Passos
1. Abrir PropertyEditWizard (nova propriedade)
2. Ir ao Step 01 (content-type)
3. Network DevTools aberto (F12 → Network, filtrar "properties")
4. Digitar no campo "propertyName":
   ```
   C -> Ca -> Cas -> Casa -> Casa  -> Casa B -> Casa Bo -> Casa Bon
   ```
   (8 mudanças em ~2 segundos)
5. Esperar 4 segundos após o último caractere
6. Contar requisições POST/PUT para `/api/properties`

### Resultados Esperados
- ✅ Apenas 1 requisição (não 8)
- ✅ Requisição acontece ~2.5s após última mudança
- ✅ Payload contém dados FINAIS ("Casa Bon...")

### Falhas Comuns
❌ 8 requisições simultâneas = debounce não funciona
❌ Requisição imediata após 1ª mudança = debounce não funciona
❌ Múltiplas requisições com dados diferentes = múltiplos debounces

### Validação
```javascript
// console.log no hook antes de setTimeout(uploadStep, 2500)
// Deve aparecer 1 vez, não 8
```

---

## 🧬 TESTE 3: Persistência após F5 (Single Step)

### Objetivo
Verificar que dados de Step 01 são recuperados após refresh

### Passos (Novo Rascunho)
1. Abrir PropertyEditWizard (novo, sem property?.id)
2. Step 01 (content-type):
   - propertyName: "Casa Teste F5"
   - propertyType: "Apartamento"
   - area: 120
3. Esperar ver "✅ Salvo com sucesso" (indicador de status)
4. Anotar ID da propriedade (rascunho) do URL ou localStorage
5. Pressionar **F5** (refresh page)
6. Navegar de volta para PropertyEditWizard
7. Se necessário, abrir novamente o rascunho

### Resultados Esperados
✅ Dados de Step 01 aparecem preenchidos:
```
propertyName: "Casa Teste F5" (preenchido)
propertyType: "Apartamento" (preenchido)
area: 120 (preenchido)
```

✅ Sem erros de console
✅ Hook não dispara novos uploads (já está "salvo")

### Verificação Backend
```bash
# No servidor, verificar se documento foi gravado
curl http://localhost:3000/api/properties/{draftPropertyId}

# Response deve conter:
{
  "wizardData": {
    "contentType": {
      "propertyName": "Casa Teste F5",
      "propertyType": "Apartamento",
      "area": 120
    }
  },
  "completedSteps": ["contentType"]
}
```

### Falhas Comuns
❌ Campos vazios após refresh = sync não funcionou
❌ Erro 404 ao recuperar = ID não foi salvo
❌ Dados em localStorage mas não no backend = fallback foi usado, retry não funcionou

---

## 🧬 TESTE 4: Multi-Step Persistence

### Objetivo
Verificar que múltiplos steps persistem após refresh

### Passos
1. Abrir PropertyEditWizard (nova propriedade)
2. **Step 01** (content-type):
   - propertyName: "Multi-Step Casa"
   - propertyType: "Casa"
3. Clicar "Próximo" (salva Step 01, avança para Step 02)
4. **Step 02** (content-location):
   - country: "Brasil"
   - state: "São Paulo"
   - city: "São Paulo"
5. Clicar "Próximo" (salva Step 02, avança para Step 03)
6. **Step 03** (content-rooms):
   - bedrooms: 3
   - bathrooms: 2
7. Esperar "✅ Salvo com sucesso" em Step 03
8. **F5** Refresh
9. Navegar de volta para PropertyEditWizard com o mesmo rascunho ID

### Resultados Esperados
✅ Todos os 3 steps aparecem com dados:
- Step 01: Casa completo
- Step 02: Localização completa
- Step 03: Quartos/Banheiros
  
✅ Backend contém:
```json
{
  "wizardData": {
    "contentType": { ... dados step 01 ... },
    "contentLocation": { ... dados step 02 ... },
    "contentRooms": { ... dados step 03 ... }
  },
  "completedSteps": ["contentType", "contentLocation", "contentRooms"]
}
```

### Falhas Comuns
❌ Step 01 aparece mas Steps 02/03 vazios = merge não funcionou
❌ completedSteps contém apenas 1 step = union não funcionou
❌ Ordem dos dados misturada = parser JSON errado

---

## 🧬 TESTE 5: Retry com Erro de Rede

### Objetivo
Verificar que retry exponencial recupera de falhas transitórias

### Setup
```bash
# Terminal 1: Backend rodando normalmente
npm run dev

# Terminal 2: Simular falha de rede
# Opção A: Desconectar/conectar WiFi
# Opção B: Windows Firewall bloquear localhost
# Opção C: DevTools Network Throttling
```

### Passos (Via DevTools)
1. F12 → Network tab
2. Encontrar dropdown "No throttling" (canto superior esquerdo)
3. Selecionar "Offline"
4. Abrir PropertyEditWizard (nova propriedade)
5. Step 01, preencher dados
6. Esperar 2.5s → ver indicador "❌ Erro: Network error"
7. Em Network tab, mudança para "Online" (dropdown)
8. Observe retry automático

### Resultados Esperados
✅ Sequência de eventos:
1. User preenche campo
2. 2.5s esperando
3. Tenta POST → falha (Offline)
4. Indicador muda para: "💾 Salvando..."
5. 5 segundos depois → retry 1
6. Network ainda offline
7. Indicador: "❌ Erro: Retrying (1/3)..."
8. 10 segundos depois → retry 2
9. User reconecta (muda para Online)
10. Retry 3 sucede
11. Indicador: "✅ Salvo com sucesso"
12. Backend recebe dados

### Verificação
```javascript
// No console durante offline
// Deve haver logs como:
// "Retry attempt 1/3 after 5000ms"
// "Retry attempt 2/3 after 10000ms"
// "Sync successful after retries"
```

### Falhas Comuns
❌ Após reconectar, não há retry = exponencial não funciona
❌ Retries não param após sucesso = loop infinito
❌ Após 3 retries, dados desaparecem = fallback localStorage falhou

---

## 🧬 TESTE 6: Fallback localStorage (Max Retries)

### Objetivo
Verificar que dados são salvos em localStorage quando máximo de retries é atingido

### Passos
1. F12 → Network → Offline (deixe offline)
2. Abrir PropertyEditWizard (nova propriedade)
3. Step 01, preencher dados:
   ```
   propertyName: "Casa Offline"
   propertyType: "Apartamento"
   ```
4. Esperar ~30 segundos (todas as tentativas de retry esgotadas)
5. Ver indicador: "❌ Erro: Max retries reached (3). Dados em localStorage."
6. F12 → Application → Local Storage → buscar chave `property_draft_{propertyId}`

### Resultados Esperados
✅ localStorage contém chave: `property_draft_abc123def456` (exemplo)

✅ Valor localStorage:
```json
{
  "contentType": {
    "propertyName": "Casa Offline",
    "propertyType": "Apartamento"
  },
  "timestamp": 1702050000000,
  "syncStatus": "pending"
}
```

✅ Indicador mostra: "❌ Erro: Max retries (3). Data saved locally."

### Recovery Teste
1. Manter página aberta ou recarregar F5
2. Network → voltar para "Online"
3. Hook deve detectar localStorage e tentar sync novamente
4. Após sucesso: "✅ Salvo com sucesso"
5. localStorage deve ser limpo

### Falhas Comuns
❌ localStorage vazio = fallback não funcionou
❌ Dados em localStorage mas não sincronizam ao conectar = recovery não funciona
❌ Indicador não mostra mensagem de erro = UX ruim

---

## 🧬 TESTE 7: Status Indicators (UI Feedback)

### Objetivo
Verificar que todos os indicadores de status aparecem corretamente

### Passos
1. Abrir PropertyEditWizard (nova propriedade)
2. Step 01, começar a digitar nome
3. **Observar durante 5 segundos**:
   - 0-2.5s: Nenhum indicador (ou "💾 Salvando..." se já foi salvo antes)
   - ~2.5s: "💾 Salvando..." aparece
   - ~3.5s: "✅ Salvo com sucesso" aparece
   - Desaparece após 3 segundos

4. Agora simular erro:
   - F12 → Network → Offline
   - Mudar campo de novo
   - 2.5s → "💾 Salvando..."
   - ~3.5s → "❌ Erro: Network error" aparece
   - Volta para "💾 Salvando..." a cada tentativa de retry
   - Mensagem de erro persiste até reconectar

### Resultados Esperados
✅ Estados vistos nesta ordem:
1. (nada) → 💾 Salvando → ✅ Salvo
2. (nada) → 💾 Salvando → ❌ Erro (offline)
3. (nada) → 💾 Salvando → ✅ Salvo (após online)

✅ Posicionamento: abaixo do step, não interfere com campos
✅ Cores:
   - 💾 Amarelo/Azul (ação em progresso)
   - ✅ Verde (sucesso)
   - ❌ Vermelho (erro)

### Acessibilidade
```javascript
// Indicador deve ter aria-label
<div aria-label="Salvando...">💾 Salvando...</div>

// Screen reader ouve: "Salvando"
```

### Falhas Comuns
❌ Indicador nunca aparece = usePropertyStepSync não renderiza UI
❌ Indicador congela em "💾 Salvando..." = timeout muito longo
❌ Múltiplos indicadores simultâneos = re-renders desnecessários
❌ Mensagem de erro muito genérica = user confuso

---

## 🧬 TESTE 8: Compatibilidade Reversa (Legacy Data)

### Objetivo
Verificar que rascunhos antigos (sem novo hook) ainda funcionam

### Setup
```bash
# Abrir banco de dados directamente
# Localizar document de propriedade antigo (sem completedSteps ou com estrutura antiga)
# Exemplo:
db.properties.findOne({_id: "old-draft-id"})
{
  "wizardData": {
    "contentType": { "propertyName": "Casa Velha", ... },
    "contentLocation": { "city": "São Paulo", ... }
  }
  // Sem completedSteps (estrutura antiga)
}
```

### Passos
1. Usar URL para abrir rascunho antigo:
   ```
   /properties/wizard?draftPropertyId=old-draft-id
   ```
2. Página deve carregar sem erros
3. Verificar que dados antigos aparecem em seus steps

### Resultados Esperados
✅ Dados antigos carregam sem erro
✅ Novo hook funciona com dados antigos
✅ completedSteps é inicializado como array vazio (valor padrão)
✅ Ao fazer mudança em um step, merge acontece sem sobrescrever dados antigos

### Verificação Backend
```javascript
// Após modificar um step
db.properties.findOne({_id: "old-draft-id"})

// Deve conter dados ANTIGOS + novos
{
  "wizardData": {
    "contentType": { /* dados ANTIGOS */ },
    "contentLocation": { /* dados ANTIGOS */ },
    "contentRooms": { /* novos dados */ }  // adicionado aqui
  },
  "completedSteps": ["contentRooms"]  // apenas novo (ou union se implementado)
}
```

### Falhas Comuns
❌ TypeError ao carregar (undefined.someField) = acesso inseguro
❌ Dados antigos desaparecem = merge falhou
❌ completedSteps vazio ou undefined = inicialização errada

---

## 🧬 TESTE 9: Multi-Tenant Isolation

### Objetivo
Verificar que rascunhos de diferentes tenants não se misturam

### Passos (simular multi-tenant)
1. Acessar via account A:
   ```
   Cookie: tenantId=tenant-a
   ```
   PropertyEditWizard → Step 01 → preencher "Casa do Tenant A"

2. Mudar conta para account B:
   ```
   Cookie: tenantId=tenant-b
   (ou logout + login em outra conta)
   ```
   PropertyEditWizard → Step 01 → preencher "Casa do Tenant B"

3. Voltar para account A
4. Abrir PropertyEditWizard novamente

### Resultados Esperados
✅ Account A vê apenas "Casa do Tenant A"
✅ Account B vê apenas "Casa do Tenant B"
✅ Nenhum cross-contamination

### Backend Verificação
```bash
# Logs devem mostrar tenantId correto
# POST /api/properties (tenantId=tenant-a) → apenas tenant-a pode ler
# GET /api/properties (tenantId=tenant-b) → não vê dados de tenant-a
```

### Falhas Comuns
❌ Account B vê dados de Account A = middleware de tenancy falhou
❌ Chave localStorage sem tenantId = dados misturados
❌ API retorna dados de outro tenant = authorization check falhou

---

## 🧬 TESTE 10: Performance - Memory Leaks

### Objetivo
Verificar que não há memory leaks do debounce/retry timers

### Setup
```bash
# Chrome DevTools
# F12 → Memory → Take Heap Snapshot
# Anotar heap size inicial
```

### Passos
1. Take Heap Snapshot (inicial): ~50MB (exemplo)
2. Abrir PropertyEditWizard
3. Fazer 100 mudanças rápidas em um campo (via script):
   ```javascript
   for(let i = 0; i < 100; i++) {
     document.querySelector('input[name="propertyName"]').value = `test${i}`;
     document.querySelector('input').dispatchEvent(new Event('input', { bubbles: true }));
   }
   ```
4. Esperar ~5 segundos (todos os debounces/retries completarem)
5. Take Heap Snapshot (após): deve ser ~50-55MB (não 150MB)

### Resultados Esperados
✅ Heap size cresce < 5% após 100 mudanças
✅ Nenhum array de timers crescendo
✅ localStorage não cresce de forma descontrolada

### DevTools Detalhes
```javascript
// No console, procurar por
window.timeouts // ou
window.intervals // ou
document.querySelectorAll('[aria-label*="Salvando"]').length // não cresce indefinidamente
```

### Falhas Comuns
❌ Heap cresce 50MB+ (100 mudanças × 500KB cada) = memory leak
❌ setTimeout/setInterval não são limpas = cleanup falhou
❌ localStorage cresce a 1MB+ = não está sendo limpo

---

## 🧬 TESTE 11: Edição de Propriedade Existente

### Objetivo
Verificar que hook funciona diferente em modo edição (property?.id existe)

### Passos
1. Criar propriedade completa (publishar ou deixar como rascunho com property?.id)
2. Abrir PropertyEditWizard para edição:
   ```
   /properties/wizard?propertyId={existingId}
   ```
3. Verificar que:
   - Todos os steps aparecem pré-preenchidos
   - Não há draftPropertyId (é null ou undefined)
   - property?.id é usado para API calls
4. Modificar Step 02 (content-location):
   - Mudar city de "São Paulo" para "Rio de Janeiro"
5. Esperar "✅ Salvo"
6. Modificar Step 05 (content-property-amenities):
   - Adicionar amenidade "Piscina"
7. Esperar "✅ Salvo"

### Resultados Esperados
✅ Cada step sincroniza independentemente
✅ Network tab mostra:
   - PUT /api/properties/{existingId} (Step 02)
   - PUT /api/properties/{existingId} (Step 05)

✅ Backend contém merge de ambas as mudanças

### Diferenças vs. Novo Rascunho
| Cenário | Novo Rascunho | Edição Existente |
|---------|---|---|
| ID da Propriedade | draftPropertyId | property?.id |
| Sincronização | Após "Próximo" ou auto | Auto a cada mudança |
| completedSteps | Union de steps novos | Não afeta (já publicada) |
| Fallback localStorage | Sim | Sim (mas cache de draft) |

### Falhas Comuns
❌ Mudanças em edição não sincronizam = hook desabilitado
❌ Erro 404 ao PUT = propertyId incorreto
❌ Dados antigos aparecem após mudança = merge falhou

---

## 📊 Matriz de Testes

| # | Teste | Objetivo | Duração | Criticidade |
|---|-------|----------|---------|-------------|
| 1 | Sanitização | Sem dados não-JSON | 2 min | CRÍTICO |
| 2 | Debounce | 1 upload por mudança | 3 min | CRÍTICO |
| 3 | F5 Single Step | Persistência após refresh | 5 min | CRÍTICO |
| 4 | Multi-Step | Todos os steps persistem | 5 min | CRÍTICO |
| 5 | Retry Rede | Recupera de falhas | 10 min | ALTO |
| 6 | localStorage Fallback | Dados não perdidos offline | 10 min | ALTO |
| 7 | Status Indicators | Feedback visual correto | 5 min | MÉDIO |
| 8 | Legacy Data | Compatibilidade reversa | 5 min | MÉDIO |
| 9 | Multi-Tenant | Isolamento correto | 5 min | ALTO |
| 10 | Memory Leaks | Limpeza de timers | 10 min | ALTO |
| 11 | Edição Existente | Sincronização em edição | 5 min | CRÍTICO |

**Tempo Total**: ~65 minutos (recomendado dividir em 2 sessões)

---

## 🎯 Critérios de Sucesso

### Must-Have (Testes 1-5, 9, 11)
- ✅ 0 falhas críticas
- ✅ 0 perda de dados em qualquer cenário
- ✅ Isolamento multi-tenant intacto
- ✅ Retry recover de falhas de rede

### Should-Have (Testes 6-7)
- ✅ localStorage fallback funciona
- ✅ Status indicators visíveis e precisos

### Nice-to-Have (Testes 8, 10)
- ✅ Compatibilidade reversa com dados antigos
- ✅ Zero memory leaks

---

## 📋 Checklist de Execução

Antes de começar:
- [ ] Localhost está rodando (npm run dev)
- [ ] Backend está respondendo (http://localhost:3000/health)
- [ ] DevTools aberto (F12)
- [ ] Console.log limpo (não há erros anteriores)
- [ ] Network tab filtrado em "properties"
- [ ] localStorage limpo (Application → Clear Storage)

Depois de cada teste:
- [ ] Anotar resultados no final desta document
- [ ] Screenshot se houver anomalias
- [ ] Limpar localStorage entre testes

---

## 📝 Resultados (Preencher Após Execução)

### Teste 1: Sanitização
- Resultado: [ ] Passou [ ] Falhou [ ] Parcial
- Detalhes: _________________
- Timestamp: _________________

### Teste 2: Debounce
- Resultado: [ ] Passou [ ] Falhou [ ] Parcial
- Detalhes: _________________
- Timestamp: _________________

### Teste 3: F5 Single Step
- Resultado: [ ] Passou [ ] Falhou [ ] Parcial
- Detalhes: _________________
- Timestamp: _________________

### Teste 4: Multi-Step
- Resultado: [ ] Passou [ ] Falhou [ ] Parcial
- Detalhes: _________________
- Timestamp: _________________

### Teste 5: Retry Rede
- Resultado: [ ] Passou [ ] Falhou [ ] Parcial
- Detalhes: _________________
- Timestamp: _________________

### Teste 6: localStorage Fallback
- Resultado: [ ] Passou [ ] Falhou [ ] Parcial
- Detalhes: _________________
- Timestamp: _________________

### Teste 7: Status Indicators
- Resultado: [ ] Passou [ ] Falhou [ ] Parcial
- Detalhes: _________________
- Timestamp: _________________

### Teste 8: Legacy Data
- Resultado: [ ] Passou [ ] Falhou [ ] Parcial
- Detalhes: _________________
- Timestamp: _________________

### Teste 9: Multi-Tenant
- Resultado: [ ] Passou [ ] Falhou [ ] Parcial
- Detalhes: _________________
- Timestamp: _________________

### Teste 10: Memory Leaks
- Resultado: [ ] Passou [ ] Falhou [ ] Parcial
- Detalhes: _________________
- Timestamp: _________________

### Teste 11: Edição Existente
- Resultado: [ ] Passou [ ] Falhou [ ] Parcial
- Detalhes: _________________
- Timestamp: _________________

---

## 📊 Resumo Final
- Total Testes: 11
- Testes Passados: ___/11
- Testes Falhados: ___/11
- Taxa de Sucesso: ___/100%
- Data de Execução: _________________
- Executor: _________________

---

Versão: 1.0 | Data: 8 Dezembro 2025 | Status: ✅ Pronto para Execução
