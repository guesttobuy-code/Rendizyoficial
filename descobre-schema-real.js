#!/usr/bin/env node
/**
 * 🔍 DESCOBRIR SCHEMA REAL DA TABELA PROPERTIES
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://odcgnzfremrqnvtitpcc.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                         'sb_secret_Se1z5M4EM0lzUn4uXuherQ_6LX7BQ8d';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('\n🔍 DESCOBRIR SCHEMA REAL\n');

  try {
    // Buscar UM registro de properties para ver quais colunas existem
    const { data: sample, error: sampleError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Erro ao buscar sample:', sampleError.message);
      return;
    }

    if (!sample || sample.length === 0) {
      console.log('⚠️  Tabela properties está vazia!');
      return;
    }

    const record = sample[0];
    console.log('📋 COLUNAS EXISTENTES NA TABELA properties:\n');
    
    Object.entries(record).forEach(([col, value]) => {
      let type = typeof value;
      if (Array.isArray(value)) type = `array[${value.length}]`;
      else if (value === null) type = 'null';
      else if (type === 'object') type = 'object';
      
      console.log(`  ✓ ${col.padEnd(30)} (${type})`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('📊 ANÁLISE DE PRIMEIRO REGISTRO:\n');
    
    // Mostrar conteúdo resumido de campos importantes
    const fieldsToShow = ['id', 'name', 'status', 'created_at', 'updated_at', 'code', 'type'];
    fieldsToShow.forEach(field => {
      if (field in record) {
        const value = record[field];
        console.log(`${field}: ${JSON.stringify(value).substring(0, 100)}`);
      }
    });

  } catch (err) {
    console.error('❌ Erro fatal:', err.message);
  }
}

main();
