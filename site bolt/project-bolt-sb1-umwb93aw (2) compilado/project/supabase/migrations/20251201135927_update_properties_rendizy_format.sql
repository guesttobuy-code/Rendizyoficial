/*
  # Atualização para Formato RENDIZY

  ## Resumo
  Atualiza a estrutura do banco de dados para seguir completamente o padrão da API RENDIZY,
  adicionando todos os campos necessários para compatibilidade total.

  ## Mudanças na Tabela `properties`

  ### Novos Campos Adicionados:
  1. **Identificação e Status**
     - `code` (text, unique) - Código único da propriedade
     - `status` (enum) - Status: active, inactive, maintenance

  2. **Endereço Completo**
     - `complement` (text) - Complemento (Apto 101, Bloco A)
     - `neighborhood` (text) - Bairro
     - `country` (text) - País
     - `coordinates` (jsonb) - Coordenadas GPS {lat, lng}

  3. **Foto de Capa**
     - `cover_photo` (text) - URL da foto de capa

  4. **Preços Avançados**
     - `base_price` (numeric) - Preço base
     - `currency` (text) - Moeda (BRL, USD)
     - `sale_price` (numeric) - Preço de venda
     - `weekly_discount` (numeric) - Desconto semanal (%)
     - `monthly_discount` (numeric) - Desconto mensal (%)

  5. **Restrições de Reserva**
     - `min_nights` (integer) - Mínimo de noites
     - `max_nights` (integer) - Máximo de noites
     - `advance_booking` (integer) - Dias de antecedência mínima

  6. **Relacionamentos e Multi-tenant**
     - `location_id` (uuid) - ID do prédio/condomínio
     - `organization_id` (uuid) - ID da organização (multi-tenant)

  7. **Flag de Venda**
     - `sale` (boolean) - Disponível para venda

  ## Índices Adicionados
  - Índice único no campo `code`
  - Índice no campo `organization_id` para multi-tenant
  - Índice no campo `status` para filtragem rápida
*/

-- Criar enum para status se não existir
DO $$ BEGIN
  CREATE TYPE property_status AS ENUM ('active', 'inactive', 'maintenance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar campo code (código único)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'code'
  ) THEN
    ALTER TABLE properties ADD COLUMN code text;
    UPDATE properties SET code = id WHERE code IS NULL;
    ALTER TABLE properties ALTER COLUMN code SET NOT NULL;
    ALTER TABLE properties ADD CONSTRAINT properties_code_unique UNIQUE (code);
  END IF;
END $$;

-- Adicionar campo status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'status'
  ) THEN
    ALTER TABLE properties ADD COLUMN status property_status DEFAULT 'active';
  END IF;
END $$;

-- Adicionar campos de endereço completo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'complement'
  ) THEN
    ALTER TABLE properties ADD COLUMN complement text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE properties ADD COLUMN neighborhood text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'country'
  ) THEN
    ALTER TABLE properties ADD COLUMN country text DEFAULT 'Brasil';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'coordinates'
  ) THEN
    ALTER TABLE properties ADD COLUMN coordinates jsonb;
  END IF;
END $$;

-- Adicionar campo cover_photo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'cover_photo'
  ) THEN
    ALTER TABLE properties ADD COLUMN cover_photo text;
  END IF;
END $$;

-- Adicionar campos de preços avançados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'base_price'
  ) THEN
    ALTER TABLE properties ADD COLUMN base_price numeric(10,2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'currency'
  ) THEN
    ALTER TABLE properties ADD COLUMN currency text DEFAULT 'BRL';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'sale_price'
  ) THEN
    ALTER TABLE properties ADD COLUMN sale_price numeric(10,2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'weekly_discount'
  ) THEN
    ALTER TABLE properties ADD COLUMN weekly_discount numeric(5,2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'monthly_discount'
  ) THEN
    ALTER TABLE properties ADD COLUMN monthly_discount numeric(5,2);
  END IF;
END $$;

-- Adicionar campos de restrições
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'min_nights'
  ) THEN
    ALTER TABLE properties ADD COLUMN min_nights integer DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'max_nights'
  ) THEN
    ALTER TABLE properties ADD COLUMN max_nights integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'advance_booking'
  ) THEN
    ALTER TABLE properties ADD COLUMN advance_booking integer;
  END IF;
END $$;

-- Adicionar campos de relacionamento
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE properties ADD COLUMN location_id uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE properties ADD COLUMN organization_id uuid;
  END IF;
END $$;

-- Adicionar flag de venda
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'sale'
  ) THEN
    ALTER TABLE properties ADD COLUMN sale boolean DEFAULT false;
  END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_properties_code ON properties(code);
CREATE INDEX IF NOT EXISTS idx_properties_status_new ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_organization ON properties(organization_id);

-- Atualizar dados existentes com valores padrão
UPDATE properties SET neighborhood = 'Centro' WHERE neighborhood IS NULL;
UPDATE properties SET country = 'Brasil' WHERE country IS NULL;
UPDATE properties SET currency = 'BRL' WHERE currency IS NULL;
UPDATE properties SET status = 'active' WHERE status IS NULL;
UPDATE properties SET cover_photo = photos->0 WHERE cover_photo IS NULL AND jsonb_array_length(photos) > 0;
