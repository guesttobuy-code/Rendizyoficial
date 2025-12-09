/**
 * RENDIZY - Property Edit Wizard
 * 
 * Wizard multi-step para edição completa de propriedades
 * ESTRUTURA: 3 BLOCOS → 14 STEPS
 * 
 * @version 1.0.103.292
 * @date 2025-11-04
 * 
 * 🆕 v1.0.103.292:
 * - Removido auto-save agressivo que causava salvamentos indesejados
 * - Botão "Próximo" → "Salvar e Avançar" com salvamento manual
 * - Cada step só salva no backend quando usuário clicar em "Salvar e Avançar"
 */

import { useState, useEffect } from 'react';
import {
  Home,
  MapPin,
  DoorOpen,
  Sparkles,
  Image as ImageIcon,
  FileText,
  DollarSign,
  Receipt,
  ShieldAlert,
  Settings,
  Calendar,
  Tag,
  CalendarRange,
  Share2,
  ChevronRight,
  Save,
  X,
  CheckCircle2,
  Building2,
  Users,
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'; // Mantendo Tabs para Sidebar
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { ContentTypeStep } from './wizard-steps/ContentTypeStep';
import { ContentLocationStep } from './wizard-steps/ContentLocationStep';
import { ContentRoomsStep } from './wizard-steps/ContentRoomsStep';
import { ContentLocationAmenitiesStep } from './wizard-steps/ContentLocationAmenitiesStep';
import ContentAmenitiesStep from './wizard-steps/ContentAmenitiesStep';
import ContentDescriptionStep from './wizard-steps/ContentDescriptionStep';
import SettingsRulesStep from './wizard-steps/SettingsRulesStep';
import { FinancialContractStep } from './wizard-steps/FinancialContractStep';
import { FinancialResidentialPricingStep } from './wizard-steps/FinancialResidentialPricingStep';
import { FinancialSeasonalPricingStep } from './wizard-steps/FinancialSeasonalPricingStep';
import { FinancialDerivedPricingStep } from './wizard-steps/FinancialDerivedPricingStep';
import { FinancialIndividualPricingStep } from './wizard-steps/FinancialIndividualPricingStep';
import { ContentPhotosStep } from './wizard-steps/ContentPhotosStep';
import { useClearDraft } from '../hooks/useAutoSave';
import { useWizardNavigation } from '../hooks/useWizardNavigation';
import { usePropertyData } from '../hooks/usePropertyData';

// ============================================================================
// DEFINIÇÃO DA ESTRUTURA DO WIZARD
// ============================================================================

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  validation: 'required' | 'recommended' | 'optional';
}

interface WizardBlock {
  id: string;
  title: string;
  icon: any;
  color: string;
  steps: WizardStep[];
}

const WIZARD_STRUCTURE: WizardBlock[] = [
  // ========================================
  // BLOCO 1: CONTEÚDO DO ANÚNCIO (7 PASSOS)
  // ========================================
  {
    id: 'content',
    title: 'Conteúdo',
    icon: FileText,
    color: 'blue',
    steps: [
      {
        id: 'content-type',
        title: 'Tipo e Identificação',
        description: 'Que tipo de propriedade você está anunciando?',
        icon: Home,
        validation: 'required',
      },
      {
        id: 'content-location',
        title: 'Localização',
        description: 'Onde fica sua propriedade?',
        icon: MapPin,
        validation: 'required',
      },
      {
        id: 'content-rooms',
        title: 'Cômodos e Distribuição',
        description: 'Como é a distribuição de cômodos?',
        icon: DoorOpen,
        validation: 'recommended',
      },
      {
        id: 'content-location-amenities',
        title: 'Amenidades do Local',
        description: 'Comodidades herdadas do local',
        icon: Building2,
        validation: 'optional',
      },
      {
        id: 'content-property-amenities',
        title: 'Amenidades da Acomodação',
        description: 'Comodidades específicas desta unidade',
        icon: Sparkles,
        validation: 'recommended',
      },
      {
        id: 'content-photos',
        title: 'Fotos e Mídia',
        description: 'Mostre sua propriedade em fotos',
        icon: ImageIcon,
        validation: 'recommended',
      },
      {
        id: 'content-description',
        title: 'Descrição',
        description: 'Descreva sua propriedade',
        icon: FileText,
        validation: 'required',
      },
    ],
  },

  // ========================================
  // BLOCO 2: FINANCEIRO
  // ========================================
  {
    id: 'financial',
    title: 'Financeiro',
    icon: DollarSign,
    color: 'green',
    steps: [
      {
        id: 'financial-contract',
        title: 'Configuração de Relacionamento',
        description: 'Configure titular, remuneração e comunicação',
        icon: FileText,
        validation: 'required',
      },
      {
        id: 'financial-residential-pricing',
        title: 'Preços Locação e Venda',
        description: 'Valores de locação residencial e venda de imóveis',
        icon: Home,
        validation: 'optional',
      },
      {
        id: 'financial-fees',
        title: 'Configuração de preço temporada',
        description: 'Configure taxas de limpeza, serviços e encargos adicionais',
        icon: Receipt,
        validation: 'recommended',
      },
      {
        id: 'financial-pricing',
        title: 'Precificação Individual de Temporada',
        description: 'Defina preços de diárias, períodos sazonais e descontos',
        icon: DollarSign,
        validation: 'required',
      },
      {
        id: 'financial-derived-pricing',
        title: 'Preços Derivados',
        description: 'Configure taxas por hóspede adicional e faixas etárias',
        icon: Users,
        validation: 'recommended',
      },
    ],
  },

  // ========================================
  // BLOCO 3: CONFIGURAÇÕES GERAIS
  // ========================================
  {
    id: 'settings',
    title: 'Configurações',
    icon: Settings,
    color: 'purple',
    steps: [
      {
        id: 'settings-rules',
        title: 'Regras de Hospedagem',
        description: 'Regras da acomodação',
        icon: ShieldAlert,
        validation: 'required',
      },
      {
        id: 'settings-booking',
        title: 'Configurações de Reserva',
        description: 'Como aceitar reservas?',
        icon: Calendar,
        validation: 'optional',
      },
      {
        id: 'settings-tags',
        title: 'Tags e Grupos',
        description: 'Organize sua propriedade',
        icon: Tag,
        validation: 'optional',
      },
      {
        id: 'settings-ical',
        title: 'iCal e Sincronização',
        description: 'Sincronizar calendários',
        icon: CalendarRange,
        validation: 'optional',
      },
      {
        id: 'settings-otas',
        title: 'Integrações OTAs',
        description: 'Canais de distribuição',
        icon: Share2,
        validation: 'optional',
      },
    ],
  },
];

