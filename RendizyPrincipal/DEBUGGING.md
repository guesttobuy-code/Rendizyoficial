# 🚀 Sistema de Debugging Acelerado - Rendizy + Copilot

## 📝 Como Funciona

O sistema captura **TODOS** os logs do navegador (console.log, console.error, erros não tratados) e armazena em memória. Você pode extrair e me enviar instantaneamente!

---

## 🎯 Comandos Rápidos

### 1️⃣ Iniciar servidor com Simple Browser
```bash
npm run dev:browser
```
Abre automaticamente o navegador em http://localhost:5173

### 2️⃣ Ver comandos de logs
```bash
npm run logs:help
```
Mostra todos os comandos disponíveis

---

## 🔍 Usando no Console F12

### Ver últimos 50 logs:
```javascript
console.table(window.__RENDIZY_LOGS__.slice(-50))
```

### Copiar logs para clipboard:
```javascript
copy(JSON.stringify(window.__RENDIZY_LOGS__.slice(-50), null, 2))
```
**Depois cole no chat que eu leio instantaneamente!** ⚡

### Ver apenas erros:
```javascript
window.__RENDIZY_LOGS__.filter(l => l.level === 'error')
```

### Buscar texto específico:
```javascript
window.__RENDIZY_LOGS__.filter(l => l.message.includes('properties'))
```

### Limpar logs:
```javascript
window.clearRendizyLogs()
```

### Exportar para arquivo JSON:
```javascript
window.exportRendizyLogs()
```

---

## 📊 Workflow Ideal

1. **Você testa** no Simple Browser
2. **Abre F12** (Ctrl+Shift+I)
3. **Copia logs**: `copy(JSON.stringify(window.__RENDIZY_LOGS__.slice(-50), null, 2))`
4. **Cola aqui no chat** → Eu leio instantaneamente! 🚀

---

## 🎨 Vantagens

✅ **Zero Fricção**: Copiar/colar é instantâneo  
✅ **Histórico Completo**: Guarda últimos 1000 logs  
✅ **Erros Inclusos**: Captura até erros não tratados  
✅ **Análise Rápida**: Copilot lê JSON em <1s  
✅ **Não Invasivo**: Não muda comportamento do app  

---

## 🔥 Exemplo de Uso

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2 (opcional): Ver comandos
npm run logs:help

# No navegador F12:
copy(JSON.stringify(window.__RENDIZY_LOGS__.filter(l => l.level === 'error'), null, 2))

# Cola aqui e eu analiso! ⚡
```

---

## 📦 Estrutura dos Logs

Cada log tem:
```json
{
  "timestamp": "2025-12-08T22:30:45.123Z",
  "level": "error",
  "message": "TypeError: data.modalities.has is not a function..."
}
```

---

## 💡 Dicas Pro

- Use **`copy()`** em vez de Ctrl+C (funciona melhor com objetos)
- **Filtre antes** de copiar para reduzir ruído
- **Limpe logs** antes de testar feature específica
- **Exporte JSON** para análise offline

---

## 🚨 Troubleshooting

**Logs não aparecem?**
```javascript
// Verificar se está ativo
console.log('Teste'); 
window.__RENDIZY_LOGS__.slice(-1) // Deve mostrar "Teste"
```

**Muitos logs?**
```javascript
// Ver apenas últimos 10
window.__RENDIZY_LOGS__.slice(-10)
```

**Quer log específico?**
```javascript
// Por timestamp
window.__RENDIZY_LOGS__.filter(l => l.timestamp > '2025-12-08T22:00:00')
```

---

Feito com ⚡ para debugging ultrarrápido!
