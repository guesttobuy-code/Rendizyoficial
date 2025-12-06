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

import { useState, useEffect, useCallback, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Building2,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { ContentTypeStep } from "./wizard-steps/ContentTypeStep";
import { ContentLocationStep } from "./wizard-steps/ContentLocationStep";
import { ContentRoomsStep } from "./wizard-steps/ContentRoomsStep";
import ContentLocationAmenitiesStep from "./wizard-steps/ContentLocationAmenitiesStep";
import ContentAmenitiesStep from "./wizard-steps/ContentAmenitiesStep";
import ContentDescriptionStep from "./wizard-steps/ContentDescriptionStep";
import SettingsRulesStep from "./wizard-steps/SettingsRulesStep";
import { FinancialContractStep } from "./wizard-steps/FinancialContractStep";
import { FinancialResidentialPricingStep } from "./wizard-steps/FinancialResidentialPricingStep";
import { FinancialSeasonalPricingStep } from "./wizard-steps/FinancialSeasonalPricingStep";
import { FinancialDerivedPricingStep } from "./wizard-steps/FinancialDerivedPricingStep";
import { FinancialIndividualPricingStep } from "./wizard-steps/FinancialIndividualPricingStep";
import { ContentPhotosStep } from "./wizard-steps/ContentPhotosStep";
// ❌ AUTO-SAVE REMOVIDO v1.0.103.292
// import { useAutoSave, useRestoreDraft, useClearDraft } from '../hooks/useAutoSave';
// import { AutoSaveIndicator } from './AutoSaveIndicator';
import { useRestoreDraft, useClearDraft } from "../hooks/useAutoSave";
import { propertiesApi } from "../utils/api"; // 🆕 Para salvar rascunho no backend

// ✅ LÓGICA DE SALVAMENTO POR PASSO (v1.0.103.XXX)
// IMPORTANTE: Salvar em cada passo para não perder dados se página atualizar
// - Modo CRIAÇÃO: Salva no localStorage como rascunho (não tem property.id ainda)
// - Modo EDIÇÃO: Salva no backend a cada passo (já tem property.id)
// - Último passo: Cria propriedade no backend (modo criação) ou atualiza (modo edição)
//
// RACIOCÍNIO POR TRÁS:
// - Se usuário preenche 10 passos e página atualiza no passo 11, perde tudo
// - Solução: Salvar rascunho a cada passo (localStorage em criação, backend em edição)
// - Último passo: Criar/atualizar definitivamente no backend
import { usePropertyActions } from "../hooks/usePropertyActions";

// ============================================================================
// DEFINIÇÃO DA ESTRUTURA DO WIZARD
// ============================================================================

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  validation: "required" | "recommended" | "optional";
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
    id: "content",
    title: "Conteúdo",
    icon: FileText,
    color: "blue",
    steps: [
      {
        id: "content-type",
        title: "Tipo e Identificação",
        description: "Que tipo de propriedade você está anunciando?",
        icon: Home,
        validation: "required",
      },
      {
        id: "content-location",
        title: "Localização",
        description: "Onde fica sua propriedade?",
        icon: MapPin,
        validation: "required",
      },
      {
        id: "content-rooms",
        title: "Cômodos e Fotos",
        description: "Defina cômodos e adicione fotos",
        icon: DoorOpen,
        validation: "recommended",
      },
      {
        id: "content-photos",
        title: "Tour Visual",
        description: "Visualize o tour da propriedade",
        icon: ImageIcon,
        validation: "recommended",
      },
      {
        id: "content-location-amenities",
        title: "Amenidades do Local",
        description: "Comodidades herdadas do local",
        icon: Building2,
        validation: "optional",
      },
      {
        id: "content-property-amenities",
        title: "Amenidades da Acomodação",
        description: "Comodidades específicas desta unidade",
        icon: Sparkles,
        validation: "recommended",
      },
      {
        id: "content-description",
        title: "Descrição",
        description: "Descreva sua propriedade",
        icon: FileText,
        validation: "required",
      },
    ],
  },

  // ========================================
  // BLOCO 2: FINANCEIRO
  // ========================================
  {
    id: "financial",
    title: "Financeiro",
    icon: DollarSign,
    color: "green",
    steps: [
      {
        id: "financial-contract",
        title: "Configuração de Relacionamento",
        description: "Configure titular, remuneração e comunicação",
        icon: FileText,
        validation: "required",
      },
      {
        id: "financial-residential-pricing",
        title: "Preços Locação e Venda",
        description: "Valores de locação residencial e venda de imóveis",
        icon: Home,
        validation: "optional",
      },
      {
        id: "financial-fees",
        title: "Configuração de preço temporada",
        description:
          "Configure taxas de limpeza, serviços e encargos adicionais",
        icon: Receipt,
        validation: "recommended",
      },
      {
        id: "financial-pricing",
        title: "Precificação Individual de Temporada",
        description: "Defina preços de diárias, períodos sazonais e descontos",
        icon: DollarSign,
        validation: "required",
      },
      {
        id: "financial-derived-pricing",
        title: "Preços Derivados",
        description: "Configure taxas por hóspede adicional e faixas etárias",
        icon: Users,
        validation: "recommended",
      },
    ],
  },

  // ========================================
  // BLOCO 3: CONFIGURAÇÕES GERAIS
  // ========================================
  {
    id: "settings",
    title: "Configurações",
    icon: Settings,
    color: "purple",
    steps: [
      {
        id: "settings-rules",
        title: "Regras de Hospedagem",
        description: "Regras da acomodação",
        icon: ShieldAlert,
        validation: "required",
      },
      {
        id: "settings-booking",
        title: "Configurações de Reserva",
        description: "Como aceitar reservas?",
        icon: Calendar,
        validation: "optional",
      },
      {
        id: "settings-tags",
        title: "Tags e Grupos",
        description: "Organize sua propriedade",
        icon: Tag,
        validation: "optional",
      },
      {
        id: "settings-ical",
        title: "iCal e Sincronização",
        description: "Sincronizar calendários",
        icon: CalendarRange,
        validation: "optional",
      },
      {
        id: "settings-otas",
        title: "Integrações OTAs",
        description: "Canais de distribuição",
        icon: Share2,
        validation: "optional",
      },
    ],
  },
];

// Criar WIZARD_BLOCKS a partir de WIZARD_STRUCTURE para compatibilidade
const WIZARD_BLOCKS = WIZARD_STRUCTURE.map((block) => ({
  id: block.id,
  label: block.title,
  icon: block.icon,
  description: `${block.steps.length} passos neste bloco`,
  steps: block.steps,
}));

// ============================================================================
// 🆕 v1.0.103.109 - LÓGICA DE OBRIGATORIEDADE BASEADA NA CATEGORIA
// 🆕 v1.0.103.XXX - LÓGICA DE RELEVÂNCIA BASEADA NA MODALIDADE
// ============================================================================

/**
 * Mapeamento de quais passos são relevantes para cada modalidade
 *
 * REGRAS:
 * - short_term_rental (Aluguel de Temporada): Passos específicos de temporada
 * - residential_rental (Locação Residencial): Passos específicos de locação
 * - buy_sell (Compra e Venda): Passos específicos de venda
 */
const STEP_MODALITY_MAPPING: Record<string, string[]> = {
  // BLOCO 1: CONTEÚDO - TODOS os passos são relevantes para TODAS as modalidades
  "content-type": ["short_term_rental", "residential_rental", "buy_sell"],
  "content-location": ["short_term_rental", "residential_rental", "buy_sell"],
  "content-rooms": ["short_term_rental", "residential_rental", "buy_sell"],
  "content-location-amenities": [
    "short_term_rental",
    "residential_rental",
    "buy_sell",
  ],
  "content-property-amenities": [
    "short_term_rental",
    "residential_rental",
    "buy_sell",
  ],
  "content-photos": ["short_term_rental", "residential_rental", "buy_sell"],
  "content-description": [
    "short_term_rental",
    "residential_rental",
    "buy_sell",
  ],

  // BLOCO 2: FINANCEIRO - Passos específicos por modalidade
  "financial-contract": ["short_term_rental", "residential_rental", "buy_sell"], // Todas (configuração geral)
  "financial-residential-pricing": ["residential_rental", "buy_sell"], // Apenas residencial e venda
  "financial-fees": ["short_term_rental"], // Apenas temporada (taxas de limpeza, etc)
  "financial-pricing": ["short_term_rental"], // Apenas temporada (preços por noite, sazonalidade)
  "financial-derived-pricing": ["short_term_rental"], // Apenas temporada (hóspedes adicionais, crianças)

  // BLOCO 3: CONFIGURAÇÕES - Passos específicos por modalidade
  "settings-rules": ["short_term_rental", "residential_rental", "buy_sell"], // Todas (mas conteúdo diferente)
  "settings-booking": ["short_term_rental"], // Apenas temporada (reservas por noite)
  "settings-tags": ["short_term_rental", "residential_rental", "buy_sell"], // Todas
  "settings-ical": ["short_term_rental"], // Apenas temporada (sincronização de calendário)
  "settings-otas": ["short_term_rental"], // Apenas temporada (Airbnb, Booking, etc)
};

/**
 * Determina se um passo é relevante para as modalidades selecionadas
 *
 * @param stepId - ID do passo
 * @param modalidades - Array de modalidades selecionadas
 * @returns true se o passo é relevante para pelo menos uma modalidade selecionada
 */
