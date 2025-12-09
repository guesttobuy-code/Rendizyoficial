
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePropertyV2 } from './hooks/usePropertyV2';
import { ArrowLeft, Save, Loader2, Check, Home, Building2, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Separator } from '../../components/ui/separator';
import { cn } from '../../components/ui/utils';
import { toast } from 'sonner';

// ============================================================================
// ENUMS (Paridade Estrita com Screenshots do Usuário)
// ============================================================================

// Fonte: ContentTypeStep.tsx (mockLocationTypes)
// Lista completa de 30 tipos de local
const LOCATION_TYPES = [
    { id: "loc_acomodacao_movel", name: "Acomodação Móvel" },
    { id: "loc_albergue", name: "Albergue" },
    { id: "loc_apartamento", name: "Apartamento" },
    { id: "loc_apartamento_residencial", name: "Apartamento/Residencial" },
    { id: "loc_bangalo", name: "Bangalô" },
    { id: "loc_barco", name: "Barco" },
    { id: "loc_barco_beira", name: "Barco/Beira" },
    { id: "loc_boutique", name: "Boutique Hotel" },
    { id: "loc_cabana", name: "Cabana" },
    { id: "loc_cama_cafe", name: "Cama e Café (B&B)" },
    { id: "loc_camping", name: "Camping" },
    { id: "loc_casa", name: "Casa" },
    { id: "loc_casa_movel", name: "Casa Móvel" },
    { id: "loc_castelo", name: "Castelo" },
    { id: "loc_chale", name: "Chalé" },
    { id: "loc_chale_camping", name: "Chalé (Área de Camping)" },
    { id: "loc_condominio", name: "Condomínio" },
    { id: "loc_estalagem", name: "Estalagem" },
    { id: "loc_fazenda", name: "Fazenda para Viajantes" },
    { id: "loc_hotel", name: "Hotel" },
    { id: "loc_hotel_boutique", name: "Hotel Boutique" },
    { id: "loc_hostel", name: "Hostel" },
    { id: "loc_iate", name: "Iate" },
    { id: "loc_industrial", name: "Industrial" },
    { id: "loc_motel", name: "Motel/Carro" },
    { id: "loc_pousada", name: "Pousada Exclusiva" },
    { id: "loc_residencia", name: "Residência" },
    { id: "loc_resort", name: "Resort" },
    { id: "loc_treehouse", name: "Treehouse (Casa na Árvore)" },
    { id: "loc_villa", name: "Villa/Casa" }
].sort((a, b) => a.name.localeCompare(b.name));

// Fonte: Screenshots do Usuário (Nomes com "Inteiro" etc)
const ACCOMMODATION_TYPES = [
    { id: "acc_apartamento", name: "Apartamento Inteiro" }, // Screenshot Match
    { id: "acc_bangalo", name: "Bangalô" },
    { id: "acc_cabana", name: "Cabana" },
    { id: "acc_camping", name: "Camping" },
    { id: "acc_capsula", name: "Cápsula/Trailer/Casa Móvel" },
    { id: "acc_casa", name: "Casa Inteira" }, // Screenshot Match
    { id: "acc_casa_dormitorios", name: "Casa em Dormitórios" },
    { id: "acc_chale", name: "Chalé" },
    { id: "acc_condominio", name: "Condomínio" },
    { id: "acc_dormitorio", name: "Dormitório" },
    { id: "acc_estudio", name: "Estúdio" },
    { id: "acc_holiday_home", name: "Holiday Home" },
    { id: "acc_hostel", name: "Hostel" },
    { id: "acc_hotel", name: "Hotel" },
    { id: "acc_iate", name: "Iate" },
    { id: "acc_industrial", name: "Industrial" },
    { id: "acc_loft", name: "Loft" },
    { id: "acc_quarto_compartilhado", name: "Quarto Compartilhado" },
    { id: "acc_quarto_inteiro", name: "Quarto Inteiro" },
    { id: "acc_quarto_privado", name: "Quarto Privado" },
    { id: "acc_suite", name: "Suíte" },
    { id: "acc_treehouse", name: "Treehouse" },
    { id: "acc_villa", name: "Villa/Casa" }
].sort((a, b) => a.name.localeCompare(b.name));

