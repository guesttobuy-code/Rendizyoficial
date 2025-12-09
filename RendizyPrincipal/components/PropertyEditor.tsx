/**
 * UI COMPONENTS - Property Editor
 * Componentes puros que recebem dados e callbacks
 */

import React, { useState } from 'react';
import { PropertyDraft, PropertyStep, getStepTitle, getStepFields } from '../domain/properties/types';
import { ValidationError } from '../domain/properties/types';

// ============================================================================
// BASIC INFO STEP
// ============================================================================

interface BasicInfoStepProps {
  property: PropertyDraft;
  isLoading?: boolean;
  isSaving?: boolean;
  errors?: ValidationError[];
  onSave: (data: Partial<PropertyDraft>) => Promise<void>;
}

export function BasicInfoStep({
  property,
  isLoading = false,
  isSaving = false,
  errors = [],
  onSave
}: BasicInfoStepProps) {
  const [data, setData] = useState(property.basicInfo);

  const handleSave = async () => {
    await onSave({ basicInfo: data });
  };

  const getFieldError = (fieldName: string) => {
    return errors.find(e => e.field === fieldName)?.message || '';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{getStepTitle(PropertyStep.BASIC_INFO)}</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Título *</label>
        <input
          type="text"
          value={data.title}
          onChange={e => setData({ ...data, title: e.target.value })}
          disabled={isLoading || isSaving}
          className={`w-full px-3 py-2 border rounded-md ${
            getFieldError('title') ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Nome da propriedade"
        />
        {getFieldError('title') && (
          <p className="text-red-500 text-sm mt-1">{getFieldError('title')}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descrição *</label>
        <textarea
          value={data.description}
          onChange={e => setData({ ...data, description: e.target.value })}
          disabled={isLoading || isSaving}
          className={`w-full px-3 py-2 border rounded-md ${
            getFieldError('description') ? 'border-red-500' : 'border-gray-300'
          }`}
          rows={4}
          placeholder="Descreva a propriedade em detalhes"
        />
        {getFieldError('description') && (
          <p className="text-red-500 text-sm mt-1">{getFieldError('description')}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tipo de Propriedade *</label>
        <select
          value={data.type}
          onChange={e => setData({ ...data, type: e.target.value as any })}
          disabled={isLoading || isSaving}
          className={`w-full px-3 py-2 border rounded-md ${
            getFieldError('type') ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="residential">Residencial</option>
          <option value="commercial">Comercial</option>
          <option value="land">Terreno</option>
          <option value="other">Outro</option>
        </select>
        {getFieldError('type') && (
          <p className="text-red-500 text-sm mt-1">{getFieldError('type')}</p>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={isLoading || isSaving}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? 'Salvando...' : 'Salvar e Avançar'}
      </button>
    </div>
  );
}

// ============================================================================
// ADDRESS STEP
// ============================================================================

interface AddressStepProps {
  property: PropertyDraft;
  isLoading?: boolean;
  isSaving?: boolean;
  errors?: ValidationError[];
  onSave: (data: Partial<PropertyDraft>) => Promise<void>;
}

export function AddressStep({
  property,
  isLoading = false,
  isSaving = false,
  errors = [],
  onSave
}: AddressStepProps) {
  const [data, setData] = useState(property.address);

  const handleSave = async () => {
    await onSave({ address: data });
  };

  const getFieldError = (fieldName: string) => {
    return errors.find(e => e.field === fieldName)?.message || '';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{getStepTitle(PropertyStep.ADDRESS)}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Rua *</label>
          <input
            type="text"
            value={data.street}
            onChange={e => setData({ ...data, street: e.target.value })}
            disabled={isLoading || isSaving}
            className={`w-full px-3 py-2 border rounded-md ${
              getFieldError('street') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nome da rua"
          />
          {getFieldError('street') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('street')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Número *</label>
          <input
            type="text"
            value={data.number}
            onChange={e => setData({ ...data, number: e.target.value })}
            disabled={isLoading || isSaving}
            className={`w-full px-3 py-2 border rounded-md ${
              getFieldError('number') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="123"
          />
          {getFieldError('number') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('number')}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Complemento</label>
        <input
          type="text"
          value={data.complement || ''}
          onChange={e => setData({ ...data, complement: e.target.value })}
          disabled={isLoading || isSaving}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Apto 101, Bloco A, etc"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cidade *</label>
          <input
            type="text"
            value={data.city}
            onChange={e => setData({ ...data, city: e.target.value })}
            disabled={isLoading || isSaving}
            className={`w-full px-3 py-2 border rounded-md ${
              getFieldError('city') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="São Paulo"
          />
          {getFieldError('city') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('city')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Estado *</label>
          <input
            type="text"
            value={data.state}
            onChange={e => setData({ ...data, state: e.target.value.toUpperCase() })}
            disabled={isLoading || isSaving}
            maxLength={2}
            className={`w-full px-3 py-2 border rounded-md ${
              getFieldError('state') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="SP"
          />
          {getFieldError('state') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('state')}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">CEP *</label>
        <input
          type="text"
          value={data.zipCode}
          onChange={e => setData({ ...data, zipCode: e.target.value })}
          disabled={isLoading || isSaving}
          className={`w-full px-3 py-2 border rounded-md ${
            getFieldError('zipCode') ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="12345-678"
        />
        {getFieldError('zipCode') && (
          <p className="text-red-500 text-sm mt-1">{getFieldError('zipCode')}</p>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={isLoading || isSaving}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? 'Salvando...' : 'Salvar e Avançar'}
      </button>
    </div>
  );
}

// ============================================================================
// DETAILS STEP
// ============================================================================

interface DetailsStepProps {
  property: PropertyDraft;
  isLoading?: boolean;
  isSaving?: boolean;
  errors?: ValidationError[];
  onSave: (data: Partial<PropertyDraft>) => Promise<void>;
}

export function DetailsStep({
  property,
  isLoading = false,
  isSaving = false,
  errors = [],
  onSave
}: DetailsStepProps) {
  const [data, setData] = useState(property.details);

  const handleSave = async () => {
    await onSave({ details: data });
  };

  const getFieldError = (fieldName: string) => {
    return errors.find(e => e.field === fieldName)?.message || '';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{getStepTitle(PropertyStep.DETAILS)}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Quartos</label>
          <input
            type="number"
            value={data.bedrooms}
            onChange={e => setData({ ...data, bedrooms: parseInt(e.target.value) || 0 })}
            disabled={isLoading || isSaving}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {getFieldError('bedrooms') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('bedrooms')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Banheiros</label>
          <input
            type="number"
            value={data.bathrooms}
            onChange={e => setData({ ...data, bathrooms: parseInt(e.target.value) || 0 })}
            disabled={isLoading || isSaving}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {getFieldError('bathrooms') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('bathrooms')}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Área útil (m²) *</label>
          <input
            type="number"
            value={data.area}
            onChange={e => setData({ ...data, area: parseFloat(e.target.value) || 0 })}
            disabled={isLoading || isSaving}
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-md ${
              getFieldError('area') ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {getFieldError('area') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('area')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Área total (m²) *</label>
          <input
            type="number"
            value={data.totalArea}
            onChange={e => setData({ ...data, totalArea: parseFloat(e.target.value) || 0 })}
            disabled={isLoading || isSaving}
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-md ${
              getFieldError('totalArea') ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {getFieldError('totalArea') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('totalArea')}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ano de construção</label>
        <input
          type="number"
          value={data.buildYear || ''}
          onChange={e => setData({ ...data, buildYear: e.target.value ? parseInt(e.target.value) : undefined })}
          disabled={isLoading || isSaving}
          min="1900"
          max={new Date().getFullYear()}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        {getFieldError('buildYear') && (
          <p className="text-red-500 text-sm mt-1">{getFieldError('buildYear')}</p>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={isLoading || isSaving}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? 'Salvando...' : 'Salvar e Avançar'}
      </button>
    </div>
  );
}

// ============================================================================
// PRICING STEP
// ============================================================================

interface PricingStepProps {
  property: PropertyDraft;
  isLoading?: boolean;
  isSaving?: boolean;
  errors?: ValidationError[];
  onSave: (data: Partial<PropertyDraft>) => Promise<void>;
}

export function PricingStep({
  property,
  isLoading = false,
  isSaving = false,
  errors = [],
  onSave
}: PricingStepProps) {
  const [data, setData] = useState(property.pricing);

  const handleSave = async () => {
    await onSave({ pricing: data });
  };

  const getFieldError = (fieldName: string) => {
    return errors.find(e => e.field === fieldName)?.message || '';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{getStepTitle(PropertyStep.PRICING)}</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Preço *</label>
        <input
          type="number"
          value={data.price}
          onChange={e => setData({ ...data, price: parseFloat(e.target.value) || 0 })}
          disabled={isLoading || isSaving}
          min="0"
          step="0.01"
          className={`w-full px-3 py-2 border rounded-md ${
            getFieldError('price') ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="0.00"
        />
        {getFieldError('price') && (
          <p className="text-red-500 text-sm mt-1">{getFieldError('price')}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Preço por unidade (m²)</label>
        <input
          type="number"
          value={data.pricePerUnit || ''}
          onChange={e =>
            setData({ ...data, pricePerUnit: e.target.value ? parseFloat(e.target.value) : undefined })
          }
          disabled={isLoading || isSaving}
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="0.00"
        />
        {getFieldError('pricePerUnit') && (
          <p className="text-red-500 text-sm mt-1">{getFieldError('pricePerUnit')}</p>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={isLoading || isSaving}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? 'Salvando...' : 'Salvar e Avançar'}
      </button>
    </div>
  );
}

// ============================================================================
// GALLERY STEP
// ============================================================================

interface GalleryStepProps {
  property: PropertyDraft;
  isLoading?: boolean;
  isSaving?: boolean;
  errors?: ValidationError[];
  onSave: (data: Partial<PropertyDraft>) => Promise<void>;
}

export function GalleryStep({
  property,
  isLoading = false,
  isSaving = false,
  errors = [],
  onSave
}: GalleryStepProps) {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');

  const handleAddImage = async () => {
    if (!newImageUrl) return;

    const gallery = {
      ...property.gallery,
      images: [
        ...property.gallery.images,
        {
          id: `img_${Date.now()}`,
          url: newImageUrl,
          caption: newImageCaption,
          order: property.gallery.images.length
        }
      ]
    };

    await onSave({ gallery });
    setNewImageUrl('');
    setNewImageCaption('');
  };

  const handleRemoveImage = async (imageId: string) => {
    const gallery = {
      ...property.gallery,
      images: property.gallery.images.filter(img => img.id !== imageId)
    };

    await onSave({ gallery });
  };

  const getFieldError = (fieldName: string) => {
    return errors.find(e => e.field === fieldName)?.message || '';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{getStepTitle(PropertyStep.GALLERY)}</h3>

      <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">URL da imagem</label>
          <input
            type="url"
            value={newImageUrl}
            onChange={e => setNewImageUrl(e.target.value)}
            disabled={isLoading || isSaving}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />

          <label className="block text-sm font-medium mb-1">Legenda (opcional)</label>
          <input
            type="text"
            value={newImageCaption}
            onChange={e => setNewImageCaption(e.target.value)}
            disabled={isLoading || isSaving}
            placeholder="Ex: Sala de estar"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />

          <button
            onClick={handleAddImage}
            disabled={!newImageUrl || isLoading || isSaving}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            Adicionar imagem
          </button>
        </div>
      </div>

      {getFieldError('gallery') && (
        <p className="text-red-500 text-sm">{getFieldError('gallery')}</p>
      )}

      {property.gallery.images.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold">Imagens adicionadas ({property.gallery.images.length})</h4>
          <div className="grid grid-cols-2 gap-4">
            {property.gallery.images.map(image => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.caption || 'Imagem'}
                  className="w-full h-40 object-cover rounded-md"
                />
                {image.caption && (
                  <p className="text-sm text-gray-600 mt-1">{image.caption}</p>
                )}
                <button
                  onClick={() => handleRemoveImage(image.id)}
                  disabled={isLoading || isSaving}
                  className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() =>
          onSave({})
        }
        disabled={isLoading || isSaving}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? 'Salvando...' : 'Salvar e Avançar'}
      </button>
    </div>
  );
}
