import { useState } from "react";
import { Search, Check, Tag } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";

// ============================================================================
// CONSTANTS - TAGS DE FOTOS
// ============================================================================

export const PHOTO_TAGS = [
    // Quartos
    "Quarto Principal / Suíte Master",
    "Quarto de Casal",
    "Quarto com 2 Camas de Solteiro",
    "Quarto Infantil",
    "Quarto de Hóspedes",
    "Closet",

    // Banheiros
    "Banheiro da Suíte",
    "Banheiro Social",
    "Lavabo",
    "Banheiro de Serviço",

    // Áreas Sociais
    "Sala de Estar",
    "Sala de Jantar",
    "Sala de TV",
    "Home Theater",
    "Sala de Jogos",
    "Escritório / Home Office",
    "Biblioteca",

    // Cozinha e Serviço
    "Cozinha",
    "Cozinha Gourmet",
    "Copa",
    "Despensa",
    "Área de Serviço",
    "Lavanderia",
    "Depósito",

    // Áreas Externas - Lazer
    "Piscina",
    "Área da Churrasqueira",
    "Área Gourmet Externa",
    "Deck",
    "Varanda",
    "Sacada",
    "Terraço",
    "Jardim",
    "Quintal",
    "Gazebo / Pergolado",
    "Sauna",
    "Jacuzzi / Ofurô",

    // Outros Externos
    "Garagem",
    "Estacionamento",
    "Portaria",
    "Entrada / Fachada",

    // Amenidades do Condomínio
    "Piscina do Condomínio",
    "Salão de Festas",
    "Academia / Fitness",
    "Quadra de Esportes",
    "Playground",
    "Espaço Gourmet Coletivo",
    "Salão de Jogos",
    "Spa / Sauna",
    "Praia Privativa",
    "Pier / Marina",

    // Vistas e Paisagens
    "Vista Mar",
    "Vista Montanha",
    "Vista Cidade",
    "Vista Jardim",
    "Vista Piscina",
    "Pôr do Sol",
    "Nascer do Sol",
];

// ============================================================================
// COMPONENT
// ============================================================================

interface TagsSelectorProps {
    onApply: (tags: string[]) => void;
    onCancel: () => void;
    initialSelected?: string[];
}

export function TagsSelector({
    onApply,
    onCancel,
    initialSelected = [],
}: TagsSelectorProps) {
    const [selectedTags, setSelectedTags] = useState<string[]>(initialSelected);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTags = PHOTO_TAGS.filter((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) => {
            const newTags = prev.includes(tag)
                ? prev.filter((t) => t !== tag)
                : [...prev, tag];
            console.log("Tags selecionadas:", newTags);
            return newTags;
        });
    };

    return (
        <div className="space-y-4 flex flex-col h-full">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                />
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-2">
                    {filteredTags.length > 0 ? (
                        filteredTags.map((tag) => {
                            const isSelected = selectedTags.includes(tag);
                            return (
                                <div
                                    key={tag}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted"
                                        }`}
                                    onClick={(e) => {
                                        // Prevent double toggle if clicking directly on checkbox (if checkbox propagates)
                                        // But Shadcn Checkbox usually handles its own event.
                                        // Making Checkbox pointer-events-none ensures only the div click is registered.
                                        e.preventDefault();
                                        toggleTag(tag);
                                    }}
                                >
                                    <div className="pointer-events-none">
                                        <Checkbox checked={isSelected} />
                                    </div>
                                    <span className="text-sm font-medium flex-1 leading-none">{tag}</span>
                                    {isSelected && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                            <Tag className="h-8 w-8 mb-2 opacity-50" />
                            <p>Nenhuma tag encontrada para &quot;{searchQuery}&quot;</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="flex justify-between items-center pt-4 border-t mt-auto">
                <span className="text-sm text-muted-foreground">
                    {selectedTags.length} tag(s) selecionada(s)
                </span>
                <Button
                    onClick={() => onApply(selectedTags)}
                    disabled={selectedTags.length === 0}
                >
                    <Check className="mr-2 h-4 w-4" />
                    Confirmar
                </Button>
            </div>
        </div>
    );
}
