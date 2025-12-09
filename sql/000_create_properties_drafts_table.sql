-- ============================================================================
-- MIGRATION - Create properties_drafts table for Properties V3
-- ============================================================================

-- Drop if exists (cuidado em produção)
DROP TABLE IF EXISTS properties_drafts CASCADE;

-- Create table
CREATE TABLE properties_drafts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Dados estruturados em JSONB para flexibilidade
  basic_info JSONB NOT NULL DEFAULT '{}',
  address JSONB NOT NULL DEFAULT '{}',
  details JSONB NOT NULL DEFAULT '{}',
  pricing JSONB NOT NULL DEFAULT '{}',
  gallery JSONB NOT NULL DEFAULT '{"images": []}',
  
  -- Estado do wizard
  completed_steps INTEGER[] NOT NULL DEFAULT '{}',
  step_errors JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Foreign keys (opcional, dependendo da sua estrutura)
  CONSTRAINT tenant_exists CHECK (tenant_id IS NOT NULL)
);

-- Indexes para performance
CREATE INDEX idx_properties_drafts_tenant_id ON properties_drafts(tenant_id);
CREATE INDEX idx_properties_drafts_status ON properties_drafts(status);
CREATE INDEX idx_properties_drafts_created_at ON properties_drafts(created_at DESC);
CREATE INDEX idx_properties_drafts_updated_at ON properties_drafts(updated_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE properties_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tenant's properties
CREATE POLICY "Users can only access their tenant's properties"
  ON properties_drafts
  USING (tenant_id = auth.uid()::text);

CREATE POLICY "Users can insert properties for their tenant"
  ON properties_drafts
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid()::text);

CREATE POLICY "Users can update properties in their tenant"
  ON properties_drafts
  FOR UPDATE
  USING (tenant_id = auth.uid()::text);

CREATE POLICY "Users can delete properties in their tenant"
  ON properties_drafts
  FOR DELETE
  USING (tenant_id = auth.uid()::text);

-- Create trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_properties_drafts_updated_at
  BEFORE UPDATE ON properties_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grants (ajuste conforme sua estrutura de roles)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON properties_drafts TO authenticated;
