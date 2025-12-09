-- Desabilitar RLS temporariamente para teste
ALTER TABLE properties_drafts DISABLE ROW LEVEL SECURITY;

-- Inserir um imóvel de teste
INSERT INTO properties_drafts (
  id,
  tenant_id,
  version,
  status,
  basic_info,
  address,
  details,
  pricing,
  gallery,
  completed_steps,
  step_errors
) VALUES (
  'prop_teste_v3_' || to_char(NOW(), 'YYYYMMDDHHmmss'),
  'test-tenant-001',
  1,
  'draft',
  '{"title": "TESTE V3", "description": "Propriedade de teste para validar persistência de dados no Properties V3", "type": "residential"}',
  '{}',
  '{}',
  '{}',
  '{"images": []}',
  ARRAY[0],
  '{}'
);

-- Reabilitar RLS
ALTER TABLE properties_drafts ENABLE ROW LEVEL SECURITY;

-- Verificar se foi inserido
SELECT id, tenant_id, basic_info ->> 'title' as title, status, completed_steps 
FROM properties_drafts 
WHERE tenant_id = 'test-tenant-001'
LIMIT 5;
