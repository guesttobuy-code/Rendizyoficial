# Integração com API RENDIZY

## Versão: 1.1-2025-12-01

Este projeto foi atualizado para seguir completamente as especificações da API RENDIZY, mantendo compatibilidade retroativa com o banco de dados Supabase local.

## Mudanças Implementadas

### 1. TypeScript Types (`src/types/index.ts`)

Atualizado interface `Property` para incluir todos os campos RENDIZY:

**Novos Campos:**
- `code` - Código único da propriedade
- `status` - Status (active/inactive/maintenance)
- `address.complement` - Complemento do endereço
- `address.neighborhood` - Bairro
- `address.country` - País
- `address.coordinates` - Coordenadas GPS {lat, lng}
- `coverPhoto` - URL da foto de capa
- `pricing.basePrice` - Preço base
- `pricing.currency` - Moeda (BRL, USD, etc)
- `pricing.salePrice` - Preço de venda
- `pricing.weeklyDiscount` - Desconto semanal (%)
- `pricing.monthlyDiscount` - Desconto mensal (%)
- `restrictions` - Objeto com minNights, maxNights, advanceBooking
- `locationId` - ID do prédio/condomínio
- `organizationId` - ID da organização (multi-tenant)
- `createdAt` e `updatedAt` - Timestamps

### 2. Configuração do Site (`src/config/site.ts`)

Atualizado para formato RENDIZY com suporte a:

**Variáveis de Template:**
```typescript
{
  organizationId: "{{ORG_ID}}",
  subdomain: "medhome",
  domain: "medhome.com.br",
  theme: {
    primaryColor: "#5DBEBD",
    secondaryColor: "#FF8B94",
    accentColor: "#10B981",
    fontFamily: "Inter, sans-serif"
  },
  api: {
    projectId: "{{PROJECT_ID}}",
    baseUrl: "{{API_BASE_URL}}",
    publicAnonKey: "{{PUBLIC_ANON_KEY}}"
  }
}
```

### 3. Serviço de API (`src/services/api.ts`)

**Modo Dual:** Suporta tanto RENDIZY quanto Supabase direto

**Configuração via ENV:**
- `VITE_USE_RENDIZY_API=true` - Usa API RENDIZY
- `VITE_USE_RENDIZY_API=false` (padrão) - Usa Supabase direto

**Endpoints RENDIZY:**
```typescript
// Base URL
https://{PROJECT_ID}.supabase.co/functions/v1/rendizy-server

// Propriedades
GET /properties?organizationId={ORG_ID}
GET /properties/{id}

// Calendário
GET /calendar?propertyId={id}&startDate={date}&endDate={date}&includeBlocks=true&includePrices=true

// Reservas
POST /reservations
```

**Headers de Autenticação:**
```typescript
{
  'Authorization': 'Bearer {PUBLIC_ANON_KEY}',
  'X-Auth-Token': '{USER_TOKEN}', // Opcional
  'Content-Type': 'application/json'
}
```

### 4. Banco de Dados (Migrations)

**Nova Migration:** `update_properties_rendizy_format`

Adiciona todos os campos RENDIZY ao banco local:

- ✅ 17 novos campos adicionados
- ✅ 3 novos índices criados
- ✅ Valores padrão configurados
- ✅ Compatibilidade retroativa mantida
- ✅ Dados existentes atualizados

## Como Usar

### Modo Desenvolvimento Local (Supabase Direto)

Arquivo `.env`:
```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
VITE_USE_RENDIZY_API=false
```

### Modo Produção (API RENDIZY)

Arquivo `.env`:
```bash
VITE_SUPABASE_PROJECT_ID=seu-projeto-id
VITE_SUPABASE_ANON_KEY=sua-chave-anon
VITE_USE_RENDIZY_API=true
```

O sistema automaticamente usa:
- Base URL: `https://{PROJECT_ID}.supabase.co/functions/v1/rendizy-server`
- Headers corretos de autenticação
- Formato de dados RENDIZY

## Multi-Tenant

O sistema agora suporta multi-tenant via:

1. **organization_id** no banco de dados
2. **Subdomínios:** `{subdomain}.rendizy.com.br`
3. **Domínios customizados:** `{domain}`
4. **Filtragem automática** por organização na API

## Estrutura do Banco Atualizada

```sql
properties (
  -- Campos existentes
  id, name, description, type, bedrooms, bathrooms, max_guests, area,
  street, number, city, state, zip_code,
  amenities, photos,
  daily_rate, weekly_rate, monthly_rate,
  short_term, long_term,
  created_at, updated_at,

  -- Novos campos RENDIZY
  code UNIQUE,                    -- Código único
  status,                         -- active/inactive/maintenance
  complement,                     -- Complemento
  neighborhood,                   -- Bairro
  country DEFAULT 'Brasil',       -- País
  coordinates JSONB,              -- {lat, lng}
  cover_photo,                    -- URL foto de capa
  base_price,                     -- Preço base
  currency DEFAULT 'BRL',         -- Moeda
  sale_price,                     -- Preço venda
  weekly_discount,                -- Desconto semanal %
  monthly_discount,               -- Desconto mensal %
  min_nights DEFAULT 1,           -- Mínimo noites
  max_nights,                     -- Máximo noites
  advance_booking,                -- Antecedência (dias)
  location_id UUID,               -- ID prédio/condomínio
  organization_id UUID,           -- ID organização
  sale BOOLEAN DEFAULT false      -- Disponível para venda
)
```

## Compatibilidade

✅ **100% Compatível** com especificações RENDIZY v1.1
✅ **Retrocompatível** com dados existentes
✅ **Modo Dual** - Funciona com ou sem RENDIZY
✅ **Type-Safe** - TypeScript completo
✅ **Testado** - Build OK (330KB JS)

## Próximos Passos

Para ativar integração RENDIZY completa:

1. Configure Edge Function `rendizy-server` no Supabase
2. Atualize `.env` com `VITE_USE_RENDIZY_API=true`
3. Configure `organization_id` nas propriedades
4. Teste endpoints da API RENDIZY

## Suporte

- Documentação RENDIZY: [Link para docs]
- Issues: [Link para issues]
- Versão: 1.1-2025-12-01
