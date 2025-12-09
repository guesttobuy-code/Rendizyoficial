/**
 * Script para executar no Console do Navegador (F12)
 * 
 * Copie e cole este código no console do navegador quando estiver logado no app
 */

// Obter token do usuário
const token = localStorage.getItem('rendizy-token') || 
              localStorage.getItem('auth_token') || 
              localStorage.getItem('token') || 
              localStorage.getItem('user_token');

if (token) {
  console.log('✅ Token encontrado!');
  console.log('📋 Copie o token abaixo e use no teste:');
  console.log('');
  console.log('Token:', token);
  console.log('');
  console.log('💡 Para testar, execute no terminal:');
  console.log(`node test_step01_persistence.mjs "${token}"`);
  console.log('');
  console.log('📝 Ou copie manualmente o token acima.');
} else {
  console.error('❌ Token não encontrado!');
  console.log('Verifique se você está logado no app.');
  console.log('Tentando encontrar token em:');
  console.log('  - rendizy-token');
  console.log('  - auth_token');
  console.log('  - token');
  console.log('  - user_token');
}

