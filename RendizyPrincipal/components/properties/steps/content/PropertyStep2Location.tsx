/**
 * STEP 2 - Localização
 * Endereço, características e fotos com upload para Supabase
 * Com busca automática de CEP e auto-save em localStorage
 */

import { useState, useRef, useEffect } from 'react';
import { MapPin, Upload, X, AlertCircle, Loader } from 'lucide-react';
import { uploadPropertyPhoto, validateImageFile } from '../../../../utils/supabaseStorage';
import { searchCEP, formatCEP, isValidCEP } from '../../../../utils/cepSearch';
import { usePersistenceAutoSave } from '../../../../hooks/usePersistenceAutoSave';

interface Photo {
  id: string;
  url: string;
  tags: string[];
  order: number;
}

interface PropertyStep2LocationProps {
  data: any;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PropertyStep2Location({
  data,
  errors = {},
  onChange,
  onSave,
  isSaving
}: PropertyStep2LocationProps) {
  const [addressMode, setAddressMode] = useState<'new' | 'existing'>('new');
  const [showBuildingNumber, setShowBuildingNumber] = useState<'global' | 'individual'>('global');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [searchingCEP, setSearchingCEP] = useState(false);
  const [cepError, setCepError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const photos: Photo[] = data?.photos || [];

  const handlePhotosSelect = async (files: FileList | null) => {
    if (!files || !data?.propertyId) {
      setUploadError('ID da propriedade não encontrado');
      return;
    }

    setUploadingPhotos(true);
    setUploadError('');
    const newPhotos: Photo[] = [...photos];
    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validar arquivo
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setUploadError(`${file.name}: ${validation.error}`);
        continue;
      }

      // Upload
      const result = await uploadPropertyPhoto(data.propertyId, file);
      if (result.success && result.url) {
        newPhotos.push({
          id: `photo-${Date.now()}-${i}`,
          url: result.url,
          tags: [],
          order: newPhotos.length
        });
        uploadedCount++;
      } else {
        setUploadError(`${file.name}: ${result.error}`);
      }
    }

    if (uploadedCount > 0) {
      onChange('photos', newPhotos);
    }
    setUploadingPhotos(false);
  };

  const handleRemovePhoto = (photoId: string) => {
    const updated = photos.filter(p => p.id !== photoId);
    onChange('photos', updated);
  };

  const handleCEPChange = (value: string) => {
    // Formatar CEP
    const formatted = formatCEP(value);
    onChange('zipCode', formatted);
    setCepError('');

    // Limpar timeout anterior
    if (cepTimeoutRef.current) {
      clearTimeout(cepTimeoutRef.current);
    }

    // Buscar automaticamente quando completar 8 dígitos
    if (isValidCEP(formatted)) {
      setSearchingCEP(true);
      
      cepTimeoutRef.current = setTimeout(async () => {
        const result = await searchCEP(formatted);
        
        if (result) {
          // Preencher campos automaticamente
          onChange('street', result.logradouro);
          onChange('neighborhood', result.bairro);
          onChange('city', result.localidade);
          onChange('state', result.uf);
          setCepError('');
        } else {
          setCepError('CEP não encontrado');
        }
        
        setSearchingCEP(false);
      }, 600);
    } else if (formatted.length > 0) {
      setSearchingCEP(false);
    }
  };

  // Cleanup timeout ao desmontar
  useEffect(() => {
    return () => {
      if (cepTimeoutRef.current) {
        clearTimeout(cepTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save com localStorage (debounced)
  usePersistenceAutoSave(data?.propertyId, 2, 'Location', data, data && Object.keys(data).length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Localização</h2>
        </div>
        <p className="text-gray-600">Onde fica sua propriedade?</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setAddressMode('new')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            addressMode === 'new'
              ? 'border-black text-black'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Novo endereço
        </button>
        <button
          onClick={() => setAddressMode('existing')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            addressMode === 'existing'
              ? 'border-black text-black'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Vincular a existente
        </button>
      </div>

      {addressMode === 'new' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Endereço */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <select
                value={data?.country || 'Brasil'}
                onChange={(e) => onChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option>Brasil</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={data?.state || ''}
                  onChange={(e) => onChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione</option>
                  <option value="RJ">RJ</option>
                  <option value="SP">SP</option>
                  <option value="MG">MG</option>
                  <option value="BA">BA</option>
                  <option value="SC">SC</option>
                  <option value="RS">RS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP
                  {searchingCEP && <span className="text-blue-600 text-xs ml-2">🔍 buscando...</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={data?.zipCode || ''}
                    onChange={(e) => handleCEPChange(e.target.value)}
                    placeholder="00000-000"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition-colors ${
                      cepError
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                  />
                  {searchingCEP && (
                    <div className="absolute right-3 top-2.5">
                      <Loader className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Digite o CEP para buscar automaticamente a rua, bairro e cidade
                </p>
                {cepError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {cepError}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                value={data?.city || ''}
                onChange={(e) => onChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input
                type="text"
                value={data?.neighborhood || ''}
                onChange={(e) => onChange('neighborhood', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
              <input
                type="text"
                value={data?.street || ''}
                onChange={(e) => onChange('street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input
                  type="text"
                  value={data?.number || ''}
                  onChange={(e) => onChange('number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                <input
                  type="text"
                  value={data?.complement || ''}
                  onChange={(e) => onChange('complement', e.target.value)}
                  placeholder="Apt 101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Mostrar número do prédio?</h4>
              
              <label className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 rounded">
                <input
                  type="radio"
                  checked={showBuildingNumber === 'global'}
                  onChange={() => setShowBuildingNumber('global')}
                />
                <span className="text-sm font-medium text-gray-700">Globalmente</span>
              </label>

              <label className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 rounded">
                <input
                  type="radio"
                  checked={showBuildingNumber === 'individual'}
                  onChange={() => setShowBuildingNumber('individual')}
                />
                <span className="text-sm font-medium text-gray-700">Individual por acomodação</span>
              </label>
            </div>
          </div>

          {/* Características */}
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Características</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data?.hasParking || false}
                    onChange={(e) => onChange('hasParking', e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">Estacionamento</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data?.hasCableTv || false}
                    onChange={(e) => onChange('hasCableTv', e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">Internet a Cabo</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data?.hasWifi || false}
                    onChange={(e) => onChange('hasWifi', e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">Internet Wi-Fi</span>
                </label>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Coordenadas (Opcional)</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={data?.latitude || ''}
                    onChange={(e) => onChange('latitude', parseFloat(e.target.value))}
                    placeholder="-23.1234"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={data?.longitude || ''}
                    onChange={(e) => onChange('longitude', parseFloat(e.target.value))}
                    placeholder="-43.1234"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fotos */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Fotos do Endereço</h3>
        <p className="text-sm text-gray-600 mb-4">Fachadas, áreas externas e características principais</p>

        {/* Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 font-medium">Arraste imagens ou clique</p>
          <p className="text-xs text-gray-500 mt-1">JPG, PNG até 50MB</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handlePhotosSelect(e.target.files)}
            disabled={uploadingPhotos}
            className="hidden"
          />
        </div>

        {uploadError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{uploadError}</p>
          </div>
        )}

        {uploadingPhotos && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            ⏳ Enviando fotos...
          </div>
        )}

        {/* Galeria */}
        {photos.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3">{photos.length} foto(s)</p>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo, idx) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt="Property"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={onSave}
          disabled={isSaving || uploadingPhotos}
          className="px-6 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Salvando...' : uploadingPhotos ? 'Upload...' : 'Salvar e Avançar'}
        </button>
      </div>
    </div>
  );
}
