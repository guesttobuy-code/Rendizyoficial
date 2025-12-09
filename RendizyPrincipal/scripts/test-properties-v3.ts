/**
 * TESTE AUTOMATIZADO - Properties V3
 * Cria primeira propriedade, preenche step 1, salva e valida persistência
 */

import { SupabasePropertyRepository } from '../infrastructure/repositories/PropertyRepository';
import { CreatePropertyUseCase, SavePropertyStepUseCase } from '../application/properties/useCases';
import { PropertyStep } from '../domain/properties/types';
import { getSupabaseClient } from '../utils/supabase/client';

async function testPropertiesV3() {
  console.log('🧪 INICIANDO TESTE PROPERTIES V3...\n');

  try {
    // 1. Setup
    const supabase = getSupabaseClient();
    const repository = new SupabasePropertyRepository(supabase);
    const createUseCase = new CreatePropertyUseCase(repository);
    const saveStepUseCase = new SavePropertyStepUseCase(repository);

    // 2. Criar nova propriedade
    console.log('📝 Passo 1: Criando nova propriedade...');
    const tenantId = 'test-tenant-001'; // ID de teste
    const property = await createUseCase.execute(tenantId);
    console.log(`✅ Propriedade criada com ID: ${property.id}\n`);

    // 3. Preencher dados do Step 1 (Basic Info)
    console.log('📝 Passo 2: Preenchendo Step 1 (Informações Básicas)...');
    const step1Data = {
      basicInfo: {
        title: 'TESTE V3',
        description: 'Propriedade de teste criada automaticamente para validar persistência de dados no Properties V3',
        type: 'residential' as const
      }
    };

    // 4. Salvar Step 1
    console.log('💾 Passo 3: Salvando Step 1...');
    const saveResult = await saveStepUseCase.execute(property.id, PropertyStep.BASIC_INFO, step1Data);

    if (!saveResult.success) {
      console.error('❌ Erro ao salvar:', saveResult.errors);
      return;
    }

    console.log('✅ Step 1 salvo com sucesso!');
    console.log(`   - Título: ${saveResult.property?.basicInfo.title}`);
    console.log(`   - Descrição: ${saveResult.property?.basicInfo.description.substring(0, 50)}...`);
    console.log(`   - Tipo: ${saveResult.property?.basicInfo.type}`);
    console.log(`   - Versão: ${saveResult.property?.version}`);
    console.log(`   - Steps completados: ${saveResult.property?.completedSteps.size}`);
    console.log();

    // 5. Simular refresh (recarregar do banco)
    console.log('🔄 Passo 4: Simulando F5 (recarregando do banco)...');
    const reloadedProperty = await repository.get(property.id);

    if (!reloadedProperty) {
      console.error('❌ FALHA: Propriedade não encontrada após reload!');
      return;
    }

    console.log('✅ Propriedade recarregada com sucesso!');
    console.log(`   - ID: ${reloadedProperty.id}`);
    console.log(`   - Título: ${reloadedProperty.basicInfo.title}`);
    console.log(`   - Descrição: ${reloadedProperty.basicInfo.description.substring(0, 50)}...`);
    console.log(`   - Tipo: ${reloadedProperty.basicInfo.type}`);
    console.log(`   - Versão: ${reloadedProperty.version}`);
    console.log(`   - Steps completados: ${reloadedProperty.completedSteps.size}`);
    console.log();

    // 6. Validar persistência
    console.log('🔍 Passo 5: Validando persistência de dados...');
    const isValid =
      reloadedProperty.basicInfo.title === 'TESTE V3' &&
      reloadedProperty.basicInfo.description.includes('teste criada automaticamente') &&
      reloadedProperty.basicInfo.type === 'residential' &&
      reloadedProperty.completedSteps.has(PropertyStep.BASIC_INFO);

    if (isValid) {
      console.log('✅✅✅ SUCESSO TOTAL! ✅✅✅');
      console.log('\n📊 RESUMO DO TESTE:');
      console.log('   ✓ Propriedade criada');
      console.log('   ✓ Step 1 preenchido e salvo');
      console.log('   ✓ Dados persistiram no banco');
      console.log('   ✓ Reload (F5) funciona perfeitamente');
      console.log('   ✓ Validação completa passou');
      console.log('\n🎉 Properties V3 está 100% funcional!\n');
    } else {
      console.error('❌ FALHA: Dados não persistiram corretamente');
      console.log('Esperado:', step1Data.basicInfo);
      console.log('Recebido:', reloadedProperty.basicInfo);
    }

    // 7. Informações adicionais
    console.log('📋 INFORMAÇÕES DA PROPRIEDADE:');
    console.log(`   - URL para editar: http://localhost:5173/properties/${property.id}/edit`);
    console.log(`   - Tenant ID: ${reloadedProperty.tenantId}`);
    console.log(`   - Criado em: ${new Date(reloadedProperty.createdAt).toLocaleString('pt-BR')}`);
    console.log(`   - Atualizado em: ${new Date(reloadedProperty.updatedAt).toLocaleString('pt-BR')}`);
    console.log();

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    if (error instanceof Error) {
      console.error('   Mensagem:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

// Executar teste
testPropertiesV3();
