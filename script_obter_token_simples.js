// Script simples para obter token - Cole no console do navegador (F12)

const token = localStorage.getItem('rendizy-token') || 
              localStorage.getItem('auth_token') || 
              localStorage.getItem('token') || 
              localStorage.getItem('user_token');

if (token) {
  console.log('✅ Token encontrado!');
  console.log('📋 Token:', token);
  console.log('');
  console.log('💡 Para testar, execute no terminal:');
  console.log(`node test_step01_persistence.mjs "${token}"`);
} else {
  console.error('❌ Token não encontrado! Verifique se está logado.');
}

