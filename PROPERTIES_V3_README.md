# Properties V3 - Sistema de Edição de Propriedades

Implementação completa de um módulo para criação e edição de propriedades com arquitetura limpa, validação robusta e persistência em Supabase.

## 🏗️ Arquitetura

### Camadas

```
┌─────────────────────────────────────────────────────────┐
│                    UI COMPONENTS                         │
│  (PropertyEditor: BasicInfoStep, AddressStep, etc)       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              REACT INTEGRATION LAYER                     │
│           useProperties hook / useAuth hook              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│           APPLICATION LAYER (USE CASES)                  │
│  CreatePropertyUseCase, SavePropertyStepUseCase, etc     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│           DOMAIN LAYER (BUSINESS LOGIC)                  │
│  PropertyDraft, PropertyValidator, PropertyStep, etc     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│        INFRASTRUCTURE LAYER (PERSISTENCE)                │
│    SupabasePropertyRepository, IPropertyRepository       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │     SUPABASE    │
            │  PostgreSQL DB  │
            └─────────────────┘
```

## 📁 Estrutura de Arquivos

```
src/
├── domain/
│   └── properties/
│       ├── types.ts              # PropertyDraft, PropertyStep, tipos
│       └── validators.ts         # BasicInfoValidator, AddressValidator, etc
├── application/
│   └── properties/
│       └── useCases.ts           # CreateProperty, SavePropertyStep, etc
├── infrastructure/
│   └── repositories/
│       └── PropertyRepository.ts  # IPropertyRepository + SupabaseImpl
├── hooks/
│   └── useProperties.ts          # React hook que orquestra tudo
├── components/
│   └── PropertyEditor.tsx        # Steps: BasicInfoStep, AddressStep, etc
└── pages/
    └── PropertyEditorPage.tsx    # Página completa com navegação

sql/
└── 000_create_properties_drafts_table.sql  # Schema do banco
```

## 🚀 Setup

### 1. Criar a tabela no Supabase

```bash
# Conectar ao Supabase e executar o SQL
# Arquivo: sql/000_create_properties_drafts_table.sql

# Ou via dashboard:
# Supabase → SQL Editor → Paste o conteúdo do arquivo → Execute
```

### 2. Configurar variáveis de ambiente (se necessário)

Seu `.env.local` já deve ter:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 3. Verificar imports no projeto

Os arquivos estão em:
- `src/domain/properties/types.ts`
- `src/domain/properties/validators.ts`
- `src/infrastructure/repositories/PropertyRepository.ts`
- `src/application/properties/useCases.ts`
- `src/hooks/useProperties.ts`
- `src/components/PropertyEditor.tsx`
- `src/pages/PropertyEditorPage.tsx`

## 🧪 Testes Manuais

### Teste 1: Criar nova propriedade

1. Rodar servidor: `npm run dev`
2. Acessar rota: `http://localhost:5173/properties/new`
3. Preencher dados do Passo 1 (Informações Básicas)
4. Clicar em "Salvar e Avançar"
5. ✓ Verificar console (F12) - não deve ter erros
6. ✓ Verificar se `completed_steps` foi atualizado no BD

### Teste 2: Persistência após F5

1. Continuar preenchendo os passos 2-4
2. Clicar em "Salvar" de cada passo
3. Copiar o ID da propriedade (visível no topo da página)
4. Pressionar F5 (refresh)
5. Preencher novamente a rota: `http://localhost:5173/properties/{id}`
6. ✓ Todos os dados preenchidos devem estar lá

### Teste 3: Validações

1. Ir para Passo 1 (Informações Básicas)
2. Deixar "Título" vazio
3. Clicar em "Salvar e Avançar"
4. ✓ Deve mostrar erro: "Título deve ter pelo menos 5 caracteres"
5. ✓ Propriedade NÃO deve salvar
6. ✓ Step não deve ser marcado como completed
7. Preencher corretamente e salvar
8. ✓ Agora sim deve funcionar

### Teste 4: Publish (Publicar)

1. Preencher TODOS os passos (1-5)
2. Ir para o Passo 6 (Publicar)
3. Revisar resumo
4. Clicar em "Publicar agora"
5. ✓ Status deve mudar de "draft" para "published"
6. ✓ Verificar no BD a mudança

### Teste 5: Conflito de versão

