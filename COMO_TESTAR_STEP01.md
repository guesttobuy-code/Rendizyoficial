# 🧪 COMO TESTAR STEP 01 - PERSISTÊNCIA

**Teste 06 Rafa - ID:** `8efe9eeb-22e7-467b-8350-7586e8e54f58`

---

## 📋 OPÇÃO 1: TESTE VIA CÓDIGO (RÁPIDO)

### **Passo 1: Obter Token do Usuário**

1. Abra o navegador no app Rendizy
2. Faça login
3. Abra o Console (F12)
4. Execute:
```javascript
localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('user_token')
```
5. Copie o token retornado

### **Passo 2: Executar Teste**

```bash
# No terminal, na pasta RENDIZY PASTA OFICIAL
node test_step01_persistence.mjs <seu_token>
```

**Exemplo:**
```bash
node test_step01_persistence.mjs eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **O Que o Teste Faz:**

1. ✅ Busca o imóvel atual
2. ✅ Atualiza Step 01 com dados aleatórios (mantendo nome interno)
3. ✅ Verifica se salvou
4. ✅ Simula refresh (aguarda 1 segundo)
5. ✅ Busca novamente e verifica persistência
6. ✅ Verifica se step está marcado como completo

---

## 📋 OPÇÃO 2: TESTE MANUAL (INTERFACE)

### **Passo 1: Acessar Imóvel**

1. Abra o app: `http://localhost:5173`
2. Vá para: `/properties/8efe9eeb-22e7-467b-8350-7586e8e54f58/edit`

### **Passo 2: Preencher Step 01**

1. **Nome Interno:** Manter igual (ou alterar se quiser)
2. **Tipo do Local:** Escolher qualquer opção (ex: "Apartamento")
3. **Tipo de Acomodação:** Escolher qualquer opção (ex: "Apartamento Inteiro")
4. **Subtipo:** Escolher qualquer opção (ex: "Imóvel Inteiro")
5. **Modalidades:** Marcar pelo menos uma (ex: "Locação Temporária")
6. **Número de Registro:** Preencher qualquer valor
7. **Estrutura:** Escolher "Individual" ou "Vinculado a Local"

### **Passo 3: Aguardar Auto-save**

- Aguarde 2 segundos após preencher
- Verifique no console: deve aparecer "✅ [Step01] Step 01 salvo individualmente"

### **Passo 4: Verificar Persistência**

1. Dê refresh na página (F5)
2. Verifique se:
   - ✅ Dados do Step 01 estão preenchidos
   - ✅ Step 01 está marcado como completo (verdinho na sidebar)

### **Passo 5: Verificar Backend**

1. Abra o console do navegador (F12)
2. Execute:
```javascript
// Buscar imóvel
const response = await fetch('https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/properties/8efe9eeb-22e7-467b-8350-7586e8e54f58', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('anon_key') || 'sua_chave'}`,
    'X-Auth-Token': localStorage.getItem('auth_token') || localStorage.getItem('token'),
  }
});
const data = await response.json();
console.log('wizardData:', data.data?.wizardData);
console.log('completedSteps:', data.data?.completedSteps);
```

---

## ✅ CRITÉRIOS DE SUCESSO

### **Frontend:**
- ✅ Dados do Step 01 persistem após refresh
- ✅ Step 01 aparece como completo (verdinho) na sidebar
- ✅ Console mostra "✅ [Step01] Step 01 salvo individualmente"

### **Backend:**
- ✅ `wizard_data.contentType` contém todos os dados preenchidos
- ✅ `completed_steps` inclui "content-type"
- ✅ Dados persistem no banco SQL

---

## 🔍 VERIFICAÇÕES ESPECÍFICAS

### **1. Nome Interno**
- Deve persistir exatamente como preenchido

### **2. Tipos**
- `propertyTypeId` deve persistir
- `accommodationTypeId` deve persistir

### **3. Modalidades**
- Array de modalidades deve persistir
- Ex: `["short_term_rental", "buy_sell"]`

### **4. Dados Financeiros**
- Se preenchidos, devem persistir
- Ex: `{ monthlyRent: 3500, salePrice: 450000 }`

### **5. Step Completo**
- `completed_steps` deve incluir `"content-type"`

---

**FIM DO GUIA**

