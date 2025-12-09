/**
 * TESTE: Persistência Step 01 - Teste 06 Rafa
 * 
 * ID do imóvel: 8efe9eeb-22e7-467b-8350-7586e8e54f58
 * 
 * Testa:
 * 1. Buscar imóvel atual
 * 2. Atualizar Step 01 com dados aleatórios (mantendo nome interno)
 * 3. Verificar se salvou
 * 4. Buscar novamente e verificar persistência
 * 5. Verificar se step está marcado como completo
 */

const PROPERTY_ID = "8efe9eeb-22e7-467b-8350-7586e8e54f58";
const API_BASE_URL = "https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server";

// Public Anon Key - Pode ser obtida do console do navegador também
// Execute no console: import.meta.env.VITE_SUPABASE_ANON_KEY
// Ou pegue do arquivo .env.local
const PUBLIC_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 
                         process.env.SUPABASE_ANON_KEY || 
                         process.argv[3] || 
                         "";

if (!PUBLIC_ANON_KEY) {
  console.error("❌ ERRO: Public Anon Key não fornecida!");
  console.error("   Use: node test_step01_persistence.mjs <user_token> <anon_key>");
  console.error("   Ou defina: VITE_SUPABASE_ANON_KEY=<anon_key> node test_step01_persistence.mjs <user_token>");
  console.error("\n   Para obter a chave:");
  console.error("   1. Abra o console do navegador (F12)");
  console.error("   2. Execute: import.meta.env.VITE_SUPABASE_ANON_KEY");
  console.error("   3. Ou pegue do arquivo .env.local");
  process.exit(1);
}

// Token do usuário (pegar do localStorage do navegador ou passar como argumento)
// Para testar, abra o console do navegador e execute:
// localStorage.getItem('auth_token') || localStorage.getItem('token')
const USER_TOKEN = process.env.USER_TOKEN || process.argv[2] || "";

if (!USER_TOKEN) {
  console.error("❌ ERRO: Token do usuário não fornecido!");
  console.error("   Use: node test_step01_persistence.mjs <seu_token>");
  console.error("   Ou defina: USER_TOKEN=<seu_token> node test_step01_persistence.mjs");
  console.error("\n   Para obter o token:");
  console.error("   1. Abra o navegador no app");
  console.error("   2. Abra o console (F12)");
  console.error("   3. Execute: localStorage.getItem('auth_token') || localStorage.getItem('token')");
  process.exit(1);
}

// Dados aleatórios para Step 01
const randomStep01Data = {
  internalName: "Teste 06 Rafa - Step 01 Individualizado", // Nome interno mantido
  propertyTypeId: "loc_apartamento", // Aleatório
  accommodationTypeId: "acc_apartamento", // Aleatório
  subtipo: "entire_place", // Aleatório
  modalidades: ["short_term_rental", "buy_sell"], // Aleatório
  registrationNumber: `TEST-${Date.now()}`, // Aleatório
  propertyType: "individual", // Aleatório
  financialData: {
    monthlyRent: 3500, // Aleatório
    salePrice: 450000, // Aleatório
  },
};