function isStepRelevantForModalities(
  stepId: string,
  modalidades?: string[]
): boolean {
  // Se não há modalidades selecionadas, mostrar todos os passos (comportamento padrão)
  if (!modalidades || modalidades.length === 0) {
    return true;
  }

  // Buscar modalidades relevantes para este passo
  const relevantModalities = STEP_MODALITY_MAPPING[stepId];

  // Se não há mapeamento, assumir que é relevante para todas (comportamento padrão)
  if (!relevantModalities) {
    console.warn(
      `⚠️ [PropertyEditWizard] Passo ${stepId} não tem mapeamento de modalidades`
    );
    return true;
  }

  // Verificar se pelo menos uma modalidade selecionada está na lista de relevantes
  const isRelevant = modalidades.some((mod) =>
    relevantModalities.includes(mod)
  );

  // Log para debug (apenas em desenvolvimento)
  if (process.env.NODE_ENV === "development") {
    console.log(
      `🔍 [isStepRelevantForModalities] Step: ${stepId}, Modalidades: [${modalidades.join(
        ", "
      )}], Relevantes: [${relevantModalities.join(
        ", "
      )}], Resultado: ${isRelevant}`
    );
  }

  return isRelevant;
}

/**
 * Determina se um passo é obrigatório baseado na categoria selecionada
 *
 * REGRAS:
 * - Aluguel por temporada: TODOS os 7 passos do Conteúdo são obrigatórios
 * - Locação residencial: Apenas os obrigatórios originais
 * - Compra e venda: Apenas os obrigatórios originais
 * - Múltiplas categorias: Se "Aluguel por temporada" estiver marcado, todos obrigatórios
 *
 * 🆕 v1.0.103.109: Agora suporta array de modalidades
 */
