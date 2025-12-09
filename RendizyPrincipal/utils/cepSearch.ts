/**
 * CEP Search Utility
 * Busca endereço automático a partir do CEP usando API
 */

export interface CEPData {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento?: string;
  erro?: boolean;
}

/**
 * Busca endereço via ViaCEP API
 */
export async function searchCEP(cep: string): Promise<CEPData | null> {
  if (!cep || cep.length < 5) {
    return null;
  }

  try {
    // Remover formatação
    const cleanCEP = cep.replace(/\D/g, '');
    
    // Validar comprimento
    if (cleanCEP.length !== 8) {
      return null;
    }

    // Formatar CEP
    const formattedCEP = cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');

    // Buscar via ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    
    if (!response.ok) {
      return null;
    }

    const data: CEPData = await response.json();

    // ViaCEP retorna { erro: true } para CEP não encontrado
    if (data.erro) {
      return null;
    }

    return {
      cep: formattedCEP,
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      uf: data.uf || '',
      complemento: data.complemento || ''
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}

/**
 * Formata CEP como XXX.XXX-XXX
 */
export function formatCEP(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 5) {
    return cleaned;
  }
  
  return cleaned.replace(/(\d{5})(\d{0,3})/, '$1-$2');
}

/**
 * Valida CEP
 */
export function isValidCEP(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.length === 8 && /^\d+$/.test(cleaned);
}
