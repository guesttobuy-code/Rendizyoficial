/**
 * GUIA DE TESTE - Data Persistence
 * 
 * Este arquivo contém instruções e helper para testar a persistência de dados
 * entre navegação de steps e refresh de página (F5)
 */

// ============================================================================
// COMO USAR
// ============================================================================

/*
1. ABRA O CONSOLE DO NAVEGADOR (F12 ou Ctrl+Shift+I)

2. NAVEGUE PARA http://localhost:3002 e crie uma nova propriedade

3. PREENCHA OS DADOS DE CADA STEP (veja exemplos abaixo)

4. AO CLICAR "SALVAR E PRÓXIMO", os dados serão:
   ✅ Salvos no banco de dados (Supabase/Mock)
   ✅ Salvos em localStorage (backup automático)
   ✅ Registrados em log para auditoria

5. TESTE DE PERSISTÊNCIA A:
   - Navegue entre steps normalmente
   - Os dados devem aparecer quando voltar

6. TESTE DE PERSISTÊNCIA B (CRÍTICO):
   - Preencha um step
   - Clique "SALVAR E PRÓXIMO"
   - Pressione F5 (refresh de página)
   - Volte ao step anterior
   - Os dados devem estar lá!

7. VERIFICAÇÃO:
   - Abra o console do navegador (F12)
   - Execute: persistenceManager.printReport()
   - Você verá um relatório completo de salvamentos

// ============================================================================
// DADOS DE EXEMPLO POR STEP
// ============================================================================

STEP 1 - Tipo de Propriedade:
{
  "propertyType": "APARTMENT",
  "otaIntegrations": ["booking_com"],
  "allowDirectBooking": true
}

STEP 2 - Localização:
{
  "zipCode": "20040020",        // Será auto-preenchido via CEP API
  "street": "Avenida Rio Branco",
  "neighborhood": "Centro",
  "city": "Rio de Janeiro",
  "state": "RJ",
  "country": "Brasil",
  "number": "500",
  "complement": "Apt 1001"
}

STEP 3 - Quartos:
{
  "totalRooms": 3,
  "totalBedrooms": 2,
  "totalBathrooms": 2,
  "bedroomDetails": [
    {
      "number": 1,
      "beds": [
        { "type": "DOUBLE", "quantity": 1 }
      ]
    }
  ]
}

STEP 4 - Tour Virtual:
{
  "hasVirtualTour": true,
  "tourUrl": "https://example.com/tour",
  "tourProvider": "MATTERPORT"
}

STEP 5 - Amenidades Locais:
{
  "nearbyAttractions": ["Museu Nacional", "Biblioteca"],
  "publicTransport": ["Metro Estação Central"],
  "restaurants": ["Restaurante A", "Restaurante B"]
}

STEP 6 - Amenidades Hospedagem:
{
  "amenities": {
    "wifi": true,
    "airConditioning": true,
    "kitchen": true,
    "parking": true,
    "washer": true,
    "dryer": true,
    "heating": true,
    "pool": false
  }
}

STEP 7 - Descrição:
{
  "title": "Apartamento Luxuoso no Centro",
  "description": "Apartamento 3 quartos com vista para a baía...",
  "highlights": ["Vista para baía", "Ar condicionado", "WiFi de alta velocidade"]
}

STEP 8 - Contrato:
{
  "checkInTime": "14:00",
  "checkOutTime": "11:00",
  "minStay": 1,
  "maxOccupants": 6,
  "cancellationPolicy": "MODERATE"
}

STEP 9 - Preço Residencial:
{
  "modalidades": [
    {
      "name": "DIARIA",
      "basePrice": 150.00
    }
  ]
}

STEP 10 - Configuração Sazonal:
{
  "seasons": [
    {
      "name": "Alta Temporada",
      "startDate": "2024-12-15",
      "endDate": "2025-01-31",
      "priceMultiplier": 1.5
    }
  ]
}

STEP 11 - Preço Individual:
{
  "accommodationType": "APARTMENT",
  "priceStructure": "FIXED"
}

STEP 12 - Preço Derivado:
{
  "cleaningFee": 50.00,
  "serviceFee": 20.00,
  "taxRate": 0.15
}

STEP 13 - Regras:
{
  "petPolicy": "NOT_ALLOWED",
  "smokingPolicy": "NOT_ALLOWED",
  "parties": false,
  "additionalRules": ["Sem fumar", "Sem animais de estimação"]
}

STEP 14 - Configuração Booking:
{
  "instantBooking": true,
  "requireApproval": false
}

STEP 15 - Tags e Grupos:
{
  "tags": ["BEACH", "LUXURY"],
  "propertyGroups": ["Portfolio Premium"]
}

STEP 16 - iCal Sync:
{
  "syncEnabled": true,
  "syncUrl": "https://calendar.example.com/ical"
}

STEP 17 - Integrações OTA:
{
  "activeOTAs": ["booking_com", "airbnb"],
  "syncFrequency": "HOURLY"
}

// ============================================================================
// TESTES AUTOMATIZADOS
// ============================================================================

No console, você pode rodar estes testes:

// Verificar se localStorage tem dados
localStorage.getItem('property-draft-{propertyId}')

// Ver logs de persistência
persistenceManager.getReport()

// Limpar dados de teste
persistenceManager.clearAll()

// Exportar dados para análise
persistenceManager.exportData()

// ============================================================================
// O QUE ESPERAR
// ============================================================================

✅ SUCESSO:
- Dados aparecem em cada step quando voltam
- Após F5, dados ainda estão presentes
- Console mostra "✅ Dados salvos com sucesso!" e "✅ Integridade verificada"
- persistenceManager.printReport() mostra histórico completo

❌ FALHA (Problemas):
- Dados desaparecem entre steps
- Após F5, os dados foram perdidos
- Console mostra "❌ Erro ao salvar dados"
- Campos vazios quando voltam ao step

Se encontrar problemas:
1. Abra F12 e vire a aba "Console"
2. Procure por mensagens de erro (vermelho)
3. Procure por avisos (amarelo)
4. Screenshot e relatar para desenvolvimento

// ============================================================================
// FERRAMENTAS DE DEBUG
// ============================================================================

No console (F12), você pode usar:

// Ver estado de persistência
window.persistenceManager

// Forçar save imediato
persistenceManager.saveStepBackup(1, 'BasicInfo', {propertyType: 'APARTMENT'})

// Verificar integridade
persistenceManager.verifyDataIntegrity(1, 'BasicInfo', {propertyType: 'APARTMENT'})

// Ver checkpoint
persistenceManager.getCheckpoint()

// Salvar checkpoint manualmente
persistenceManager.saveCheckpoint(2)

*/

