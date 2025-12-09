
import { useState, useEffect, useCallback } from 'react';
import { propertiesApi } from '../utils/api';
import { toast } from 'sonner';

export function usePropertyData(propertyId: string | undefined) {
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProperty = useCallback(async () => {
        if (!propertyId || propertyId === 'new') {
            // Se for novo, não busca, apenas retorna null ou objeto vazio inicializado
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await propertiesApi.get(propertyId);
            if (response.success && response.data) {
                setProperty(response.data);
            } else {
                setError('Propriedade não encontrada.');
                toast.error('Erro ao carregar dados da propriedade.');
            }
        } catch (err) {
            console.error(err);
            setError('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    }, [propertyId]);

    useEffect(() => {
        fetchProperty();
    }, [fetchProperty]);

    const saveProperty = async (data: any, showToast = true) => {
        if (!propertyId) return false;

        // Normalizar dados (ex: wizardData) se necessário
        // Aqui assumimos que 'data' é o payload parcial ou completo.
        // A API 'update' do rendizy-server espera o objeto property completo ou parcial?
        // Geralmente update(id, partial) funciona.

        try {
            // Se o passo envia apenas um fragmento (ex: { type: ... }), precisamos garantir
            // que o wizardData seja mesclado corretamente no backend ou aqui.
            // O backend atual já faz merge de wizardData se enviado.

            const response = await propertiesApi.update(propertyId, data);
            if (response.success) {
                if (showToast) toast.success('Salvo com sucesso!');
                // Atualizar estado local com a resposta fresca
                if (response.data) setProperty(response.data);
                return true;
            } else {
                toast.error(response.error || 'Erro ao salvar.');
                return false;
            }
        } catch (e) {
            console.error(e);
            toast.error('Erro ao salvar.');
            return false;
        }
    };

    return { property, loading, error, refetch: fetchProperty, saveProperty };
}
