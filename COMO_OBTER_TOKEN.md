# 🔑 COMO OBTER TOKEN PARA TESTE

**Para executar o teste automatizado, você precisa do token do usuário.**

---

## 📋 MÉTODO 1: Console do Navegador (RECOMENDADO)

### **Passo 1: Abrir Console**
1. Abra o app no navegador: `http://localhost:5173`
2. Faça login
3. Abra o Console (F12 ou Ctrl+Shift+I)
4. Vá para a aba "Console"

### **Passo 2: Executar Script**
Copie e cole este código no console:

```javascript
// Obter token
const token = localStorage.getItem('rendizy-token') || 
              localStorage.getItem('auth_token') || 
              localStorage.getItem('token') || 
              localStorage.getItem('user_token');

if (token) {
  console.log('✅ Token encontrado!');
  console.log('📋 Token:', token);
  console.log('');
  console.log('💡 Para testar, execute no terminal:');
  console.log(`node test_step01_persistence.mjs "${token}"`);
  
  // Tentar copiar para clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(token);
    console.log('✅ Token copiado para área de transferência!');
  }
} else {
  console.error('❌ Token não encontrado!');
  console.log('Verifique se você está logado.');
}
```

### **Passo 3: Copiar Token**
O token será exibido no console. Copie-o.

### **Passo 4: Executar Teste**
No terminal, execute:
```bash
node test_step01_persistence.mjs "<seu_token_aqui>"
```

---

## 📋 MÉTODO 2: Manual (Mais Rápido)

### **No Console do Navegador:**
```javascript
localStorage.getItem('rendizy-token') || localStorage.getItem('auth_token')
```

Copie o resultado e use no teste.

---

## 📋 MÉTODO 3: Script Automático

Arquivo criado: `obter_token_console.js`

1. Abra o console do navegador
2. Copie o conteúdo de `obter_token_console.js`
3. Cole no console
4. O token será exibido e copiado automaticamente

---

**Depois de obter o token, execute:**
```bash
node test_step01_persistence.mjs "<seu_token>"
```

