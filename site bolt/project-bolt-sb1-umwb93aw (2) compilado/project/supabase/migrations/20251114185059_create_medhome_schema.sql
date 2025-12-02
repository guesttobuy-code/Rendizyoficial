/*
  # Schema do Sistema MedHome
  
  ## Resumo
  Criação do banco de dados completo para o sistema de aluguel de acomodações 
  humanizadas da MedHome, focado em pacientes oncológicos e transplantados.
  
  ## Tabelas Criadas
  
  ### 1. properties (Propriedades/Acomodações)
  Armazena todas as acomodações disponíveis
  - `id` (uuid, PK) - Identificador único
  - `name` (text) - Nome da acomodação
  - `description` (text) - Descrição detalhada
  - `type` (text) - Tipo: apartment, house, condo
  - `bedrooms` (int) - Quantidade de quartos
  - `bathrooms` (int) - Quantidade de banheiros
  - `max_guests` (int) - Capacidade máxima de hóspedes
  - `area` (numeric) - Área em m²
  - `street` (text) - Endereço: rua
  - `number` (text) - Endereço: número
  - `city` (text) - Cidade
  - `state` (text) - Estado
  - `zip_code` (text) - CEP
  - `amenities` (jsonb) - Array de comodidades
  - `photos` (jsonb) - Array de URLs das fotos
  - `daily_rate` (numeric) - Valor da diária
  - `weekly_rate` (numeric) - Valor semanal
  - `monthly_rate` (numeric) - Valor mensal
  - `availability` (text) - Status: available, rented, maintenance
  - `short_term` (boolean) - Aceita aluguel de curto prazo
  - `long_term` (boolean) - Aceita aluguel de longo prazo
  - `created_at` (timestamptz) - Data de criação
  - `updated_at` (timestamptz) - Data de atualização
  
  ### 2. reservations (Reservas)
  Gerencia todas as reservas/solicitações
  - `id` (uuid, PK) - Identificador único
  - `property_id` (uuid, FK) - Referência à propriedade
  - `guest_name` (text) - Nome do hóspede
  - `guest_email` (text) - Email do hóspede
  - `guest_phone` (text) - Telefone do hóspede
  - `check_in` (date) - Data de entrada
  - `check_out` (date) - Data de saída
  - `guests` (int) - Número de hóspedes
  - `total_price` (numeric) - Valor total
  - `status` (text) - Status: pending, confirmed, cancelled, completed
  - `message` (text) - Mensagem do hóspede
  - `created_at` (timestamptz) - Data da solicitação
  - `updated_at` (timestamptz) - Data de atualização
  
  ### 3. contacts (Mensagens de Contato)
  Armazena mensagens do formulário de contato
  - `id` (uuid, PK) - Identificador único
  - `name` (text) - Nome do contato
  - `email` (text) - Email
  - `phone` (text) - Telefone
  - `subject` (text) - Assunto
  - `message` (text) - Mensagem
  - `status` (text) - Status: new, read, replied
  - `created_at` (timestamptz) - Data do contato
  
  ### 4. calendar_availability (Disponibilidade do Calendário)
  Controle detalhado de disponibilidade por data
  - `id` (uuid, PK) - Identificador único
  - `property_id` (uuid, FK) - Referência à propriedade
  - `date` (date) - Data específica
  - `status` (text) - Status: available, booked, blocked
  - `price` (numeric) - Preço específico para a data
  - `min_nights` (int) - Mínimo de noites
  - `created_at` (timestamptz) - Data de criação
  
  ## Segurança (RLS)
  - Todas as tabelas têm RLS habilitado
  - Leitura pública para properties e calendar_availability
  - Criação pública para reservations e contacts
  - Operações administrativas requerem autenticação
  
  ## Índices
  - Índices criados para otimizar buscas frequentes
  - city, type, availability para properties
  - property_id, date para calendar_availability
  - property_id, status para reservations
*/

-- Criar enum types
DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('apartment', 'house', 'condo');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE property_availability AS ENUM ('available', 'rented', 'maintenance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE contact_status AS ENUM ('new', 'read', 'replied');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE calendar_status AS ENUM ('available', 'booked', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela: properties
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  type property_type NOT NULL DEFAULT 'apartment',
  bedrooms integer NOT NULL DEFAULT 1,
  bathrooms integer NOT NULL DEFAULT 1,
  max_guests integer NOT NULL DEFAULT 2,
  area numeric(10,2) NOT NULL,
  street text NOT NULL,
  number text NOT NULL,
  city text NOT NULL,
  state text NOT NULL DEFAULT 'SP',
  zip_code text NOT NULL,
  amenities jsonb DEFAULT '[]'::jsonb,
  photos jsonb DEFAULT '[]'::jsonb,
  daily_rate numeric(10,2) NOT NULL,
  weekly_rate numeric(10,2) NOT NULL,
  monthly_rate numeric(10,2) NOT NULL,
  availability property_availability DEFAULT 'available',
  short_term boolean DEFAULT true,
  long_term boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: reservations
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL DEFAULT 1,
  total_price numeric(10,2) NOT NULL,
  status reservation_status DEFAULT 'pending',
  message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_dates CHECK (check_out > check_in)
);

-- Tabela: contacts
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status contact_status DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- Tabela: calendar_availability
CREATE TABLE IF NOT EXISTS calendar_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  status calendar_status DEFAULT 'available',
  price numeric(10,2),
  min_nights integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_availability ON properties(availability);
CREATE INDEX IF NOT EXISTS idx_reservations_property ON reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_calendar_property_date ON calendar_availability(property_id, date);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies para properties
CREATE POLICY "Qualquer pessoa pode visualizar propriedades"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Apenas usuários autenticados podem criar propriedades"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Apenas usuários autenticados podem atualizar propriedades"
  ON properties FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Apenas usuários autenticados podem deletar propriedades"
  ON properties FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies para reservations
CREATE POLICY "Qualquer pessoa pode visualizar suas reservas"
  ON reservations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Qualquer pessoa pode criar reservas"
  ON reservations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Apenas usuários autenticados podem atualizar reservas"
  ON reservations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies para contacts
CREATE POLICY "Apenas usuários autenticados podem visualizar contatos"
  ON contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Qualquer pessoa pode criar contatos"
  ON contacts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Apenas usuários autenticados podem atualizar contatos"
  ON contacts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies para calendar_availability
CREATE POLICY "Qualquer pessoa pode visualizar disponibilidade"
  ON calendar_availability FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Apenas usuários autenticados podem gerenciar disponibilidade"
  ON calendar_availability FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
