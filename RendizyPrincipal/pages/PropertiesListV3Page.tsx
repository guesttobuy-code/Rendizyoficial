/**
 * PROPERTIES V3 - Lista de Propriedades
 * Página de listagem com botão para criar nova
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { PropertyDraft, getCompletionPercentage } from '../domain/properties/types';
import { SupabasePropertyRepository } from '../infrastructure/repositories/PropertyRepository';
import { getSupabaseClient } from '../utils/supabase/client';
import { useAuth } from '../hooks/useAuth';

export function PropertiesListV3Page() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadProperties();
  }, [user]);

  const loadProperties = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const supabase = getSupabaseClient();
      const repository = new SupabasePropertyRepository(supabase);
      const tenantId = user.organizationId || user.id;
      const list = await repository.listByTenant(tenantId);
      setProperties(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('Error loading properties:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta propriedade?')) return;

    try {
      const supabase = getSupabaseClient();
      const repository = new SupabasePropertyRepository(supabase);
      await repository.delete(propertyId);
      await loadProperties();
    } catch (err) {
      console.error('Error deleting property:', err);
      alert('Erro ao deletar propriedade');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando propriedades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Erro ao carregar</h2>
          <p className="text-red-700">{error.message}</p>
          <button
            onClick={loadProperties}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Properties V3</h1>
                <p className="text-gray-600">Arquitetura limpa e dados persistentes</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/properties/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Nova Propriedade
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {properties.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma propriedade</h2>
            <p className="text-gray-600 mb-6">Crie sua primeira propriedade usando o botão acima</p>
            <button
              onClick={() => navigate('/properties/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Criar primeira propriedade
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                {/* Header do card */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {property.basicInfo.internalName || 'Sem nome'}
                      </h3>
                      <p className="text-sm text-gray-500">ID: {property.id.slice(0, 16)}...</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        property.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : property.status === 'archived'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {property.status === 'published'
                        ? 'Publicado'
                        : property.status === 'archived'
                        ? 'Arquivado'
                        : 'Rascunho'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {property.basicInfo.propertyType && (
                        <span className="capitalize">{property.basicInfo.propertyType}</span>
                      )}
                      {property.basicInfo.accommodationType && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{property.basicInfo.accommodationType}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {property.basicInfo.modalities && property.basicInfo.modalities.size > 0 && (
                        <span className="capitalize">{Array.from(property.basicInfo.modalities).join(', ')}</span>
                      )}
                      {property.address.city && (
                        <>
                          <span>•</span>
                          <span>
                            {property.address.city}, {property.address.state}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-700">Progresso</span>
                      <span className="text-xs text-gray-600">{getCompletionPercentage(property)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${getCompletionPercentage(property)}%` }}
                      />
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Criado: {new Date(property.createdAt).toLocaleDateString('pt-BR')}</p>
                    <p>Atualizado: {new Date(property.updatedAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between bg-gray-50">
                  <button
                    onClick={() => navigate(`/properties/${property.id}/edit`)}
                    className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(property.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
