/**
 * VALIDATORS V3 - Validações para os 17 Steps da Property V3
 * Estende validators.ts com regras para Steps 9-17
 */

import { ValidationError, ValidationResult } from './types';

// ============================================================================
// STEP 9 - RESIDENTIAL PRICING (Preços Residenciais)
// ============================================================================

export interface ResidentialPricingData {
  rentalNightlyPrice?: number;
  minRentalDays?: number;
  salePrice?: number;
  acceptOffers?: boolean;
}

export class ResidentialPricingValidator {
  static validate(data: ResidentialPricingData): ValidationResult {
    const errors: ValidationError[] = [];

    // Se tem modalidade de aluguel, nightly price é obrigatório e > 0
    if (data.rentalNightlyPrice !== undefined && data.rentalNightlyPrice !== null) {
      if (typeof data.rentalNightlyPrice !== 'number' || data.rentalNightlyPrice <= 0) {
        errors.push({
          field: 'rentalNightlyPrice',
          message: 'Preço por noite deve ser maior que 0'
        });
      }
      if (data.minRentalDays !== undefined && data.minRentalDays !== null) {
        if (typeof data.minRentalDays !== 'number' || data.minRentalDays < 1) {
          errors.push({
            field: 'minRentalDays',
            message: 'Mínimo de dias deve ser pelo menos 1'
          });
        }
      }
    }

    // Se tem modalidade de venda, sale price é obrigatório e > 0
    if (data.salePrice !== undefined && data.salePrice !== null) {
      if (typeof data.salePrice !== 'number' || data.salePrice <= 0) {
        errors.push({
          field: 'salePrice',
          message: 'Preço de venda deve ser maior que 0'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// STEP 10 - SEASONAL CONFIG (Configuração Sazonal)
// ============================================================================

export interface SeasonConfig {
  season: 'high' | 'medium' | 'low';
  priceAdjustmentPercent?: number;
  startMonth?: number; // 1-12
  endMonth?: number;   // 1-12
}

export interface SeasonalConfigData {
  highSeason?: SeasonConfig;
  mediumSeason?: SeasonConfig;
  lowSeason?: SeasonConfig;
}

export class SeasonalConfigValidator {
  static validate(data: SeasonalConfigData): ValidationResult {
    const errors: ValidationError[] = [];

    ['highSeason', 'mediumSeason', 'lowSeason'].forEach(seasonKey => {
      const season = data[seasonKey as keyof SeasonalConfigData] as SeasonConfig;
      if (!season) return;

      if (season.priceAdjustmentPercent !== undefined && season.priceAdjustmentPercent !== null) {
        if (typeof season.priceAdjustmentPercent !== 'number' || season.priceAdjustmentPercent < -99 || season.priceAdjustmentPercent > 200) {
          errors.push({
            field: `${seasonKey}.priceAdjustmentPercent`,
            message: 'Ajuste percentual deve estar entre -99% e 200%'
          });
        }
      }

      if (season.startMonth !== undefined && season.startMonth !== null) {
        if (!Number.isInteger(season.startMonth) || season.startMonth < 1 || season.startMonth > 12) {
          errors.push({
            field: `${seasonKey}.startMonth`,
            message: 'Mês inicial deve estar entre 1 e 12'
          });
        }
      }

      if (season.endMonth !== undefined && season.endMonth !== null) {
        if (!Number.isInteger(season.endMonth) || season.endMonth < 1 || season.endMonth > 12) {
          errors.push({
            field: `${seasonKey}.endMonth`,
            message: 'Mês final deve estar entre 1 e 12'
          });
        }
      }

      // Se tem startMonth e endMonth, validar range
      if (season.startMonth && season.endMonth) {
        if (season.startMonth > season.endMonth) {
          // Allow wrap-around (ex: dez-jan)
          if (season.startMonth > 12 || season.endMonth < 1) {
            errors.push({
              field: `${seasonKey}.monthRange`,
              message: 'Range de meses inválido'
            });
          }
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// STEP 11 - INDIVIDUAL PRICING (Preços por Acomodação)
// ============================================================================

export interface AccommodationPricing {
  accommodationName: string;
  seasons: {
    high?: number;
    medium?: number;
    low?: number;
  };
}

export interface IndividualPricingData {
  accommodations: AccommodationPricing[];
}

export class IndividualPricingValidator {
  static validate(data: IndividualPricingData): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.accommodations || !Array.isArray(data.accommodations) || data.accommodations.length === 0) {
      errors.push({
        field: 'accommodations',
        message: 'Adicione pelo menos uma acomodação'
      });
      return { isValid: false, errors };
    }

    data.accommodations.forEach((acc, idx) => {
      if (!acc.accommodationName || acc.accommodationName.trim().length === 0) {
        errors.push({
          field: `accommodations.${idx}.accommodationName`,
          message: 'Nome da acomodação é obrigatório'
        });
      }

      Object.entries(acc.seasons).forEach(([season, price]) => {
        if (price !== undefined && price !== null) {
          if (typeof price !== 'number' || price <= 0) {
            errors.push({
              field: `accommodations.${idx}.seasons.${season}`,
              message: `Preço ${season} deve ser maior que 0`
            });
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// STEP 12 - DERIVED PRICING (Preços Derivados - Descontos, Taxas, etc)
// ============================================================================

export interface DerivedPricingData {
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  cleaningFee?: number;
  serviceFeePercent?: number;
  securityDeposit?: number;
  autoCalculateWeekly?: boolean;
  autoCalculateMonthly?: boolean;
}

export class DerivedPricingValidator {
  static validate(data: DerivedPricingData): ValidationResult {
    const errors: ValidationError[] = [];

    if (data.weeklyDiscount !== undefined && data.weeklyDiscount !== null) {
      if (typeof data.weeklyDiscount !== 'number' || data.weeklyDiscount < 0 || data.weeklyDiscount > 100) {
        errors.push({
          field: 'weeklyDiscount',
          message: 'Desconto semanal deve estar entre 0% e 100%'
        });
      }
    }

    if (data.monthlyDiscount !== undefined && data.monthlyDiscount !== null) {
      if (typeof data.monthlyDiscount !== 'number' || data.monthlyDiscount < 0 || data.monthlyDiscount > 100) {
        errors.push({
          field: 'monthlyDiscount',
          message: 'Desconto mensal deve estar entre 0% e 100%'
        });
      }
    }

    if (data.cleaningFee !== undefined && data.cleaningFee !== null) {
      if (typeof data.cleaningFee !== 'number' || data.cleaningFee < 0) {
        errors.push({
          field: 'cleaningFee',
          message: 'Taxa de limpeza não pode ser negativa'
        });
      }
    }

    if (data.serviceFeePercent !== undefined && data.serviceFeePercent !== null) {
      if (typeof data.serviceFeePercent !== 'number' || data.serviceFeePercent < 0 || data.serviceFeePercent > 50) {
        errors.push({
          field: 'serviceFeePercent',
          message: 'Taxa de serviço deve estar entre 0% e 50%'
        });
      }
    }

    if (data.securityDeposit !== undefined && data.securityDeposit !== null) {
      if (typeof data.securityDeposit !== 'number' || data.securityDeposit < 0) {
        errors.push({
          field: 'securityDeposit',
          message: 'Caução não pode ser negativa'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// STEP 14 - BOOKING CONFIG (Configuração de Reservas)
// ============================================================================

export interface BookingConfigData {
  cancellationPolicy?: 'flexible' | 'moderate' | 'strict' | 'non-refundable';
  autoConfirmBooking?: boolean;
  responseTimeHours?: number;
  requireGuests?: {
    phone?: boolean;
    email?: boolean;
    identityVerification?: boolean;
  };
}

export class BookingConfigValidator {
  static validate(data: BookingConfigData): ValidationResult {
    const errors: ValidationError[] = [];

    if (data.responseTimeHours !== undefined && data.responseTimeHours !== null) {
      if (typeof data.responseTimeHours !== 'number' || data.responseTimeHours < 1 || data.responseTimeHours > 168) {
        errors.push({
          field: 'responseTimeHours',
          message: 'Tempo de resposta deve estar entre 1 e 168 horas (7 dias)'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// STEP 15 - TAGS & GROUPS (Tags e Grupos de Propriedade)
// ============================================================================

export interface TagsGroupsData {
  customTags?: string[];
  suggestedTagsSelected?: string[];
  propertyGroup?: string;
  syncGroupAvailability?: boolean;
}

export class TagsGroupsValidator {
  static validate(data: TagsGroupsData): ValidationResult {
    const errors: ValidationError[] = [];

    if (data.customTags && Array.isArray(data.customTags)) {
      data.customTags.forEach((tag, idx) => {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          errors.push({
            field: `customTags.${idx}`,
            message: 'Tag não pode estar vazia'
          });
        }
        if (tag.length > 50) {
          errors.push({
            field: `customTags.${idx}`,
            message: 'Tag não pode ter mais de 50 caracteres'
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// STEP 16 - ICAL SYNC (Sincronização de Calendário)
// ============================================================================

export interface ICalSyncData {
  exportUrl?: string;
  importUrl?: string;
  autoSync?: boolean;
  syncFrequencyMinutes?: number;
  syncSettings?: {
    syncBookings?: boolean;
    syncUnavailable?: boolean;
    syncPrices?: boolean;
  };
}

export class ICalSyncValidator {
  static validate(data: ICalSyncData): ValidationResult {
    const errors: ValidationError[] = [];

    if (data.importUrl) {
      if (!this.isValidUrl(data.importUrl)) {
        errors.push({
          field: 'importUrl',
          message: 'URL de importação inválida'
        });
      }
    }

    if (data.syncFrequencyMinutes !== undefined && data.syncFrequencyMinutes !== null) {
      if (typeof data.syncFrequencyMinutes !== 'number' || data.syncFrequencyMinutes < 5 || data.syncFrequencyMinutes > 1440) {
        errors.push({
          field: 'syncFrequencyMinutes',
          message: 'Frequência de sincronização deve estar entre 5 minutos e 24 horas'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// STEP 17 - OTA INTEGRATIONS (Integrações OTA)
// ============================================================================

export interface OTAIntegrationData {
  selectedOTAs?: ('airbnb' | 'booking' | 'decolar' | 'vrbo' | 'expedia' | 'trivago')[];
  otaPropertyCodes?: {
    [ota: string]: string;
  };
  otaApiKeys?: {
    [ota: string]: string;
  };
  syncFrequencyMinutes?: number;
}

export class OTAIntegrationsValidator {
  static validate(data: OTAIntegrationData): ValidationResult {
    const errors: ValidationError[] = [];

    if (data.selectedOTAs && Array.isArray(data.selectedOTAs) && data.selectedOTAs.length > 0) {
      const validOTAs = ['airbnb', 'booking', 'decolar', 'vrbo', 'expedia', 'trivago'];

      data.selectedOTAs.forEach((ota) => {
        if (!validOTAs.includes(ota)) {
          errors.push({
            field: 'selectedOTAs',
            message: `OTA inválida: ${ota}`
          });
        }

        // Se OTA está selecionada, precisa de API key
        if (data.otaApiKeys && !data.otaApiKeys[ota]) {
          errors.push({
            field: `otaApiKeys.${ota}`,
            message: `API key obrigatória para ${ota}`
          });
        }
      });
    }

    if (data.syncFrequencyMinutes !== undefined && data.syncFrequencyMinutes !== null) {
      if (typeof data.syncFrequencyMinutes !== 'number' || data.syncFrequencyMinutes < 5 || data.syncFrequencyMinutes > 1440) {
        errors.push({
          field: 'syncFrequencyMinutes',
          message: 'Frequência de sincronização deve estar entre 5 minutos e 24 horas'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// EXPORT UTILS
// ============================================================================

export const V3Validators = {
  ResidentialPricing: ResidentialPricingValidator,
  SeasonalConfig: SeasonalConfigValidator,
  IndividualPricing: IndividualPricingValidator,
  DerivedPricing: DerivedPricingValidator,
  BookingConfig: BookingConfigValidator,
  TagsGroups: TagsGroupsValidator,
  ICalSync: ICalSyncValidator,
  OTAIntegrations: OTAIntegrationsValidator
};