// ============================================================================
// FUNÇÕES HELPER
// ============================================================================

export const persistenceTestUtils = {
  /**
   * Printa um relatório bem formatado no console
   */
  printReport: () => {
    if (!(window as any).persistenceManager) {
      console.error('❌ PersistenceManager não foi inicializado!');
      return;
    }
    (window as any).persistenceManager.printReport();
  },

  /**
   * Verifica todos os steps com dados
   */
  checkAllSteps: () => {
    if (!(window as any).persistenceManager) {
      console.error('❌ PersistenceManager não foi inicializado!');
      return;
    }
    const data = (window as any).persistenceManager.exportData();
    console.log('📊 Dados salvos:', data);
    return data;
  },

  /**
   * Simula refresh e verifica se dados persistem
   */
  testRefreshSimulation: () => {
    console.log('🔄 Simulando refresh de página...');
    const data = (window as any).persistenceManager?.exportData();
    console.log('✅ Dados antes de refresh:', data);
    // Usuário faz F5 aqui
    setTimeout(() => {
      console.log('⏱️ Aguarde o page reload (F5) e verifique novamente');
    }, 1000);
  },

  /**
   * Limpa e reseta tudo
   */
  reset: () => {
    if (!(window as any).persistenceManager) {
      console.error('❌ PersistenceManager não foi inicializado!');
      return;
    }
    (window as any).persistenceManager.clearAll();
    console.log('✅ Tudo foi limpo. Recarregue a página (F5)');
  }
};

// Expor globalmente para testes
if (typeof window !== 'undefined') {
  (window as any).persistenceTestUtils = persistenceTestUtils;
}

export default persistenceTestUtils;