function getStepValidation(
  step: WizardStep,
  modalidades?: string[]
): "required" | "recommended" | "optional" {
  // Se é aluguel por temporada E o passo está no bloco de Conteúdo
  if (modalidades?.includes("short_term_rental")) {
    const contentBlock = WIZARD_STRUCTURE.find((b) => b.id === "content");
    const isContentStep = contentBlock?.steps.some((s) => s.id === step.id);

    if (isContentStep) {
      return "required"; // Todos os 7 passos são obrigatórios
    }
  }

  // 🆕 Step 01 Financeiro: Para compra e venda = recomendado (não obrigatório)
  if (step.id === "financial-contract") {
    const isOnlyBuySell =
      modalidades?.length === 1 && modalidades.includes("buy_sell");
    if (isOnlyBuySell) {
      return "recommended"; // Apenas recomendado para compra e venda
    }
  }

  // 🆕 Step 01 Configurações: Para compra e venda = opcional (não obrigatório)
  if (step.id === "settings-rules") {
    const isOnlyBuySell =
      modalidades?.length === 1 && modalidades.includes("buy_sell");
    if (isOnlyBuySell) {
      return "optional"; // Opcional para compra e venda
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
  property,
  onSave,
  isSaving = false,
  isFullScreen = false,
}: PropertyEditWizardProps) {
  console.log("🚀 [Wizard] PropertyEditWizard montando...");
  console.log("📊 [Wizard] Props:", {
    open,
    hasProperty: !!property,
    propertyId: property?.id,
    isSaving,
    isFullScreen,
  });

  // ✅ PROTEÇÃO: Verificar se onSave é uma função
  if (typeof onSave !== "function") {
    console.error(
      "❌ [Wizard] onSave não é uma função!",
      typeof onSave,
      onSave
    );
    throw new Error("PropertyEditWizard: onSave deve ser uma função");
  }

  const [currentBlock, setCurrentBlock] = useState<string>("content");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [locationData, setLocationData] = useState<any>(null);

  // 🆕 v1.0.103.292 - Estado de salvamento interno
  const [isSavingInternal, setIsSavingInternal] = useState<boolean>(false);

  // 🆕 SISTEMA DE RASCUNHO - Estado para rascunho no backend
  const [draftPropertyId, setDraftPropertyId] = useState<string | null>(
    property?.id || null
  );
  const isInitialRenderRef = useRef(true);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🆕 SISTEMA DE RASCUNHO - Atualizar draftPropertyId quando property mudar
  useEffect(() => {
    if (property?.id && !draftPropertyId) {
      setDraftPropertyId(property.id);
    }
  }, [property?.id]); // ✅ Remover draftPropertyId da dependência para evitar loop

  // Hook de ações padronizadas
  const { updateProperty, cancelEditing } = usePropertyActions();

  // ✅ RESTAURAR RASCUNHO SE EXISTIR (modo criação)
  // 🆕 CORREÇÃO: Só restaurar rascunho do localStorage se for EDIÇÃO (tem property.id)
  // Se for CRIAÇÃO (id === "new" ou sem property), NÃO restaurar rascunho do localStorage
  // Rascunhos devem ser editados apenas quando usuário clica em "Continuar" na lista
  const draftData = property?.id ? useRestoreDraft(property.id) : null;

  // Função helper para criar dados iniciais vazios
  const createEmptyFormData = () => ({
    id: undefined,
    // Step 1: Tipo
    contentType: {
      propertyTypeId: undefined,
      accommodationTypeId: undefined,
      subtipo: undefined,
      modalidades: [],
      registrationNumber: "",
      propertyType: "individual",
      internalName: "",
    },
    // Step 2: Localização
    contentLocation: {
      mode: "new" as "new" | "existing",
      selectedLocationId: undefined,
      locationName: undefined,
      locationAmenities: [],
      address: {
        country: "BR",
        state: "",
        stateCode: "",
        zipCode: "",
        city: "",
        neighborhood: "",
        street: "",
        number: "",
        complement: "",
        latitude: undefined,
        longitude: undefined,
      },
      showBuildingNumber: "global" as "global" | "individual",
      photos: [],
      hasExpressCheckInOut: false,
      hasParking: false,
      hasCableInternet: false,
      hasWiFi: false,
      has24hReception: false,
    },
    // Step 3: Cômodos
    contentRooms: {
      rooms: [],
    },
    // Step 4: Amenidades
    contentAmenities: {
      propertyAmenities: [],
      inheritLocationAmenities: true,
    },
    // Step 6: Descrição
    contentDescription: {
      fixedFields: {},
      customFieldsValues: {},
      autoTranslate: false,
    },
    // Dados financeiros (vazios)
    financialResidentialPricing: {},
    financialContract: {},
    financialSeasonalPricing: {},
    financialIndividualPricing: {},
    financialDerivedPricing: {},
    // Configurações (vazias)
    settingsRules: {},
  });

  // Form data for all steps
  // ✅ VERSÃO SIMPLIFICADA: Inicialização direta sem try-catch complexo
  // ✅ LÓGICA: Se tem property.id = modo edição (usar dados da propriedade)
  // ✅ LÓGICA: Se não tem property.id = modo criação (dados vazios inicialmente)
  // ✅ LÓGICA: Se houver rascunho, será restaurado via useEffect abaixo
  const [formData, setFormData] = useState<any>(() => {
    // Modo EDIÇÃO: usar dados da propriedade existente
    if (property?.id) {
      // ✅ FIX: Preferir dados do wizardData (fonte da verdade do form), fallback para dados flat
      const wd = property.wizardData || {};
      const ct = wd.contentType || {};

      return {
        id: property.id,
        contentType: {
          propertyTypeId: ct.propertyTypeId || property.propertyTypeId || undefined,
          accommodationTypeId: ct.accommodationTypeId || property.accommodationTypeId || undefined,
          subtipo: ct.subtipo || property.subtipo || undefined,
          modalidades: ct.modalidades || property.modalidades || [],
          registrationNumber: ct.registrationNumber || property.registrationNumber || "",
          propertyType: ct.propertyType || property.propertyType || "individual",
          // ✅ FIX: Usar internalName do wizard, ou property.name como fallback robusto
          internalName: ct.internalName || property.internalName || property.name || "",
        },
        contentLocation: {
          mode: "new" as "new" | "existing",
          selectedLocationId: wd.contentLocation?.selectedLocationId || property.locationId || undefined,
          locationName: wd.contentLocation?.locationName || property.locationName || undefined,
          locationAmenities: wd.contentLocation?.locationAmenities || property.locationAmenities || [],
          address: {
            country: wd.contentLocation?.address?.country || property.address?.country || "BR",
            state: wd.contentLocation?.address?.state || property.address?.state || "",
            stateCode: wd.contentLocation?.address?.stateCode || property.address?.stateCode || "",
            zipCode: wd.contentLocation?.address?.zipCode || property.address?.zipCode || "",
            city: wd.contentLocation?.address?.city || property.address?.city || "",
            neighborhood: wd.contentLocation?.address?.neighborhood || property.address?.neighborhood || "",
            street: wd.contentLocation?.address?.street || property.address?.street || "",
            number: wd.contentLocation?.address?.number || property.address?.number || "",
            complement: wd.contentLocation?.address?.complement || property.address?.complement || "",
            latitude: wd.contentLocation?.address?.latitude || property.address?.latitude || undefined,
            longitude: wd.contentLocation?.address?.longitude || property.address?.longitude || undefined,
          },
          showBuildingNumber: wd.contentLocation?.showBuildingNumber || "global",
          photos: wd.contentLocation?.photos || property.locationPhotos || [],
          hasExpressCheckInOut: wd.contentLocation?.hasExpressCheckInOut || property.hasExpressCheckInOut || false,
          hasParking: wd.contentLocation?.hasParking || property.hasParking || false,
          hasCableInternet: wd.contentLocation?.hasCableInternet || property.hasCableInternet || false,
          hasWiFi: wd.contentLocation?.hasWiFi || property.hasWiFi || false,
          has24hReception: wd.contentLocation?.has24hReception || property.has24hReception || false,
        },
        contentRooms: {
          rooms: wd.contentRooms?.rooms || property.rooms || [],
        },
        contentAmenities: {
          propertyAmenities:
            wd.contentAmenities?.propertyAmenities || property.amenities || property.propertyAmenities || [],
          inheritLocationAmenities: wd.contentAmenities?.inheritLocationAmenities ?? (property.inheritLocationAmenities !== false),
        },
        contentDescription: {
          fixedFields: wd.contentDescription?.fixedFields || property.descriptionFields || {},
          customFieldsValues: wd.contentDescription?.customFieldsValues || property.customDescriptionFieldsValues || {},
          autoTranslate: wd.contentDescription?.autoTranslate || false,
        },
        financialResidentialPricing: wd.financialResidentialPricing || property.financialResidentialPricing || {},
        financialContract: wd.financialContract || property.financialContract || {},
        financialSeasonalPricing: wd.financialSeasonalPricing || property.financialSeasonalPricing || {},
        financialIndividualPricing: wd.financialIndividualPricing || property.financialIndividualPricing || {},
        financialDerivedPricing: wd.financialDerivedPricing || property.financialDerivedPricing || {},
        settingsRules: wd.settingsRules || property.settingsRules || {},
      };
    }

    // Modo CRIAÇÃO: dados vazios (rascunho será restaurado via useEffect se existir)
    return createEmptyFormData();
  });

  // ✅ PROTEÇÃO: Garantir que formData sempre tenha estrutura válida (apenas no mount)
  // REMOVIDO: useEffect que poderia causar loops - formData já é inicializado corretamente

  // 🆕 CORREÇÃO: Só restaurar rascunho se for EDIÇÃO (tem property.id)
  // Se for CRIAÇÃO (sem property.id), NÃO restaurar - sempre começar do zero
  // Rascunhos devem ser editados apenas quando usuário clica em "Continuar" na lista
  useEffect(() => {
    // Só restaurar se for EDIÇÃO (tem property.id) E tem draftData
    if (property?.id && draftData) {
      try {
        console.log(
          "📦 [Wizard] Restaurando rascunho do localStorage (modo edição):",
          draftData
        );
        // Validar que draftData é um objeto válido
        if (
          draftData &&
          typeof draftData === "object" &&
          !Array.isArray(draftData)
        ) {
          setFormData(draftData);
          toast.info("Rascunho restaurado! Continue de onde parou.");
        } else {
          console.warn("⚠️ [Wizard] draftData inválido, ignorando:", draftData);
        }
      } catch (error: any) {
        console.error("❌ [Wizard] Erro ao restaurar rascunho:", error);
      }
    } else if (!property?.id) {
      // Modo CRIAÇÃO: Não restaurar rascunho - sempre criar novo
      console.log(
        "🆕 [Wizard] Modo criação - não restaurar rascunho, criar novo"
      );
    }
  }, [draftData, property?.id]);

  // ============================================================================
  // 🆕 v1.0.103.122 - AUTO-SAVE AUTOMÁTICO
  // ============================================================================

  // ============================================================================
  // ✅ LÓGICA DE SALVAMENTO POR PASSO (v1.0.103.XXX)
  // ============================================================================
  //
  // IMPORTANTE: Salvar em cada passo para não perder dados se página atualizar
  //
  // RACIOCÍNIO POR TRÁS:
  // - Se usuário preenche 10 passos e página atualiza no passo 11, perde tudo
  // - Solução: Salvar rascunho a cada passo (localStorage em criação, backend em edição)
  // - Último passo: Criar/atualizar definitivamente no backend
  //
  // LÓGICA POR MODO:
  // - Modo CRIAÇÃO (sem property.id):
  //   * A cada passo: Salva no localStorage como rascunho
  //   * Último passo: Cria propriedade no backend + limpa rascunho
  //   * Se página atualizar: Restaura rascunho do localStorage automaticamente
  //
  // - Modo EDIÇÃO (com property.id):
  //   * A cada passo: Salva no backend (já tem ID)
  //   * Último passo: Atualiza no backend + limpa rascunho
  //   * Se página atualizar: Carrega dados do backend (não precisa rascunho)
  //
  // ============================================================================

  // ============================================================================
  // HELPERS
  // ============================================================================

  // 🆕 v1.0.103.XXX - Contar apenas passos relevantes para modalidades selecionadas
  const getRelevantSteps = () => {
    // ✅ PROTEÇÃO: Garantir que formData existe
    if (!formData || typeof formData !== "object") {
      return WIZARD_STRUCTURE.flatMap((block) => block.steps);
    }
    const modalidades = (formData?.contentType?.modalidades ||
      formData?.contentType?.categoria ||
      []) as string[];
    const relevantSteps: WizardStep[] = [];

    WIZARD_STRUCTURE.forEach((block) => {
      block.steps.forEach((step) => {
        if (isStepRelevantForModalities(step.id, modalidades)) {
          relevantSteps.push(step);
        }
      });
    });

    return relevantSteps;
  };

  // 🆕 SISTEMA DE RASCUNHO - Função para calcular progresso
  const calculateDraftProgress = useCallback(() => {
    if (!formData || typeof formData !== "object") {
      return { percentage: 0, completedStepsArray: [] };
    }

    const modalidades = (formData?.contentType?.modalidades ||
      formData?.contentType?.categoria ||
      []) as string[];

    const relevantSteps = getRelevantSteps();
    const completed = Array.from(completedSteps).filter((stepId) =>
      isStepRelevantForModalities(stepId, modalidades)
    );

    const percentage =
      relevantSteps.length > 0
        ? Math.round((completed.length / relevantSteps.length) * 100)
        : 0;

    return {
      percentage,
      completedStepsArray: completed,
    };
    // Remover getRelevantSteps das dependências (é função local)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Sem dependências - função usa formData e completedSteps do closure

  // 🆕 Função helper para normalizar dados do wizard para rascunho
  // Não usar useCallback para evitar dependências circulares
  const normalizeWizardDataForDraft = (wizardData: any): any => {
    // Valores mínimos para permitir criação de rascunho
    let name =
      wizardData.contentType?.internalName ||
      wizardData.name ||
      "Rascunho de Propriedade";
    let code =
      wizardData.contentType?.code ||
      wizardData.code ||
      `DRAFT-${Date.now().toString(36).toUpperCase()}`;
    // 🆕 CORREÇÃO: Extrair type corretamente do ContentTypeStep
    // ContentTypeStep salva como propertyTypeId OU accommodationTypeId
    let type =
      wizardData.contentType?.propertyTypeId ||
      wizardData.contentType?.accommodationTypeId ||
      wizardData.type ||
      "loc_casa";

    console.log("🔍 [normalizeWizardDataForDraft] Extraindo type:", {
      propertyTypeId: wizardData.contentType?.propertyTypeId,
      accommodationTypeId: wizardData.contentType?.accommodationTypeId,
      type: wizardData.type,
      finalType: type,
      contentType: wizardData.contentType,
    });

    // 🆕 CORREÇÃO: Garantir que endereço sempre tenha city e state válidos
    let address = wizardData.contentLocation?.address || wizardData.address;

    // Se não tem endereço ou não tem city/state, usar padrão
    if (!address || !address.city || !address.state) {
      address = {
        city: "Rio de Janeiro",
        state: "RJ",
        country: "BR",
      };
      console.log(
        "🔍 [normalizeWizardDataForDraft] Endereço padrão aplicado:",
        address
      );
    }

    // Extrair dados financeiros para basePrice
    const salePrice = wizardData.financialResidentialPricing?.salePrice;
    const monthlyRent = wizardData.financialResidentialPricing?.monthlyRent;
    const modalities =
      wizardData.contentType?.modalidades || wizardData.modalities || [];

    let basePrice = wizardData.basePrice;
    if (!basePrice) {
      if (modalities.includes("buy_sell") && salePrice) {
        basePrice = salePrice;
      } else if (modalities.includes("residential_rental") && monthlyRent) {
        basePrice = monthlyRent;
      } else {
        basePrice = 0; // Valor padrão para rascunho
      }
    }

    return {
      ...wizardData,
      name,
      code,
      type,
      address,
      status: "draft",
      // 🆕 IMPORTANTE: Campos de rascunho (sem duplicação)
      wizardData: wizardData.wizardData || wizardData, // Dados completos do wizard
      completionPercentage: wizardData.completionPercentage || 0,
      completedSteps: wizardData.completedSteps || [],
      // Valores mínimos para permitir criação
      maxGuests:
        wizardData.contentRooms?.maxGuests || wizardData.maxGuests || 2,
      bedrooms: wizardData.contentRooms?.bedrooms || wizardData.bedrooms || 1,
      beds: wizardData.contentRooms?.beds || wizardData.beds || 1,
      bathrooms:
        wizardData.contentRooms?.bathrooms || wizardData.bathrooms || 1,
      basePrice: basePrice,
      currency: wizardData.currency || "BRL",
      // Campos do Step 1
      propertyType: wizardData.contentType?.propertyType || "individual",
      accommodationType: wizardData.contentType?.accommodationTypeId,
      subtype: wizardData.contentType?.subtipo || wizardData.subtype,
      modalities: modalities,
    };
  }; // ✅ Função normal (não useCallback) - evita loops

  // 🆕 SISTEMA DE RASCUNHO - Salvar rascunho no backend
  const saveDraftToBackend = useCallback(async () => {
    try {
      const { percentage, completedStepsArray } = calculateDraftProgress();

      // Preparar dados para salvar como rascunho
      const draftData = {
        ...formData,
        status: "draft", // 🆕 Sempre salvar como rascunho até finalizar
        wizardData: formData, // Dados completos do wizard
        completionPercentage: percentage,
        completedSteps: completedStepsArray,
      };

      console.log("💾 [Wizard] Salvando rascunho no backend...", {
        draftPropertyId,
        percentage,
        completedSteps: completedStepsArray.length,
      });

      if (draftPropertyId) {
        // 🆕 Atualizar rascunho existente usando o ID
        // ✅ PATCH: Usar PUT (método correto) ao invés de POST com ID
        const normalizedData = normalizeWizardDataForDraft(draftData);
        console.log(
          "🔄 [Wizard] Atualizando rascunho existente com ID (PUT):",
          draftPropertyId
        );
        // ✅ PATCH: Usar propertiesApi.update() ao invés de create() com ID
        const response = await propertiesApi.update(
          draftPropertyId,
          normalizedData
        );
        if (response.success) {
          console.log(
            "✅ [Wizard] Rascunho atualizado no backend (PUT):",
            draftPropertyId
          );
          return draftPropertyId;
        } else {
          throw new Error(response.error || "Erro ao atualizar rascunho");
        }
      } else {
        // 🆕 NOVA ABORDAGEM: Criar rascunho mínimo primeiro (sem validações complexas)
        // O backend cria um registro mínimo com ID gerado pelo banco
        // Depois, atualizamos com os dados do wizard
        console.log(
          "🆕 [Wizard] Criando rascunho mínimo (ID será gerado pelo banco)..."
        );

        // ✅ RASCUNHO SIMPLIFICADO: Enviar apenas o que o usuário preencheu
        // Princípio: Rascunho = qualquer dado salvo, sem validações
        // Backend aceita qualquer estrutura, preenche padrões apenas para constraints do banco

        // ✅ RASCUNHO SIMPLIFICADO: Remover duplicação e enviar apenas o que o usuário preencheu
        // Princípio: Rascunho = qualquer dado salvo, sem validações
        const cleanedWizardData = { ...draftData };
        if (
          cleanedWizardData.wizardData &&
          typeof cleanedWizardData.wizardData === "object"
        ) {
          const { wizardData: nestedWizardData, ...restWizardData } =
            cleanedWizardData.wizardData;
          cleanedWizardData.wizardData = restWizardData;
        } else if (cleanedWizardData.wizardData) {
          delete cleanedWizardData.wizardData;
        }

        // Montar payload: enviar TUDO que o usuário preencheu + status draft
        // Backend aceita qualquer estrutura e preenche padrões apenas para constraints do banco
        const minimalDraft: any = {
          status: "draft", // ✅ Único campo obrigatório
          wizardData: cleanedWizardData, // ✅ Tudo que o usuário preencheu
          completionPercentage: percentage,
          completedSteps: completedStepsArray,
        };

        // ✅ Incluir campos apenas se existirem (não forçar valores)
        // Backend vai preencher padrões apenas para constraints do banco
        if (draftData.contentDescription?.title) {
          minimalDraft.name = draftData.contentDescription.title;
        }
        if (draftData.contentType?.code) {
          minimalDraft.code = draftData.contentType.code;
        }
        if (
          draftData.contentType?.propertyTypeId ||
          draftData.contentType?.accommodationTypeId
        ) {
          minimalDraft.type =
            draftData.contentType?.propertyTypeId ||
            draftData.contentType?.accommodationTypeId;
        }
        if (draftData.contentLocation?.address) {
          minimalDraft.address = draftData.contentLocation.address;
        }
        if (draftData.maxGuests !== undefined) {
          minimalDraft.maxGuests = draftData.maxGuests;
        }
        if (draftData.basePrice !== undefined) {
          minimalDraft.basePrice = draftData.basePrice;
        }
        if (draftData.currency) {
          minimalDraft.currency = draftData.currency;
        }

        console.log("📤 [Wizard] DADOS MÍNIMOS PARA CRIAR RASCUNHO:", {
          status: minimalDraft.status,
          type: minimalDraft.type,
          hasWizardData: !!minimalDraft.wizardData,
          completionPercentage: minimalDraft.completionPercentage,
          address: minimalDraft.address,
          fullMinimalDraft: minimalDraft,
        });

        const response = await propertiesApi.create(minimalDraft);

        // 🆕 DEBUG: Log da resposta
        console.log("📡 [Wizard] RESPOSTA DO BACKEND:", {
          success: response.success,
          hasData: !!response.data,
          dataId: response.data?.id,
          error: response.error,
          fullResponse: response,
        });

        if (response.success && response.data?.id) {
          const newDraftId = response.data.id;
          setDraftPropertyId(newDraftId);
          console.log(
            "✅ [Wizard] Rascunho criado no backend com ID (gerado pelo banco):",
            newDraftId
          );

          // 🆕 NOVA ABORDAGEM: Agora que temos o ID, atualizar com os dados completos do wizard
          // ✅ PATCH: Usar PUT (método correto) ao invés de POST com ID
          try {
            console.log(
              "🔄 [Wizard] Atualizando rascunho com dados completos do wizard (PUT)..."
            );

            // Normalizar dados para atualização
            const normalizedData = normalizeWizardDataForDraft(draftData);

            // ✅ PATCH: Usar propertiesApi.update() ao invés de create() com ID
            // Isso é mais semântico e correto (PUT para atualização)
            const updateResponse = await propertiesApi.update(
              newDraftId,
              normalizedData
            );

            if (updateResponse.success) {
              console.log(
                "✅ [Wizard] Rascunho atualizado com dados completos (PUT)"
              );
            } else {
              console.warn(
                "⚠️ [Wizard] Rascunho criado mas atualização falhou:",
                updateResponse.error
              );
              // Não falhar - o rascunho já existe, pode atualizar depois
            }
          } catch (updateError) {
            console.warn(
              "⚠️ [Wizard] Rascunho criado mas atualização falhou:",
              updateError
            );
            // Não falhar - o rascunho já existe, pode atualizar depois
          }

          // Salvar também no localStorage como backup
          saveDraft();
          return newDraftId;
        } else {
          throw new Error(response.error || "Erro ao criar rascunho");
        }
      }
    } catch (error) {
      console.error("❌ [Wizard] Erro ao salvar rascunho no backend:", error);
      toast.error("Erro ao salvar rascunho. Tente novamente.");
      throw error;
    }
  }, [draftPropertyId]); // ✅ Apenas draftPropertyId - função usa formData e completedSteps do closure

  // Hook para salvar rascunho no localStorage (backup - não usar mais)
  const saveDraft = useCallback(() => {
    try {
      const draftId = draftPropertyId || property?.id || "draft";
      localStorage.setItem(
        `property_draft_${draftId}`,
        JSON.stringify(formData)
      );
      console.log("💾 [Wizard] Rascunho salvo no localStorage (backup)");
    } catch (error) {
      console.error(
        "❌ [Wizard] Erro ao salvar rascunho no localStorage:",
        error
      );
    }
  }, [formData, draftPropertyId, property?.id]);

  // Auto-save de rascunho (modo criação) com debounce suave
  useEffect(() => {
    // Se já tem ID (modo edição), não precisa auto-save local
    if (property?.id) {
      return;
    }

    // Ignorar primeiro render para evitar salvar imediatamente ao montar
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const newId = await saveDraftToBackend();
        if (!draftPropertyId && newId) {
          setDraftPropertyId(newId);
        }
        await saveDraft();
      } catch (error) {
        console.warn("⚠️ [Wizard] Auto-save de rascunho falhou:", error);
      }
    }, 1200);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    property?.id,
    draftPropertyId,
    saveDraftToBackend,
    saveDraft,
    formData,
    completedSteps,
  ]);

  // Hook para limpar draft
  const clearDraft = useClearDraft();

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getCurrentBlock = () => {
    return (
      WIZARD_STRUCTURE.find((block) => block.id === currentBlock) ||
      WIZARD_STRUCTURE[0]
    );
  };

  const getCurrentStep = () => {
    const block = getCurrentBlock();
    if (!block || !block.steps || currentStepIndex >= block.steps.length) {
      // Fallback para o primeiro step do primeiro bloco
      return WIZARD_STRUCTURE[0].steps[0];
    }
    return block.steps[currentStepIndex];
  };

  const getTotalSteps = () => {
    // ✅ PROTEÇÃO: Garantir que formData existe
    if (!formData || typeof formData !== "object") {
      return WIZARD_STRUCTURE.reduce(
        (acc, block) => acc + block.steps.length,
        0
      );
    }
    // Se há modalidades selecionadas, contar apenas passos relevantes
    const modalidades = (formData?.contentType?.modalidades ||
      formData?.contentType?.categoria ||
      []) as string[];
    if (modalidades.length > 0) {
      return getRelevantSteps().length;
    }
    // Caso contrário, contar todos
    return WIZARD_STRUCTURE.reduce((acc, block) => acc + block.steps.length, 0);
  };

  const getCurrentStepNumber = () => {
    // ✅ PROTEÇÃO: Garantir que formData existe
    if (!formData || typeof formData !== "object") {
      return 1; // Fallback seguro
    }
    const modalidades = (formData?.contentType?.modalidades ||
      formData?.contentType?.categoria ||
      []) as string[];
    let stepNumber = 0;

    for (const block of WIZARD_STRUCTURE) {
      if (block.id === currentBlock) {
        // Contar apenas passos relevantes até o passo atual
        for (let i = 0; i <= currentStepIndex; i++) {
          const step = block.steps[i];
          if (step && isStepRelevantForModalities(step.id, modalidades)) {
            stepNumber++;
          }
        }
        break;
      }
      // Contar todos os passos relevantes dos blocos anteriores
      block.steps.forEach((step) => {
        if (isStepRelevantForModalities(step.id, modalidades)) {
          stepNumber++;
        }
      });
    }
    return stepNumber;
  };

  const getProgress = () => {
    const totalRelevant = getTotalSteps();
    if (totalRelevant === 0) return 0;

    // ✅ PROTEÇÃO: Garantir que formData existe
    if (!formData || typeof formData !== "object") {
      return 0;
    }
    // Contar apenas passos relevantes completados
    const modalidades = (formData?.contentType?.modalidades ||
      formData?.contentType?.categoria ||
      []) as string[];
    const relevantCompleted = Array.from(completedSteps).filter((stepId) =>
      isStepRelevantForModalities(stepId, modalidades)
    ).length;

    return (relevantCompleted / totalRelevant) * 100;
  };

  const getBlockProgress = (blockId: string) => {
    const block = WIZARD_STRUCTURE.find((b) => b.id === blockId)!;
    const modalidades =
      formData.contentType?.modalidades ||
      formData.contentType?.categoria ||
      [];

    // Contar apenas passos relevantes
    const relevantStepsInBlock = block.steps.filter((step) =>
      isStepRelevantForModalities(step.id, modalidades)
    );

    if (relevantStepsInBlock.length === 0) return 0;

    const completedInBlock = relevantStepsInBlock.filter((step) =>
      completedSteps.has(step.id)
    ).length;

    return (completedInBlock / relevantStepsInBlock.length) * 100;
  };

  // ============================================================================
  // 🆕 v1.0.103.XXX - EFEITO: Ajustar navegação quando modalidades mudarem
  // ============================================================================

  useEffect(() => {
    // Quando modalidades mudam, verificar se o passo atual ainda é relevante
    const modalidades =
      formData.contentType?.modalidades ||
      formData.contentType?.categoria ||
      [];

    if (modalidades.length === 0) {
      // Se não há modalidades, não fazer nada (mostrar todos os passos)
      return;
    }

    const block = getCurrentBlock();
    const step = getCurrentStep();

    if (step && !isStepRelevantForModalities(step.id, modalidades)) {
      // Se passo atual não é mais relevante, navegar para o primeiro passo relevante
      const relevantSteps = getRelevantSteps();
      if (relevantSteps.length > 0) {
        const firstRelevant = relevantSteps[0];
        const firstBlock = WIZARD_STRUCTURE.find((b) =>
          b.steps.some((s) => s.id === firstRelevant.id)
        );
        const firstStepIndex =
          firstBlock?.steps.findIndex((s) => s.id === firstRelevant.id) ?? 0;

        if (
          firstBlock &&
          (firstBlock.id !== currentBlock ||
            firstStepIndex !== currentStepIndex)
        ) {
          setCurrentBlock(firstBlock.id);
          setCurrentStepIndex(firstStepIndex);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData?.contentType?.modalidades,
    formData?.contentType?.categoria,
    currentBlock,
    currentStepIndex,
  ]);

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  // 🆕 v1.0.103.292 - Salvar E Avançar (manual)
  // 🆕 v1.0.103.XXX - Pular passos irrelevantes ao avançar
  const handleSaveAndNext = async () => {
    const block = getCurrentBlock();
    const step = getCurrentStep();

    console.log("💾 [Wizard] Salvando E avançando...");

    try {
      setIsSavingInternal(true);

      // ============================================================================
      // ✅ LÓGICA DE SALVAMENTO POR PASSO
      // ============================================================================
      //
      // IMPORTANTE: Salvar em cada passo para não perder dados se página atualizar
      //
      // RACIOCÍNIO POR TRÁS:
      // - Se usuário preenche 10 passos e página atualiza no passo 11, perde tudo
      // - Solução: Salvar rascunho a cada passo (localStorage em criação, backend em edição)
      // - Último passo: Criar/atualizar definitivamente no backend
      //
      // ============================================================================

      // 🆕 SISTEMA DE RASCUNHO: Salvar no backend a cada step
      if (property?.id || draftPropertyId) {
        // Modo EDIÇÃO ou CRIAÇÃO COM RASCUNHO: Salvar no backend a cada passo
        const propertyId = property?.id || draftPropertyId!;

        console.log("💾 [Wizard] Atualizando rascunho no backend:", {
          propertyId,
          hasPropertyId: !!property?.id,
          hasDraftPropertyId: !!draftPropertyId,
          step: getCurrentStepNumber(),
        });

        // Calcular progresso
        const { percentage, completedStepsArray } = calculateDraftProgress();

        console.log("📊 [Wizard] Progresso calculado:", {
          percentage,
          completedSteps: completedStepsArray.length,
          totalSteps: getTotalSteps(),
        });

        // Preparar dados com progresso
        const dataWithProgress = {
          ...formData,
          wizardData: formData, // Dados completos do wizard
          completionPercentage: percentage,
          completedSteps: completedStepsArray,
          status: "draft", // Manter como rascunho até finalizar
        };

        console.log("📤 [Wizard] Enviando dados para atualizar:", {
          propertyId,
          status: dataWithProgress.status,
          completionPercentage: dataWithProgress.completionPercentage,
          completedStepsCount: dataWithProgress.completedSteps.length,
        });

        await updateProperty(propertyId, dataWithProgress, {
          redirectToList: false, // ✅ NÃO redirecionar ao salvar step intermediário
          customSuccessMessage: `Step ${getCurrentStepNumber()} salvo com sucesso!`,
          onSuccess: () => {
            console.log(
              "✅ [Wizard] Rascunho atualizado com sucesso no backend"
            );
            clearDraft(); // Limpar rascunho do localStorage se existir
          },
        });
      } else {
        // 🆕 Modo CRIAÇÃO (primeiro step): Criar rascunho no backend
        console.log(
          "💾 [Wizard] Modo criação - criando rascunho no backend (primeiro step)"
        );

        try {
          console.log("🔄 [Wizard] Chamando saveDraftToBackend()...");
          const newDraftId = await saveDraftToBackend();
          console.log("✅ [Wizard] Rascunho criado no backend:", newDraftId);

          if (!newDraftId) {
            throw new Error("Rascunho criado mas não retornou ID");
          }

          // 🆕 IMPORTANTE: Atualizar draftPropertyId para próximos steps
          setDraftPropertyId(newDraftId);
          console.log(
            "🔄 [Wizard] draftPropertyId atualizado para:",
            newDraftId
          );

          // Salvar também no localStorage como backup
          saveDraft();

          // 🆕 Toast de sucesso
          toast.success("Rascunho salvo com sucesso!");
        } catch (error: any) {
          console.error("❌ [Wizard] ERRO DETALHADO ao criar rascunho:", {
            error,
            message: error?.message,
            stack: error?.stack,
            formData: {
              hasContentType: !!formData?.contentType,
              modalities: formData?.contentType?.modalidades,
              hasLocation: !!formData?.contentLocation,
            },
          });
          console.error(
            "❌ [Wizard] Erro ao criar rascunho no backend:",
            error
          );

          // 🆕 Tentar novamente após 1 segundo (pode ser problema temporário de rede)
          setTimeout(async () => {
            try {
              console.log("🔄 [Wizard] Tentando criar rascunho novamente...");
              const retryDraftId = await saveDraftToBackend();
              console.log(
                "✅ [Wizard] Rascunho criado no backend (retry):",
                retryDraftId
              );
              toast.success("Rascunho salvo com sucesso!");
            } catch (retryError) {
              console.error(
                "❌ [Wizard] Erro ao criar rascunho (retry):",
                retryError
              );
              // Não mostrar erro ao usuário - já salvou no localStorage como backup
            }
          }, 1000);

          // Fallback: tentar com dados mais simples se falhar
          try {
            console.log(
              "🔄 [Wizard] Tentando criar rascunho com dados simplificados..."
            );
            const simpleDraft = {
              name:
                formData.contentType?.internalName || "Rascunho de Propriedade",
              code:
                formData.contentType?.code ||
                `DRAFT-${Date.now().toString(36).toUpperCase()}`,
              type:
                formData.contentType?.propertyTypeId ||
                formData.contentType?.accommodationTypeId ||
                "loc_casa",
              address: formData.contentLocation?.address || {
                city: "Rio de Janeiro",
                state: "RJ",
                country: "BR",
              },
              status: "draft",
              wizardData: formData,
              completionPercentage: 0,
              completedSteps: [],
              maxGuests: 2,
              bedrooms: 1,
              beds: 1,
              bathrooms: 1,
              basePrice: 0,
              currency: "BRL",
            };

            const retryResponse = await propertiesApi.create(simpleDraft);
            if (retryResponse.success && retryResponse.data?.id) {
              const newDraftId = retryResponse.data.id;
              setDraftPropertyId(newDraftId);
              console.log(
                "✅ [Wizard] Rascunho criado no backend (retry):",
                newDraftId
              );
              toast.success("Rascunho salvo com sucesso!");
              // Salvar também no localStorage como backup
              saveDraft();
              return;
            } else {
              throw new Error(retryResponse.error || "Erro ao criar rascunho");
            }
          } catch (retryError: any) {
            console.error("❌ [Wizard] Erro no retry também:", retryError);
            // Último fallback: salvar no localStorage
            saveDraft();
            toast.error(
              `Erro ao salvar rascunho: ${error?.message || retryError?.message || "Erro desconhecido"
              }. Verifique sua conexão.`
            );
          }
        }
      }

      // 2. Marcar step atual como completo
      setCompletedSteps((prev) => new Set(prev).add(step.id));

      // 3. Aguardar um momento antes de avançar (evita conflito DOM)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 4. Avançar para próximo step RELEVANTE
      // ✅ PROTEÇÃO: Garantir que formData existe
      if (!formData || typeof formData !== "object") {
        console.error("❌ [Wizard] formData inválido em handleSaveAndNext");
        return;
      }
      const modalidades = (formData?.contentType?.modalidades ||
        formData?.contentType?.categoria ||
        []) as string[];

      // Função helper para encontrar próximo step relevante
      const findNextRelevantStep = (
        startBlockIndex: number,
        startStepIndex: number
      ): { blockIndex: number; stepIndex: number } | null => {
        // Começar do próximo step no mesmo bloco
        for (let bi = startBlockIndex; bi < WIZARD_STRUCTURE.length; bi++) {
          const currentBlock = WIZARD_STRUCTURE[bi];
          const startIdx = bi === startBlockIndex ? startStepIndex + 1 : 0;

          for (let si = startIdx; si < currentBlock.steps.length; si++) {
            const step = currentBlock.steps[si];
            if (step && isStepRelevantForModalities(step.id, modalidades)) {
              return { blockIndex: bi, stepIndex: si };
            }
          }
        }
        return null; // Não há mais passos relevantes
      };

      const nextStep = findNextRelevantStep(
        WIZARD_STRUCTURE.findIndex((b) => b.id === currentBlock),
        currentStepIndex
      );

      if (nextStep) {
        setCurrentBlock(WIZARD_STRUCTURE[nextStep.blockIndex].id);
        setCurrentStepIndex(nextStep.stepIndex);
      } else {
        // Último step relevante - redirecionar
        toast.success("Todos os passos concluídos!");
        // Não redireciona aqui, handleSave já faz isso
      }
    } catch (error) {
      console.error("❌ Erro ao salvar e avançar:", error);
    } finally {
      setIsSavingInternal(false);
    }
  };

  const handleNext = () => {
    const block = getCurrentBlock();
    const step = getCurrentStep();

    // ✅ Apenas avançar SEM salvar
    // Usado pelo botão "Próximo" (se houver)

    // Marcar step atual como completo
    setCompletedSteps((prev) => new Set(prev).add(step.id));

    // 🆕 v1.0.103.XXX - Pular passos irrelevantes ao avançar
    // ✅ PROTEÇÃO: Garantir que formData existe
    if (!formData || typeof formData !== "object") {
      console.error("❌ [Wizard] formData inválido em handleNext");
      return;
    }
    const modalidades = (formData?.contentType?.modalidades ||
      formData?.contentType?.categoria ||
      []) as string[];

    // Função helper para encontrar próximo step relevante
    const findNextRelevantStep = (
      startBlockIndex: number,
      startStepIndex: number
    ): { blockIndex: number; stepIndex: number } | null => {
      // Começar do próximo step no mesmo bloco
      for (let bi = startBlockIndex; bi < WIZARD_STRUCTURE.length; bi++) {
        const currentBlock = WIZARD_STRUCTURE[bi];
        const startIdx = bi === startBlockIndex ? startStepIndex + 1 : 0;

        for (let si = startIdx; si < currentBlock.steps.length; si++) {
          const step = currentBlock.steps[si];
          if (step && isStepRelevantForModalities(step.id, modalidades)) {
            return { blockIndex: bi, stepIndex: si };
          }
        }
      }
      return null; // Não há mais passos relevantes
    };

    const nextStep = findNextRelevantStep(
      WIZARD_STRUCTURE.findIndex((b) => b.id === currentBlock),
      currentStepIndex
    );

    if (nextStep) {
      setCurrentBlock(WIZARD_STRUCTURE[nextStep.blockIndex].id);
      setCurrentStepIndex(nextStep.stepIndex);
    } else {
      // Último step relevante - mostrar resumo ou salvar
      toast.success("Todos os passos concluídos!");
    }
  };

  const handlePrevious = () => {
    // ✅ NÃO salvar no backend - apenas voltar!
    // Auto-save salva localmente (rascunho)

    // ✅ PROTEÇÃO: Garantir que formData existe
    if (!formData || typeof formData !== "object") {
      console.error("❌ [Wizard] formData inválido em handlePrevious");
      return;
    }
    // 🆕 v1.0.103.XXX - Pular passos irrelevantes ao voltar
    const modalidades = (formData?.contentType?.modalidades ||
      formData?.contentType?.categoria ||
      []) as string[];

    // Função helper para encontrar step relevante anterior
    const findPreviousRelevantStep = (
      startBlockIndex: number,
      startStepIndex: number
    ): { blockIndex: number; stepIndex: number } | null => {
      // Começar do step anterior no mesmo bloco
      for (let bi = startBlockIndex; bi >= 0; bi--) {
        const currentBlock = WIZARD_STRUCTURE[bi];
        const startIdx =
          bi === startBlockIndex
            ? startStepIndex - 1
            : currentBlock.steps.length - 1;

        for (let si = startIdx; si >= 0; si--) {
          const step = currentBlock.steps[si];
          if (step && isStepRelevantForModalities(step.id, modalidades)) {
            return { blockIndex: bi, stepIndex: si };
          }
        }
      }
      return null; // Não há step relevante anterior
    };

    const prevStep = findPreviousRelevantStep(
      WIZARD_STRUCTURE.findIndex((b) => b.id === currentBlock),
      currentStepIndex
    );

    if (prevStep) {
      setCurrentBlock(WIZARD_STRUCTURE[prevStep.blockIndex].id);
      setCurrentStepIndex(prevStep.stepIndex);
    }
  };

  const handleStepClick = (blockId: string, stepIndex: number) => {
    // ✅ NÃO salvar no backend - apenas mudar de step!
    // Auto-save salva localmente (rascunho)

    // 🆕 v1.0.103.XXX - Verificar se passo é relevante antes de navegar
    const block = WIZARD_STRUCTURE.find((b) => b.id === blockId);
    const step = block?.steps[stepIndex];

    if (!step) return;

    // ✅ PROTEÇÃO: Garantir que formData existe
    if (!formData || typeof formData !== "object") {
      console.error("❌ [Wizard] formData inválido em handleStepClick");
      return;
    }
    const modalidades = (formData?.contentType?.modalidades ||
      formData?.contentType?.categoria ||
      []) as string[];
    const isRelevant = isStepRelevantForModalities(step.id, modalidades);

    if (!isRelevant) {
      toast.info(
        "Este passo não é relevante para a(s) modalidade(s) selecionada(s)"
      );
      return;
    }

    setCurrentBlock(blockId);
    setCurrentStepIndex(stepIndex);
  };

  const handleSave = async () => {
    try {
      // Validar dados antes de salvar
      // TODO: Adicionar validações específicas

      // Usar hook padronizado para atualizar
      if (property?.id) {
        await updateProperty(property.id, formData, {
          onSuccess: () => {
            // Limpar rascunho após salvar com sucesso
            clearDraft();
          },
        });
      } else {
        // Se não tem ID, chamar onSave do parent (modo criação)
        onSave(formData);
      }
    } catch (error) {
      console.error("❌ Erro ao salvar imóvel:", error);
    }
  };

  const isFirstStep = () => {
    // ✅ PROTEÇÃO: Garantir que formData existe
    if (!formData || typeof formData !== "object") {
      return currentBlock === WIZARD_STRUCTURE[0].id && currentStepIndex === 0;
    }
    // 🆕 v1.0.103.XXX - Verificar se é o primeiro passo RELEVANTE
    const modalidades = (formData?.contentType?.modalidades ||
      formData?.contentType?.categoria ||
      []) as string[];
    const relevantSteps = getRelevantSteps();

    if (relevantSteps.length === 0) return true; // Fallback

    const firstRelevantStep = relevantSteps[0];
    const firstBlock = WIZARD_STRUCTURE.find((b) =>
      b.steps.some((s) => s.id === firstRelevantStep.id)
    );
    const firstStepIndex =
      firstBlock?.steps.findIndex((s) => s.id === firstRelevantStep.id) ?? 0;

    return (
      currentBlock === firstBlock?.id && currentStepIndex === firstStepIndex
    );
  };

  const isLastStep = () => {
    // ✅ PROTEÇÃO: Garantir que formData existe
    if (!formData || typeof formData !== "object") {
      const lastBlock = WIZARD_STRUCTURE[WIZARD_STRUCTURE.length - 1];
      return (
        currentBlock === lastBlock.id &&
        currentStepIndex === lastBlock.steps.length - 1
      );
    }
    // 🆕 v1.0.103.XXX - Verificar se é o último passo RELEVANTE
    const modalidades = (formData?.contentType?.modalidades ||
      formData?.contentType?.categoria ||
      []) as string[];
    const relevantSteps = getRelevantSteps();

    if (relevantSteps.length === 0) return false; // Fallback

    const lastRelevantStep = relevantSteps[relevantSteps.length - 1];
    const lastBlock = WIZARD_STRUCTURE.find((b) =>
      b.steps.some((s) => s.id === lastRelevantStep.id)
    );
    const lastStepIndex =
      lastBlock?.steps.findIndex((s) => s.id === lastRelevantStep.id) ?? 0;

    return currentBlock === lastBlock?.id && currentStepIndex === lastStepIndex;
  };

  const handleFinish = async () => {
    // Marcar último step como completo
    const step = getCurrentStep();
    setCompletedSteps((prev) => new Set(prev).add(step.id));

    try {
      setIsSavingInternal(true);

      console.log("🎯 [Wizard] handleFinish chamado");
      console.log(
        "📊 [Wizard] formData completo:",
        JSON.stringify(formData, null, 2)
      );
      console.log(
        "🔍 [Wizard] Modalidades:",
        formData.contentType?.modalidades
      );
      console.log(
        "💰 [Wizard] Financial Residential Pricing:",
        formData.financialResidentialPricing
      );

      // Aguardar um momento antes de salvar (evita conflito DOM)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // ============================================================================
      // ✅ LÓGICA DE SALVAMENTO FINAL (ÚLTIMO PASSO)
      // ============================================================================
      //
      // IMPORTANTE: Último passo - criar propriedade (modo criação) ou atualizar (modo edição)
      //
      // RACIOCÍNIO POR TRÁS:
      // - Modo CRIAÇÃO: Até aqui, dados estavam apenas no localStorage (rascunho)
      //   Agora vamos criar a propriedade definitivamente no backend
      // - Modo EDIÇÃO: Atualizar propriedade existente no backend
      // - Após sucesso: Limpar rascunho do localStorage (não precisa mais)
      //
      // ============================================================================

      if (property?.id) {
        // Modo EDIÇÃO: Atualizar propriedade existente no backend
        // Por que: Já tem property.id, pode atualizar diretamente
        await updateProperty(property.id, formData, {
          redirectToList: true, // ✅ REDIRECIONAR ao finalizar todos os steps
          customSuccessMessage: `${formData.contentType?.internalName || "Imóvel"
            } finalizado com sucesso!`,
          onSuccess: () => {
            clearDraft(); // Limpar rascunho do localStorage
          },
        });
      } else {
        // 🆕 Modo CRIAÇÃO: Finalizar rascunho (mudar status para 'active')
        // IMPORTANTE: Rascunho já existe no backend desde o primeiro step
        // Agora vamos apenas mudar o status para 'active' (finalizar)

        if (draftPropertyId) {
          console.log(
            "✅ [Wizard] Finalizando rascunho - mudando status para 'active'",
            draftPropertyId
          );

          // Calcular progresso final
          const { percentage, completedStepsArray } = calculateDraftProgress();

          // Atualizar rascunho com status 'active' (finalizar)
          const finalData = {
            ...formData,
            status: "active", // 🆕 Mudar para 'active' ao finalizar
            wizardData: formData,
            completionPercentage: 100, // Sempre 100% ao finalizar
            completedSteps: completedStepsArray,
          };

          await updateProperty(draftPropertyId, finalData, {
            redirectToList: true, // ✅ REDIRECIONAR ao finalizar
            customSuccessMessage: `${formData.contentType?.internalName || "Imóvel"
              } finalizado com sucesso!`,
            onSuccess: () => {
              clearDraft(); // Limpar rascunho do localStorage
            },
          });
        } else {
          // Fallback: Se não tem draftPropertyId, criar agora (compatibilidade)
          console.log(
            "⚠️ [Wizard] Rascunho não encontrado, criando propriedade agora (último passo)"
          );
          await onSave(formData);
          clearDraft();
        }
      }
    } catch (error) {
      console.error("❌ Erro ao finalizar:", error);
      toast.error("Erro ao finalizar. Verifique o console para mais detalhes.");
    } finally {
      setIsSavingInternal(false);
    }
  };

  // ============================================================================
  // VALIDATION BADGE
  // ============================================================================

  const getValidationBadge = (validation?: string) => {
    if (!validation) return null;

    switch (validation) {
      case "required":
        return (
          <Badge variant="destructive" className="text-xs">
            Obrigatório
          </Badge>
        );
      case "recommended":
        return (
          <Badge variant="default" className="text-xs bg-amber-500">
            Recomendado
          </Badge>
        );
      case "optional":
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
  // RENDER STEP CONTENT
  // ============================================================================

  const renderStepContent = () => {
    try {
      console.log("🎨 [Wizard] renderStepContent chamado");

      // ✅ PROTEÇÃO: Garantir que formData existe
      if (!formData || typeof formData !== "object") {
        console.error(
          "❌ [Wizard] formData inválido no renderStepContent:",
          formData
        );
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              Erro ao carregar dados. Recarregue a página.
            </p>
          </div>
        );
      }

      const step = getCurrentStep();
      console.log("📋 [Wizard] Step atual:", step?.id);

      if (!step || !step.id) {
        console.warn("⚠️ [Wizard] Step não encontrado");
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        );
      }

      // 🆕 v1.0.103.XXX - Verificar se passo é relevante para modalidades selecionadas
      // ✅ PROTEÇÃO: Garantir que formData.contentType existe
      const modalidades = (formData?.contentType?.modalidades ||
        formData?.contentType?.categoria ||
        []) as string[];
      const isRelevant = isStepRelevantForModalities(step.id, modalidades);

      // Se não é relevante, mostrar mensagem informativa
      if (!isRelevant) {
        const modalidadeNames = modalidades
          .map((m: string) => {
            if (m === "short_term_rental") return "Aluguel de Temporada";
            if (m === "residential_rental") return "Locação Residencial";
            if (m === "buy_sell") return "Compra e Venda";
            return m;
          })
          .join(" ou ");

        return (
          <Card className="border-2 border-dashed border-amber-200 bg-amber-50/30">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="p-4 bg-amber-100 rounded-full">
                <Info className="h-8 w-8 text-amber-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Passo não aplicável</h3>
                <p className="text-sm text-muted-foreground">
                  Este passo não é relevante para a(s) modalidade(s)
                  selecionada(s): <strong>{modalidadeNames}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Selecione outras modalidades no passo "Tipo e Identificação"
                  para ver este passo.
                </p>
              </div>
            </CardContent>
          </Card>
        );
      }

      // Step 1: Tipo (content-type)
      if (step.id === "content-type") {
        console.log("🎨 [Wizard] Renderizando ContentTypeStep");
        console.log("📊 [Wizard] formData.contentType:", formData.contentType);
        try {
          // Garantir que data sempre tenha estrutura válida
          const contentTypeData = formData.contentType || {
            propertyTypeId: undefined,
            accommodationTypeId: undefined,
            subtipo: undefined,
            modalidades: [],
            registrationNumber: "",
            propertyType: "individual",
          };

          return (
            <ContentTypeStep
              data={contentTypeData}
              onChange={(data) => {
                console.log("🔄 [Wizard] ContentTypeStep onChange:", data);
                setFormData({
                  ...formData,
                  contentType: data,
                });
              }}
            />
          );
        } catch (error: any) {
          console.error(
            "❌ [Wizard] Erro ao renderizar ContentTypeStep:",
            error
          );
          console.error("❌ [Wizard] Stack:", error?.stack);
          throw error; // Re-throw para ErrorBoundary capturar
        }
      }

      // Step 2: Localização (content-location)
      if (step.id === "content-location") {
        // 🆕 Passar modalidades para filtrar campos
        const modalidades = (formData?.contentType?.modalidades ||
          formData?.contentType?.categoria ||
          []) as string[];

        return (
          <ContentLocationStep
            data={
              formData.contentLocation || {
                mode: "new",
                address: {
                  country: "BR",
                  state: "",
                  stateCode: "",
                  city: "",
                  neighborhood: "",
                  street: "",
                  number: "",
                  zipCode: "",
                },
                showBuildingNumber: "global",
                photos: [],
              }
            }
            onChange={(data) => {
              setFormData({
                ...formData,
                contentLocation: data,
              });
            }}
            modalidades={modalidades}
            propertyId={property?.id}
          />
        );
      }
      if (step.id === "content-rooms") {
        return (
          <ContentRoomsStep
            data={formData.contentRooms}
            onChange={(data) => {
              setFormData({
                ...formData,
                contentRooms: data,
              });
            }}
            propertyId={property?.id}
          />
        );
      }

      // Step 4: Amenidades do Local (content-location-amenities) - READ ONLY
      if (step.id === "content-location-amenities") {
        // 🆕 Passar modalidades para filtrar campos específicos
        const modalidades = (formData?.contentType?.modalidades ||
          formData?.contentType?.categoria ||
          []) as string[];
        return (
          <ContentLocationAmenitiesStep
            propertyType={formData.contentType?.propertyType || "individual"}
            data={formData.contentLocationAmenities}
            modalidades={modalidades}
            onChange={(data) => {
              setFormData({
                ...formData,
                contentLocationAmenities: data,
              });
            }}
          />
        );
      }

      // Step 5: Amenidades da Acomodação (content-property-amenities) - EDITÁVEL
      if (step.id === "content-property-amenities") {
        return (
          <ContentAmenitiesStep
            value={{
              listingAmenities:
                formData.contentAmenities?.listingAmenities || [],
            }}
            onChange={(data) => {
              setFormData({
                ...formData,
                contentAmenities: data,
              });
            }}
          />
        );
      }

      // Step 6: Fotos e Mídia (content-photos) -> Agora é "Tour Visual" (Step 4)
      if (step.id === "content-photos") {
        return (
          <ContentPhotosStep
            data={formData.contentPhotos || { photos: [] }}
            rooms={formData.contentRooms?.rooms || []}
            onChange={(data) => {
              setFormData({
                ...formData,
                contentPhotos: data,
              });
            }}
            // 🆕 v1.0.104.1 - Permitir exclusão de fotos (atualiza rooms)
            onRoomsUpdate={(updatedRooms) => {
              setFormData({
                ...formData,
                contentRooms: {
                  ...(formData.contentRooms || {}),
                  rooms: updatedRooms
                }
              });
            }}
            propertyId={property?.id}
          />
        );
      }

      // Step 4: Amenidades (content-amenities) - DEPRECATED, mantido para compatibilidade
      if (step.id === "content-amenities") {
        return (
          <ContentAmenitiesStep
            value={{
              locationId: formData.contentLocation?.selectedLocationId,
              locationName: formData.contentLocation?.locationName,
              locationAmenities:
                formData.contentLocation?.locationAmenities || [],
              propertyAmenities:
                formData.contentAmenities?.propertyAmenities || [],
              inheritLocationAmenities:
                formData.contentAmenities?.inheritLocationAmenities,
            }}
            onChange={(data) => {
              setFormData({
                ...formData,
                contentAmenities: data,
              });
            }}
          />
        );
      }

      // Step 6: Descrição (content-description)
      if (step.id === "content-description") {
        // TODO: Buscar configuredCustomFields das settings (kv_store ou API)
        const configuredCustomFields = []; // Virá das configurações globais

        return (
          <ContentDescriptionStep
            value={formData.contentDescription}
            onChange={(data) => {
              setFormData({
                ...formData,
                contentDescription: data,
              });
            }}
            configuredCustomFields={configuredCustomFields}
          />
        );
      }

      // Step 1: Regras de Hospedagem (settings-rules)
      if (step.id === "settings-rules") {
        return (
          <SettingsRulesStep
            data={formData.settingsRules || {}}
            onChange={(data) => {
              setFormData({
                ...formData,
                settingsRules: data,
              });
            }}
          />
        );
      }

      // FINANCIAL STEP 1: Configuração de Relacionamento (financial-contract)
      if (step.id === "financial-contract") {
        return (
          <FinancialContractStep
            data={
              formData.financialContract || {
                isSublet: false,
                isExclusive: false,
                blockCalendarAfterEnd: false,
                commissionModel: "global",
                considerChannelFees: false,
                deductChannelFees: false,
                allowExclusiveTransfer: false,
                electricityChargeMode: "global",
                showReservationsInOwnerCalendar: "global",
                ownerPreReservationEmail: "global",
                agentPreReservationEmail: "global",
                ownerConfirmedReservationEmail: "global",
                agentConfirmedReservationEmail: "global",
                cancellationEmail: "global",
                deletedReservationEmail: "global",
                reserveLinkBeforeCheckout: "global",
              }
            }
            onChange={(data) => {
              setFormData({
                ...formData,
                financialContract: data,
              });
            }}
            owners={[]} // TODO: Buscar do backend
            managers={[]} // TODO: Buscar do backend
          />
        );
      }

      // FINANCIAL STEP 2: Preços Locação e Venda (financial-residential-pricing)
      if (step.id === "financial-residential-pricing") {
        // 🆕 Passar modalidades para filtrar seções
        const modalidades = (formData?.contentType?.modalidades ||
          formData?.contentType?.categoria ||
          []) as string[];
        return (
          <FinancialResidentialPricingStep
            data={
              formData.financialResidentialPricing || {
                priceType: "rental",
                acceptsFinancing: false,
                acceptsTrade: false,
                exclusiveSale: false,
              }
            }
            categories={modalidades}
            onChange={(data) => {
              setFormData({
                ...formData,
                financialResidentialPricing: data,
              });
            }}
            categories={
              formData.contentType?.modalidades ||
              formData.contentType?.categoria ||
              []
            }
          />
        );
      }

      // FINANCIAL STEP 3: Configuração de preço temporada (financial-fees)
      if (step.id === "financial-fees") {
        return (
          <FinancialSeasonalPricingStep
            data={
              formData.financialSeasonalPricing || {
                configMode: "global",
                region: "global",
                currency: "BRL",
                discountPolicy: "global",
                longStayDiscount: 0,
                weeklyDiscount: 0,
                monthlyDiscount: 0,
                depositMode: "global",
                depositAmount: 0,
                depositCurrency: "BRL",
                dynamicPricingMode: "global",
                enableDynamicPricing: false,
                feesMode: "global",
                cleaningFee: 0,
                cleaningFeePaidBy: "guest",
                petFee: 0,
                petFeePaidBy: "guest",
                extraServicesFee: 0,
                extraServicesFeePaidBy: "guest",
              }
            }
            onChange={(data) => {
              setFormData({
                ...formData,
                financialSeasonalPricing: data,
              });
            }}
          />
        );
      }

      // FINANCIAL STEP 4: Precificação Individual de Temporada (financial-pricing)
      if (step.id === "financial-pricing") {
        return (
          <FinancialIndividualPricingStep
            data={
              formData.financialIndividualPricing || {
                pricingMode: "global",
                basePricePerNight: 0,
                currency: "BRL",
                enableStayDiscounts: false,
                weeklyDiscount: 0,
                monthlyDiscount: 0,
                enableSeasonalPricing: false,
                seasonalPeriods: [],
                enableWeekdayPricing: false,
                weekdayPricing: {
                  monday: 0,
                  tuesday: 0,
                  wednesday: 0,
                  thursday: 0,
                  friday: 0,
                  saturday: 0,
                  sunday: 0,
                },
                enableSpecialDates: false,
                specialDates: [],
              }
            }
            onChange={(data) => {
              setFormData({
                ...formData,
                financialIndividualPricing: data,
              });
            }}
          />
        );
      }

      // FINANCIAL STEP 5: Preços Derivados (financial-derived-pricing)
      if (step.id === "financial-derived-pricing") {
        return (
          <FinancialDerivedPricingStep
            data={
              formData.financialDerivedPricing || {
                pricesVaryByGuests: false,
                maxGuestsIncluded: 2,
                extraGuestFeeType: "fixed",
                extraGuestFeeValue: 0,
                chargeForChildren: false,
                childrenChargeType: "per_night",
                ageBrackets: [],
              }
            }
            onChange={(data) => {
              setFormData({
                ...formData,
                financialDerivedPricing: data,
              });
            }}
          />
        );
      }

      // Outros steps - Placeholder
      console.log("⚠️ [Wizard] Step não implementado:", step.id);
      return (
        <Card className="border-2 border-dashed border-muted">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <step.icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>Formulário será implementado aqui</span>
            </div>
          </CardContent>
        </Card>
      );
    } catch (error: any) {
      console.error("❌ [Wizard] ERRO ao renderizar step:", error);
      console.error("❌ [Wizard] Stack trace:", error?.stack);
      return (
        <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="p-4 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                Erro ao carregar passo
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {error?.message || "Erro desconhecido"}
              </p>
              <pre className="mt-4 text-xs bg-red-100 dark:bg-red-900 p-4 rounded overflow-auto max-h-40">
                {error?.stack}
              </pre>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Conteúdo do wizard (compartilhado entre modal e full-screen)
  const wizardContent = (
    <>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Progresso Geral: {Math.round(getProgress())}%
          </span>
          <span className="font-medium">
            {completedSteps.size} de {getTotalSteps()} passos
          </span>
        </div>
        <Progress value={getProgress()} className="h-2" />
      </div>

      <Separator />

      {/* Tabs Container */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={currentBlock}
          onValueChange={setCurrentBlock}
          className="h-full flex flex-col"
        >
          {/* Tab Triggers */}
          <TabsList className="grid w-full grid-cols-3">
            {WIZARD_BLOCKS.map((block) => (
              <TabsTrigger key={block.id} value={block.id} className="gap-2">
                <block.icon className="h-4 w-4" />
                {block.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Contents */}
          <div className="flex-1 overflow-hidden pt-6">
            {WIZARD_BLOCKS.map((block) => (
              <TabsContent
                key={block.id}
                value={block.id}
                className="h-full m-0 flex gap-6"
              >
                {/* Sidebar - Steps List */}
                <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      {block.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        // ✅ PROTEÇÃO: Garantir que formData existe
                        if (!formData || typeof formData !== "object") {
                          return block.description;
                        }
                        const modalidades = (formData?.contentType
                          ?.modalidades ||
                          formData?.contentType?.categoria ||
                          []) as string[];
                        const relevantInBlock = block.steps.filter((s) =>
                          isStepRelevantForModalities(s.id, modalidades)
                        ).length;
                        const totalInBlock = block.steps.length;

                        if (
                          modalidades.length > 0 &&
                          relevantInBlock < totalInBlock
                        ) {
                          return `${relevantInBlock} de ${totalInBlock} passos relevantes para sua(s) modalidade(s)`;
                        }
                        return block.description;
                      })()}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {(() => {
                      // 🆕 v1.0.103.XXX - Filtrar steps relevantes primeiro
                      // ✅ PROTEÇÃO: Garantir que formData existe
                      if (!formData || typeof formData !== "object") {
                        return block.steps.map((step, index) => (
                          <div
                            key={step.id}
                            className="text-xs text-muted-foreground"
                          >
                            {index + 1}. {step.title}
                          </div>
                        ));
                      }
                      const modalidades = (formData?.contentType?.modalidades ||
                        formData?.contentType?.categoria ||
                        []) as string[];

                      const relevantSteps = block.steps
                        .map((step, originalIndex) => ({ step, originalIndex }))
                        .filter(
                          ({ step }) =>
                            step &&
                            isStepRelevantForModalities(step.id, modalidades)
                        );

                      return relevantSteps.map(
                        ({ step, originalIndex }, filteredIndex) => {
                          const isActive =
                            currentBlock === block.id &&
                            currentStepIndex === originalIndex;
                          const isCompleted = completedSteps.has(step.id);
                          const Icon = step.icon;

                          // 🆕 v1.0.103.109 - Obrigatoriedade dinâmica baseada na categoria
                          const dynamicValidation = getStepValidation(
                            step,
                            modalidades
                          );

                          return (
                            <button
                              key={step.id}
                              onClick={() =>
                                handleStepClick(block.id, originalIndex)
                              }
                              className={`
                              w-full text-left px-3 py-2 rounded-lg transition-colors
                              flex items-start gap-3 group
                              ${isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                                }
                            `}
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Icon
                                    className={`h-4 w-4 ${isActive
                                      ? "text-primary-foreground"
                                      : "text-muted-foreground"
                                      }`}
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium truncate">
                                    {filteredIndex + 1}. {step.title}
                                  </span>
                                </div>
                                <p
                                  className={`text-xs truncate ${isActive
                                    ? "text-primary-foreground/80"
                                    : "text-muted-foreground"
                                    }`}
                                >
                                  {step.description}
                                </p>
                                <div className="pt-1">
                                  {getValidationBadge(dynamicValidation)}
                                </div>
                              </div>
                            </button>
                          );
                        }
                      );
                    })()}
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Current Step Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Passo {getCurrentStepNumber()} de {getTotalSteps()}
                          </Badge>
                          {getValidationBadge(getCurrentStep().validation)}
                        </div>
                        <h3 className="text-xl font-semibold">
                          {getCurrentStep().title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {getCurrentStep().description}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 overflow-y-auto">
                    {renderStepContent()}
                  </div>
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>

      <Separator />

      {/* Footer - Actions */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep()}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={cancelEditing}>
            Cancelar
          </Button>
          {isLastStep() ? (
            <Button
              onClick={handleFinish}
              disabled={isSaving || isSavingInternal}
            >
              {isSaving || isSavingInternal ? (
                <>
                  <span className="mr-2">Salvando...</span>
                  <span className="animate-spin">⏳</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Finalizar
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSaveAndNext}
              disabled={isSaving || isSavingInternal}
            >
              {isSaving || isSavingInternal ? (
                <>
                  <span className="mr-2">Salvando...</span>
                  <span className="animate-spin">⏳</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar e Avançar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );

  // ✅ PROTEÇÃO FINAL: Garantir que formData está válido antes de renderizar
  // Simplificado: formData sempre será válido após inicialização
  // Se formData for inválido, usar dados vazios como fallback (sem setTimeout que pode causar loops)
  if (!formData || typeof formData !== "object") {
    console.warn("⚠️ [Wizard] formData inválido no render, usando fallback");
    // Atualizar formData apenas se necessário (evita loops)
    const safeFormData = createEmptyFormData();
    setFormData(safeFormData);
    // Continuar renderização normalmente (não retornar erro)
  }

  // Se estiver em modo full-screen, não usa Dialog
  if (isFullScreen) {
    return (
      <div className="w-full bg-card rounded-lg border shadow-sm flex flex-col h-full">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 space-y-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">
                {property?.id ? "Editar Propriedade" : "Nova Propriedade"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {property?.internalName || "Nova Propriedade"} - Complete os 14
                passos para finalizar a configuração
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col gap-4">
          {wizardContent}
        </div>
      </div>
    );
  }

  // Modo modal (original)
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 space-y-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl">Editar Propriedade</DialogTitle>
              <DialogDescription>
                {property?.internalName || "Nova Propriedade"} - Complete os 14
                passos para finalizar a configuração
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content com Progress Bar */}
        <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col gap-4">
          {wizardContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PropertyEditWizard;
