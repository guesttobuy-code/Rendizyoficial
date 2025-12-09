import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePropertyV2 } from './hooks/usePropertyV2';
import { ArrowLeft, Save, Loader2, Check, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { toast } from 'sonner';

export function PropertyLocationSpoke() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { property, isLoading, isSaving, lastSaved, saveProperty } = usePropertyV2(id);

    // Local State for Address Fields (Parity Check: ALL fields from api.ts included)
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState('Brasil');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [complement, setComplement] = useState('');

    const [isDirty, setIsDirty] = useState(false);

    // Sync with loaded property
    useEffect(() => {
        if (property) {
            // Prioritize direct address object, fallback to wizardData or other sources if needed
            const addr = property.address || {};
            const wizAddr = (property as any).wizardData?.contentLocation?.address || {};

            setZipCode(addr.zipCode || wizAddr.zipCode || '');
            setCountry(addr.country || wizAddr.country || 'Brasil');
            setState(addr.state || wizAddr.state || '');
            setCity(addr.city || wizAddr.city || '');
            setNeighborhood(addr.neighborhood || wizAddr.neighborhood || '');
            setStreet(addr.street || wizAddr.street || '');
            setNumber(addr.number || wizAddr.number || '');
            setComplement(addr.complement || wizAddr.complement || '');
        }
    }, [property]);

    const handleSave = async () => {
        if (!id) return;

        const addressData = {
            zipCode,
            country,
            state,
            city,
            neighborhood,
            street,
            number,
            complement
        };

        // 🛡️ SHOTGUN PAYLOAD: Save in all possible locations
        const payload = {
            // 1. Direct Update
            address: addressData,

            // 2. Wizard Data Structure (Legacy/Backend Normalization)
            wizardData: {
                contentLocation: {
                    address: addressData
                }
            },

            // 3. Fallback flat fields if necessary (unlikely for object, but good for parity)
            contentLocation: {
                address: addressData
            }
        };

        const success = await saveProperty(payload);
        if (success) {
            setIsDirty(false);
            toast.success('Endereço salvo com sucesso!');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSave();
        }
    };

    const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
        setter(value);
        setIsDirty(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="mt-4 text-gray-500">Carregando endereço...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8" onKeyDown={handleKeyDown}>
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/properties-v2')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Localização Completa
                        </h2>
                        <p className="text-sm text-gray-500">
                            Spoke 02 • Endereço do Imóvel
                        </p>
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
                            className={isDirty ? 'bg-blue-600' : 'bg-gray-400'}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isSaving ? 'Salvando...' : 'Salvar Endereço'}
                        </Button>
                    </div>
                </div>

                {/* Address Form Card */}
                <Card className="border-t-4 border-t-green-500 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-600" />
                            Endereço Físico
                        </CardTitle>
                        <CardDescription>
                            Informe todos os detalhes de localização do imóvel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Row 1: CEP & Country */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>CEP / Zip Code</Label>
                                <Input
                                    value={zipCode}
                                    onChange={(e) => handleChange(setZipCode, e.target.value)}
                                    placeholder="00000-000"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>País</Label>
                                <Input
                                    value={country}
                                    onChange={(e) => handleChange(setCountry, e.target.value)}
                                    placeholder="Brasil"
                                />
                            </div>
                        </div>

                        {/* Row 2: State & City */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Estado (UF)</Label>
                                <Input
                                    value={state}
                                    onChange={(e) => handleChange(setState, e.target.value)}
                                    placeholder="SP"
                                    maxLength={2}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Cidade</Label>
                                <Input
                                    value={city}
                                    onChange={(e) => handleChange(setCity, e.target.value)}
                                    placeholder="Ex: São Paulo"
                                />
                            </div>
                        </div>

                        {/* Row 3: Neighborhood & Street */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Bairro</Label>
                                <Input
                                    value={neighborhood}
                                    onChange={(e) => handleChange(setNeighborhood, e.target.value)}
                                    placeholder="Ex: Vila Madalena"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Rua / Logradouro</Label>
                                <Input
                                    value={street}
                                    onChange={(e) => handleChange(setStreet, e.target.value)}
                                    placeholder="Ex: Rua Harmonia"
                                />
                            </div>
                        </div>

                        {/* Row 4: Number & Complement */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Número</Label>
                                <Input
                                    value={number}
                                    onChange={(e) => handleChange(setNumber, e.target.value)}
                                    placeholder="123"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Complemento (Opcional)</Label>
                                <Input
                                    value={complement}
                                    onChange={(e) => handleChange(setComplement, e.target.value)}
                                    placeholder="Ex: Apto 42, Bloco C"
                                />
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Debug View for Trust */}
                <div className="bg-gray-100 p-4 rounded text-xs font-mono text-gray-600 overflow-auto">
                    <strong>DEBUG STATE (Atual):</strong> {JSON.stringify({ zipCode, city, street, number, complement })}
                </div>

            </div>
        </div>
    );
}
