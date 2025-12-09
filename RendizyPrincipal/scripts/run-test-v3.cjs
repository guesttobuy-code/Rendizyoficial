/**
 * Runner para teste Properties V3
 * Executa o teste TypeScript usando tsx
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando teste Properties V3...\n');

try {
  const scriptPath = path.join(__dirname, 'test-properties-v3.ts');
  
  // Executar com tsx (TypeScript runner)
  execSync(`npx tsx ${scriptPath}`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env }
  });
  
} catch (error) {
  console.error('❌ Erro ao executar teste:', error.message);
  process.exit(1);
}