// Criar WIZARD_BLOCKS a partir de WIZARD_STRUCTURE para compatibilidade
const WIZARD_BLOCKS = WIZARD_STRUCTURE.map(block => ({
  id: block.id,
  label: block.title,
  icon: block.icon,
  description: `${block.steps.length} passos neste bloco`,
  steps: block.steps
}));

// ============================================================================
// HELPERS FOR DATA NORMALIZATION
// ============================================================================

/**
 * Normaliza os dados da propriedade (API) para o formato esperado pelo Wizard (State)
 * Garante que os campos aninhados sejam inicializados corretamente.
 */
function normalizePropertyToWizardData(property: any): any {
  if (!property) return {};

  return {
    id: property.id,
    // Step 1: Tipo - ⚠️ Inicialização Robusta (Checar Root > wizardData > wizard_data)
    contentType: {
      propertyTypeId:
        property.propertyTypeId ||
        property.wizardData?.contentType?.propertyTypeId ||
        property.wizard_data?.contentType?.propertyTypeId ||
        undefined,
      accommodationTypeId:
        property.accommodationTypeId ||
        property.wizardData?.contentType?.accommodationTypeId ||
        property.wizard_data?.contentType?.accommodationTypeId ||
        undefined,
      subtipo:
        property.subtipo ||
        property.wizardData?.contentType?.subtipo ||
        property.wizard_data?.contentType?.subtipo ||
        undefined,
      modalidades:
        property.modalidades ||
        property.wizardData?.contentType?.modalidades ||
        property.wizard_data?.contentType?.modalidades ||
        [],
      registrationNumber: property.registrationNumber || '',
      propertyType: property.propertyType || 'individual',
      internalName: property.internalName || property.name || '',
    },
    // Step 2: Localização
    contentLocation: {
      mode: 'new' as 'new' | 'existing',
      selectedLocationId: property.locationId || undefined,
      locationName: property.locationName || undefined,
      locationAmenities: property.locationAmenities || [],
      address: {
        country: property.address?.country || 'BR',
        state: property.address?.state || '',
        stateCode: property.address?.stateCode || '',
        zipCode: property.address?.zipCode || '',
        city: property.address?.city || '',
        neighborhood: property.address?.neighborhood || '',
        street: property.address?.street || '',
        number: property.address?.number || '',
        complement: property.address?.complement || '',
        latitude: property.address?.latitude || undefined,
        longitude: property.address?.longitude || undefined,
      },
      showBuildingNumber: 'global' as 'global' | 'individual',
      photos: property.locationPhotos || [],
      hasExpressCheckInOut: property.hasExpressCheckInOut || false,
      hasParking: property.hasParking || false,
      hasCableInternet: property.hasCableInternet || false,
      hasWiFi: property.hasWiFi || false,
      has24hReception: property.has24hReception || false,
    },
    // Step 3: Cômodos
    contentRooms: {
      rooms: property.rooms || [],
    },
    // Step 4: Amenidades
    contentAmenities: {
      propertyAmenities: property.amenities || property.propertyAmenities || [],
      inheritLocationAmenities: property.inheritLocationAmenities !== false,
    },
    // Step 6: Fotos e Mídia
    contentPhotos: property.contentPhotos || {
      photos: property.photos || [],
      coverPhotoId: property.coverPhotoId || undefined
    },
    // Step 7: Descrição
    contentDescription: {
      fixedFields: property.descriptionFields || {},
      customFieldsValues: property.customDescriptionFieldsValues || {},
      autoTranslate: false,
    },
    // Mantém outros campos para segurança
    ...property.wizardData, // fallback para outros dados já salvos
    ...property.wizard_data // fallback snake_case
  };
}