1. Abrir mesma propriedade em DUAS abas diferentes
2. Na aba 1: Preencher um campo e salvar
3. Na aba 2: Tentar preencher outro campo e salvar
4. ✓ Deve mostrar erro: "Property foi modificada"
5. ✓ Pedir para recarregar

### Teste 6: Galeria de imagens

1. Ir para Passo 5 (Galeria)
2. Adicionar URL de uma imagem válida
3. ✓ Imagem deve aparecer na preview
4. ✓ Deve persistir ao salvar
5. Deletar imagem
6. ✓ Deve sumir

## 📊 Fluxo de Dados

### Salvar um step

```
User input (Form)
    ↓
PropertyEditor component (apresentação)
    ↓
useProperties.saveStep()
    ↓
SavePropertyStepUseCase.execute()
    ↓
PropertyValidator.validateStep()
    ↓
[Se válido] SupabasePropertyRepository.save()
    ↓
Supabase PostgreSQL
    ↓
[Retorna PropertyDraft atualizada]
    ↓
React state atualiza
    ↓
Componente re-renderiza
```

### Carregar propriedade

```
PropertyEditorPage monta com propertyId
    ↓
useProperties(propertyId) hook
    ↓
useEffect dispara LoadPropertyUseCase.execute()
    ↓
SupabasePropertyRepository.get()
    ↓
Supabase PostgreSQL
    ↓
PropertyDraft carregada
    ↓
State atualiza
    ↓
Componentes renderizam
```

## 🔐 Validações Implementadas

### BasicInfo
- ✓ Title: 5+ caracteres obrigatório
- ✓ Description: 20+ caracteres obrigatório
- ✓ Type: um dos valores válidos

### Address
- ✓ Street: obrigatório
- ✓ Number: obrigatório
- ✓ City: obrigatório
- ✓ State: exatamente 2 caracteres
- ✓ ZipCode: formato CEP válido (12345-678 ou 12345678)

### Details
- ✓ Bedrooms: >= 0
- ✓ Bathrooms: >= 0
- ✓ Area: > 0
- ✓ TotalArea: >= Area
- ✓ BuildYear: 1900 até ano atual

### Pricing
- ✓ Price: > 0 obrigatório
- ✓ PricePerUnit: > 0 se fornecido

### Gallery
- ✓ Mínimo 1 imagem para publicar

## ⚠️ Versionamento e Conflitos

O sistema usa **optimistic locking** para prevenir conflitos:

1. Cada propriedade tem um `version` integer
2. Ao salvar, o BD só aceita se a versão corresponder
3. Se outra requisição atualizou enquanto você estava processando, retorna erro
4. O usuário é pedido para recarregar

Isso previne perda de dados quando múltiplas requisições acontecem simultâneas.

## 🛠️ Troubleshooting

### Erro: "Property não encontrada"
- Verificar se o propertyId é válido
- Verificar se o tenant_id é o mesmo

### Erro: "Version conflict"
- Propriedade foi editada em outro lugar
- Recarregue a página
- Se persiste, pode ser problema de race condition - considere adicionar retry

### Erro: "CORS" ou "401"
- Verificar se as variáveis de ambiente Supabase estão corretas
- Verificar se está autenticado (useAuth hook deve retornar user)
- Verificar se RLS policies estão corretas

### Imagens não carregam
- Verificar se as URLs são válidas
- Verificar se o servidor de imagens está accessible
- Considerar fazer upload de imagens em vez de URL (fazer depois)

## 📝 Próximos Passos

1. **Integrar com App.tsx** - Adicionar rota `/properties/new` e `/properties/:id`
2. **Upload de imagens** - Em vez de URL, fazer upload real para Supabase Storage
3. **Rich text editor** - Para descrição mais elaborada
4. **Geolocalização** - Buscar coordinates automaticamente do endereço
5. **Testes unitários** - Validadores e use cases já estão preparados
6. **Testes E2E** - Com Cypress ou Playwright
7. **Publicação em produção** - Migração completa de Properties V2 para V3

## 📖 Referências

- **Domain types**: `src/domain/properties/types.ts`
- **Validadores**: `src/domain/properties/validators.ts`
- **Use Cases**: `src/application/properties/useCases.ts`
- **Hook**: `src/hooks/useProperties.ts`
- **Componentes**: `src/components/PropertyEditor.tsx`
- **Página**: `src/pages/PropertyEditorPage.tsx`

---

**Status**: ✓ Pronto para testes manuais
**Último update**: Dezembro 2025
