/**
 * APPLICATION LAYER - Use Cases
 * Lógica pura de negócio, sem React ou HTTP
 */

import {
  PropertyDraft,
  PropertyStep,
  ValidationError
} from '../../domain/properties/types';
import { PropertyValidator } from '../../domain/properties/validators';
import { IPropertyRepository } from '../../infrastructure/repositories/PropertyRepository';

// ============================================================================
// USE CASE - Criar nova property
// ============================================================================

export class CreatePropertyUseCase {
  constructor(private repository: IPropertyRepository) {}

  async execute(tenantId: string): Promise<PropertyDraft> {
    return await this.repository.create(tenantId);
  }
}

// ============================================================================
// USE CASE - Carregar property existente
// ============================================================================

export class LoadPropertyUseCase {
  constructor(private repository: IPropertyRepository) {}

  async execute(propertyId: string): Promise<PropertyDraft | null> {
    return await this.repository.get(propertyId);
  }
}

// ============================================================================
// USE CASE - Salvar um step da property
// ============================================================================

export interface SavePropertyStepResult {
  success: boolean;
  property?: PropertyDraft;
  errors?: ValidationError[];
  conflictVersion?: number; // Se houver conflito de versão
}

export class SavePropertyStepUseCase {
  constructor(private repository: IPropertyRepository) {}

  async execute(
    propertyId: string,
    step: PropertyStep,
    updates: Partial<PropertyDraft>
  ): Promise<SavePropertyStepResult> {
    console.log('🔧 [SavePropertyStepUseCase.execute] INÍCIO - step:', step);
    console.log('🔧 [SavePropertyStepUseCase.execute] updates:', updates);
    
    // 1. Carregar property atual
    const property = await this.repository.get(propertyId);
    if (!property) {
      return {
        success: false,
        errors: [{ field: 'property', message: 'Property não encontrada' }]
      };
    }

    // 2. Aplicar updates para o step específico
    this.applyStepUpdates(property, step, updates);

    console.log('🔧 [SavePropertyStepUseCase.execute] APÓS applyStepUpdates:', {
      basicInfo: property.basicInfo,
      modalitiesType: property.basicInfo.modalities?.constructor?.name
    });

    // 3. Validar o step
    const validation = PropertyValidator.validateStep(property, step);

    if (!validation.isValid) {
      // Guardar erros no property mas NÃO salvar no DB
      console.log('❌ [SavePropertyStepUseCase.execute] Validação falhou:', validation.errors);
      property.stepErrors.set(step, validation.errors);
      return {
        success: false,
        property,
        errors: validation.errors
      };
    }

    // 4. Se validou, marca step como completed
    property.completedSteps.add(step);
    property.stepErrors.delete(step);

    // 5. Tentar salvar no repositório (com versionamento)
    try {
      const saved = await this.repository.save(property);
      return {
        success: true,
        property: saved
      };
    } catch (error) {
      // Conflito de versão - outra requisição atualizou enquanto a gente estava processando
      if (error instanceof Error && error.message.includes('Version conflict')) {
        const current = await this.repository.get(propertyId);
        return {
          success: false,
          property: current || undefined,
          errors: [{ field: 'version', message: 'Property foi modificada. Recarregue e tente novamente.' }],
          conflictVersion: current?.version
        };
      }

      throw error;
    }
  }

  private applyStepUpdates(
    property: PropertyDraft,
    step: PropertyStep,
    updates: Partial<PropertyDraft>
  ): void {
    switch (step) {
      case PropertyStep.BASIC_INFO:
        if (updates.basicInfo) {
          // ⚠️ CUIDADO: Spread operator destrói Set! Precisa tratar modalities especialmente
          const updatedBasicInfo = { ...property.basicInfo, ...updates.basicInfo };
          
          // Se modalities foi perdido no spread, recupera
          if (!updatedBasicInfo.modalities || (typeof updatedBasicInfo.modalities === 'object' && updatedBasicInfo.modalities.constructor === Object)) {
            updatedBasicInfo.modalities = updates.basicInfo?.modalities instanceof Set 
              ? updates.basicInfo.modalities 
              : property.basicInfo.modalities;
          }
          
          property.basicInfo = updatedBasicInfo;
          
          console.log('🔧 [SavePropertyStepUseCase] BASIC_INFO atualizado:', {
            internalName: property.basicInfo.internalName,
            propertyType: property.basicInfo.propertyType,
            accommodationType: property.basicInfo.accommodationType,
            modalities: property.basicInfo.modalities,
            modalitiesType: property.basicInfo.modalities?.constructor?.name
          });
        }
        break;

      case PropertyStep.ADDRESS:
        if (updates.address) {
          property.address = { ...property.address, ...updates.address };
        }
        break;

      case PropertyStep.DETAILS:
        if (updates.details) {
          property.details = { ...property.details, ...updates.details };
        }
        break;

      case PropertyStep.PRICING:
        if (updates.pricing) {
          property.pricing = { ...property.pricing, ...updates.pricing };
        }
        break;

      case PropertyStep.GALLERY:
        if (updates.gallery) {
          property.gallery = updates.gallery;
        }
        break;

      case PropertyStep.PUBLISH:
        // Publish não atualiza dados, só muda status
        property.status = 'published';
        break;
    }

    property.updatedAt = new Date();
  }
}

// ============================================================================
// USE CASE - Publicar property (validação completa)
// ============================================================================

export interface PublishPropertyResult {
  success: boolean;
  property?: PropertyDraft;
  errors?: ValidationError[];
}

export class PublishPropertyUseCase {
  constructor(private repository: IPropertyRepository) {}

  async execute(propertyId: string): Promise<PublishPropertyResult> {
    // 1. Carregar property
    const property = await this.repository.get(propertyId);
    if (!property) {
      return {
        success: false,
        errors: [{ field: 'property', message: 'Property não encontrada' }]
      };
    }

    // 2. Validar TUDO
    const validation = PropertyValidator.validateFull(property);
    if (!validation.isValid) {
      return {
        success: false,
        property,
        errors: validation.errors
      };
    }

    // 3. Marcar como published
    property.status = 'published';
    property.completedSteps.add(PropertyStep.PUBLISH);

    // 4. Salvar
    try {
      const saved = await this.repository.save(property);
      return {
        success: true,
        property: saved
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Version conflict')) {
        return {
          success: false,
          errors: [{ field: 'version', message: 'Property foi modificada. Recarregue e tente novamente.' }]
        };
      }
      throw error;
    }
  }
}

// ============================================================================
// USE CASE - Deletar property
// ============================================================================

export class DeletePropertyUseCase {
  constructor(private repository: IPropertyRepository) {}

  async execute(propertyId: string): Promise<void> {
    await this.repository.delete(propertyId);
  }
}

// ============================================================================
// USE CASE - Listar properties de um tenant
// ============================================================================

export class ListPropertiesByTenantUseCase {
  constructor(private repository: IPropertyRepository) {}

  async execute(tenantId: string): Promise<PropertyDraft[]> {
    return await this.repository.listByTenant(tenantId);
  }
}
