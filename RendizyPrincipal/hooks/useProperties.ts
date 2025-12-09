/**
 * REACT INTEGRATION - Hook useProperties
 * Liga domain + application + infrastructure ao React
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PropertyDraft, PropertyStep } from '../domain/properties/types';
import { PropertyValidator } from '../domain/properties/validators';
import {
  CreatePropertyUseCase,
  LoadPropertyUseCase,
  SavePropertyStepUseCase,
  SavePropertyStepResult,
  PublishPropertyUseCase,
  DeletePropertyUseCase
} from '../application/properties/useCases';
import { SupabasePropertyRepository, MockPropertyRepository } from '../infrastructure/repositories/PropertyRepository';
import { getSupabaseClient } from '../utils/supabase/client';
import { useAuth } from './useAuth';

// ============================================================================
// TIPOS
// ============================================================================

export interface UsePropertiesState {
  property: PropertyDraft | null;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  lastSavedAt: Date | null;
}

export interface UsePropertiesActions {
  saveStep: (step: PropertyStep, updates: Partial<PropertyDraft>) => Promise<SavePropertyStepResult>;
  publish: () => Promise<boolean>;
  delete: () => Promise<void>;
  refresh: () => Promise<void>;
}

export type UsePropertiesReturn = UsePropertiesState & UsePropertiesActions;

// ============================================================================
// HOOK
// ============================================================================

export function useProperties(propertyId?: string): UsePropertiesReturn {
  const supabase = getSupabaseClient();
  const { user } = useAuth();

  // Estado
  const [property, setProperty] = useState<PropertyDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Refs para use cases (evita recriação a cada render)
  const repositoryRef = useRef<SupabasePropertyRepository | MockPropertyRepository | null>(null);
  const createUseCaseRef = useRef<CreatePropertyUseCase | null>(null);
  const loadUseCaseRef = useRef<LoadPropertyUseCase | null>(null);
  const saveStepUseCaseRef = useRef<SavePropertyStepUseCase | null>(null);
  const publishUseCaseRef = useRef<PublishPropertyUseCase | null>(null);
  const deleteUseCaseRef = useRef<DeletePropertyUseCase | null>(null);
  const useMockRef = useRef<boolean>(false);

  // Inicializar use cases
  useEffect(() => {
    if (!supabase) return;

    // Tenta usar Supabase, fallback para Mock se falhar
    try {
      repositoryRef.current = new SupabasePropertyRepository(supabase);
      useMockRef.current = false;
      console.log('📚 Usando SupabasePropertyRepository');
    } catch (e) {
      console.warn('⚠️ Supabase falhou, usando MockPropertyRepository para testes');
      repositoryRef.current = new MockPropertyRepository();
      useMockRef.current = true;
    }

    createUseCaseRef.current = new CreatePropertyUseCase(repositoryRef.current);
    loadUseCaseRef.current = new LoadPropertyUseCase(repositoryRef.current);
    saveStepUseCaseRef.current = new SavePropertyStepUseCase(repositoryRef.current);
    publishUseCaseRef.current = new PublishPropertyUseCase(repositoryRef.current);
    deleteUseCaseRef.current = new DeletePropertyUseCase(repositoryRef.current);
  }, [supabase]);

  // Carregar property ao montar
  useEffect(() => {
    if (!user || !repositoryRef.current) return;

    const loadProperty = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let loadedProperty: PropertyDraft | null = null;

        if (propertyId) {
          // Carregar existente
          loadedProperty = await loadUseCaseRef.current!.execute(propertyId);
          if (!loadedProperty) {
            setError(new Error('Property não encontrada'));
            return;
          }
        } else {
          // Criar novo
          try {
            loadedProperty = await createUseCaseRef.current!.execute(user.organizationId || user.id);
          } catch (supabaseErr) {
            // Se Supabase falhar, usar Mock
            console.warn('⚠️ Falha ao criar via Supabase, usando Mock para testes:', supabaseErr);
            if (!useMockRef.current) {
              repositoryRef.current = new MockPropertyRepository();
              useMockRef.current = true;
              
              // Reinicializar use cases com Mock
              createUseCaseRef.current = new CreatePropertyUseCase(repositoryRef.current);
              loadUseCaseRef.current = new LoadPropertyUseCase(repositoryRef.current);
              saveStepUseCaseRef.current = new SavePropertyStepUseCase(repositoryRef.current);
              publishUseCaseRef.current = new PublishPropertyUseCase(repositoryRef.current);
              deleteUseCaseRef.current = new DeletePropertyUseCase(repositoryRef.current);
            }
            
            loadedProperty = await createUseCaseRef.current!.execute(user.organizationId || user.id);
          }
        }

        setProperty(loadedProperty);
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        console.error('Error loading property:', errorObj);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperty();
  }, [propertyId, user]);

  // ========================================================================
  // AÇÕES
  // ========================================================================

  const saveStep = useCallback(
    async (step: PropertyStep, updates: Partial<PropertyDraft>): Promise<SavePropertyStepResult> => {
      console.log('🔧 [useProperties] saveStep chamado:', { step, updates });
      
      if (!property) {
        return {
          success: false,
          errors: [{ field: 'property', message: 'Property não carregada' }]
        };
      }

      try {
        setIsSaving(true);
        setError(null);

        const result = await saveStepUseCaseRef.current!.execute(property.id, step, updates);

        console.log('🔧 [useProperties] saveStep resultado:', { 
          success: result.success, 
          hasErrors: result.errors && result.errors.length > 0 
        });

        if (result.success && result.property) {
          setProperty(result.property);
          setLastSavedAt(new Date());
        } else {
          setProperty(result.property || property);
          // ❌ NÃO SETAR ERROR STATE POR VALIDAÇÃO - apenas retornar erros
          // if (result.errors && result.errors.length > 0) {
          //   const errorMsg = result.errors.map(e => e.message).join(', ');
          //   setError(new Error(errorMsg));
          // }
        }

        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        console.error('Error saving step:', errorObj);
        return {
          success: false,
          errors: [{ field: 'save', message: errorObj.message }]
        };
      } finally {
        setIsSaving(false);
      }
    },
    [property]
  );

  const publish = useCallback(async (): Promise<boolean> => {
    if (!property) return false;

    try {
      setIsSaving(true);
      setError(null);

      const result = await publishUseCaseRef.current!.execute(property.id);

      if (result.success && result.property) {
        setProperty(result.property);
        setLastSavedAt(new Date());
        return true;
      } else {
        if (result.errors && result.errors.length > 0) {
          const errorMsg = result.errors.map(e => e.message).join(', ');
          setError(new Error(errorMsg));
        }
        return false;
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error('Error publishing:', errorObj);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [property]);

  const deleteProperty = useCallback(async (): Promise<void> => {
    if (!property) return;

    try {
      setIsSaving(true);
      await deleteUseCaseRef.current!.execute(property.id);
      setProperty(null);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error('Error deleting property:', errorObj);
      throw errorObj;
    } finally {
      setIsSaving(false);
    }
  }, [property]);

  const refresh = useCallback(async (): Promise<void> => {
    if (!property) return;

    try {
      setIsLoading(true);
      const reloaded = await loadUseCaseRef.current!.execute(property.id);
      if (reloaded) {
        setProperty(reloaded);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error('Error refreshing:', errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  }, [property]);

  return {
    // Estado
    property,
    isLoading,
    isSaving,
    error,
    lastSavedAt,

    // Ações
    saveStep,
    publish,
    delete: deleteProperty,
    refresh
  };
}
