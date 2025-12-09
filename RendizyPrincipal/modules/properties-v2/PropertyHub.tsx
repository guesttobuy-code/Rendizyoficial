import React, { useEffect, useState } from 'react';
import { propertiesApi, Property } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Plus, Home, MapPin, Edit3, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../../components/ui/alert-dialog';

export function PropertyHub() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const navigate = useNavigate();

    const loadProperties = async () => {
        setIsLoading(true);
        const res = await propertiesApi.list();
        if (res.success && res.data) {
            // Sort by updated_at desc (newest first)
            const sorted = res.data.sort((a: any, b: any) =>
                new Date(b.updatedAt || b.created_at || 0).getTime() - new Date(a.updatedAt || a.created_at || 0).getTime()
            );
            setProperties(sorted);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadProperties();
    }, []);

    const handleCreate = async () => {
        const newProp = {
            name: 'Novo Anúncio Rascunho',
            type: 'residencia', // Valor inicial padrão
            status: 'draft'
        };

        // Fixed: Single await
        const res = await propertiesApi.create(newProp);
        if (res.success && res.data) {
            navigate(`/properties-v2/${res.data.id}/identification`);
        } else {
            toast.error('Erro ao criar rascunho. Backend offline?');
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        // Fixed: Permanent true
        const res = await propertiesApi.delete(id, { permanent: true });
        if (res.success) {
            toast.success('Imóvel removido permanentemente');
            loadProperties();
        } else {
            toast.error('Erro ao remover imóvel');
        }
        setDeletingId(null);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                        Hub de Propriedades (V2)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Arquitetura "Atomic Hub & Spoke" - Dados Persistentes
                    </p>
                </div>
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Anúncio (Draft-First)
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-400">Carregando imóveis...</div>
            ) : (
                <>
                    {properties.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <Home className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Nenhum anúncio encontrado</h3>
                            <p className="text-gray-500 mb-6">Comece criando seu primeiro rascunho V2.</p>
                            <Button onClick={handleCreate} variant="outline">
                                Criar Agora
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {properties.map(p => (
                                <Card key={p.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-800 relative">

                                    {/* Delete Button (Hover Only) */}
                                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon" className="h-8 w-8 shadow-sm">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o imóvel e todos os dados associados.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-red-600 hover:bg-red-700"
                                                        onClick={() => handleDelete(p.id)}
                                                    >
                                                        {deletingId === p.id ? 'Excluindo...' : 'Sim, excluir'}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>

                                    <div className="h-32 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                        {p.photos?.[0] ? (
                                            <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Home className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                                            {p.status || 'draft'}
                                        </div>
                                    </div>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="truncate text-lg">{(p as any).internal_name || (p as any).internalName || p.name || 'Sem nome'}</CardTitle>
                                        <CardDescription className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {p.address?.city || 'Local não definido'}
                                            </div>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            <Button variant="outline" size="sm" onClick={() => navigate(`/properties-v2/${p.id}/identification`)}>
                                                <Edit3 className="w-3 h-3 mr-2" />
                                                Identidade
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => navigate(`/properties-v2/${p.id}/location`)}>
                                                <MapPin className="w-3 h-3 mr-2" />
                                                Endereço
                                            </Button>
                                        </div>

                                        {/* Debug Data Dump */}
                                        <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-900 rounded text-[10px] font-mono text-gray-500 overflow-hidden h-20 hover:h-auto hover:absolute hover:z-20 hover:shadow-xl hover:bg-white transition-all border border-gray-100">
                                            <p className="font-bold text-gray-700 mb-1">DATA DUMP (Debug):</p>
                                            <pre className="whitespace-pre-wrap word-break-break-all">
                                                {JSON.stringify({
                                                    id: p.id,
                                                    type: p.type,
                                                    city: p.address?.city,
                                                    state: p.address?.state,
                                                    internal_name: (p as any).internal_name
                                                }, null, 2)}
                                            </pre>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
