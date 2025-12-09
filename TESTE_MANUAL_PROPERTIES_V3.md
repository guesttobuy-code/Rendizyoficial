# TESTE MANUAL - Properties V3

## Passo a Passo

### 1. Acessar a aplicação
```
http://localhost:5173/
```

### 2. Fazer login no sistema

### 3. Clicar no botão "PROPERTIES V3" no menu lateral
- Deve abrir a página de listagem
- Inicialmente vazia com mensagem "Nenhuma propriedade"

### 4. Clicar em "Nova Propriedade"
- Deve abrir o editor em `/properties/new`
- Formulário de 6 steps visível

### 5. Preencher Step 1 (Informações Básicas)
```
Título: TESTE V3
Descrição: Propriedade de teste criada para validar persistência de dados no Properties V3 com arquitetura limpa
Tipo: Residencial
```

### 6. Clicar em "Salvar e Avançar"
- Deve salvar no banco
- Deve avançar para Step 2

### 7. Pressionar F5 (Refresh)
- Página deve recarregar
- Dados do Step 1 devem voltar preenchidos
- Step 1 deve estar marcado como ✓ completo

### 8. Voltar para listagem
- Clicar em "PROPERTIES V3" no menu
- Deve mostrar 1 propriedade
- Card deve mostrar:
  - Título: TESTE V3
  - Status: Rascunho (amarelo)
  - Progresso: ~17% (1 de 6 steps)

## Validação de Sucesso

✅ Propriedade aparece na listagem
✅ Dados persistem após F5
✅ Step 1 marcado como completo
✅ Progress bar mostra 17%
✅ Pode editar clicando no card

## Verificar no Supabase

Acessar Supabase Dashboard → Table Editor → `properties_drafts`

Deve ter 1 registro com:
- `id`: prop_[timestamp]_[random]
- `tenant_id`: [seu_tenant_id]
- `version`: 2 (após salvar)
- `status`: 'draft'
- `basic_info`: { title: 'TESTE V3', description: '...', type: 'residential' }
- `completed_steps`: [0]
- `created_at` e `updated_at` preenchidos

## Em caso de erro

1. **Erro 404**: Verificar se rotas estão corretas em App.tsx
2. **Erro ao salvar**: Verificar console (F12) para erros de Supabase
3. **Dados não persistem**: Verificar se tabela `properties_drafts` existe
4. **Erro de autenticação**: Verificar se está logado e tem tenant_id

## Comandos úteis

### Ver logs do servidor
```powershell
# O servidor já está rodando
# Verificar saída no terminal
```

### Rebuild se necessário
```powershell
cd "C:\dev - Copia\RENDIZY PASTA OFICIAL\RendizyPrincipal"
npm run build
npm run dev
```

### Verificar tabela Supabase via SQL
```sql
SELECT * FROM properties_drafts 
WHERE tenant_id = '[seu_tenant_id]' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## Status Esperado

Após completar todos os passos:
- ✅ 1 propriedade "TESTE V3" na listagem
- ✅ Dados persistentes no banco
- ✅ F5 funciona perfeitamente
- ✅ Progress tracking funcional
- ✅ Validações ativas

**TUDO PRONTO PARA TESTE MANUAL!** 🚀
