/**
 * TESTE DIRETO: Persistência Step 01 - Verificação no Banco
 * 
 * Este teste verifica diretamente no banco SQL se os dados do Step 01
 * estão sendo salvos corretamente, sem depender da autenticação da API.
 * 
 * ID do imóvel: 8efe9eeb-22e7-467b-8350-7586e8e54f58
 */

import { createClient } from '@supabase/supabase-js';

const PROPERTY_ID = "8efe9eeb-22e7-467b-8350-7586e8e54f58";
const SUPABASE_URL = "https://odcgnzfremrqnvtitpcc.supabase.co";
const SUPABASE_ANON_KEY = process.argv[2] || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY2duemZyZW1ycW52dGl0cGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTQxNzEsImV4cCI6MjA3NzkzMDE3MX0.aljqrK3mKwQ6T6EB_fDPfkbP7QC_hhiZwxUZbtnqVqQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testStep01Direct() {
  console.log("🧪 TESTE DIRETO: Persistência Step 01 - Verificação no Banco\n");
  console.log("=".repeat(60));
  
  try {
    // 1. Buscar imóvel diretamente do SQL
    console.log("\n📥 PASSO 1: Buscando imóvel diretamente do SQL...");
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('id, name, status, wizard_data, completion_percentage, completed_steps')
      .eq('id', PROPERTY_ID)
      .maybeSingle();
    
    if (fetchError) {
      console.error("❌ ERRO ao buscar imóvel:", fetchError);
      process.exit(1);
    }
    
    if (!property) {
      console.error("❌ Imóvel não encontrado!");
      process.exit(1);
    }
    
    console.log("✅ Imóvel encontrado:");
    console.log("   ID:", property.id);
    console.log("   Nome:", property.name || "(sem nome)");
    console.log("   Status:", property.status || "(sem status)");
    console.log("   Completion %:", property.completion_percentage || 0);
    console.log("   Completed Steps:", property.completed_steps || []);
    
    // 2. Verificar wizard_data
    console.log("\n📦 PASSO 2: Verificando wizard_data...");
    let wizardData = property.wizard_data;
    
    if (typeof wizardData === 'string') {
      try {
        wizardData = JSON.parse(wizardData);
        console.log("   ✅ wizard_data parseado de string para objeto");
      } catch (e) {
        console.error("   ❌ Erro ao parsear wizard_data:", e);
        wizardData = null;
      }
    }
    
    if (!wizardData) {
      console.log("   ⚠️ wizard_data está vazio ou null");
    } else {
      console.log("   ✅ wizard_data encontrado:");
      console.log("      Tipo:", typeof wizardData);
      console.log("      Keys:", Object.keys(wizardData || {}));
      
      // Verificar se tem contentType (Step 01)
      if (wizardData.contentType) {
        console.log("\n   📋 Dados do Step 01 (contentType):");
        const step01 = wizardData.contentType;
        console.log("      internalName:", step01.internalName || "(não definido)");
        console.log("      propertyTypeId:", step01.propertyTypeId || "(não definido)");
        console.log("      accommodationTypeId:", step01.accommodationTypeId || "(não definido)");
        console.log("      subtipo:", step01.subtipo || "(não definido)");
        console.log("      modalidades:", step01.modalidades || []);
        console.log("      registrationNumber:", step01.registrationNumber || "(não definido)");
        
        // Verificar se tem dados mínimos
        const hasMinimalData = step01.internalName && step01.propertyTypeId && step01.accommodationTypeId;
        if (hasMinimalData) {
          console.log("\n   ✅ Step 01 tem dados mínimos necessários");
        } else {
          console.log("\n   ⚠️ Step 01 NÃO tem dados mínimos necessários");
        }
      } else {
        console.log("   ⚠️ wizard_data não contém contentType (Step 01 não foi salvo)");
      }
    }
    
    // 3. Verificar completed_steps
    console.log("\n✅ PASSO 3: Verificando completed_steps...");
    const completedSteps = property.completed_steps || [];
    const isStep01Completed = Array.isArray(completedSteps) && completedSteps.includes('content-type');
    
    console.log("   Completed Steps:", completedSteps);
    console.log("   Step 01 (content-type) está completo?", isStep01Completed ? "✅ SIM" : "❌ NÃO");
    
    // 4. Resumo final
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMO FINAL:");
    console.log("=".repeat(60));
    
    const hasWizardData = !!wizardData && !!wizardData.contentType;
    const hasStep01Data = hasWizardData && wizardData.contentType.internalName && 
                          wizardData.contentType.propertyTypeId && 
                          wizardData.contentType.accommodationTypeId;
    
    console.log("✅ wizard_data existe:", hasWizardData ? "SIM" : "NÃO");
    console.log("✅ Step 01 tem dados:", hasStep01Data ? "SIM" : "NÃO");
    console.log("✅ Step 01 está marcado como completo:", isStep01Completed ? "SIM" : "NÃO");
    console.log("✅ Completion %:", property.completion_percentage || 0);
    
    if (hasStep01Data && isStep01Completed) {
      console.log("\n🎉 SUCESSO: Step 01 está persistido corretamente!");
    } else if (hasStep01Data && !isStep01Completed) {
      console.log("\n⚠️ ATENÇÃO: Step 01 tem dados, mas não está marcado como completo");
    } else {
      console.log("\n❌ PROBLEMA: Step 01 não tem dados ou não está completo");
    }
    
  } catch (error) {
    console.error("❌ ERRO NO TESTE:", error);
    process.exit(1);
  }
}

testStep01Direct();

