# 🔐 Tokens Salvos

**Data:** 2024-11-21  
**Status:** ✅ Tokens salvos em `.env.local` (não versionado)

---

## 📋 Tokens Configurados

### **1. GitHub - Personal Access Token**

✅ **Funcionando!**

- **Token:** `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`
- **Tipo:** Personal Access Token (Classic)
- **Uso:** Git push, pull, clone
- **Repositório:** `https://github.com/suacasarendemais-png/Rendizy2producao.git`
- **Status:** ✅ Testado e funcionando!

**Obter novo token:** https://github.com/settings/tokens/new

---

### **2. Supabase - Secret Key**

⚠️ **É um Secret Key, não um Access Token!**

- **Token:** `sb_secret_Se1z5M4EM0lzUn4uXuherQ_6LX7BQ8d`
- **Tipo:** Secret Key (para aplicações)
- **Uso:** Edge Functions, variáveis de ambiente
- **Limitação:** ❌ NÃO funciona para login no CLI

**Este token é usado em:**
- Edge Functions (variáveis de ambiente)
- Supabase Dashboard (Settings > Edge Functions > Secrets)
- Não funciona para `npx supabase login`

---

### **3. Supabase - Access Token (Para CLI)**

✅ **Obtido e configurado!**

- **Token:** `sbp_17d159c6f1a2dab113e0cac351052dee23ededff`
- **Tipo:** Access Token (para CLI)
- **Uso:** Login no Supabase CLI
- **Status:** ✅ Configurado e funcionando!

**Como obter:**
1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em "Generate new token"
3. Dê um nome: "Rendizy CLI"
4. Copie o token gerado (formato: `sbp_...`)
5. Use para login: `npx supabase login --token sbp_...`

---

## 📁 Arquivo Local

Os tokens estão salvos em:
- **Arquivo:** `.env.local`
- **Localização:** Raiz do projeto
- **Status:** ✅ Adicionado ao `.gitignore` (não será versionado)

---

## 🚀 Como Usar

### **GitHub (Funciona Agora!):**

```powershell
# Carregar token
$env:GITHUB_TOKEN = (Get-Content .env.local | Select-String "GITHUB_TOKEN").ToString().Split("=")[1]

# Configurar remote
git remote set-url origin "https://$env:GITHUB_TOKEN@github.com/suacasarendemais-png/Rendizy2producao.git"

# Fazer push
git push
```

### **Supabase CLI (Precisa de Access Token):**

```powershell
# Primeiro, obtenha um Access Token em:
# https://supabase.com/dashboard/account/tokens

# Depois faça login
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."
npx supabase login --token $env:SUPABASE_ACCESS_TOKEN

# Verificar login
npx supabase projects list

# Linkar projeto
npx supabase link --project-ref odcgnzfremrqnvtitpcc
```

### **Supabase Secret Key (Para Edge Functions):**

```powershell
# Este token é usado em Edge Functions, não no CLI
# Configure no Supabase Dashboard:
# Settings > Edge Functions > Secrets
# Adicione: SUPABASE_SECRET_KEY = sb_secret_...
```

---

## 🔒 Segurança

✅ **Arquivo `.env.local` está no `.gitignore`**  
✅ **Não será commitado no Git**  
✅ **Mantenha este arquivo em local seguro**  
✅ **Nunca compartilhe os tokens publicamente**

---

## 📝 Scripts Criados

1. **`configurar-tokens.ps1`** - Configura tokens automaticamente
2. **`configurar-acessos.ps1`** - Configura acessos (login interativo)
3. **`.env.local`** - Arquivo com tokens (não versionado)

---

## 🧪 Testes Realizados

### **GitHub:**
✅ Token configurado  
✅ Remote atualizado  
✅ Conexão testada com sucesso (`git ls-remote` funcionou)

### **Supabase:**
⚠️ Token fornecido é Secret Key (não funciona para CLI)  
❌ Precisa de Access Token para login no CLI  
💡 Use: `npx supabase login` (login interativo) ou obtenha Access Token

---

## 📌 Próximos Passos

1. ✅ **GitHub:** Pronto para usar! Pode fazer `git push` agora
2. ⚠️ **Supabase CLI:** Precisa obter Access Token em https://supabase.com/dashboard/account/tokens
3. 💡 **Alternativa:** Use login interativo: `npx supabase login` (abre navegador)

---

**Última atualização:** 2024-11-21  
**Tokens salvos em:** `.env.local` (não versionado)  
**Script de uso:** `configurar-tokens.ps1`

