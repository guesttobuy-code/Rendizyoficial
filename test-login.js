// Script para fazer login automático no navegador
// Execute este código no console do navegador (F12)

(async function() {
  console.log('🔐 Iniciando login automático...');
  
  // Aguardar a página carregar
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Preencher campos
  const usernameInput = document.querySelector('input[type="text"], input[name="username"], input[placeholder*="usuário" i], input[placeholder*="username" i]');
  const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
  
  if (!usernameInput || !passwordInput) {
    console.error('❌ Campos de login não encontrados');
    console.log('Campos disponíveis:', document.querySelectorAll('input'));
    return;
  }
  
  // Preencher valores
  usernameInput.value = 'admin';
  passwordInput.value = 'root';
  
  // Disparar eventos de input para React detectar
  usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
  passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
  usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
  passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  console.log('✅ Campos preenchidos');
  
  // Tentar encontrar e clicar no botão de quick login primeiro
  const quickLoginButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('admin / root') || btn.textContent.includes('admin')
  );
  
  if (quickLoginButton) {
    console.log('✅ Botão de quick login encontrado, clicando...');
    quickLoginButton.click();
  } else {
    // Se não encontrar, procurar botão de submit
    const submitButton = document.querySelector('button[type="submit"], button:contains("Entrar"), button:contains("Login")');
    if (submitButton) {
      console.log('✅ Botão de submit encontrado, clicando...');
      submitButton.click();
    } else {
      console.error('❌ Botão de login não encontrado');
      console.log('Botões disponíveis:', Array.from(document.querySelectorAll('button')).map(b => b.textContent));
    }
  }
  
  console.log('✅ Login iniciado!');
})();

