#!/usr/bin/env node
/**
 * 🔍 TESTE COMPLETO - SIMULAR O QUE FRONTEND FAZ
 * Vai criar um rascunho como frontend faz, depois atualizar com PUT
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://odcgnzfremrqnvtitpcc.supabase.co';
const API_BASE = 'https://odcgnzfremrqnvtitpcc.functions.supabase.co/rendizy-server';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY2duemZyZW1ycW52dGl0cGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTQxNzEsImV4cCI6MjA3NzkzMDE3MX0.aljqrK3mKwQ6T6EB_fDPfkbP7QC_hhiZwxUZbtnqVqQ';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_Se1z5M4EM0lzUn4uXuherQ_6LX7BQ8d';

// Token de usuário (simulado - como frontend enviaria)
const USER_TOKEN = 'admin-superadmin-token-test'; // Será validado pelo backend

async function testCompleteFlow() {
  console.log('\n🔍 TESTE COMPLETO - SIMULAR FLUXO DO FRONTEND\n');
  console.log('Step 1: Criar rascunho (POST /properties)');
  console.log('Step 2: Atualizar com PUT /properties/:id');
  console.log('Step 3: Verificar banco com SERVICE_ROLE_KEY\n');

  try {
    // ===== STEP 1: CREATE (/properties POST) =====
    console.log('📡 STEP 1: POST /properties - Criando rascunho...\n');

    const createPayload = {
      status: 'draft',
      wizardData: {
        name: 'Casa de Teste - Simulação Frontend',
        type: 'residencia',
        status: 'draft',
        contentType: {
          type: 'residencia',
          internalName: 'Casa Simulada'
        }
      },
      completionPercentage: 0,
      completedSteps: []
    };

    console.log('Payload enviado (como frontend faria):');
    console.log(JSON.stringify(createPayload, null, 2));

    const createResponse = await fetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
        'X-Auth-Token': USER_TOKEN  // ← Frontend envia isto
      },
      body: JSON.stringify(createPayload)
    });

    const createData = await createResponse.json();
    console.log('\n✅ Resposta CREATE:');
    console.log(`Status: ${createResponse.status}`);
    console.log('Data:', JSON.stringify(createData, null, 2));

    if (!createData.success || !createData.data?.id) {
      console.error('❌ CREATE falhou!');
      return;
    }

    const draftId = createData.data.id;
    console.log(`\n✅ Rascunho criado com ID: ${draftId}\n`);

    // Pequeno delay
    await new Promise(r => setTimeout(r, 1000));

    // ===== STEP 2: UPDATE (PUT /properties/:id) =====
    console.log('📡 STEP 2: PUT /properties/:id - Atualizando rascunho...\n');

    // Agora simular o PUT com dados "completos" (como normalizeWizardDataForDraft faria)
    const updatePayload = {
      wizardData: {
        name: 'Casa de Teste - Simulação Frontend',
        type: 'residencia',
        status: 'draft',
        contentType: {
          type: 'residencia',
          internalName: 'Casa Simulada UPDATED',
          propertyTypeId: 'residencia-id-123',
          modalidades: ['aluguel_curta_duracao']
        },
        contentLocation: {
          street: 'Rua Teste 123',
          number: '456',
          complement: 'Apt 789',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100'
        },
        bedrooms: 3,
        bathrooms: 2,
        maxGuests: 6
      },
      completionPercentage: 35,  // Usuário completou alguns passos
      completedSteps: ['content-type', 'content-location', 'content-rooms']
    };

    console.log('Payload enviado (como normalizeWizardDataForDraft faria):');
    console.log(JSON.stringify(updatePayload, null, 2));

    const updateResponse = await fetch(`${API_BASE}/properties/${draftId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
        'X-Auth-Token': USER_TOKEN  // ← Frontend envia isto
      },
      body: JSON.stringify(updatePayload)
    });

    const updateData = await updateResponse.json();
    console.log('\n✅ Resposta UPDATE:');
    console.log(`Status: ${updateResponse.status}`);
    console.log('Data:', JSON.stringify(updateData, null, 2));

    if (!updateData.success) {
      console.error('❌ UPDATE falhou!');
      console.error('Erro:', updateData.error);
      return;
    }

    console.log(`\n✅ Rascunho atualizado!\n`);

    // ===== STEP 3: VERIFICAR NO BANCO =====
    console.log('📡 STEP 3: Verificar dados no banco com SERVICE_ROLE_KEY...\n');

    await new Promise(r => setTimeout(r, 500));

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: verified, error: verifyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', draftId)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao buscar do banco:', verifyError);
      return;
    }

    console.log('✅ Dados no banco após PUT:');
    console.log(`- ID: ${verified.id}`);
    console.log(`- name: ${verified.name}`);
    console.log(`- completion_percentage: ${verified.completion_percentage}%`);
    console.log(`- completed_steps: ${verified.completed_steps?.length || 0} steps`);
    console.log(`- wizard_data keys: ${Object.keys(verified.wizard_data || {}).length}`);
    console.log(`\nwizard_data content:`);
    console.log(JSON.stringify(verified.wizard_data, null, 2));

    // Análise final
    console.log('\n' + '='.repeat(80));
    console.log('📊 ANÁLISE FINAL');
    console.log('='.repeat(80));

    const success = 
      verified.completion_percentage === 35 &&
      verified.completed_steps?.length === 3 &&
      Object.keys(verified.wizard_data || {}).length > 5;

    if (success) {
      console.log('✅ TUDO FUNCIONOU! Dados foram persistidos corretamente.');
      console.log('\nIsso significa:');
      console.log('- POST cria rascunho ✅');
      console.log('- PUT atualiza dados ✅');
      console.log('- RLS permite UPDATE ✅');
      console.log('- Banco persiste tudo ✅');
      console.log('\n⚠️  Se isto funciona aqui, o problema está 100% no FRONTEND!');
      console.log('    Especificamente na função saveDraftToBackend() enviando dados VAZIOS.');
    } else {
      console.log('❌ FALHOU! Dados não foram persistidos como esperado.');
      console.log('Possíveis causas:');
      console.log('- PUT respondeu OK mas não salvou realmente');
      console.log('- RLS está bloqueando');
      console.log('- Trigger ou constraint está rejeitando');
    }

  } catch (err) {
    console.error('❌ Erro fatal:', err.message);
  }
}

testCompleteFlow();
