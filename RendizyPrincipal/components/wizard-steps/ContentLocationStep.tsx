/**
 * RENDIZY - Wizard Step: Localização
 *
 * Step 2 do Wizard de Edição de Propriedades
 * Baseado na imagem fornecida pelo usuário
 *
 * @version 1.0.103.9
 * @date 2025-10-29
 */

import { useState } from "react";
import {
  MapPin,
  Upload,
  Image as ImageIcon,
  Car,
  Wifi,
  Globe,
  Clock,
  Zap,
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

interface FormData {
  mode: AddressMode;
  address: AddressData;
  showBuildingNumber: AddressVisibility;
  photos: string[];
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
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ContentLocationStep({
  data,
  onChange,
  modalidades = [],
}: ContentLocationStepProps) {
  const [mapPreviewUrl, setMapPreviewUrl] = useState<string>("");

  // 🆕 Verificar se é modalidade de temporada (para mostrar campos específicos)
  const isShortTermRental = modalidades.includes("short_term_rental");

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
    const address = cepData
      ? `${cepData.logradouro}, ${cepData.bairro}, ${cepData.localidade} - ${cepData.uf}`
      : `${data.address.street}, ${data.address.neighborhood}, ${data.address.city} - ${data.address.stateCode}`;

    // URL do Google Maps Static API (simplificada para preview)
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(
      address
    )}&zoom=15&size=400x300&markers=color:red%7C${encodeURIComponent(
      address
    )}&key=YOUR_API_KEY`;

    setMapPreviewUrl(mapUrl);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // TODO: Implementar upload de fotos
      console.log("Fotos selecionadas:", files);
    }
  };

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
                Adicione fotos do entorno e áreas sociais do endereço da sua
                unidade.
              </p>
            </div>

            {/* Upload Area */}
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Arraste suas imagens para cá ou clique para carregar.
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Imagens
                    </span>
                  </Button>
                </label>
              </CardContent>
            </Card>

            {/* Preview de fotos (se houver) */}
            {data.photos && data.photos.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {data.photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      onClick={() => {
                        const newPhotos = data.photos.filter(
                          (_, i) => i !== index
                        );
                        handleChange("photos", newPhotos);
                      }}
                    >
                      ×
                    </button>
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
    </div>
  );
}

export default ContentLocationStep;
