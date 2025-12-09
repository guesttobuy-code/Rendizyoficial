#!/usr/bin/env node
/**
 * 🔍 ANÁLISE DO CONTEÚDO DE wizard_data
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://odcgnzfremrqnvtitpcc.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                         'sb_secret_Se1z5M4EM0lzUn4uXuherQ_6LX7BQ8d';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('\n🔍 ANÁLISE DETALHADA - wizard_data (COLUNA CORRETA)\n');

  try {
    // Buscar os últimos 5 rascunhos
    const { data: drafts, error } = await supabase
      .from('properties')
      .select('id, name, status, created_at, updated_at, wizard_data, completion_percentage, completed_steps')
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Erro:', error.message);
      return;
    }

    console.log(`📦 Total de RASCUNHOS encontrados: ${drafts.length}\n`);

    if (drafts.length === 0) {
      console.log('⚠️  Nenhum rascunho!');
      return;
    }

    drafts.forEach((draft, idx) => {
      console.log('\n' + '='.repeat(80));
      console.log(`[RASCUNHO ${idx + 1}] ${draft.name}`);
      console.log('='.repeat(80));
      
      console.log(`ID: ${draft.id}`);
      console.log(`Criado: ${new Date(draft.created_at).toLocaleString('pt-BR')}`);
      console.log(`Atualizado: ${new Date(draft.updated_at).toLocaleString('pt-BR')}`);
      console.log(`Completion: ${draft.completion_percentage || 0}%`);
      console.log(`Completed Steps: ${draft.completed_steps ? draft.completed_steps.length : 0}`);

      console.log('\n📊 wizard_data:');
      
      if (!draft.wizard_data || Object.keys(draft.wizard_data).length === 0) {
        console.log('  ⚠️  VAZIO OU NULL!');
      } else {
        console.log(`  ✓ ${Object.keys(draft.wizard_data).length} propriedades encontradas:`);
        
        // Mostrar estrutura
        Object.entries(draft.wizard_data).forEach(([key, value]) => {
          let valueStr;
          if (value === null) {
            valueStr = '[NULL]';
          } else if (Array.isArray(value)) {
            valueStr = `[ARRAY com ${value.length} items]`;
          } else if (typeof value === 'object') {
            const keys = Object.keys(value);
            valueStr = `[OBJECT com ${keys.length} keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}]`;
          } else {
            valueStr = String(value).substring(0, 60);
          }
          console.log(`    - ${key}: ${valueStr}`);
        });
      }

      console.log('\n');
    });

    // Análise global
    console.log('\n' + '='.repeat(80));
    console.log('📋 ESTATÍSTICAS GLOBAIS');
    console.log('='.repeat(80));

    const { data: allProps, error: allError } = await supabase
      .from('properties')
      .select('id, status, wizard_data, completion_percentage')
      .limit(100);

    if (allError) {
      console.error('❌ Erro:', allError.message);
      return;
    }

    let stats = {
      total: allProps.length,
      por_status: {},
      com_wizard_data: 0,
      sem_wizard_data: 0,
      wizard_data_vazio: 0,
      completion_distribution: { '0%': 0, '1-50%': 0, '51-99%': 0, '100%': 0 }
    };

    allProps.forEach(prop => {
      if (!stats.por_status[prop.status]) {
        stats.por_status[prop.status] = 0;
      }
      stats.por_status[prop.status]++;

      if (prop.wizard_data && Object.keys(prop.wizard_data).length > 0) {
        stats.com_wizard_data++;
      } else {
        stats.sem_wizard_data++;
        if (!prop.wizard_data || Object.keys(prop.wizard_data).length === 0) {
          stats.wizard_data_vazio++;
        }
      }

      const comp = prop.completion_percentage || 0;
      if (comp === 0) stats.completion_distribution['0%']++;
      else if (comp < 50) stats.completion_distribution['1-50%']++;
      else if (comp < 100) stats.completion_distribution['51-99%']++;
      else stats.completion_distribution['100%']++;
    });

    console.log(`\nTotal de propriedades: ${stats.total}`);
    console.log(`Com wizard_data: ${stats.com_wizard_data}`);
    console.log(`SEM wizard_data: ${stats.sem_wizard_data}`);
    console.log(`wizard_data vazio: ${stats.wizard_data_vazio}`);
    
    console.log('\nPor status:');
    Object.entries(stats.por_status).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    console.log('\nDistribuição de completion:');
    Object.entries(stats.completion_distribution).forEach(([range, count]) => {
      console.log(`  - ${range}: ${count}`);
    });

  } catch (err) {
    console.error('❌ Erro fatal:', err.message);
  }
}

main();
