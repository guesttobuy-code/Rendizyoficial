# 📋 Instruções Após Mover a Pasta

**Data:** 2025-01-28

---

## ✅ PASSO 1: Mover a Pasta

1. **Feche o Cursor completamente** (se estiver aberto)
2. **Feche qualquer outro programa** que possa estar usando a pasta
3. **Recorte** a pasta: `C:\Users\rafae\Downloads\login-que-funcionou-20251124-172504 BACKUP`
4. **Cole** em: `C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL`
   - Se a pasta destino já existir, você pode:
     - **Opção A:** Colar dentro dela (os arquivos vão para dentro)
     - **Opção B:** Substituir a pasta destino (se estiver vazia ou quiser sobrescrever)

---

## ✅ PASSO 2: Verificar se Tudo Foi Movido

Após mover, verifique se estes arquivos/pastas estão presentes:

```
C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL\
├── Ligando os motores.md          ✅
├── RendizyPrincipal\              ✅
├── supabase\                      ✅
├── rendizy.code-workspace          ✅
└── (outros arquivos e pastas)
```

---

## ✅ PASSO 3: Configurar Git

Abra o PowerShell na nova pasta e execute:

```powershell
cd "C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL"

# Configurar remote do GitHub
git remote set-url origin "https://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@github.com/guesttobuy-code/Rendizyoficial.git"

# Verificar
git remote -v

# Buscar do repositório
git fetch origin

# Verificar status
git status
```

---

## ✅ PASSO 4: Configurar Supabase CLI

No mesmo PowerShell:

```powershell
# Linkar com o projeto Supabase
npx supabase link --project-ref odcgnzfremrqnvtitpcc

# Verificar status
npx supabase status
```

---

## ✅ PASSO 5: Abrir no Cursor

1. **Abrir workspace:**
   - `File` → `Open Workspace from File...`
   - Selecione: `C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL\rendizy.code-workspace`

2. **Ou abrir pasta diretamente:**
   - `File` → `Open Folder...`
   - Selecione: `C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL`

---

## ✅ PASSO 6: Verificar Tudo Está Funcionando

Após abrir no Cursor, verifique:

- [ ] ✅ Arquivos estão todos presentes
- [ ] ✅ Git está configurado (`git remote -v` mostra o repositório correto)
- [ ] ✅ Supabase está linkado (`npx supabase status` funciona)
- [ ] ✅ Cursor abre sem erros
- [ ] ✅ `Ligando os motores.md` está atualizado com a nova localização

---

## 🎯 PRONTO!

Agora você está trabalhando na **pasta oficial** do projeto Rendizy!

**Localização oficial:**
```
C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL
```

**Próximos passos:**
1. Ler `Ligando os motores.md` para começar
2. Seguir o checklist inicial
3. Começar a trabalhar! 🚀

---

**Nota:** Este arquivo pode ser deletado após seguir todas as instruções.
