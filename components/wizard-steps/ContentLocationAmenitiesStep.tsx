/**
 * RENDIZY - Content Location Amenities Step (PASSO 4)
 * 
 * Step 4: Amenidades do Local
 * Refatorado para arquitetura URL-Driven (Phase 2)
 * 
 * @version 1.0.104.0
 * @date 2025-12-06
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, Wifi, Cable, Clock, Car, CheckSquare, Home } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Textarea } from '../ui/textarea';
import { LOCATION_AMENITIES } from '../../utils/amenities-categories';
import { useWizardNavigation } from '../../hooks/useWizardNavigation';
import { usePropertyData } from '../../hooks/usePropertyData';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface LocationAmenitiesData {
  tickableAmenities: string[];
  checkInCheckout?: { enabled: boolean; details?: string; };
  parking?: {
    enabled: boolean;
    type?: 'free' | 'paid' | 'not-specified';
    location?: 'on-site' | 'nearby' | 'public';
    reservation?: 'required' | 'not-required' | 'not-available';
    area?: string;
    rate?: string;
  };
  cableInternet?: {
    enabled: boolean;
    availability?: string[];
    pricing?: 'free' | 'additional-cost';
  };
  wifiInternet?: {
    enabled: boolean;
    availability?: string[];
    pricing?: 'free' | 'additional-cost';
  };
  reception24h?: {
    enabled: boolean;
    instructions?: string;
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContentLocationAmenitiesStep() {
  const { propertyId, goToNextStep, goToPreviousStep } = useWizardNavigation();
  const { property, loading: loadingProperty, saveProperty } = usePropertyData(propertyId);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [localData, setLocalData] = useState<LocationAmenitiesData>({
    tickableAmenities: [],
  });

  // ============================================================================
  // INIT DATA
  // ============================================================================

  useEffect(() => {
    if (property && property.wizardData?.contentLocationAmenities) {
      setLocalData(property.wizardData.contentLocationAmenities);
    }
  }, [property]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleToggleTickable = (amenityId: string) => {
    const newTickable = localData.tickableAmenities.includes(amenityId)
      ? localData.tickableAmenities.filter(id => id !== amenityId)
      : [...localData.tickableAmenities, amenityId];

    setLocalData(prev => ({ ...prev, tickableAmenities: newTickable }));
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleUpdate = (updates: Partial<LocationAmenitiesData>) => {
    setLocalData(prev => ({ ...prev, ...updates }));
  };

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  const handleSave = async (advance: boolean = true) => {
    setIsSaving(true);
    try {
      const payload = {
        wizardData: {
          contentLocationAmenities: localData
        }
      };
      const success = await saveProperty(payload, advance); // showToast if saving specifically?
      if (success && advance) {
        goToNextStep();
      } else if (success) {
        toast.success('Alterações salvas!');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // FILTRO
  // ============================================================================

  const filteredCategories = LOCATION_AMENITIES.map(category => ({
    ...category,
    amenities: category.amenities.filter(amenity =>
      amenity.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.amenities.length > 0);


  // ============================================================================
  // RENDER
  // ============================================================================

  if (loadingProperty) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados...</div>;
  }

  return (
    <div className="h-full flex flex-col pb-20">
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* ============================================================ */}
        {/* COLUNA ESQUERDA - Colunas tickáveis (70%) */}
        {/* ============================================================ */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">

          {/* Busca */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Filtro para pesquisar a lista de cada aba"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categorias Colapsáveis */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-2">
              {filteredCategories.map((category) => {
                const categorySelected = category.amenities.filter((amenity) =>
                  localData.tickableAmenities.includes(amenity.id)
                ).length;
                const isExpanded = expandedCategories.has(category.id);

                return (
                  <Collapsible
                    key={category.id}
                    open={isExpanded}
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <Card className="border-2">
                      {/* Header da Categoria */}
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="size-4 text-muted-foreground" />
                              ) : (
                                <ChevronUp className="size-4 text-muted-foreground" />
                              )}
                              <h3 className="font-medium">{category.name}</h3>
                            </div>
                            <Badge variant="secondary" className="text-sm">
                              {categorySelected}/{category.amenities.length}
                            </Badge>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      {/* Conteúdo - Checkboxes */}
                      <CollapsibleContent>
                        <Separator />
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {category.amenities.map((amenity) => {
                              const isChecked = localData.tickableAmenities.includes(amenity.id);

                              return (
                                <div
                                  key={amenity.id}
                                  className="flex items-center gap-3"
                                >
                                  <Checkbox
                                    id={`amenity-${amenity.id}`}
                                    checked={isChecked}
                                    onCheckedChange={() => handleToggleTickable(amenity.id)}
                                  />
                                  <Label
                                    htmlFor={`amenity-${amenity.id}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {amenity.name}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* ============================================================ */}
        {/* COLUNA DIREITA - Acesso, Estacionamento e Internet (30%) */}
        {/* ============================================================ */}
        <div className="w-[400px] flex flex-col gap-4 overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">

              {/* ========== CARD 1: Amenidades básicas ========== */}
              <AmenityCard
                icon={<Home className="size-5" />}
                title="Amenidades básicas"
                subtitle="(combo) cabo internet em todos lugares"
                onSave={() => handleSave(false)}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="Busca rápida" className="pl-10" />
                </div>
              </AmenityCard>

              {/* ========== CARD 2: Check-in/checkout expressos ========== */}
              <AmenityCard
                icon={<CheckSquare className="size-5" />}
                title="Check-in/checkout"
                subtitle="expressos"
                onSave={() => handleSave(false)}
              >
                <YesNoButtons
                  value={localData.checkInCheckout?.enabled}
                  onChange={(enabled) => handleUpdate({ checkInCheckout: { enabled } })}
                />
              </AmenityCard>

              {/* ========== CARD 3: Estacionamento ========== */}
              <AmenityCard
                icon={<Car className="size-5" />}
                title="Estacionamento"
                subtitle="Por favor, informe mais detalhes."
                onSave={() => handleSave(false)}
              >
                <div className="space-y-4">
                  <YesNoButtons
                    value={localData.parking?.enabled}
                    onChange={(enabled) => handleUpdate({ parking: { ...localData.parking, enabled } })}
                  />

                  {localData.parking?.enabled && (
                    <>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Tipo de estacionamento
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            variant={localData.parking?.type === 'free' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleUpdate({ parking: { ...localData.parking, enabled: true, type: 'free' } })}
                          >
                            No local
                          </Button>
                          <Button
                            variant={localData.parking?.type === 'paid' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleUpdate({ parking: { ...localData.parking, enabled: true, type: 'paid' } })}
                          >
                            Em local próximo
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Reserva de estacionamento
                        </Label>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">Não disponível</Button>
                          <Button variant="outline" size="sm" className="flex-1">Necessária reserva</Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Área de estacionamento
                        </Label>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">Público</Button>
                          <Button variant="outline" size="sm" className="flex-1">Particular</Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Taxa Estacionamento
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            variant={localData.parking?.rate === 'free' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleUpdate({ parking: { ...localData.parking, enabled: true, rate: 'free' } })}
                          >
                            Grátis
                          </Button>
                          <Button
                            variant={localData.parking?.rate === 'paid' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleUpdate({ parking: { ...localData.parking, enabled: true, rate: 'paid' } })}
                          >
                            Custo Adicional
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </AmenityCard>

              {/* ========== CARD 4: Internet a Cabo ========== */}
              <AmenityCard
                icon={<Cable className="size-5" />}
                title="Internet a Cabo"
                subtitle="Por favor, informe mais detalhes."
                onSave={() => handleSave(false)}
              >
                <div className="space-y-4">
                  <YesNoButtons
                    value={localData.cableInternet?.enabled}
                    onChange={(enabled) => handleUpdate({ cableInternet: { ...localData.cableInternet, enabled } })}
                  />

                  {localData.cableInternet?.enabled && (
                    <>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Onde está disponível?
                        </Label>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full justify-start text-cyan-600 border-cyan-200 bg-cyan-50 hover:bg-cyan-100">
                            Em todo o estabelecimento
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                            Apenas em áreas públicas
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                            Todas as acomodações
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                            Em algumas acomodações
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                            Business center
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Aplicação de Cobrança
                        </Label>
                        <div className="space-y-2">
                          <Button
                            variant={localData.cableInternet?.pricing === 'free' ? 'default' : 'outline'}
                            size="sm"
                            className="w-full"
                            onClick={() => handleUpdate({ cableInternet: { ...localData.cableInternet, enabled: true, pricing: 'free' } })}
                          >
                            Grátis
                          </Button>
                          <Button
                            variant={localData.cableInternet?.pricing === 'additional-cost' ? 'default' : 'outline'}
                            size="sm"
                            className="w-full"
                            onClick={() => handleUpdate({ cableInternet: { ...localData.cableInternet, enabled: true, pricing: 'additional-cost' } })}
                          >
                            Custo Adicional
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </AmenityCard>

              {/* ========== CARD 5: Internet Wi-Fi ========== */}
              <AmenityCard
                icon={<Wifi className="size-5" />}
                title="Internet Wi-Fi"
                subtitle="Por favor, informe mais detalhes."
                onSave={() => handleSave(false)}
              >
                <div className="space-y-4">
                  <YesNoButtons
                    value={localData.wifiInternet?.enabled}
                    onChange={(enabled) => handleUpdate({ wifiInternet: { ...localData.wifiInternet, enabled } })}
                  />

                  {localData.wifiInternet?.enabled && (
                    <>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Onde está disponível?
                        </Label>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full justify-start text-cyan-600 border-cyan-200 bg-cyan-50 hover:bg-cyan-100">
                            Em todo o estabelecimento
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                            Apenas em áreas públicas
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                            Todas as acomodações
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                            Em algumas acomodações
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                            Business center
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Aplicação de Cobrança
                        </Label>
                        <div className="space-y-2">
                          <Button
                            variant={localData.wifiInternet?.pricing === 'free' ? 'default' : 'outline'}
                            size="sm"
                            className="w-full"
                            onClick={() => handleUpdate({ wifiInternet: { ...localData.wifiInternet, enabled: true, pricing: 'free' } })}
                          >
                            Grátis
                          </Button>
                          <Button
                            variant={localData.wifiInternet?.pricing === 'additional-cost' ? 'default' : 'outline'}
                            size="sm"
                            className="w-full"
                            onClick={() => handleUpdate({ wifiInternet: { ...localData.wifiInternet, enabled: true, pricing: 'additional-cost' } })}
                          >
                            Custo Adicional
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </AmenityCard>

              {/* ========== CARD 6: Recepção 24 horas ========== */}
              <AmenityCard
                icon={<Clock className="size-5" />}
                title="Recepção 24 horas"
                subtitle="Por favor, informe mais detalhes."
                onSave={() => handleSave(false)}
              >
                <div className="space-y-4">
                  <YesNoButtons
                    value={localData.reception24h?.enabled}
                    onChange={(enabled) => handleUpdate({ reception24h: { ...localData.reception24h, enabled } })}
                  />

                  {localData.reception24h?.enabled && (
                    <div>
                      <Label className="text-sm mb-2 block">Instruções para Artista</Label>
                      <Textarea
                        placeholder="Sobreescrever as informações padrão do Artista? Se você fornecer instruções aqui, estas serão incluídas na informação que será disponibilizada ao artista."
                        value={localData.reception24h?.instructions || ''}
                        onChange={(e) => handleUpdate({ reception24h: { ...localData.reception24h, enabled: true, instructions: e.target.value } })}
                        rows={4}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </AmenityCard>

            </div>
          </ScrollArea>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="fixed bottom-0 left-64 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 flex justify-between items-center z-10">
        <div className="text-sm text-muted-foreground">
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={isSaving} onClick={goToPreviousStep}>Voltar</Button>
          <Button onClick={() => handleSave(true)} disabled={isSaving || loadingProperty}>
            {isSaving ? 'Salvando...' : 'Salvar e Avançar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AmenityCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSave?: () => void;
}

function AmenityCard({ icon, title, subtitle, children, onSave }: AmenityCardProps) {
  return (
    <Card className="border-2">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="text-gray-500 mt-0.5">{icon}</div>
            <div>
              <h3 className="font-semibold text-base leading-tight">{title}</h3>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {onSave && (
            <Button size="sm" variant="default" className="shrink-0 bg-cyan-500 hover:bg-cyan-600" onClick={onSave}>
              Salvar
            </Button>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-4">
        {children}
      </CardContent>
    </Card>
  );
}

interface YesNoButtonsProps {
  value?: boolean;
  onChange: (value: boolean) => void;
}

function YesNoButtons({ value, onChange }: YesNoButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={value === true ? 'default' : 'outline'}
        size="sm"
        className={value === true ? 'flex-1 bg-cyan-500 hover:bg-cyan-600' : 'flex-1 bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100'}
        onClick={() => onChange(true)}
      >
        Sim
      </Button>
      <Button
        variant={value === false ? 'default' : 'outline'}
        size="sm"
        className={value === false ? 'flex-1 bg-cyan-500 hover:bg-cyan-600' : 'flex-1 bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100'}
        onClick={() => onChange(false)}
      >
        Não
      </Button>
    </div>
  );
}

export default ContentLocationAmenitiesStep;