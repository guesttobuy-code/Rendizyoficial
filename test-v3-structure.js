#!/usr/bin/env node
/**
 * TESTER RÁPIDO - Verificação da Estrutura V3
 * Execute este arquivo para validar a implementação
 */

const fs = require('fs');
const path = require('path');

const BASEPATH = './RENDIZY PASTA OFICIAL/RendizyPrincipal';

// ✅ Lista de arquivos esperados
const EXPECTED_FILES = [
  // Components
  'components/properties/PropertyStep1OTA.tsx',
  'components/properties/steps/content/PropertyStep2Location.tsx',
  'components/properties/steps/content/PropertyStep3Rooms.tsx',
  'components/properties/steps/content/PropertyStep4Tour.tsx',
  'components/properties/steps/content/PropertyStep5LocalAmenities.tsx',
  'components/properties/steps/content/PropertyStep6AccommodationAmenities.tsx',
  'components/properties/steps/content/PropertyStep7Description.tsx',
  'components/properties/steps/financial/PropertyStep8Contract.tsx',
  'components/properties/steps/settings/PropertyStep13Rules.tsx',
  // Utils
  'utils/propertySteps.ts',
  // Pages
  'pages/PropertyEditorPage.tsx',
];

// 🎯 Verificações a fazer
const CHECKS = [
  {
    name: 'Arquivo PropertyEditorPage.tsx existe',
    check: () => {
      const file = path.join(BASEPATH, 'pages/PropertyEditorPage.tsx');
      return fs.existsSync(file);
    }
  },
  {
    name: 'PropertyEditorPage importa PropertyStepId',
    check: () => {
      const file = path.join(BASEPATH, 'pages/PropertyEditorPage.tsx');
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('PropertyStepId') && content.includes('getStepsByBlock');
    }
  },
  {
    name: 'propertySteps.ts tem enum com 17 values',
    check: () => {
      const file = path.join(BASEPATH, 'utils/propertySteps.ts');
      const content = fs.readFileSync(file, 'utf-8');
      return (content.match(/=\s*\d+/g) || []).length >= 17;
    }
  },
  {
    name: 'Step 2 Location importa corretamente',
    check: () => {
      const file = path.join(BASEPATH, 'components/properties/steps/content/PropertyStep2Location.tsx');
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('useState') && content.includes('export function PropertyStep2Location');
    }
  },
  {
    name: 'Step 7 Description tem tabs de idiomas',
    check: () => {
      const file = path.join(BASEPATH, 'components/properties/steps/content/PropertyStep7Description.tsx');
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes("'pt'") && content.includes("'en'") && content.includes("'es'");
    }
  },
  {
    name: 'Step 6 Amenities tem 5+ categorias',
    check: () => {
      const file = path.join(BASEPATH, 'components/properties/steps/content/PropertyStep6AccommodationAmenities.tsx');
      const content = fs.readFileSync(file, 'utf-8');
      return (content.match(/'[A-Z][a-z]+'/g) || []).length >= 5;
    }
  },
  {
    name: 'PropertyEditorPage tem 3 tabs (content, financial, settings)',
    check: () => {
      const file = path.join(BASEPATH, 'pages/PropertyEditorPage.tsx');
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('content') && content.includes('financial') && content.includes('settings');
    }
  },
  {
    name: 'PropertyEditorPage renderiza sidebar com steps agrupados',
    check: () => {
      const file = path.join(BASEPATH, 'pages/PropertyEditorPage.tsx');
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('getStepsByBlock') && content.includes('Check');
    }
  },
  {
    name: 'Steps 3-7 implementados com componentes reais',
    check: () => {
      const steps = [3, 4, 5, 6, 7];
      return steps.every(step => {
        const filePath = step === 3 ? 'PropertyStep3Rooms.tsx'
          : step === 4 ? 'PropertyStep4Tour.tsx'
          : step === 5 ? 'PropertyStep5LocalAmenities.tsx'
          : step === 6 ? 'PropertyStep6AccommodationAmenities.tsx'
          : 'PropertyStep7Description.tsx';
        const file = path.join(BASEPATH, 'components/properties/steps/content', filePath);
        return fs.existsSync(file) && fs.statSync(file).size > 500;
      });
    }
  },
  {
    name: 'Steps 8 e 13 implementados (financeiro e settings)',
    check: () => {
      const file8 = path.join(BASEPATH, 'components/properties/steps/financial/PropertyStep8Contract.tsx');
      const file13 = path.join(BASEPATH, 'components/properties/steps/settings/PropertyStep13Rules.tsx');
      return fs.existsSync(file8) && fs.existsSync(file13);
    }
  },
];

// 🚀 Executar verificações
console.log('🧪 TESTE DA ESTRUTURA V3 - 17 STEPS\n');
console.log('═'.repeat(50) + '\n');

let passed = 0;
let failed = 0;

CHECKS.forEach((checkObj, index) => {
  try {
    const result = checkObj.check();
    if (result) {
      console.log(`✅ [${index + 1}/${CHECKS.length}] ${checkObj.name}`);
      passed++;
    } else {
      console.log(`❌ [${index + 1}/${CHECKS.length}] ${checkObj.name}`);
      failed++;
    }
  } catch (error) {
    console.log(`⚠️  [${index + 1}/${CHECKS.length}] ${checkObj.name}`);
    console.log(`   Erro: ${error.message.substring(0, 50)}...`);
    failed++;
  }
});

console.log('\n' + '═'.repeat(50));
console.log(`\n📊 RESULTADOS:`);
console.log(`   ✅ Passou: ${passed}/${CHECKS.length}`);
console.log(`   ❌ Falhou: ${failed}/${CHECKS.length}`);

if (failed === 0) {
  console.log('\n🎉 TODAS AS VERIFICAÇÕES PASSARAM!');
  console.log('\n📋 Próximas tarefas:');
  console.log('   1. Testar navegação entre os 17 steps');
  console.log('   2. Verificar salvar/avançar de cada step');
  console.log('   3. Implementar Steps 9-12 (Financeiro)');
  console.log('   4. Implementar Steps 14-17 (Configurações)');
  process.exit(0);
} else {
  console.log('\n⚠️  Algumas verificações falharam. Revise a implementação.');
  process.exit(1);
}