async function testStep01Persistence() {
  console.log("🧪 TESTE: Persistência Step 01 - Teste 06 Rafa\n");
  console.log("=" .repeat(60));
  
  try {
    // 1. Buscar imóvel atual
    console.log("\n📥 PASSO 1: Buscando imóvel atual...");
    const getResponse = await fetch(`${API_BASE_URL}/properties/${PROPERTY_ID}`, {
      headers: {
        Authorization: `Bearer ${PUBLIC_ANON_KEY}`,
        apikey: PUBLIC_ANON_KEY, // ✅ Obrigatório para Supabase Edge Functions
        "X-Auth-Token": USER_TOKEN, // Token do usuário
        "Content-Type": "application/json",
      },
    });
    
    if (!getResponse.ok) {
      throw new Error(`Erro ao buscar imóvel: ${getResponse.status} ${getResponse.statusText}`);
    }
    
    const getData = await getResponse.json();
    if (!getData.success) {
      throw new Error(`Erro na resposta: ${getData.error}`);
    }
    
    const property = getData.data;
    console.log("✅ Imóvel encontrado:", property.id);
    console.log("📊 Nome atual:", property.name || property.internalName || "N/A");
    console.log("📊 wizardData atual:", JSON.stringify(property.wizardData || {}, null, 2));
    console.log("📊 completed_steps atual:", property.completedSteps || []);
    
    // 2. Atualizar APENAS Step 01
    console.log("\n💾 PASSO 2: Atualizando Step 01 com dados aleatórios...");
    console.log("📤 Dados a enviar:", JSON.stringify(randomStep01Data, null, 2));
    
    const updateData = {
      wizardData: {
        contentType: randomStep01Data, // Apenas Step 01
      },
    };
    
    const updateResponse = await fetch(`${API_BASE_URL}/properties/${PROPERTY_ID}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${PUBLIC_ANON_KEY}`,
        apikey: PUBLIC_ANON_KEY, // ✅ Obrigatório para Supabase Edge Functions
        "X-Auth-Token": USER_TOKEN, // Token do usuário
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Erro ao atualizar: ${updateResponse.status} ${updateResponse.statusText}\n${errorText}`);
    }
    
    const updateResult = await updateResponse.json();
    if (!updateResult.success) {
      throw new Error(`Erro na resposta: ${updateResult.error}`);
    }
    
    console.log("✅ Step 01 atualizado com sucesso!");
    console.log("📊 Resposta:", JSON.stringify(updateResult.data, null, 2));
    
    // 3. Aguardar 1 segundo (simular refresh)
    console.log("\n⏳ PASSO 3: Aguardando 1 segundo (simulando refresh)...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Buscar novamente e verificar persistência
    console.log("\n📥 PASSO 4: Buscando imóvel novamente (após 'refresh')...");
    const getResponse2 = await fetch(`${API_BASE_URL}/properties/${PROPERTY_ID}`, {
      headers: {
        Authorization: `Bearer ${PUBLIC_ANON_KEY}`,
        apikey: PUBLIC_ANON_KEY, // ✅ Obrigatório para Supabase Edge Functions
        "X-Auth-Token": USER_TOKEN, // Token do usuário
        "Content-Type": "application/json",
      },
    });
    
    if (!getResponse2.ok) {
      throw new Error(`Erro ao buscar imóvel: ${getResponse2.status} ${getResponse2.statusText}`);
    }
    
    const getData2 = await getResponse2.json();
    if (!getData2.success) {
      throw new Error(`Erro na resposta: ${getData2.error}`);
    }
    
    const propertyAfterRefresh = getData2.data;
    console.log("✅ Imóvel encontrado após refresh");
    
    // Parse wizardData se for string
    let wizardData = propertyAfterRefresh.wizardData;
    if (typeof wizardData === 'string') {
      try {
        wizardData = JSON.parse(wizardData);
      } catch (e) {
        console.warn("⚠️ Erro ao parsear wizardData:", e);
      }
    }
    
    const step01Data = wizardData?.contentType || {};
    
    // 5. Verificar persistência
    console.log("\n🔍 PASSO 5: Verificando persistência dos dados...");
    console.log("=" .repeat(60));
    
    const checks = {
      internalName: step01Data.internalName === randomStep01Data.internalName,
      propertyTypeId: step01Data.propertyTypeId === randomStep01Data.propertyTypeId,
      accommodationTypeId: step01Data.accommodationTypeId === randomStep01Data.accommodationTypeId,
      subtipo: step01Data.subtipo === randomStep01Data.subtipo,
      modalidades: JSON.stringify(step01Data.modalidades || []) === JSON.stringify(randomStep01Data.modalidades),
      registrationNumber: step01Data.registrationNumber === randomStep01Data.registrationNumber,
      propertyType: step01Data.propertyType === randomStep01Data.propertyType,
      financialData: JSON.stringify(step01Data.financialData || {}) === JSON.stringify(randomStep01Data.financialData),
    };
    
    console.log("\n📊 DADOS SALVOS:");
    console.log(JSON.stringify(step01Data, null, 2));
    
    console.log("\n✅ VERIFICAÇÕES:");
    Object.entries(checks).forEach(([field, passed]) => {
      const status = passed ? "✅" : "❌";
      const expected = randomStep01Data[field] || randomStep01Data.financialData?.[field];
      const actual = step01Data[field] || step01Data.financialData?.[field];
      console.log(`${status} ${field}:`);
      console.log(`   Esperado: ${JSON.stringify(expected)}`);
      console.log(`   Atual:    ${JSON.stringify(actual)}`);
    });
    
    const allPassed = Object.values(checks).every(v => v === true);
    
    // 6. Verificar se step está marcado como completo
    console.log("\n🔍 PASSO 6: Verificando se step está marcado como completo...");
    const completedSteps = propertyAfterRefresh.completedSteps || [];
    const isStep01Completed = completedSteps.includes("content-type");
    
    console.log(`📊 completed_steps: ${JSON.stringify(completedSteps)}`);
    console.log(`✅ Step 01 completo? ${isStep01Completed ? "✅ SIM" : "❌ NÃO"}`);
    
    // Resultado final
    console.log("\n" + "=".repeat(60));
    if (allPassed && isStep01Completed) {
      console.log("🎉 TESTE PASSOU! Todos os dados persistiram e step está completo.");
      process.exit(0);
    } else {
      console.log("❌ TESTE FALHOU!");
      if (!allPassed) {
        console.log("   - Alguns dados não persistiram corretamente");
      }
      if (!isStep01Completed) {
        console.log("   - Step 01 não está marcado como completo");
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error("\n❌ ERRO NO TESTE:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar teste
testStep01Persistence();

