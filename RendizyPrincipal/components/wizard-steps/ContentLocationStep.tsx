/**
 * RENDIZY - Wizard Step: Localização
 *
 * Step 2 do Wizard de Edição de Propriedades
 * Baseado na imagem fornecida pelo usuário
 *
 * @version 1.0.104.0
 * @date 2025-10-30
 * 
 * 🆕 v1.0.104.0:
 * - Implementado sistema de tags para fotos de localização
 * - Suporte a upload real de fotos (Supabase Storage)
 * - Migração automática de array de strings para objetos Photo
 */

import { useState, useEffect } from "react";
import {
  MapPin,
  Upload,
  Image as ImageIcon,
  Car,
  Wifi,
  Globe,
  Clock,
  Zap,
  Trash2,
  Tag as TagIcon,
  GripVertical,
  Loader2,
  Check,
} from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { TagsSelector, PHOTO_TAGS } from "../common/TagsSelector";
import { uploadRoomPhoto, deleteRoomPhoto } from "../../utils/roomsApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

// ============================================================================
// TYPES
// ============================================================================

type AddressMode = "new" | "existing";
type AddressVisibility = "global" | "individual";

interface AddressData {
  country: string;
  state: string;
  stateCode: string;
  zipCode: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
  latitude?: number;
  longitude?: number;
}

interface Photo {
  id: string;
  url: string;
  tags: string[];
  order: number;
  path?: string; // Caminho no storage (opcional, para delete)
}

interface FormData {
  mode: AddressMode;
  address: AddressData;
  showBuildingNumber: AddressVisibility;
  photos: Photo[]; // 🆕 Atualizado para Photo[]
  // Características do Local (afetam todos os anúncios)
  hasExpressCheckInOut?: boolean; // Check-in/checkout expressos
  hasParking?: boolean; // Estacionamento
  hasCableInternet?: boolean; // Internet a Cabo
  hasWiFi?: boolean; // Internet Wi-Fi
  has24hReception?: boolean; // Recepção 24 horas
}

interface ContentLocationStepProps {
  data: FormData;
  onChange: (data: FormData) => void;
  modalidades?: string[]; // 🆕 Modalidades selecionadas para filtrar campos
  propertyId?: string; // 🆕 ID da propriedade para upload
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ContentLocationStep({
  data,
  onChange,
  modalidades = [],
  propertyId,
}: ContentLocationStepProps) {
  const [mapPreviewUrl, setMapPreviewUrl] = useState<string>("");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);

  // 🆕 Verificar se é modalidade de temporada (para mostrar campos específicos)
  const isShortTermRental = modalidades.includes("short_term_rental");

  // ============================================================================
  // MIGRATION & INIT
  // ============================================================================

