#!/usr/bin/env node
/**
 * 🔍 ANÁLISE PROFUNDA - SCHEMA E DADOS DA TABELA PROPERTIES
 * Investiga a estrutura real do banco de dados e padrões de dados
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://odcgnzfremrqnvtitpcc.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                         'sb_secret_Se1z5M4EM0lzUn4uXuherQ_6LX7BQ8d';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ============================================================================
// FASE 1: INSPECIONAR SCHEMA DA TABELA
// ============================================================================
async function analyzeSchema() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 FASE 1: ANALISAR SCHEMA DA TABELA PROPERTIES');
  console.log('='.repeat(80) + '\n');

  try {
    // Executar query SQL para pegar informações de colunas
    const { data: columns, error: colError } = await supabase.rpc('get_columns_info', {
      p_table_name: 'properties'
    }).catch(e => {
      console.log('⚠️  RPC não disponível, tentando abordagem alternativa...');
      return { data: null, error: e };
    });

    if (!colError && columns) {
      console.log('✅ Colunas encontradas:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '[NOT NULL]' : '[NULLABLE]'}`);
      });
    } else {
      // Fallback: tentar SELECT vazio para pegar metadados
      console.log('📊 Tentando descobrir colunas via SELECT vazio...');
      const { data: sampleData, error: sampleError } = await supabase
        .from('properties')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.error('❌ Erro:', sampleError.message);
        return;
      }

      if (sampleData && sampleData.length > 0) {
        const firstRecord = sampleData[0];
        console.log('✅ Colunas encontradas (do primeiro registro):');
        Object.keys(firstRecord).forEach(col => {
          const value = firstRecord[col];
          const type = Array.isArray(value) ? 'array' : typeof value;
          console.log(`  - ${col} (${type})`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Erro ao analisar schema:', err.message);
  }
}

// ============================================================================
// FASE 2: ANÁLISE DE DADOS - RASCUNHOS
// ============================================================================
async function analyzeProperties() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 FASE 2: ANALISAR DADOS EXISTENTES - RASCUNHOS');
  console.log('='.repeat(80) + '\n');

  try {
    // Buscar rascunhos (draft)
    const { data: drafts, error: draftError } = await supabase
      .from('properties')
      .select('id, name, status, created_at, updated_at, wizardData, address')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(10);

    if (draftError) {
      console.error('❌ Erro ao buscar rascunhos:', draftError.message);
      return;
    }

    console.log(`📦 Total de RASCUNHOS encontrados: ${drafts.length}\n`);

    if (drafts.length === 0) {
      console.log('⚠️  Nenhum rascunho encontrado!');
    } else {
      drafts.forEach((draft, idx) => {
        console.log(`\n[Rascunho ${idx + 1}] ${draft.name || '(sem nome)'}`);
        console.log(`  ID: ${draft.id}`);
        console.log(`  Criado: ${draft.created_at}`);
        console.log(`  Modificado: ${draft.updated_at}`);
        console.log(`  Status: ${draft.status}`);
        
        // Analisar wizardData
        if (draft.wizardData) {
          if (typeof draft.wizardData === 'string') {
            try {
              const parsed = JSON.parse(draft.wizardData);
              console.log(`  🔍 wizardData (parsed): ${Object.keys(parsed).length} propriedades`);
              console.log(`     Chaves: ${Object.keys(parsed).slice(0, 5).join(', ')}${Object.keys(parsed).length > 5 ? '...' : ''}`);
            } catch (e) {
              console.log(`  ❌ wizardData: INVÁLIDO (não é JSON válido)`);
            }
          } else {
            console.log(`  🔍 wizardData (object): ${Object.keys(draft.wizardData).length} propriedades`);
            console.log(`     Chaves: ${Object.keys(draft.wizardData).slice(0, 5).join(', ')}${Object.keys(draft.wizardData).length > 5 ? '...' : ''}`);
          }
        } else {
          console.log(`  ⚠️  wizardData: VAZIO/NULL`);
        }

        // Analisar address
        if (draft.address) {
          console.log(`  📍 address: ${typeof draft.address === 'string' ? 'STRING' : 'OBJECT'}`);
        } else {
          console.log(`  ⚠️  address: VAZIO/NULL`);
        }
      });
    }
  } catch (err) {
    console.error('❌ Erro ao analisar propriedades:', err.message);
  }
}

// ============================================================================
// FASE 3: ANÁLISE DE PROPRIEDADES PUBLICADAS
// ============================================================================
async function analyzePublished() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 FASE 3: ANALISAR PROPRIEDADES PUBLICADAS');
  console.log('='.repeat(80) + '\n');

  try {
    const { data: published, error: pubError } = await supabase
      .from('properties')
      .select('id, name, status, created_at, updated_at')
      .neq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(10);

    if (pubError) {
      console.error('❌ Erro ao buscar publicadas:', pubError.message);
      return;
    }

    console.log(`✅ Total de PUBLICADAS encontradas: ${published.length}\n`);

    if (published.length === 0) {
      console.log('⚠️  Nenhuma propriedade publicada!');
    } else {
      published.forEach((prop, idx) => {
        console.log(`[Publicada ${idx + 1}] ${prop.name || '(sem nome)'}`);
        console.log(`  ID: ${prop.id}`);
        console.log(`  Status: ${prop.status}`);
        console.log(`  Criado: ${prop.created_at}`);
      });
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

// ============================================================================
// FASE 4: ANÁLISE DE INTEGRITY - DADOS INCOMPLETOS
// ============================================================================
async function analyzeIntegrity() {
  console.log('\n' + '='.repeat(80));
  console.log('🔐 FASE 4: ANÁLISE DE INTEGRIDADE - DADOS INCOMPLETOS');
  console.log('='.repeat(80) + '\n');

  try {
    const { data: allProps, error: allError } = await supabase
      .from('properties')
      .select('id, status, name, wizardData, address, type, code')
      .limit(100);

    if (allError) {
      console.error('❌ Erro:', allError.message);
      return;
    }

    console.log(`📋 Total de propriedades: ${allProps.length}\n`);

    let statsObject = {
      total: allProps.length,
      por_status: {},
      sem_nome: 0,
      sem_wizardData: 0,
      sem_address: 0,
      sem_type: 0,
      status_draft_sem_dados: 0
    };

    allProps.forEach(prop => {
      // Por status
      if (!statsObject.por_status[prop.status]) {
        statsObject.por_status[prop.status] = 0;
      }
      statsObject.por_status[prop.status]++;

      // Contadores
      if (!prop.name) statsObject.sem_nome++;
      if (!prop.wizardData) statsObject.sem_wizardData++;
      if (!prop.address) statsObject.sem_address++;
      if (!prop.type) statsObject.sem_type++;

      // Status draft sem dados
      if (prop.status === 'draft' && !prop.wizardData) {
        statsObject.status_draft_sem_dados++;
      }
    });

    console.log('📊 ESTATÍSTICAS:');
    console.log(`  Total de propriedades: ${statsObject.total}`);
    console.log(`  Por status:`);
    Object.entries(statsObject.por_status).forEach(([status, count]) => {
      console.log(`    - ${status}: ${count}`);
    });
    console.log(`\n  Dados incompletos:`);
    console.log(`    - Sem nome: ${statsObject.sem_nome}`);
    console.log(`    - Sem wizardData: ${statsObject.sem_wizardData}`);
    console.log(`    - Sem address: ${statsObject.sem_address}`);
    console.log(`    - Sem type: ${statsObject.sem_type}`);
    console.log(`    - Rascunhos SEM DATA NENHUMA: ${statsObject.status_draft_sem_dados}`);

    if (statsObject.status_draft_sem_dados > 0) {
      console.log(`\n🚨 ALERTA: ${statsObject.status_draft_sem_dados} rascunhos foram criados mas ficaram VAZIOS!`);
      console.log('    Isto explica por que "salva mas perde dados" - o rascunho é criado mas o PUT nunca acontece.');
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

// ============================================================================
// FASE 5: RASTREAR FLUXO - TIMINGS
// ============================================================================
async function analyzeTimings() {
  console.log('\n' + '='.repeat(80));
  console.log('⏱️  FASE 5: ANÁLISE DE TIMINGS - QUANDO FORAM CRIADOS/ATUALIZADOS');
  console.log('='.repeat(80) + '\n');

  try {
    const { data: props, error: err } = await supabase
      .from('properties')
      .select('id, name, status, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (err) {
      console.error('❌ Erro:', err.message);
      return;
    }

    console.log('📅 10 Propriedades mais recentes (por UPDATE):\n');

    props.slice(0, 10).forEach((prop, idx) => {
      const createdTime = new Date(prop.created_at);
      const updatedTime = new Date(prop.updated_at);
      const diffMs = updatedTime - createdTime;
      const diffSecs = (diffMs / 1000).toFixed(2);

      console.log(`[${idx + 1}] ${prop.name || '(sem nome)'}`);
      console.log(`    Status: ${prop.status}`);
      console.log(`    Criado: ${createdTime.toLocaleString('pt-BR')}`);
      console.log(`    Atualizado: ${updatedTime.toLocaleString('pt-BR')}`);
      console.log(`    Diferença: ${diffSecs}s`);
      
      if (prop.status === 'draft' && diffSecs < 2) {
        console.log(`    ⚠️  Criado mas não atualizado (PUT nunca aconteceu?)`);
      }
      console.log('');
    });
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

// ============================================================================
// EXECUTOR PRINCIPAL
// ============================================================================
async function main() {
  console.log('\n🔍 ANÁLISE DETALHADA - BANCO DE DADOS PROPERTIES\n');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Autenticado: Sim\n`);

  await analyzeSchema();
  await analyzeProperties();
  await analyzePublished();
  await analyzeIntegrity();
  await analyzeTimings();

  console.log('\n' + '='.repeat(80));
  console.log('✅ ANÁLISE CONCLUÍDA');
  console.log('='.repeat(80) + '\n');
}

main().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
