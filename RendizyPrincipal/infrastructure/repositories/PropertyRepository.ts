/**
 * INFRASTRUCTURE - Repository para PropertyDraft
 * Abstração de armazenamento com implementação Supabase
 */

import { PropertyDraft, createEmptyProperty } from '../../domain/properties/types';
import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// INTERFACE - Contrato de armazenamento
// ============================================================================

export interface IPropertyRepository {
  /**
   * Cria uma nova property em branco e persiste no DB
   */
  create(tenantId: string): Promise<PropertyDraft>;

  /**
   * Busca uma property pelo ID
   */
  get(propertyId: string): Promise<PropertyDraft | null>;

  /**
   * Salva uma property inteira (cria ou atualiza)
   * Trata versionamento para evitar conflitos
   */
  save(property: PropertyDraft): Promise<PropertyDraft>;

  /**
   * Deleta uma property
   */
  delete(propertyId: string): Promise<void>;

  /**
   * Lista todas as properties de um tenant
   */
  listByTenant(tenantId: string): Promise<PropertyDraft[]>;
}

// ============================================================================
// IMPLEMENTAÇÃO - Supabase
// ============================================================================

export class SupabasePropertyRepository implements IPropertyRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(tenantId: string): Promise<PropertyDraft> {
    const property = createEmptyProperty(tenantId);

    // Serializar Sets para JSON
    const dataToStore = this.serializeProperty(property);

    const { data, error } = await this.supabase
      .from('properties_drafts')
      .insert([dataToStore])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create property: ${error.message}`);
    }

    return this.deserializeProperty(data);
  }

  async get(propertyId: string): Promise<PropertyDraft | null> {
    const { data, error } = await this.supabase
      .from('properties_drafts')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Failed to get property: ${error.message}`);
    }

    return this.deserializeProperty(data);
  }

  async save(property: PropertyDraft): Promise<PropertyDraft> {
    const dataToStore = this.serializeProperty(property);

    // Usa versionamento otimista - só atualiza se a versão bater
    const { data, error } = await this.supabase
      .from('properties_drafts')
      .update({
        ...dataToStore,
        version: property.version + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', property.id)
      .eq('version', property.version)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save property: ${error.message}`);
    }

    if (!data) {
      // Isso significa que a versão não bateu - conflito
      const current = await this.get(property.id);
      if (current) {
        throw new Error(
          `Property was modified by another process. Current version: ${current.version}, expected: ${property.version}`
        );
      }
    }

    return this.deserializeProperty(data);
  }

  async delete(propertyId: string): Promise<void> {
    const { error } = await this.supabase.from('properties_drafts').delete().eq('id', propertyId);

    if (error) {
      throw new Error(`Failed to delete property: ${error.message}`);
    }
  }

  async listByTenant(tenantId: string): Promise<PropertyDraft[]> {
    const { data, error } = await this.supabase
      .from('properties_drafts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list properties: ${error.message}`);
    }

    return data.map(item => this.deserializeProperty(item));
  }

  // ========================================================================
  // HELPERS - Serialização/Deserialização
  // ========================================================================

  private serializeProperty(property: PropertyDraft): Record<string, any> {
    // Converter basicInfo.modalities de Set para array
    const basicInfo = { ...property.basicInfo };
    if (basicInfo.modalities instanceof Set) {
      basicInfo.modalities = Array.from(basicInfo.modalities) as any;
    }

    return {
      id: property.id,
      tenant_id: property.tenantId,
      version: property.version,
      created_at: property.createdAt.toISOString(),
      updated_at: property.updatedAt.toISOString(),
      status: property.status,
      basic_info: basicInfo,
      address: property.address,
      details: property.details,
      pricing: property.pricing,
      gallery: property.gallery,
      completed_steps: Array.from(property.completedSteps), // Set -> Array
      step_errors: Object.fromEntries(property.stepErrors) // Map -> Object
    };
  }

  private deserializeProperty(data: Record<string, any>): PropertyDraft {
    const completedSteps = new Set(data.completed_steps || []);
    const stepErrors = new Map(Object.entries(data.step_errors || {}));

    // Converter basicInfo.modalities de array para Set (se existir)
    const basicInfo = { ...data.basic_info };
    if (basicInfo.modalities && Array.isArray(basicInfo.modalities)) {
      basicInfo.modalities = new Set(basicInfo.modalities);
    } else if (!basicInfo.modalities) {
      basicInfo.modalities = new Set();
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      version: data.version,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      status: data.status,
      basicInfo,
      address: data.address,
      details: data.details,
      pricing: data.pricing,
      gallery: data.gallery,
      completedSteps,
      stepErrors
    };
  }
}

// ============================================================================
// MOCK REPOSITORY - Para testes sem banco
// ============================================================================

export class MockPropertyRepository implements IPropertyRepository {
  private storage = new Map<string, PropertyDraft>();

  async create(tenantId: string): Promise<PropertyDraft> {
    const property = createEmptyProperty(tenantId);
    this.storage.set(property.id, this.deepClone(property));
    return property;
  }

  async get(propertyId: string): Promise<PropertyDraft | null> {
    const property = this.storage.get(propertyId);
    return property ? this.deepClone(property) : null;
  }

  async save(property: PropertyDraft): Promise<PropertyDraft> {
    const current = this.storage.get(property.id);

    if (!current) {
      throw new Error(`Property not found: ${property.id}`);
    }

    if (current.version !== property.version) {
      throw new Error(
        `Version conflict. Current: ${current.version}, expected: ${property.version}`
      );
    }

    const updated = {
      ...property,
      version: property.version + 1,
      updatedAt: new Date()
    };

    this.storage.set(property.id, this.deepClone(updated));
    return updated;
  }

  async delete(propertyId: string): Promise<void> {
    this.storage.delete(propertyId);
  }

  async listByTenant(tenantId: string): Promise<PropertyDraft[]> {
    return Array.from(this.storage.values())
      .filter(p => p.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private deepClone(property: PropertyDraft): PropertyDraft {
    return {
      ...property,
      basicInfo: { ...property.basicInfo },
      address: { ...property.address },
      details: { ...property.details },
      pricing: { ...property.pricing },
      gallery: { ...property.gallery, images: [...property.gallery.images] },
      completedSteps: new Set(property.completedSteps),
      stepErrors: new Map(property.stepErrors)
    };
  }
}
