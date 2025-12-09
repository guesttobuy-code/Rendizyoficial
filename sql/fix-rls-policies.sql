-- ============================================================================
-- Corrigir RLS para permitir operações públicas em properties_drafts
-- ============================================================================

-- Drop todas as policies antigas
DROP POLICY IF EXISTS "Users can only access their tenant's properties" ON properties_drafts;
DROP POLICY IF EXISTS "Users can insert properties for their tenant" ON properties_drafts;
DROP POLICY IF EXISTS "Users can update properties in their tenant" ON properties_drafts;
DROP POLICY IF EXISTS "Users can delete properties in their tenant" ON properties_drafts;

-- Criar uma policy que permite tudo (para ambiente de desenvolvimento)
-- Em produção, você deve usar políticas mais restritivas
CREATE POLICY "Allow all operations"
  ON properties_drafts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verificar se foi criado
SELECT * FROM pg_policies WHERE tablename = 'properties_drafts';
