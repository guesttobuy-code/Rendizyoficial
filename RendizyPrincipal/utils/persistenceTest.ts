/**
 * Test Persistence Helper
 * Verifica se dados estão sendo persistidos corretamente entre steps
 */

export interface PersistenceTest {
  step: number;
  stepName: string;
  savedData: any;
  timestamp: string;
  status: 'saved' | 'failed' | 'pending';
}

class PersistenceTestHelper {
  private tests: PersistenceTest[] = [];
  private propertyId: string = '';

  initialize(propertyId: string) {
    this.propertyId = propertyId;
    this.tests = [];
  }

  /**
   * Registra um teste de save
   */
  recordTest(step: number, stepName: string, data: any, status: 'saved' | 'failed' = 'saved') {
    const test: PersistenceTest = {
      step,
      stepName,
      savedData: JSON.parse(JSON.stringify(data)), // Deep copy
      timestamp: new Date().toISOString(),
      status
    };

    this.tests.push(test);
    console.log(`✅ [PERSISTENCE TEST] Step ${step} - ${stepName} - ${status}`, data);
    
    // Salvar no localStorage para análise
    try {
      localStorage.setItem(
        `persistence-test-${this.propertyId}`,
        JSON.stringify(this.tests)
      );
    } catch (err) {
      console.error('Failed to save persistence test:', err);
    }
  }

  /**
   * Valida se o dado está presente quando retorna ao step
   */
  verifyData(step: number, currentData: any): boolean {
    const test = this.tests.find(t => t.step === step);
    
    if (!test) {
      console.warn(`❌ [PERSISTENCE TEST] No saved data found for step ${step}`);
      return false;
    }

    // Verificar se dados críticos continuam presentes
    const savedKeys = Object.keys(test.savedData);

    for (const key of savedKeys) {
      if (!(key in currentData)) {
        console.warn(`❌ [PERSISTENCE TEST] Missing key "${key}" in step ${step}`, {
          expected: test.savedData[key],
          current: currentData[key]
        });
        return false;
      }
    }

    console.log(`✅ [PERSISTENCE TEST] Data verified for step ${step}`);
    return true;
  }

  /**
   * Gera relatório dos testes
   */
  getReport(): string {
    let report = '\n📊 PERSISTENCE TEST REPORT\n';
    report += '='.repeat(50) + '\n\n';

    for (const test of this.tests) {
      const status = test.status === 'saved' ? '✅' : '❌';
      report += `${status} Step ${test.step}: ${test.stepName}\n`;
      report += `   Timestamp: ${new Date(test.timestamp).toLocaleString()}\n`;
      report += `   Data keys: ${Object.keys(test.savedData).join(', ')}\n`;
      report += '\n';
    }

    report += '='.repeat(50) + '\n';
    report += `Total tests: ${this.tests.length}\n`;
    report += `Passed: ${this.tests.filter(t => t.status === 'saved').length}\n`;
    report += `Failed: ${this.tests.filter(t => t.status === 'failed').length}\n`;

    return report;
  }

  /**
   * Imprime relatório no console
   */
  printReport() {
    console.log(this.getReport());
  }

  /**
   * Exporta testes como JSON
   */
  exportTests(): string {
    return JSON.stringify(this.tests, null, 2);
  }

  /**
   * Limpa testes
   */
  clear() {
    this.tests = [];
    try {
      localStorage.removeItem(`persistence-test-${this.propertyId}`);
    } catch (err) {
      console.error('Failed to clear tests:', err);
    }
  }
}

export const persistenceTestHelper = new PersistenceTestHelper();

/**
 * Hook para testar persistência
 */
export function useTestPersistence(_propertyId: string) {
  return {
    recordSave: (step: number, stepName: string, data: any) => {
      persistenceTestHelper.recordTest(step, stepName, data, 'saved');
    },
    verifyData: (step: number, data: any) => {
      return persistenceTestHelper.verifyData(step, data);
    },
    printReport: () => {
      persistenceTestHelper.printReport();
    },
    clear: () => {
      persistenceTestHelper.clear();
    }
  };
}
