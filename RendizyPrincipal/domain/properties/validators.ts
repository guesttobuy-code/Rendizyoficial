/**
 * VALIDATORS - Lógica de validação pura
 * Testa dados contra regras de negócio
 */

import {
  BasicInfo,
  Address,
  Details,
  Pricing,
  PropertyDraft,
  PropertyStep,
  ValidationError,
  ValidationResult,
  getStepFields,
  PROPERTY_STEPS_CONFIG
} from './types';

// ============================================================================
// VALIDADORES POR SEÇÃO
// ============================================================================

export class BasicInfoValidator {
  static validate(info: BasicInfo): ValidationResult {
    const errors: ValidationError[] = [];

    // internalName é obrigatório e deve ter pelo menos 3 caracteres
    if (!info.internalName || info.internalName.trim().length < 3) {
      errors.push({
        field: 'internalName',
        message: 'Nome interno deve ter pelo menos 3 caracteres'
      });
    }

    // propertyType é obrigatório (Tipo do Local)
    if (!info.propertyType || info.propertyType === '') {
      errors.push({
        field: 'propertyType',
        message: 'Tipo do local é obrigatório'
      });
    }

    // accommodationType é obrigatório (Tipo de Acomodação)
    if (!info.accommodationType || info.accommodationType === '') {
      errors.push({
        field: 'accommodationType',
        message: 'Tipo de acomodação é obrigatório'
      });
    }

    // modalities: pelo menos uma deve ser selecionada
    if (!info.modalities || info.modalities.size === 0) {
      errors.push({
        field: 'modalities',
        message: 'Selecione pelo menos uma modalidade'
      });
    }

    // Se announcementType for 'linked', totalUnits é obrigatório
    if (info.announcementType === 'linked' && (!info.totalUnits || info.totalUnits <= 0)) {
      errors.push({
        field: 'totalUnits',
        message: 'Quantidade de acomodações deve ser maior que zero para anúncios vinculados'
      });
    }

    // === Validações Legadas (compatibilidade) ===
    // Title é opcional agora (usar internalName)
    if (info.title && info.title.trim().length > 0 && info.title.trim().length < 5) {
      errors.push({
        field: 'title',
        message: 'Título deve ter pelo menos 5 caracteres'
      });
    }

    // Description é opcional agora (movido para outro step)
    if (info.description && info.description.trim().length > 0 && info.description.trim().length < 20) {
      errors.push({
        field: 'description',
        message: 'Descrição deve ter pelo menos 20 caracteres'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export class AddressValidator {
  static validate(address: Address): ValidationResult {
    const errors: ValidationError[] = [];

    // Street é obrigatório
    if (!address.street || address.street.trim().length === 0) {
      errors.push({
        field: 'street',
        message: 'Rua é obrigatória'
      });
    }

    // Number é obrigatório
    if (!address.number || address.number.trim().length === 0) {
      errors.push({
        field: 'number',
        message: 'Número é obrigatório'
      });
    }

    // City é obrigatório
    if (!address.city || address.city.trim().length === 0) {
      errors.push({
        field: 'city',
        message: 'Cidade é obrigatória'
      });
    }

    // State é obrigatório (2 dígitos para Brasil)
    if (!address.state || address.state.trim().length !== 2) {
      errors.push({
        field: 'state',
        message: 'Estado deve ter 2 caracteres (ex: SP)'
      });
    }

    // ZipCode é obrigatório (validar formato básico)
    if (!address.zipCode || !/^\d{5}-?\d{3}$/.test(address.zipCode.replace(/\D/g, ''))) {
      errors.push({
        field: 'zipCode',
        message: 'CEP inválido (formato: 12345-678)'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export class DetailsValidator {
  static validate(details: Details): ValidationResult {
    const errors: ValidationError[] = [];

    // Bedrooms deve ser >= 0
    if (details.bedrooms < 0) {
      errors.push({
        field: 'bedrooms',
        message: 'Número de quartos não pode ser negativo'
      });
    }

    // Bathrooms deve ser >= 0
    if (details.bathrooms < 0) {
      errors.push({
        field: 'bathrooms',
        message: 'Número de banheiros não pode ser negativo'
      });
    }

    // Area deve ser > 0
    if (details.area <= 0) {
      errors.push({
        field: 'area',
        message: 'Área deve ser maior que 0'
      });
    }

    // Total Area deve ser >= Area
    if (details.totalArea < details.area) {
      errors.push({
        field: 'totalArea',
        message: 'Área total deve ser maior ou igual à área útil'
      });
    }

    // Build year deve ser razoável
    if (details.buildYear && (details.buildYear < 1900 || details.buildYear > new Date().getFullYear())) {
      errors.push({
        field: 'buildYear',
        message: `Ano deve estar entre 1900 e ${new Date().getFullYear()}`
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export class PricingValidator {
  static validate(pricing: Pricing): ValidationResult {
    const errors: ValidationError[] = [];

    // Price deve ser > 0
    if (pricing.price <= 0) {
      errors.push({
        field: 'price',
        message: 'Preço deve ser maior que 0'
      });
    }

    // Price per unit deve ser > 0 se fornecido
    if (pricing.pricePerUnit && pricing.pricePerUnit <= 0) {
      errors.push({
        field: 'pricePerUnit',
        message: 'Preço por unidade deve ser maior que 0'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// VALIDADOR PRINCIPAL - TODA A PROPERTY
// ============================================================================

export class PropertyValidator {
  /**
   * Valida um step específico da property
   * Retorna erros apenas daquele step
   */
  static validateStep(property: PropertyDraft, step: PropertyStep): ValidationResult {
    switch (step) {
      case PropertyStep.BASIC_INFO:
        return BasicInfoValidator.validate(property.basicInfo);

      case PropertyStep.ADDRESS:
        return AddressValidator.validate(property.address);

      case PropertyStep.DETAILS:
        return DetailsValidator.validate(property.details);

      case PropertyStep.PRICING:
        return PricingValidator.validate(property.pricing);

      case PropertyStep.GALLERY:
        // Gallery é opcional no mínimo
        return { isValid: true, errors: [] };

      case PropertyStep.PUBLISH:
        // Publish valida tudo
        return PropertyValidator.validateFull(property);

      default:
        return { isValid: false, errors: [{ field: 'step', message: 'Step desconhecido' }] };
    }
  }

  /**
   * Valida a property INTEIRA
   * Usado antes de publicar
   */
  static validateFull(property: PropertyDraft): ValidationResult {
    const errors: ValidationError[] = [];

    // Validar cada seção
    const basicResult = BasicInfoValidator.validate(property.basicInfo);
    const addressResult = AddressValidator.validate(property.address);
    const detailsResult = DetailsValidator.validate(property.details);
    const pricingResult = PricingValidator.validate(property.pricing);

    // Coletar todos os erros
    errors.push(...basicResult.errors);
    errors.push(...addressResult.errors);
    errors.push(...detailsResult.errors);
    errors.push(...pricingResult.errors);

    // Exigir pelo menos uma imagem para publicar
    if (property.gallery.images.length === 0) {
      errors.push({
        field: 'gallery',
        message: 'Adicione pelo menos uma foto antes de publicar'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check se todos os dados obrigatórios foram preenchidos
   */
  static isReadyToPublish(property: PropertyDraft): boolean {
    // Todos os steps devem estar completed
    const allSteps = Object.values(PropertyStep).filter(v => typeof v === 'number') as PropertyStep[];
    const allCompleted = allSteps.every(step => property.completedSteps.has(step));

    if (!allCompleted) return false;

    // Validação completa não deve ter erros
    const validation = PropertyValidator.validateFull(property);
    return validation.isValid;
  }
}
