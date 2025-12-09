// Script para obter Public Anon Key - Cole no console do navegador (F12)

// Tentar obter do import.meta.env (Vite)
let anonKey = null;

// Método 1: Tentar acessar import.meta.env (pode não funcionar no console)
try {
  if (typeof import !== 'undefined' && import.meta && import.meta.env) {
    anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
} catch (e) {
  // Ignorar erro
}

// Método 2: Tentar ler do localStorage (se estiver salvo)
if (!anonKey) {
  anonKey = localStorage.getItem('supabase_anon_key') || 
            localStorage.getItem('anon_key');
}

// Método 3: Tentar ler do window (se estiver exposto)
if (!anonKey && typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY__) {
  anonKey = window.__SUPABASE_ANON_KEY__;
}

if (anonKey) {
  console.log('✅ Public Anon Key encontrada!');
  console.log('📋 Key:', anonKey);
  console.log('');
  console.log('💡 Para testar, execute no terminal:');
  console.log(`node test_step01_persistence.mjs "<user_token>" "${anonKey}"`);
} else {
  console.error('❌ Public Anon Key não encontrada!');
  console.log('');
  console.log('📝 Tente uma dessas opções:');
  console.log('1. Verifique o arquivo .env.local na raiz do projeto');
  console.log('2. Procure por: VITE_SUPABASE_ANON_KEY');
  console.log('3. Ou pegue do Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc/settings/api');
}

