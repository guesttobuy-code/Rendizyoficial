/**
 * PÁGINA - Property Editor Page
 * Orquestra componentes + hook para criar/editar properties
 * VERSÃO 3: 17 Steps em 3 Blocos (Conteúdo, Financeiro, Configurações)
 * PERSISTÊNCIA: Backup automático em localStorage + sincronização
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { usePersistence } from '../utils/persistenceManager';
import { PropertyStep } from '../domain/properties/types';
import { PropertyStep1OTA } from '../components/properties/PropertyStep1OTA';
import { PropertyStep2Location } from '../components/properties/steps/content/PropertyStep2Location';
import { PropertyStep3Rooms } from '../components/properties/steps/content/PropertyStep3Rooms';
import { PropertyStep4Tour } from '../components/properties/steps/content/PropertyStep4Tour';
import { PropertyStep5LocalAmenities } from '../components/properties/steps/content/PropertyStep5LocalAmenities';
import { PropertyStep6AccommodationAmenities } from '../components/properties/steps/content/PropertyStep6AccommodationAmenities';
import { PropertyStep7Description } from '../components/properties/steps/content/PropertyStep7Description';
import { PropertyStep8Contract } from '../components/properties/steps/financial/PropertyStep8Contract';
import { PropertyStep9ResidentialPricing } from '../components/properties/steps/financial/PropertyStep9ResidentialPricing';
import { PropertyStep10SeasonalConfig } from '../components/properties/steps/financial/PropertyStep10SeasonalConfig';
import { PropertyStep11IndividualPricing } from '../components/properties/steps/financial/PropertyStep11IndividualPricing';
import { PropertyStep12DerivedPricing } from '../components/properties/steps/financial/PropertyStep12DerivedPricing';
import { PropertyStep13Rules } from '../components/properties/steps/settings/PropertyStep13Rules';
import { PropertyStep14BookingConfig } from '../components/properties/steps/configuration/PropertyStep14BookingConfig';
import { PropertyStep15TagsGroups } from '../components/properties/steps/settings/PropertyStep15TagsGroups';
import { PropertyStep16ICalSync } from '../components/properties/steps/configuration/PropertyStep16ICalSync';
import { PropertyStep17OTAIntegrations } from '../components/properties/steps/configuration/PropertyStep17OTAIntegrations';
import { 
  PropertyStepId, 
  PROPERTY_STEPS, 
  getStepConfig,
  getStepsByBlock,
  getBlockTitle,
  getValidationBadgeColor,
  getValidationLabel,
  mapStepIdToPropertyStep
} from '../utils/propertySteps';
import { Check } from 'lucide-react';

export function PropertyEditorPage() {
  const { id: propertyId } = useParams<{ id?: string }>();
  const { property, isLoading, isSaving, error, lastSavedAt, saveStep, publish, refresh } =
    useProperties(propertyId);

  // Persistência Manager (auto-inicializado com property ID)
  usePersistence(propertyId);

  const [currentStep, setCurrentStep] = useState<PropertyStepId>(PropertyStepId.TYPE_IDENTIFICATION);
  const [currentBlock, setCurrentBlock] = useState<string>('content');
  const [draftData, setDraftData] = useState<any>({}); // Estado temporário para edições
  const [showValidation, setShowValidation] = useState(false); // Controlar quando mostrar erros

  // Métodos para navegação entre steps
  const handleNextStep = () => {
    const nextStep = currentStep + 1;
    if (nextStep <= 17) {
      setCurrentStep(nextStep as PropertyStepId);
      // Atualizar bloco se necessário
      const nextConfig = getStepConfig(nextStep as PropertyStepId);
      if (nextConfig) {
        setCurrentBlock(nextConfig.block);
      }
    }
  };

  const handlePreviousStep = () => {
    const previousStep = currentStep - 1;
    if (previousStep >= PropertyStepId.TYPE_IDENTIFICATION) {
      setCurrentStep(previousStep as PropertyStepId);
      // Atualizar bloco se necessário
      const prevConfig = getStepConfig(previousStep as PropertyStepId);
      if (prevConfig) {
        setCurrentBlock(prevConfig.block);
      }
    }
  };

  const handleGoToStep = (stepId: PropertyStepId) => {
    setCurrentStep(stepId);
    const stepConfig = getStepConfig(stepId);
    if (stepConfig) {
      setCurrentBlock(stepConfig.block);
    }
  };

  // Salvar step e avançar
  const handleSaveAndNext = async (updates: any) => {
    const result = await saveStep(currentStep, updates);
    if (result.success) {
      handleNextStep();
    }
  };

  // Publicar propriedade
  const handlePublish = async () => {
    if (!property) return;

    const success = await publish();
    if (success) {
      setCurrentStep(PropertyStep.PUBLISH);
    }
  };

  // Estado de carregamento
  if (isLoading || !property) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando propriedade...</p>
        </div>
      </div>
    );
  }

  // DEBUG: Verificar se property tem erros ao carregar
  console.log('🔍 [PropertyEditorPage] Property carregada:', {
    id: property.id,
    version: property.version,
    completedSteps: property.completedSteps.size,
    hasErrors: property.stepErrors.size > 0,
    basicInfo: property.basicInfo
  });

  // Erros
  if (error) {
    console.error('❌ [PropertyEditorPage] Error state:', error);
    return (
      <div className="min-h-screen bg-red-50 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Erro ao carregar propriedade</h1>
          <p className="text-red-700 mb-4">{error.message}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Obter erros do step atual (SAFE: nunca quebra render)
  const stepErrors = property.stepErrors.get(currentStep) || [];
  
  // Converter erros de array para objeto chave-valor (COM SEGURANÇA)
  const errorsMap: Record<string, string> = {};
  try {
    stepErrors.forEach((error) => {
      if (error && error.field && error.message) {
        errorsMap[error.field] = error.message;
      }
    });
  } catch (err) {
    console.warn('⚠️ Erro ao processar stepErrors:', err);
  }

  // Só mostrar erros se showValidation === true E se não for propriedade nova
  const isNewProperty = property.completedSteps.size === 0 && property.version === 1;
  const visibleErrors = (showValidation && !isNewProperty) ? errorsMap : {};

  // Renderizar step atual
  const renderStep = () => {
    switch (currentStep) {
      case PropertyStepId.TYPE_IDENTIFICATION:
        return (
          <PropertyStep1OTA
            data={draftData.basicInfo || property.basicInfo}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                basicInfo: { ...(draftData.basicInfo || property.basicInfo), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.basicInfo || property.basicInfo;
              const result = await saveStep(PropertyStep.BASIC_INFO, { basicInfo: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.LOCATION:
        return (
          <PropertyStep2Location
            data={{ ...((draftData as any).address || property.address || {}), propertyId }}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                address: { ...((draftData as any).address || property.address || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = (draftData as any).address || property.address || {};
              const result = await saveStep(PropertyStep.ADDRESS, { address: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.ROOMS:
        return (
          <PropertyStep3Rooms
            data={draftData.rooms || property.rooms || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                rooms: { ...(draftData.rooms || property.rooms || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.rooms || property.rooms || {};
              const result = await saveStep(currentStep, { rooms: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.TOUR:
        return (
          <PropertyStep4Tour
            data={draftData.tour || property.tour || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                tour: { ...(draftData.tour || property.tour || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.tour || property.tour || {};
              const result = await saveStep(currentStep, { tour: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.LOCAL_AMENITIES:
        return (
          <PropertyStep5LocalAmenities
            data={draftData.localAmenities || property.localAmenities || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                localAmenities: { ...(draftData.localAmenities || property.localAmenities || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.localAmenities || property.localAmenities || {};
              const result = await saveStep(currentStep, { localAmenities: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.ACCOMMODATION_AMENITIES:
        return (
          <PropertyStep6AccommodationAmenities
            data={draftData.accommodationAmenities || property.accommodationAmenities || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                accommodationAmenities: { ...(draftData.accommodationAmenities || property.accommodationAmenities || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.accommodationAmenities || property.accommodationAmenities || {};
              const result = await saveStep(currentStep, { accommodationAmenities: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.DESCRIPTION:
        return (
          <PropertyStep7Description
            data={draftData.description || property.description || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                description: { ...(draftData.description || property.description || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.description || property.description || {};
              const result = await saveStep(currentStep, { description: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      // Placeholder para Steps 8-17
      case PropertyStepId.CONTRACT:
        return (
          <PropertyStep8Contract
            data={draftData.contract || property.contract || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                contract: { ...(draftData.contract || property.contract || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.contract || property.contract || {};
              const result = await saveStep(currentStep, { contract: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.RULES:
        return (
          <PropertyStep13Rules
            data={draftData.rules || property.rules || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                rules: { ...(draftData.rules || property.rules || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.rules || property.rules || {};
              const result = await saveStep(currentStep, { rules: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.RESIDENTIAL_PRICING:
        return (
          <PropertyStep9ResidentialPricing
            data={draftData.pricing || property.pricing || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                pricing: { ...(draftData.pricing || property.pricing || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.pricing || property.pricing || {};
              const result = await saveStep(currentStep, { pricing: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.SEASONAL_CONFIG:
        return (
          <PropertyStep10SeasonalConfig
            data={draftData.seasonalConfig || property.seasonalConfig || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                seasonalConfig: { ...(draftData.seasonalConfig || property.seasonalConfig || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.seasonalConfig || property.seasonalConfig || {};
              const result = await saveStep(currentStep, { seasonalConfig: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.INDIVIDUAL_PRICING:
        return (
          <PropertyStep11IndividualPricing
            data={draftData.individualPricing || property.individualPricing || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                individualPricing: { ...(draftData.individualPricing || property.individualPricing || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.individualPricing || property.individualPricing || {};
              const result = await saveStep(currentStep, { individualPricing: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.DERIVED_PRICING:
        return (
          <PropertyStep12DerivedPricing
            data={draftData.derivedPricing || property.derivedPricing || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                derivedPricing: { ...(draftData.derivedPricing || property.derivedPricing || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.derivedPricing || property.derivedPricing || {};
              const result = await saveStep(currentStep, { derivedPricing: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.BOOKING_CONFIG:
        return (
          <PropertyStep14BookingConfig
            data={draftData.bookingConfig || property.bookingConfig || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                bookingConfig: { ...(draftData.bookingConfig || property.bookingConfig || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.bookingConfig || property.bookingConfig || {};
              const result = await saveStep(currentStep, { bookingConfig: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.TAGS_GROUPS:
        return (
          <PropertyStep15TagsGroups
            data={draftData.tagsGroups || property.tagsGroups || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                tagsGroups: { ...(draftData.tagsGroups || property.tagsGroups || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.tagsGroups || property.tagsGroups || {};
              const result = await saveStep(currentStep, { tagsGroups: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.ICAL_SYNC:
        return (
          <PropertyStep16ICalSync
            data={draftData.icalSync || property.icalSync || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                icalSync: { ...(draftData.icalSync || property.icalSync || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.icalSync || property.icalSync || {};
              const result = await saveStep(currentStep, { icalSync: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      case PropertyStepId.OTA_INTEGRATIONS:
        return (
          <PropertyStep17OTAIntegrations
            data={draftData.otaIntegrations || property.otaIntegrations || {}}
            errors={visibleErrors}
            onChange={(field, value) => {
              setDraftData({
                ...draftData,
                otaIntegrations: { ...(draftData.otaIntegrations || property.otaIntegrations || {}), [field]: value }
              });
              setShowValidation(false);
            }}
            onSave={async () => {
              setShowValidation(true);
              const dataToSave = draftData.otaIntegrations || property.otaIntegrations || {};
              const result = await saveStep(currentStep, { otaIntegrations: dataToSave });
              
              if (result.success) {
                handleNextStep();
                setDraftData({});
                setShowValidation(false);
              }
            }}
            isSaving={isSaving}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {propertyId ? 'Editar Propriedade' : 'Nova Propriedade'}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600">ID: {property.id}</p>
            {lastSavedAt && (
              <p className="text-sm text-green-600">
                ✓ Última atualização: {lastSavedAt.toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {currentStep} de 17 passos
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((currentStep / 17) * 100)}% completo
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 17) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Block Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {(['content', 'financial', 'settings'] as PropertyBlock[]).map((block) => (
              <button
                key={block}
                onClick={() => {
                  setCurrentBlock(block);
                  const firstStepInBlock = getStepsByBlock(block)[0];
                  if (firstStepInBlock) {
                    setCurrentStep(firstStepInBlock.id);
                  }
                }}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  currentBlock === block
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {getBlockTitle(block)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Steps */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Passos</h3>
              <nav className="space-y-1">
                {getStepsByBlock(currentBlock).map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = property.completedSteps.has(step.id);
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => handleGoToStep(step.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors flex items-center gap-2 ${
                        isActive
                          ? 'bg-black text-white font-medium'
                          : isCompleted
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {isCompleted ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-gray-400'}`} />
                        )}
                      </div>
                      <span className="flex-1">{step.title}</span>
                      {step.validation && (
                        <span 
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            step.validation === 'required' 
                              ? 'bg-red-100 text-red-700' 
                              : step.validation === 'recommended'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {getValidationLabel(step.validation)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-8">
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