  useEffect(() => {
    // Migração automática de string[] para Photo[]
    // Verifica se data.photos existe e se o primeiro item é string
    // @ts-ignore - Verificando tipo runtime para compatibilidade
    if (data.photos && data.photos.length > 0 && typeof data.photos[0] === 'string') {
      console.log("🔄 [ContentLocationStep] Migrating photos from strings to objects...");
      // @ts-ignore
      const migratedPhotos: Photo[] = data.photos.map((url: string, index: number) => ({
        id: `loc-migrated-${Date.now()}-${index}`,
        url: url,
        tags: [],
        order: index
      }));

      onChange({ ...data, photos: migratedPhotos });
    }
  }, [data.photos, onChange, data]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (field: keyof FormData, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleAddressChange = (field: keyof AddressData, value: any) => {
    onChange({
      ...data,
      address: {
        ...data.address,
        [field]: value,
      },
    });
  };

  const handleCepBlur = async () => {
    const cep = data.address.zipCode?.replace(/\D/g, "");
    if (cep?.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const cepData = await response.json();

        if (!cepData.erro) {
          onChange({
            ...data,
            address: {
              ...data.address,
              street: cepData.logradouro || data.address.street,
              neighborhood: cepData.bairro || data.address.neighborhood,
              city: cepData.localidade || data.address.city,
              state: cepData.uf || data.address.state,
              stateCode: cepData.uf || data.address.stateCode,
            },
          });

          // Gerar URL do mapa com base no endereço
          updateMapPreview(cepData);
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const updateMapPreview = (cepData?: any) => {
    // Mock URL for now
    const address = cepData
      ? `${cepData.logradouro}, ${cepData.bairro}, ${cepData.localidade} - ${cepData.uf}`
      : `${data.address.street}, ${data.address.neighborhood}, ${data.address.city} - ${data.address.stateCode}`;

    // URL do Google Maps Static API (simplificada para preview)
    // Note: precisa de API KEY válida
    const mapUrl = ""; // Deixar vazio por enquanto se não tiver key
    setMapPreviewUrl(mapUrl);
  };

  // ============================================================================
  // PHOTO MANAGEMENT
  // ============================================================================

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Se não temos propertyId, usar preview local (blob)
    if (!propertyId) {
      const newPhotos: Photo[] = [];
      Array.from(files).forEach((file, index) => {
        const url = URL.createObjectURL(file);
        newPhotos.push({
          id: `loc-photo-${Date.now()}-${index}`,
          url,
          tags: [],
          order: (data.photos?.length || 0) + index,
        });
      });

      handleChange("photos", [...(data.photos || []), ...newPhotos]);
      return;
    }

    // Upload real para Supabase
    setUploadingPhotos(true);
    const newPhotos: Photo[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        toast.loading(`Fazendo upload da foto ${i + 1}/${files.length}...`, {
          id: "loc-photo-upload",
        });

        // Usar "location" como roomType para organizar no storage
        const uploadedPhoto = await uploadRoomPhoto(
          file,
          propertyId,
          "location"
        );

        newPhotos.push({
          id: uploadedPhoto.id,
          url: uploadedPhoto.url,
          path: uploadedPhoto.path,
          tags: [],
          order: (data.photos?.length || 0) + i,
        });
      }

      handleChange("photos", [...(data.photos || []), ...newPhotos]);

      toast.success(`${files.length} foto(s) enviada(s) com sucesso!`, {
        id: "loc-photo-upload",
      });
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Erro ao fazer upload das fotos", {
        id: "loc-photo-upload",
      });
    } finally {
      setUploadingPhotos(false);
      // Reset input value
      event.target.value = "";
    }
  };

  const deletePhoto = async (photoId: string) => {
    const photo = data.photos.find((p) => p.id === photoId);
    if (!photo) return;

    // Se tem path, deletar do storage
    if (photo.path && propertyId) {
      try {
        await deleteRoomPhoto(photo.path);
        toast.success("Foto deletada com sucesso!");
      } catch (error) {
        console.error("Error deleting photo:", error);
        toast.error("Erro ao deletar foto do servidor");
        // Continuar para remover da lista local mesmo com erro, para não travar UI
      }
    }

    const newPhotos = data.photos.filter((p) => p.id !== photoId);
    handleChange("photos", newPhotos);

    // Se estava selecionada, remover da seleção
    if (selectedPhotos.includes(photoId)) {
      setSelectedPhotos(prev => prev.filter(id => id !== photoId));
    }
  };

  // ============================================================================
  // TAGGING & SELECTION
  // ============================================================================

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const selectAllPhotos = () => {
    if (!data.photos) return;
    setSelectedPhotos(data.photos.map((p) => p.id));
  };

  const deselectAllPhotos = () => {
    setSelectedPhotos([]);
  };

  const applyTagsToSelected = (tags: string[]) => {
    const updatedPhotos = data.photos.map((photo) => {
      if (selectedPhotos.includes(photo.id)) {
        return { ...photo, tags: [...new Set([...photo.tags, ...tags])] };
      }
      return photo;
    });

    handleChange("photos", updatedPhotos);
    setShowTagsModal(false);
    setSelectedPhotos([]);
    toast.success("Tags aplicadas com sucesso!");
  };

  const removePhotoTag = (photoId: string, tag: string) => {
    const updatedPhotos = data.photos.map((photo) => {
      if (photo.id === photoId) {
        return { ...photo, tags: photo.tags.filter((t) => t !== tag) };
      }
      return photo;
    });

    handleChange("photos", updatedPhotos);
  };

  // ============================================================================
  // DRAG & DROP
  // ============================================================================

  const handleDragStart = (photoId: string) => {
    setDraggedPhotoId(photoId);
  };

  const handleDragOver = (e: React.DragEvent, targetPhotoId: string) => {
    e.preventDefault();
    if (!draggedPhotoId || draggedPhotoId === targetPhotoId) return;

    const photos = [...data.photos];
    const draggedIndex = photos.findIndex((p) => p.id === draggedPhotoId);
    const targetIndex = photos.findIndex((p) => p.id === targetPhotoId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedPhoto] = photos.splice(draggedIndex, 1);
    photos.splice(targetIndex, 0, draggedPhoto);

    // Atualizar order
    const orderedPhotos = photos.map((photo, index) => ({
      ...photo,
      order: index
    }));

    handleChange("photos", orderedPhotos);
  };

  const handleDragEnd = () => {
    setDraggedPhotoId(null);
  };

  // ============================================================================
  // SAFETY CHECK
  // ============================================================================

  // Garantir que photos seja array
  const safePhotos: Photo[] = Array.isArray(data.photos) ? data.photos : [];
  // Filtrar itens inválidos (se sobrar alguma string)
  const displayPhotos = safePhotos.filter(p => typeof p === 'object' && p !== null && p.url);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6 max-w-5xl">
      {/* TABS: Novo endereço / Vincular a existente */}
      <Tabs
        value={data.mode}
        onValueChange={(value) => handleChange("mode", value as AddressMode)}
      >
        <TabsList>
          <TabsTrigger value="new">Novo endereço</TabsTrigger>
          <TabsTrigger value="existing">Vincular a existente</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6 mt-6">
          {/* Layout: 2 colunas (Formulário + Mapa) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUNA ESQUERDA - FORMULÁRIO */}
            <div className="space-y-4">
              {/* País */}
              <div className="space-y-2">
                <Label htmlFor="country">País:</Label>
                <Select
                  value={data.address.country}
                  onValueChange={(value) =>
                    handleAddressChange("country", value)
                  }
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Selecione o país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BR">Brasil (BR)</SelectItem>
                    <SelectItem value="US">Estados Unidos (US)</SelectItem>
                    <SelectItem value="AR">Argentina (AR)</SelectItem>
                    <SelectItem value="UY">Uruguai (UY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Estado e Sigla */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">Estado:</Label>
                  <Input
                    id="state"
                    placeholder="Rio De Janeiro"
                    value={data.address.state}
                    onChange={(e) =>
                      handleAddressChange("state", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateCode">Sigla do estado:</Label>
                  <Input
                    id="stateCode"
                    placeholder="RJ"
                    maxLength={2}
                    value={data.address.stateCode}
                    onChange={(e) =>
                      handleAddressChange(
                        "stateCode",
                        e.target.value.toUpperCase()
                      )
                    }
                  />
                </div>
              </div>

              {/* CEP */}
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP:</Label>
                <Input
                  id="zipCode"
                  placeholder="28950-000"
                  value={data.address.zipCode}
                  onChange={(e) => {
                    const formatted = e.target.value
                      .replace(/\D/g, "")
                      .replace(/(\d{5})(\d)/, "$1-$2")
                      .slice(0, 9);
                    handleAddressChange("zipCode", formatted);
                  }}
                  onBlur={handleCepBlur}
                />
              </div>

              {/* Cidade */}
              <div className="space-y-2">
                <Label htmlFor="city">Cidade:</Label>
                <Input
                  id="city"
                  placeholder="Armação dos Búzios"
                  value={data.address.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                />
              </div>

              {/* Bairro */}
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro:</Label>
                <Input
                  id="neighborhood"
                  placeholder="Praia Rasa"
                  value={data.address.neighborhood}
                  onChange={(e) =>
                    handleAddressChange("neighborhood", e.target.value)
                  }
                />
              </div>

              {/* Rua e Número */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Rua:</Label>
                  <Input
                    id="street"
                    placeholder="rua Do Conforto"
                    value={data.address.street}
                    onChange={(e) =>
                      handleAddressChange("street", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número:</Label>
                  <Input
                    id="number"
                    placeholder="N 136 e"
                    value={data.address.number}
                    onChange={(e) =>
                      handleAddressChange("number", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Complemento */}
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento:</Label>
                <Input
                  id="complement"
                  placeholder="Pousada Recanto das Palmeiras"
                  value={data.address.complement}
                  onChange={(e) =>
                    handleAddressChange("complement", e.target.value)
                  }
                />
              </div>

              {/* Mostrar número do prédio */}
              <div className="space-y-2">
                <Label>Mostrar o número do prédio aos usuários?</Label>
                <p className="text-sm text-muted-foreground">
                  Marque (Não) para ocultar o número do prédio nos seus
                  anúncios.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={
                      data.showBuildingNumber === "global"
                        ? "default"
                        : "outline"
                    }
                    className="flex-1"
                    onClick={() => handleChange("showBuildingNumber", "global")}
                  >
                    Global
                  </Button>
                  <Button
                    type="button"
                    variant={
                      data.showBuildingNumber === "individual"
                        ? "default"
                        : "outline"
                    }
                    className="flex-1"
                    onClick={() =>
                      handleChange("showBuildingNumber", "individual")
                    }
                  >
                    Individual
                  </Button>
                </div>
              </div>

              {/* CARACTERÍSTICAS DO LOCAL - Sim/Não (Universais) */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium mb-1">Características do Local</h4>
                  <p className="text-sm text-muted-foreground">
                    Informações que se aplicam a todas as modalidades.
                  </p>
                </div>

                {/* Estacionamento */}
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Car className="size-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Estacionamento</p>
                          <p className="text-xs text-muted-foreground">
                            Por favor, informe mais detalhes.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            data.hasParking === true ? "default" : "outline"
                          }
                          className={
                            data.hasParking === true
                              ? "bg-blue-500 hover:bg-blue-600"
                              : ""
                          }
                          onClick={() => handleChange("hasParking", true)}
                        >
                          Sim
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            data.hasParking === false ? "default" : "outline"
                          }
                          className={
                            data.hasParking === false
                              ? "bg-blue-500 hover:bg-blue-600"
                              : ""
                          }
                          onClick={() => handleChange("hasParking", false)}
                        >
                          Não
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Internet a Cabo */}
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Globe className="size-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Internet a Cabo</p>
                          <p className="text-xs text-muted-foreground">
                            Por favor, informe mais detalhes.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            data.hasCableInternet === true
                              ? "default"
                              : "outline"
                          }
                          className={
                            data.hasCableInternet === true
                              ? "bg-blue-500 hover:bg-blue-600"
                              : ""
                          }
                          onClick={() => handleChange("hasCableInternet", true)}
                        >
                          Sim
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            data.hasCableInternet === false
                              ? "default"
                              : "outline"
                          }
                          className={
                            data.hasCableInternet === false
                              ? "bg-blue-500 hover:bg-blue-600"
                              : ""
                          }
                          onClick={() =>
                            handleChange("hasCableInternet", false)
                          }
                        >
                          Não
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Internet Wi-Fi */}
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Wifi className="size-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Internet Wi-Fi</p>
                          <p className="text-xs text-muted-foreground">
                            Por favor, informe mais detalhes.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            data.hasWiFi === true ? "default" : "outline"
                          }
                          className={
                            data.hasWiFi === true
                              ? "bg-blue-500 hover:bg-blue-600"
                              : ""
                          }
                          onClick={() => handleChange("hasWiFi", true)}
                        >
                          Sim
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            data.hasWiFi === false ? "default" : "outline"
                          }
                          className={
                            data.hasWiFi === false
                              ? "bg-blue-500 hover:bg-blue-600"
                              : ""
                          }
                          onClick={() => handleChange("hasWiFi", false)}
                        >
                          Não
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* SERVIÇOS DE TEMPORADA - Apenas para Aluguel por Temporada */}
              {isShortTermRental && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium mb-1">Serviços de Temporada</h4>
                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                      Apenas Temporada
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Serviços específicos para aluguel por temporada.
                  </p>

                  {/* Check-in/checkout expressos */}
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Zap className="size-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Check-in/checkout expressos
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Permite check-in e checkout sem necessidade de
                              presença física.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              data.hasExpressCheckInOut === true
                                ? "default"
                                : "outline"
                            }
                            className={
                              data.hasExpressCheckInOut === true
                                ? "bg-blue-500 hover:bg-blue-600"
                                : ""
                            }
                            onClick={() =>
                              handleChange("hasExpressCheckInOut", true)
                            }
                          >
                            Sim
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              data.hasExpressCheckInOut === false
                                ? "default"
                                : "outline"
                            }
                            className={
                              data.hasExpressCheckInOut === false
                                ? "bg-blue-500 hover:bg-blue-600"
                                : ""
                            }
                            onClick={() =>
                              handleChange("hasExpressCheckInOut", false)
                            }
                          >
                            Não
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recepção 24 horas */}
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Clock className="size-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Recepção 24 horas</p>
                            <p className="text-xs text-muted-foreground">
                              Recepção disponível 24 horas por dia, 7 dias por
                              semana.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              data.has24hReception === true
                                ? "default"
                                : "outline"
                            }
                            className={
                              data.has24hReception === true
                                ? "bg-blue-500 hover:bg-blue-600"
                                : ""
                            }
                            onClick={() =>
                              handleChange("has24hReception", true)
                            }
                          >
                            Sim
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              data.has24hReception === false
                                ? "default"
                                : "outline"
                            }
                            className={
                              data.has24hReception === false
                                ? "bg-blue-500 hover:bg-blue-600"
                                : ""
                            }
                            onClick={() =>
                              handleChange("has24hReception", false)
                            }
                          >
                            Não
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* COLUNA DIREITA - MAPA */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative h-80 bg-muted flex items-center justify-center">
                    {mapPreviewUrl ? (
                      <img
                        src={mapPreviewUrl}
                        alt="Mapa"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center space-y-2">
                        <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Preencha o CEP para visualizar o mapa
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Botões do mapa (Map / Satellite) */}
                  <div className="absolute top-2 left-2 flex gap-1 bg-white rounded-md shadow-md">
                    <button className="px-3 py-1 text-sm font-medium bg-white hover:bg-gray-100 rounded-l-md">
                      Map
                    </button>
                    <button className="px-3 py-1 text-sm font-medium bg-white hover:bg-gray-100 rounded-r-md">
                      Satellite
                    </button>
                  </div>
                </CardContent>
              </Card>

              <div className="text-xs text-muted-foreground">
                <p>Arraste o marcador para ajustar a localização exata</p>
              </div>
            </div>
          </div>

          {/* FOTOS RELACIONADAS AO ENDEREÇO */}
          <div className="space-y-4 pt-6 border-t">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                Fotos relacionadas ao endereço
              </h3>
              <p className="text-sm text-muted-foreground">
                Adicione fotos do entorno, fachada e áreas sociais do endereço.
                Arraste para reordenar.
              </p>
            </div>

            {/* Botões de Ação em Lote */}
            {displayPhotos.length > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAllPhotos}
                  disabled={selectedPhotos.length === displayPhotos.length}
                >
                  Selecionar Todas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={deselectAllPhotos}
                  disabled={selectedPhotos.length === 0}
                >
                  Desmarcar Todas
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setShowTagsModal(true)}
                  disabled={selectedPhotos.length === 0}
                >
                  <TagIcon className="h-4 w-4 mr-2" />
                  Adicionar Tags
                </Button>
              </div>
            )}

            {/* Upload Area */}
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                {uploadingPhotos ? (
                  <>
                    <Loader2 className="h-8 w-8 text-muted-foreground mb-2 animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Fazendo upload das fotos...
                    </p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Arraste suas imagens para cá ou clique para carregar.
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="loc-photo-upload-input"
                      disabled={uploadingPhotos}
                    />
                    <label htmlFor="loc-photo-upload-input">
                      <Button type="button" variant="outline" asChild disabled={uploadingPhotos}>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar Imagens
                        </span>
                      </Button>
                    </label>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Grid de Fotos */}
            {displayPhotos.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {displayPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    draggable
                    onDragStart={() => handleDragStart(photo.id)}
                    onDragOver={(e) => handleDragOver(e, photo.id)}
                    onDragEnd={handleDragEnd}
                    className={`relative group aspect-square rounded-lg overflow-hidden border-2 cursor-move bg-muted ${selectedPhotos.includes(photo.id)
                      ? "border-primary ring-2 ring-primary"
                      : "border-transparent"
                      }`}
                  >
                    {/* Checkbox de seleção */}
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedPhotos.includes(photo.id)}
                        onCheckedChange={() => togglePhotoSelection(photo.id)}
                        className="bg-white border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                    </div>

                    {/* Ícone de Drag */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      <GripVertical className="h-8 w-8 text-white drop-shadow-md" />
                    </div>

                    <img
                      src={photo.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />

                    {/* Botão de deletar */}
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7 rounded-full shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePhoto(photo.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Tags Overlay */}
                    {photo.tags.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <div className="flex flex-wrap gap-1">
                          {photo.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px] h-5 px-1 gap-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePhotoTag(photo.id, tag);
                              }}
                            >
                              {tag}
                              <span className="cursor-pointer hover:text-red-500">×</span>
                            </Badge>
                          ))}
                          {photo.tags.length > 2 && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1">
                              +{photo.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: Vincular a existente */}
        <TabsContent value="existing" className="space-y-4 mt-6">
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-muted rounded-full mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Selecione um endereço já cadastrado no sistema para vincular a
                esta propriedade.
              </p>
              <Button type="button" variant="outline" className="mt-4">
                Selecionar Endereço Existente
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resumo do Endereço */}
      {data.mode === "new" && data.address.city && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço Completo:
              </h4>
              <div className="text-sm text-muted-foreground">
                {data.address.street && `${data.address.street}, `}
                {data.address.number && `${data.address.number} `}
                {data.address.complement && `- ${data.address.complement}`}
                {(data.address.street || data.address.number) && <br />}
                {data.address.neighborhood && `${data.address.neighborhood}, `}
                {data.address.city && `${data.address.city} - `}
                {data.address.stateCode}
                {data.address.zipCode && <br />}
                {data.address.zipCode && `CEP: ${data.address.zipCode}`}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Tags */}
      <Dialog open={showTagsModal} onOpenChange={setShowTagsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Tags</DialogTitle>
            <DialogDescription>
              Selecione as tags para adicionar às {selectedPhotos.length} foto(s) selecionada(s).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 h-96 w-full">
            <TagsSelector
              onApply={(tags) => applyTagsToSelected(tags)}
              onCancel={() => setShowTagsModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ContentLocationStep;