function getStepValidation(
  step: WizardStep,
  modalidades?: string[]
): 'required' | 'recommended' | 'optional' {
  // Se é aluguel por temporada E o passo está no bloco de Conteúdo
  if (modalidades?.includes('short_term_rental')) {
    const contentBlock = WIZARD_STRUCTURE.find(b => b.id === 'content');
    const isContentStep = contentBlock?.steps.some(s => s.id === step.id);

    if (isContentStep) {
      return 'required'; // Todos os 7 passos são obrigatórios
    }
  }

  // Caso contrário, mantém a validação original
  return step.validation;
}

// ============================================================================
// TYPES
// ============================================================================

interface PropertyEditWizardProps {
  open: boolean;
  onClose: () => void;
  property: any;
  onSave: (data: any) => void;
  isSaving?: boolean;
  isFullScreen?: boolean; // Novo: indica se está em modo full-screen
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PropertyEditWizard({
  open,
  onClose,
  property: initialProperty, // Usado apenas para ID inicial se necessário
  onSave,
  isSaving = false,
  isFullScreen = false,
}: PropertyEditWizardProps) {
  // Navigation Hook
  const {
    currentStep,
    currentStepIndex,
    steps: allSteps,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    propertyId
  } = useWizardNavigation();

  // Data Hook - Fetch fresh data on every mount/step change
  const {
    property: remoteProperty,
    loading: isLoadingRemote,
    saveProperty
  } = usePropertyData(propertyId);

  // Local State for the CURRENT STEP form data via "Controlled Components" pattern
  // Inicializamos com os dados remotos normalizados
  const [wizardState, setWizardState] = useState<any>(normalizePropertyToWizardData(initialProperty));
  const [isSavingInternal, setIsSavingInternal] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Hook de ações (para cancelEditing e updateProperty se necessário)
  const clearDraft = useClearDraft();

  // Sync Local State with Remote Data when Remote Data loads
  // Isso garante que ao navegar para um passo, ele receba os dados frescos do servidor
  useEffect(() => {
    if (remoteProperty) {
      console.log('🔄 [Wizard] Sincronizando dados remotos...');
      const normalized = normalizePropertyToWizardData(remoteProperty);
      setWizardState((prev: any) => ({
        ...prev,
        ...normalized,
      }));
    }
  }, [remoteProperty, currentStep?.id]);

  // Se não houver step ativo (URL raiz /edit/), redirecionar para o primeiro
  useEffect(() => {
    if (!currentStep && propertyId) {
      goToStep(allSteps[0].path);
    }
  }, [currentStep, propertyId, allSteps, goToStep]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const currentBlockId = WIZARD_STRUCTURE.find(b => b.steps.some(s => s.id === currentStep?.id))?.id || 'content';

  const getCurrentBlock = () => {
    return WIZARD_STRUCTURE.find((block) => block.id === currentBlockId) || WIZARD_STRUCTURE[0];
  };

  const currentStepDef = currentStep ? WIZARD_STRUCTURE.flatMap(b => b.steps).find(s => s.id === currentStep.id) : null;

  const getValidationBadge = (validation?: string) => {
    if (!validation) return null;

    switch (validation) {
      case 'required':
        return (
          <Badge variant="destructive" className="text-xs">
            Obrigatório
          </Badge>
        );
      case 'recommended':
        return (
          <Badge variant="default" className="text-xs bg-amber-500">
            Recomendado
          </Badge>
        );
      case 'optional':
        return (
          <Badge variant="outline" className="text-xs">
            Opcional
          </Badge>
        );
      default:
        return null;
    }
  };

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  const handleSaveAndNext = async () => {
    setIsSavingInternal(true);
    try {
      console.log('💾 [Wizard] Salvando passo atual:', currentStep?.id);

      const success = await saveProperty(wizardState);

      if (success) {
        if (currentStepIndex === allSteps.length - 1) {
          toast.success('Propriedade finalizada com sucesso!');
          onClose(); // Voltar para lista
        } else {
          goToNextStep();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar passo.');
    } finally {
      setIsSavingInternal(false);
    }
  };

  // ============================================================================
  // RENDER STEP CONTENT
  // ============================================================================

  const renderStepContent = () => {
    if (!currentStep || isLoadingRemote) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados do passo...</p>
          </div>
        </div>
      );
    }

    // Renderização Condicional baseada no ID do passo (URL)

    switch (currentStep.id) {
      // BLOCO 1: CONTEÚDO
      case 'content-type':
        return <ContentTypeStep />;
      case 'content-location':
        return <ContentLocationStep />;
      case 'content-rooms':
        return <ContentRoomsStep />;
      case 'content-location-amenities':
        // Preparar dados para o componente (compatibilidade com estrutura antiga e nova)
        const locationAmenitiesData = wizardState.contentLocationAmenities || {
          tickableAmenities: wizardState.contentLocation?.locationAmenities || [],
          // Defaults para objetos complexos se não existirem
          checkInCheckout: { enabled: false },
          parking: { enabled: false },
          cableInternet: { enabled: false },
          wifiInternet: { enabled: false },
          reception24h: { enabled: false }
        };

      case 'content-location-amenities':
        return <ContentLocationAmenitiesStep />;
      case 'content-property-amenities':
        return <ContentAmenitiesStep />;
      case 'content-photos':
        return <ContentPhotosStep />;
      case 'content-description':
        return <ContentDescriptionStep />;

      // BLOCO 2: FINANCEIRO
      case 'financial-contract':
        return <FinancialContractStep />;
      case 'financial-residential-pricing':
        return <FinancialResidentialPricingStep />;
      case 'financial-fees':
        return <FinancialSeasonalPricingStep />;
      case 'financial-pricing':
        return <FinancialIndividualPricingStep />;
      case 'financial-derived-pricing':
        return <FinancialDerivedPricingStep />;

      // BLOCO 3: CONFIGURAÇÕES
      case 'settings-rules':
        return <SettingsRulesStep />;

      // FALLBACK SAFE
      default:
        return (
          <div className="p-8 text-center border rounded-lg bg-muted/20">
            <h3 className="text-lg font-medium">{currentStep.label}</h3>
            <p className="text-muted-foreground mb-4">Este passo ainda não foi migrado ou não foi encontrado.</p>
            <Button onClick={handleSaveAndNext}>Salvar e Continuar (Pular)</Button>
          </div>
        );
    }
  };

  // ============================================================================
  // SIDEBAR RENDER
  // ============================================================================

  return (
    <div className={`flex flex-col h-full bg-background ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-64 border-r bg-muted/30 overflow-y-auto hidden md:block">
          <div className="p-4 space-y-6">
            {WIZARD_STRUCTURE.map((block) => (
              <div key={block.id}>
                <div className="flex items-center gap-2 mb-2 px-2">
                  <div className={`p-1.5 rounded-md bg-${block.color}-100 dark:bg-${block.color}-900/30 text-${block.color}-600`}>
                    <block.icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-medium text-sm">{block.title}</h3>
                </div>

                <div className="space-y-0.5">
                  {block.steps.map((step) => {
                    const navStep = allSteps.find(s => s.id === step.id);
                    const isActive = currentStep?.id === step.id;
                    const isCompleted = completedSteps.has(step.id);
                    const dynamicValidation = getStepValidation(step, wizardState.contentType?.modalidades);

                    return (
                      <button
                        key={step.id}
                        onClick={() => navStep && goToStep(navStep.path)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors
                          ${isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                        `}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          ) : (
                            <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-gray-300'}`} />
                          )}
                          <span className="truncate">{step.title}</span>
                        </div>

                        {/* Validation Badge */}
                        {getValidationBadge(dynamicValidation) && isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" title="Obrigatório" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Header do Passo */}
          <header className="border-b px-6 py-4 flex items-center justify-between bg-background">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {currentStepDef?.title || 'Editando Propriedade'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentStepDef?.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {isSavingInternal ? 'Salvando...' : 'Alterações não salvas'}
              </span>
              <Button
                onClick={handleSaveAndNext}
                disabled={isSavingInternal || isLoadingRemote}
                className="gap-2"
              >
                {isSavingInternal ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" /> : <Save className="h-4 w-4" />}
                {currentStepIndex === allSteps.length - 1 ? 'Finalizar' : 'Salvar e Avançar'}
              </Button>
            </div>
          </header>

          {/* Conteúdo do Scroll */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
              {renderStepContent()}
            </div>
          </div>

          {/* Footer de Navegação */}
          <div className="border-t p-4 bg-background flex justify-between items-center">
            <Button variant="ghost" onClick={goToPreviousStep} disabled={currentStepIndex === 0}>
              Anterior
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onClose()}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAndNext} disabled={isSavingInternal}>
                {currentStepIndex === allSteps.length - 1 ? 'Finalizar' : 'Próximo'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}