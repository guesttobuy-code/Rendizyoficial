/**
 * RENDIZY - Property Wizard Page
 *
 * Página para criação/edição de propriedades
 * v1.0.103.174 - Agora com sidebar sempre visível
 *
 * @version 1.0.103.174
 * @date 2025-10-31
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, AlertCircle, Home } from "lucide-react";
import { Button } from "../components/ui/button";
import { PropertyEditWizard } from "../components/PropertyEditWizard";
import { toast } from "sonner";
import { propertiesApi } from "../utils/api";

export function PropertyWizardPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se é edição ou criação
  const isEditMode = !!id && id !== "new";

  // Carregar propriedade se for edição
  useEffect(() => {
    const loadProperty = async () => {
      if (!isEditMode) {
        setLoading(false);
        return;
      }

      try {
        console.log("🔍 Carregando propriedade:", id);
        const response = await propertiesApi.get(id);

        if (response.success && response.data) {
          console.log("✅ Propriedade carregada:", response.data);
          setProperty(response.data);
          setError(null);
        } else {
          console.error("❌ Propriedade não encontrada");
          setError("Propriedade não encontrada");
          toast.error("Propriedade não encontrada");

          // Redirecionar após 2 segundos
          setTimeout(() => {
            navigate("/properties");
          }, 2000);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar propriedade:", error);
        setError("Erro ao carregar propriedade. Verifique sua conexão.");
        toast.error("Erro ao carregar propriedade");

        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate("/properties");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id, isEditMode, navigate]);

  // ✅ BOAS PRÁTICAS v1.0.103.1000 - Normalizar dados do wizard antes de enviar
  const normalizeWizardData = (wizardData: any): any => {
    console.log("🔄 [PropertyWizardPage] Normalizando dados do wizard...");

    // Extrair campos do wizard (estrutura aninhada)
    let name = wizardData.contentType?.internalName || wizardData.name || null;

    let code = wizardData.contentType?.code || wizardData.code || null;

    let type =
      wizardData.contentType?.propertyTypeId ||
      wizardData.contentType?.accommodationTypeId ||
      wizardData.type ||
      null;

    // Gerar nome a partir do accommodationTypeId se não existir
    if (!name && wizardData.contentType?.accommodationTypeId) {
      const accommodationTypeId = wizardData.contentType.accommodationTypeId;
      const accommodationTypeNames: Record<string, string> = {
        acc_casa: "Casa",
        acc_apartamento: "Apartamento",
        acc_chale: "Chalé",
        acc_bangalo: "Bangalô",
        acc_estudio: "Estúdio",
        acc_loft: "Loft",
        acc_suite: "Suíte",
        acc_villa: "Villa",
        acc_quarto_inteiro: "Quarto Inteiro",
        acc_quarto_privado: "Quarto Privado",
        acc_quarto_compartilhado: "Quarto Compartilhado",
      };
      name =
        accommodationTypeNames[accommodationTypeId] ||
        accommodationTypeId
          .replace("acc_", "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
      console.log("✅ [PropertyWizardPage] Nome gerado:", name);
    }

    // Gerar código único se não existir
    if (!code) {
      const timestamp = Date.now().toString(36).slice(-6).toUpperCase();
      const typePrefix = type
        ? type
          .replace("loc_", "")
          .replace("acc_", "")
          .substring(0, 3)
          .toUpperCase()
        : "PRP";
      code = `${typePrefix}${timestamp}`;
      console.log("✅ [PropertyWizardPage] Código gerado:", code);
    }

    // Extrair endereço de contentLocation
    let address =
      wizardData.contentLocation?.address || wizardData.address || {};

    // Garantir que address tenha city e state (obrigatórios)
    if (!address.city && wizardData.contentLocation?.city) {
      address.city = wizardData.contentLocation.city;
    }
    if (!address.state && wizardData.contentLocation?.state) {
      address.state = wizardData.contentLocation.state;
    }
    if (!address.state && wizardData.contentLocation?.stateCode) {
      address.state = wizardData.contentLocation.stateCode;
    }

    // ✅ Se ainda não tiver city/state, usar valores padrão temporários (será atualizado no Step 2)
    if (!address.city) {
      address.city = "Rio de Janeiro";
    }
    if (!address.state) {
      address.state = "RJ";
    }
    if (!address.country) {
      address.country = "BR";
    }

    // Extrair dados financeiros de compra e venda
    const salePrice = wizardData.financialResidentialPricing?.salePrice;
    const monthlyRent = wizardData.financialResidentialPricing?.monthlyRent;
    const modalities =
      wizardData.contentType?.modalidades || wizardData.modalities || [];

    // Preparar financialInfo para o backend
    const financialInfo: any = {};
    if (modalities.includes("buy_sell") && salePrice) {
      financialInfo.salePrice = salePrice;
    }
    if (modalities.includes("residential_rental") && monthlyRent) {
      financialInfo.monthlyRent = monthlyRent;
    }

    // ✅ FIX: Garantir que fotos sejam extraídas para o nível raiz
    // O backend espera 'photos' no root para salvar na coluna photos
    // 🆕 v1.0.103.1100 - Extrair fotos também dos cômodos (wizard step 3)
    let photos =
      wizardData.contentPhotos?.photos ||
      wizardData.photos ||
      [];

    // Extrair fotos dos cômodos se houver
    if (wizardData.contentRooms?.rooms && Array.isArray(wizardData.contentRooms.rooms)) {
      const roomPhotos = wizardData.contentRooms.rooms.flatMap((room: any) => room.photos || []);
      if (roomPhotos.length > 0) {
        // Evitar duplicatas se já existirem (por ID)
        const existingIds = new Set(photos.map((p: any) => p.id || p.url));
        const newPhotos = roomPhotos.filter((p: any) => !existingIds.has(p.id || p.url));

        if (newPhotos.length > 0) {
          console.log(`📸 [PropertyWizardPage] Adicionando ${newPhotos.length} fotos dos cômodos ao array principal`);
          photos = [...photos, ...newPhotos];
        }
      }
    }

    const coverPhoto =
      wizardData.contentPhotos?.coverPhoto ||
      wizardData.coverPhoto ||
      (photos.length > 0 ? (photos[0].url || photos[0]) : null);

    console.log("📸 [PropertyWizardPage] Fotos normalizadas:", {
      count: photos.length,
      hasCover: !!coverPhoto
    });

    // Retornar dados normalizados (mantendo estrutura wizard para compatibilidade)
    return {
      ...wizardData,
      internalName: wizardData.internalName || wizardData.contentType?.internalName,
      name: name || "Propriedade",
      code: code,
      type: type || wizardData.contentType?.propertyTypeId || "loc_casa",
      address: address,
      // Campos obrigatórios mínimos para criação
      maxGuests:
        wizardData.contentRooms?.maxGuests || wizardData.maxGuests || 2,
      bedrooms: wizardData.contentRooms?.bedrooms || wizardData.bedrooms || 1,
      beds: wizardData.contentRooms?.beds || wizardData.beds || 1,
      bathrooms:
        wizardData.contentRooms?.bathrooms || wizardData.bathrooms || 1,
      // Para compra e venda, usar salePrice se disponível, senão usar valor padrão
      // IMPORTANTE: basePrice é sempre obrigatório no backend, mesmo para compra e venda
      // Se for compra e venda e tiver salePrice, usar salePrice como basePrice
      // Se for locação residencial e tiver monthlyRent, usar monthlyRent como basePrice
      // Caso contrário, usar 100 como padrão
      basePrice:
        wizardData.basePrice ||
        (modalities.includes("buy_sell") && salePrice
          ? salePrice
          : undefined) ||
        (modalities.includes("residential_rental") && monthlyRent
          ? monthlyRent
          : undefined) ||
        100,
      currency: wizardData.currency || "BRL",
      // Campos do Step 1
      propertyType: wizardData.contentType?.propertyType || "individual",
      accommodationType: wizardData.contentType?.accommodationTypeId,
      subtype: wizardData.contentType?.subtipo || wizardData.subtype,
      modalities: modalities,
      // Campos de media
      photos: photos,
      coverPhoto: coverPhoto,
      // Campos financeiros para o backend
      financialInfo:
        Object.keys(financialInfo).length > 0 ? financialInfo : undefined,
      // Manter estrutura completa do wizard para compatibilidade
      financialResidentialPricing: wizardData.financialResidentialPricing,
    };
  };

  // Salvar propriedade
  const handleSave = async (data: any) => {
    console.log("💾 [PropertyWizardPage] handleSave chamado");
    console.log(
      "📊 [PropertyWizardPage] Dados a salvar (brutos):",
      JSON.stringify(data, null, 2)
    );
    console.log(
      "🔧 [PropertyWizardPage] Modo:",
      isEditMode ? "EDIÇÃO" : "CRIAÇÃO"
    );

    setSaving(true);

    try {
      // ✅ BOAS PRÁTICAS v1.0.103.1000 - Normalizar dados ANTES de enviar
      const normalizedData = normalizeWizardData(data);
      console.log(
        "✅ [PropertyWizardPage] Dados normalizados:",
        JSON.stringify(normalizedData, null, 2)
      );

      // ✅ VALIDAÇÃO EXTRA: só forçar campos quando NÃO for rascunho
      const isDraftSave = !isEditMode || normalizedData.status === "draft";

      if (!isDraftSave) {
        if (
          !normalizedData.name ||
          !normalizedData.code ||
          !normalizedData.type
        ) {
          console.error("❌ [PropertyWizardPage] Campos obrigatórios faltando:", {
            name: normalizedData.name,
            code: normalizedData.code,
            type: normalizedData.type,
          });
          toast.error(
            "Preencha todos os campos obrigatórios (Nome, Código, Tipo)"
          );
          setSaving(false);
          return;
        }

        if (!normalizedData.address?.city || !normalizedData.address?.state) {
          console.error(
            "❌ [PropertyWizardPage] Endereço incompleto:",
            normalizedData.address
          );
          toast.error("Preencha cidade e estado no endereço");
          setSaving(false);
          return;
        }

        if (!normalizedData.basePrice || normalizedData.basePrice <= 0) {
          console.error(
            "❌ [PropertyWizardPage] basePrice inválido:",
            normalizedData.basePrice
          );
          toast.error("Preço base deve ser maior que zero");
          setSaving(false);
          return;
        }
      }

      let response;

      if (isEditMode) {
        console.log("📝 [PropertyWizardPage] Atualizando propriedade ID:", id);
        response = await propertiesApi.update(id, normalizedData);
      } else {
        // 🆕 SISTEMA DE RASCUNHO: Se não tem status, assumir 'draft' para criação
        const dataToCreate = {
          ...normalizedData,
          status: normalizedData.status || "draft", // 🆕 Sempre criar como rascunho inicialmente
        };

        console.log(
          "➕ [PropertyWizardPage] Criando nova propriedade (rascunho)"
        );
        console.log(
          "📤 [PropertyWizardPage] Enviando para API:",
          JSON.stringify(dataToCreate, null, 2)
        );
        response = await propertiesApi.create(dataToCreate as any);

        // 🆕 Se criou com sucesso e retornou ID, atualizar state para próximos steps
        if (response.success && response.data?.id) {
          console.log(
            "✅ [PropertyWizardPage] Rascunho criado com ID:",
            response.data.id
          );
          // Não atualizar property aqui - será feito pelo wizard quando necessário
        }
      }

      console.log(
        "📡 [PropertyWizardPage] Resposta da API:",
        JSON.stringify(response, null, 2)
      );

      if (response.success) {
        console.log(
          "✅ [PropertyWizardPage] Sucesso! Navegando para /properties"
        );

        // 🆕 Se for criação e status='draft', mensagem diferente
        const isDraft = normalizedData.status === "draft";
        const successMessage = isEditMode
          ? "Propriedade atualizada com sucesso!"
          : isDraft
            ? "Rascunho salvo! Você pode continuar depois."
            : "Propriedade criada com sucesso!";

        toast.success(successMessage);

        // 🆕 Se for rascunho, não redirecionar (deixar usuário continuar)
        if (!isDraft) {
          // Usar navigate em vez de window.location
          navigate("/properties");
        }
      } else {
        console.error(
          "❌ [PropertyWizardPage] Erro na resposta:",
          response.error
        );
        console.error("❌ [PropertyWizardPage] Resposta completa:", response);
        toast.error(response.error || "Erro ao salvar propriedade");
      }
    } catch (error: any) {
      console.error("❌ [PropertyWizardPage] Exceção ao salvar:", error);
      console.error("❌ [PropertyWizardPage] Stack trace:", error?.stack);
      toast.error(
        `Erro ao salvar propriedade: ${error?.message || "Erro desconhecido"}`
      );
    } finally {
      setSaving(false);
      console.log("🏁 [PropertyWizardPage] handleSave finalizado");
    }
  };

  // Voltar para lista
  const handleBack = () => {
    navigate("/properties");
  };

  // Error state (quando propriedade não encontrada)
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            Propriedade não encontrada
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Ir para Dashboard
            </Button>
            <Button onClick={() => navigate("/properties")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Imóveis
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando propriedade...</p>

          {/* Botão de emergência mesmo durante loading */}
          <div className="mt-6">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      {/* Header com breadcrumb e botão voltar */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Imóveis
              </Button>

              <div className="h-4 w-px bg-border" />

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Gestão de Imóveis</span>
                <span>›</span>
                <span className="text-foreground font-medium">
                  {isEditMode
                    ? `Editar: ${property?.internalName || "Imóvel"}`
                    : "Nova Propriedade"}
                </span>
              </div>
            </div>

            {/* Botão de emergência sempre visível */}
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Wizard Component (ocupa toda a altura restante) */}
      <div className="container mx-auto px-6 py-8">
        <PropertyEditWizard
          open={true}
          onClose={handleBack}
          property={property || {}}
          onSave={handleSave}
          isSaving={saving}
          isFullScreen={true}
        />
      </div>
    </div>
  );
}
