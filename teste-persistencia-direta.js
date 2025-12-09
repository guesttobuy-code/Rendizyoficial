/**
 * 🔍 ANÁLISE: Verificar se o problema está no:
 * 1. Frontend não enviando PUT request
 * 2. Backend recebendo mas não salvando
 * 3. Mapeamento SQL incorreto
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://odcgnzfremrqnvtitpcc.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                         'sb_secret_Se1z5M4EM0lzUn4uXuherQ_6LX7BQ8d';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('\n🔍 VERIFICAR ERRO DE PERSISTÊNCIA\n');

  try {
    // Pegar um rascunho específico
    const { data: draft, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'draft')
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Erro:', error.message);
      return;
    }

    const draftId = draft.id;
    console.log(`📋 Rascunho analisado: ${draftId}`);
    console.log(`   Name: ${draft.name}`);
    console.log(`   wizard_data keys: ${Object.keys(draft.wizard_data || {}).length}`);
    console.log(`   completed_steps: ${draft.completed_steps?.length || 0}`);
    console.log(`   completion_percentage: ${draft.completion_percentage || 0}%\n`);

    // TESTE 1: Simular um PUT com dados "completos"
    console.log('📡 TESTE 1: Tentando fazer PUT com dados adicionais...\n');

    const testData = {
      name: draft.name + ' [TESTE]',
      wizardData: {
        name: draft.wizard_data?.name || 'Novo Anúncio',
        type: draft.wizard_data?.type || 'residencia',
        status: 'draft',
        contentType: {
          type: 'residencia',
          internalName: 'Casa de Veraneio'
        },
        contentLocation: {
          street: 'Rua Teste',
          number: '123',
          city: 'São Paulo',
          state: 'SP'
        },
        bedrooms: 3,
        bathrooms: 2,
        description: 'Esta é uma descrição de teste para verificar persistência'
      },
      completionPercentage: 50,
      completedSteps: ['step-1', 'step-2', 'step-3']
    };

    const { data: updated, error: updateError } = await supabase
      .from('properties')
      .update({
        wizard_data: testData.wizardData,
        completion_percentage: testData.completionPercentage,
        completed_steps: testData.completedSteps,
        name: testData.name
      })
      .eq('id', draftId)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Erro no PUT:', updateError.message);
      console.log('   Detalhes:', updateError);
      return;
    }

    console.log('✅ PUT SUCESSO! Verificando dados retornados:\n');

    console.log('📊 Dados após UPDATE:');
    console.log(`  - name: ${updated.name}`);
    console.log(`  - wizard_data keys: ${Object.keys(updated.wizard_data || {}).length}`);
    console.log(`    Conteúdo: ${JSON.stringify(updated.wizard_data).substring(0, 200)}...`);
    console.log(`  - completion_percentage: ${updated.completion_percentage}%`);
    console.log(`  - completed_steps: ${updated.completed_steps?.join(', ')}`);

    // VERIFICAÇÃO: Buscar novamente para confirmar persistência
    console.log('\n🔄 VERIFICAÇÃO: Buscando novamente do banco...\n');

    const { data: verified, error: verifyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', draftId)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar:', verifyError.message);
      return;
    }

    console.log('✅ Dados VERIFICADOS (refetch do banco):');
    console.log(`  - name: ${verified.name}`);
    console.log(`  - wizard_data keys: ${Object.keys(verified.wizard_data || {}).length}`);
    console.log(`  - completion_percentage: ${verified.completion_percentage}%`);
    console.log(`  - completed_steps: ${verified.completed_steps?.length} steps`);

    // Verificar se os dados foram realmente persistidos
    const testPassed = 
      verified.completion_percentage === 50 &&
      verified.completed_steps?.length === 3 &&
      Object.keys(verified.wizard_data || {}).length >= 5;

    console.log(`\n🎯 RESULTADO: ${testPassed ? '✅ PERSISTÊNCIA FUNCIONA!' : '❌ PERSISTÊNCIA FALHOU!'}`);

  } catch (err) {
    console.error('❌ Erro fatal:', err.message);
  }
}

main();
