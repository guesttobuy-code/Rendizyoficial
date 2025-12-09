
import { useState, useEffect, useCallback } from 'react';
import { propertiesApi, Property } from '../../../utils/api';
import { toast } from 'sonner';

/**
 * Hook to manage Property Data for the V2 Architecture (Hub & Spoke).
 * 
 * DESIGN PHILOSOPHY:
 * - Server is Truth: We fetch from server.
 * - Atomic Updates: We send only what changed.
 * - Persistence Promise: We return 'isSaving' and 'lastSavedAt' to give user confidence.
 */
export function usePropertyV2(propertyId: string | undefined) {
    const [property, setProperty] = useState<Property | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch on Mount
    useEffect(() => {
        if (!propertyId) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        async function fetchProperty() {
            try {
                setIsLoading(true);
                console.log(`📡 [usePropertyV2] Fetching property ${propertyId}...`);
                const response = await propertiesApi.get(propertyId);

                if (isMounted) {
                    if (response.success && response.data) {
                        console.log('✅ [usePropertyV2] Data loaded:', response.data);

                        // 🆕 FIX: Handle stringified wizardData (persistence resilience)
                        // Backend now force-stringifies wizardData, so we must parse it if it comes as string
                        const loadedProperty = response.data; // Response.data is the property object directly
                        if (typeof loadedProperty.wizardData === 'string') {
                            try {
                                console.log("📦 [usePropertyV2] Parsing stringified wizardData...");
                                loadedProperty.wizardData = JSON.parse(loadedProperty.wizardData);
                            } catch (e) {
                                console.error("❌ [usePropertyV2] Failed to parse wizardData:", e);
                            }
                        }

                        setProperty(loadedProperty);
                        setError(null);
                    } else {
                        console.error('❌ [usePropertyV2] Failed to load:', response.error);
                        setError(response.error || 'Failed to load property');
                        toast.error('Erro ao carregar propriedade');
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error('💥 [usePropertyV2] Crash:', err);
                    setError('Network error');
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchProperty();

        return () => { isMounted = false; };
    }, [propertyId]);

    // 2. Atomic Save Function
    const saveProperty = useCallback(async (dataToUpdate: Partial<Property>) => {
        if (!propertyId) return;

        setIsSaving(true);
        console.log('💾 [usePropertyV2] Saving update:', dataToUpdate);

        // Optimistic UI update (optional - for now we stick to safe update)
        // setProperty(prev => prev ? ({ ...prev, ...dataToUpdate }) : null);

        try {
            const response = await propertiesApi.update(propertyId, dataToUpdate);

            if (response.success && response.data) {
                setLastSaved(new Date());
                setProperty(response.data); // Update with server verification
                toast.success('Alterações salvas com segurança');
                console.log('✅ [usePropertyV2] Update confirmed by server');
                return true;
            } else {
                throw new Error(response.error || 'Autosave failed');
            }
        } catch (err) {
            console.error('❌ [usePropertyV2] Save failed:', err);
            toast.error('Falha ao salvar. Tente novamente.');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [propertyId]);

    return {
        property,
        isLoading,
        isSaving,
        lastSaved,
        error,
        saveProperty, // EXP: Explicit save function
        refetch: () => window.location.reload() // Brutal refresh if needed
    };
}