// Fonte: ContentTypeStep.tsx (lines 712-715)
const SUBTYPES = [
    { id: "entire_place", name: "Imóvel Inteiro" },
    { id: "private_room", name: "Quarto Privativo" },
    { id: "shared_room", name: "Quarto Compartilhado" }
];

export function PropertyIdentitySpoke() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { property, isLoading, isSaving, lastSaved, saveProperty } = usePropertyV2(id);

    // State do Formulário
    const [internalName, setInternalName] = useState('');
    const [propertyTypeId, setPropertyTypeId] = useState(''); // Tipo do Local
    const [accommodationTypeId, setAccommodationTypeId] = useState(''); // Tipo de Acomodação
    const [subtype, setSubtype] = useState('');
    const [structureType, setStructureType] = useState('individual'); // individual | location-linked
    const [modalities, setModalities] = useState<string[]>([]);

    // Auth Error State
    const [authError, setAuthError] = useState(false);

    const [isDirty, setIsDirty] = useState(false);

    // Sync with loaded property
    useEffect(() => {
        if (property) {
            // Mapping inteligente tentando buscar de multiple sources (Shotgun read)
            const p = property as any;
            // 🆕 READ ROBUSTNESS: Handle camelCase and snake_case
            const wd = p.wizardData?.contentType || p.wizardData?.content_type || {};

            // Log para debug
            console.log("📥 [PropertyIdentitySpoke] Dados carregados:", p);
            console.log("📥 [PropertyIdentitySpoke] WizardData:", wd);

            // 🔄 NORMALIZATION LOGIC (The "Anti-Crash" Shield)
            // Legacy data might have 'casa' instead of 'loc_casa'. We must map it.

            // 1. Property Type (Local)
            let rawType = wd.propertyTypeId || p.propertyTypeId || wd.type || p.type || '';
            // Try to find exact match, if not, try to prefix/search
            let validLoc = LOCATION_TYPES.find(t => t.id === rawType)?.id;
            if (!validLoc) validLoc = LOCATION_TYPES.find(t => t.id === `loc_${rawType}`)?.id;
            setPropertyTypeId(validLoc || '');

            // 2. Accommodation Type
            let rawAcc = wd.accommodationTypeId || p.accommodationTypeId || '';
            let validAcc = ACCOMMODATION_TYPES.find(t => t.id === rawAcc)?.id;
            if (!validAcc) validAcc = ACCOMMODATION_TYPES.find(t => t.id === `acc_${rawAcc}`)?.id;
            setAccommodationTypeId(validAcc || '');

            // 3. Subtype
            let rawSub = wd.subtipo || wd.subtype || p.subtype || '';
            const validSub = SUBTYPES.find(t => t.id === rawSub)?.id;
            setSubtype(validSub || '');

            setInternalName(wd.internalName || p.internalName || p.name || '');

            // Normalizar propertyType (legacy pode ser string livre, aqui queremos enum)
            const pType = wd.propertyType || p.structureType || p.propertyType || 'individual';
            setStructureType(['individual', 'location-linked'].includes(pType) ? pType : 'individual');

            setModalities(wd.modalidades || p.modalidades || []);
        }
    }, [property]);

    const handleSave = async () => {
        if (!id) return;
        setAuthError(false);
        const toastId = toast.loading('Salvando alterações...');

        console.log("💾 [PropertyIdentitySpoke] Iniciando salvamento...");

        // payload unificado (Shotgun)
        const payload = {
            name: internalName,
            debug_ts: Date.now(), // Trace update freshness

            // Shotgun Payload: Salva em multiple paths para garantir
            wizardData: {
                // CAMEL CASE (Frontend Std)
                contentType: {
                    internalName,
                    propertyTypeId,
                    accommodationTypeId,
                    subtipo: subtype,
                    subtype: subtype,
                    propertyType: structureType, // Structure (individual/linked)
                    modalidades: modalities, // Legacy Portuguese key
                    modalities: modalities   // 🆕 English key
                },
                // SNAKE CASE (Backend/DB Compatibility)
                content_type: {
                    internalName,
                    propertyTypeId,
                    accommodationTypeId,
                    subtipo: subtype,
                    subtype: subtype,
                    propertyType: structureType,
                    modalidades: modalities,
                    modalities: modalities
                }
            },

            // Flat fields para acesso rápido pelo backend/listas
            internalName,
            propertyTypeId,
            accommodationTypeId,
            subtipo: subtype, // V2 usa subtipo
            subtype: subtype, // Legacy usa subtype
            structureType,
            modalities,
            type: propertyTypeId, // Legacy type fallback
        };

        console.log("🚀 [PropertyIdentitySpoke] PAYLOAD SENDING:", JSON.stringify(payload, null, 2));
        const success = await saveProperty(payload);

        if (success) {
            setIsDirty(false);
            setAuthError(false);
            toast.dismiss(toastId);
            toast.success("Salvo com sucesso!");
            console.log("✅ [PropertyIdentitySpoke] Salvo com sucesso!");
        } else {
            console.error("❌ [PropertyIdentitySpoke] Falha ao salvar.");
            toast.dismiss(toastId);
            toast.error("Erro ao salvar. Verifique se você está logado.", {
                description: "Sua sessão pode ter expirado. Tente recarregar a página."
            });
        }
    };

    const toggleModality = (mod: string) => {
        setModalities(prev =>
            prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
        );
        setIsDirty(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="mt-4 text-gray-500">Carregando dados...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/properties-v2')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Identificação & Tipo
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">Obrigatório</span>
                            <span>Passo 1 de 17</span>
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        {lastSaved && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Check className="w-3 h-3 text-green-500" />
                                Salvo às {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !isDirty}
                            className={cn("min-w-[140px]", isDirty ? 'bg-blue-600' : 'bg-gray-400')}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* SECTION 1: IDENTIFICAÇÃO */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Identificação Interna</CardTitle>
                            <CardDescription>Nome para identificar este imóvel no painel administrativo (visível apenas para equipe).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>Nome Interno</Label>
                                <Input
                                    value={internalName}
                                    onChange={(e) => { setInternalName(e.target.value); setIsDirty(true); }}
                                    placeholder="Ex: Teste 06 Rafa"
                                    className="text-lg bg-gray-50"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* SECTION 2: TIPO E SUBTIPO */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tipo</CardTitle>
                            <CardDescription>Qual é o tipo da acomodação?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Tipo do local</Label>
                                    <Label>Tipo do local</Label>
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={propertyTypeId || ""}
                                        onChange={(e) => { setPropertyTypeId(e.target.value); setIsDirty(true); }}
                                    >
                                        <option value="" disabled>Selecione</option>
                                        {LOCATION_TYPES.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo de acomodação</Label>
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={accommodationTypeId || ""}
                                        onChange={(e) => { setAccommodationTypeId(e.target.value); setIsDirty(true); }}
                                    >
                                        <option value="" disabled>Selecione</option>
                                        {ACCOMMODATION_TYPES.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Subtipo</Label>
                                <p className="text-sm text-gray-500 mb-2">Qual é o subtipo desta acomodação?</p>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={subtype || ""}
                                    onChange={(e) => { setSubtype(e.target.value); setIsDirty(true); }}
                                >
                                    <option value="" disabled>Selecione o subtipo</option>
                                    {SUBTYPES.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SECTION 3: MODALIDADE */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Modalidade</CardTitle>
                            <CardDescription>Em quais modalidades essa unidade se aplica?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2 border p-4 rounded-md bg-white hover:bg-gray-50.transition-colors">
                                <Checkbox
                                    id="mod_short"
                                    checked={modalities.includes('short_term_rental')}
                                    onCheckedChange={() => toggleModality('short_term_rental')}
                                />
                                <Label htmlFor="mod_short" className="cursor-pointer font-normal flex-1">Aluguel por temporada</Label>
                            </div>
                            <div className="flex items-center space-x-2 border p-4 rounded-md bg-white hover:bg-gray-50.transition-colors">
                                <Checkbox
                                    id="mod_sell"
                                    checked={modalities.includes('buy_sell')}
                                    onCheckedChange={() => toggleModality('buy_sell')}
                                />
                                <Label htmlFor="mod_sell" className="cursor-pointer font-normal flex-1">Compra e Venda</Label>
                            </div>
                            <div className="flex items-center space-x-2 border p-4 rounded-md bg-white hover:bg-gray-50.transition-colors">
                                <Checkbox
                                    id="mod_residential"
                                    checked={modalities.includes('residential_rental')}
                                    onCheckedChange={() => toggleModality('residential_rental')}
                                />
                                <Label htmlFor="mod_residential" className="cursor-pointer font-normal flex-1">Locação residencial</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SECTION 4: ESTRUTURA DO ANÚNCIO */}
                    <div>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-xs">NEW</span>
                                Estrutura do Anúncio
                            </h3>
                            <p className="text-sm text-gray-500">Selecione como as amenidades do local serão gerenciadas.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                className={cn(
                                    "border rounded-xl p-6 cursor-pointer transition-all hover:shadow-md bg-white",
                                    structureType === 'individual' ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-200"
                                )}
                                onClick={() => { setStructureType('individual'); setIsDirty(true); }}
                            >
                                <div className="flex items-center gap-2 mb-2 font-bold text-gray-900">
                                    <Home className="w-5 h-5" />
                                    Anúncio Individual
                                </div>
                                <p className="text-sm text-gray-500 mb-6">Casa, apartamento sem prédio, etc.</p>
                                <div className="text-xs space-y-2">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                                            <Check className="w-3 h-3 text-green-600" />
                                        </div>
                                        Amenidades do local: <span className="font-semibold text-gray-900">Editáveis</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                                            <Check className="w-3 h-3 text-green-600" />
                                        </div>
                                        Amenidades da acomodação: <span className="font-semibold text-gray-900">Editáveis</span>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={cn(
                                    "border rounded-xl p-6 cursor-pointer transition-all hover:shadow-md bg-white",
                                    structureType === 'location-linked' ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-200"
                                )}
                                onClick={() => { setStructureType('location-linked'); setIsDirty(true); }}
                            >
                                <div className="flex items-center gap-2 mb-2 font-bold text-gray-900">
                                    <Building2 className="w-5 h-5" />
                                    Anúncio Vinculado
                                </div>
                                <p className="text-sm text-gray-500 mb-6">Apartamento em prédio, quarto em hotel, etc.</p>
                                <div className="text-xs space-y-2">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <div className="w-4 h-4 bg-amber-100 rounded flex items-center justify-center">
                                            <Lock className="w-3 h-3 text-amber-600" />
                                        </div>
                                        Amenidades do local: <span className="font-semibold text-gray-900">Herdadas</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                                            <Check className="w-3 h-3 text-green-600" />
                                        </div>
                                        Amenidades da acomodação: <span className="font-semibold text-gray-900">Editáveis</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dados de Debug (Visível apenas em Dev) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-8 p-4 bg-gray-100 rounded text-xs font-mono text-gray-600 overflow-auto">
                            <strong>🕵️ DEBUG - Payload (Shotgun):</strong>
                            <pre>{JSON.stringify({
                                internalName,
                                propertyTypeId,
                                accommodationTypeId,
                                subtype,
                                structureType,
                                modalities
                            }, null, 2)}</pre>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
