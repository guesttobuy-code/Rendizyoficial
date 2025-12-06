/**
 * RENDIZY - Content Photos Step (Visual Tour)
 *
 * Step 04 do wizard de conteúdo (Antigo Step 06)
 *
 * FUNCIONALIDADES:
 * - Visualização "Tour" (somente leitura) das fotos organizadas por cômodo
 * - Definir foto de capa (Global)
 * - Trava: Capa deve ser horizontal
 * - Excluir fotos (remove do cômodo)
 * - Ajuste UX: Grid flexível para exibir fotos horizontais/verticais corretamente
 * - 🆕 DESTAQUE DE CAPA: Foto de capa sai do grid e vai para o topo
 * - 🆕 CONFIRMAÇÃO: Diálogo para confirmar troca de capa
 *
 * @version 1.0.104.3
 * @date 2025-12-05
 */

import { useState } from "react";
import {
  Image as ImageIcon,
  Star,
  Eye,
  Info,
  MapPin,
  Camera,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"; // Import CheckCircle2 here
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

// ============================================================================
// TYPES
// ============================================================================

interface Photo {
  id: string;
  url: string;
  tags?: string[];
  order?: number;
  description?: string;
  width?: number; // Optional metadata if available
  height?: number;
}

interface Room {
  id: string;
  type: string;
  typeName: string;
  customName?: string;
  isShared: boolean;
  photos: Photo[];
}

interface ContentPhotosData {
  coverPhotoId?: string;
  // Mantemos photos array por compatibilidade
  photos?: Photo[];
}

interface ContentPhotosStepProps {
  data: ContentPhotosData;
  rooms: Room[]; // Recebe os cômodos com suas fotos
  onChange: (data: ContentPhotosData) => void;
  // 🆕 Callback para atualizar cômodos (exclusão de fotos)
  onRoomsUpdate?: (rooms: Room[]) => void;
  propertyId?: string;
}

// ============================================================================
// HELPER: VALIDATE IMAGE DIMENSIONS
// ============================================================================

const isHorizontal = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Considera horizontal se width >= height (paisagem ou quadrado)
      resolve(img.width > img.height);
    };
    img.onerror = () => {
      resolve(true); // Fallback: permite se não conseguir carregar
    };
    img.src = url;
  });
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ContentPhotosStep({
  data,
  rooms,
  onChange,
  onRoomsUpdate,
}: ContentPhotosStepProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [validatingCover, setValidatingCover] = useState<string | null>(null);
  const [pendingCoverPhoto, setPendingCoverPhoto] = useState<Photo | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Calcular todas as fotos
  const allPhotos = rooms.flatMap((r) => r.photos);

  // Capa atual (não fallback automático visualmente, apenas se definido)
  // SE não tiver coverPhotoId definido, não mostramos nada no topo?
  // O usuário disse: "assim que definirmos qual a fotos de capa... ele se mova".
  // Vamos assumir que data.coverPhotoId é a fonte da verdade.
  const currentCoverId = data.coverPhotoId;
  const currentCoverPhoto = allPhotos.find(p => p.id === currentCoverId);

  // 🆕 INITIATE SET COVER (Opens confirmation)
  const handleInitiateSetCover = async (photo: Photo) => {
    setValidatingCover(photo.id);
    const isLandscape = await isHorizontal(photo.url);
    setValidatingCover(null);

    if (!isLandscape) {
      toast.error("Foto de capa inválida", {
        description: "A foto de capa deve ser horizontal (paisagem).",
      });
      return;
    }

    setPendingCoverPhoto(photo);
    setIsConfirmDialogOpen(true);
  };

  // 🆕 CONFIRM SET COVER
  const handleConfirmSetCover = () => {
    if (pendingCoverPhoto) {
      onChange({
        ...data,
        coverPhotoId: pendingCoverPhoto.id,
      });
      toast.success("Foto de capa definida!");
      setIsConfirmDialogOpen(false);
      setPendingCoverPhoto(null);
    }
  };

  // 🆕 DELETE PHOTO
  const handleDeletePhoto = (roomId: string, photoId: string) => {
    if (!onRoomsUpdate) return;

    const newRooms = rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        photos: room.photos.filter(p => p.id !== photoId)
      };
    });

    onRoomsUpdate(newRooms);

    // Se a foto deletada era a capa, limpar capa
    if (photoId === currentCoverId) {
      onChange({
        ...data,
        coverPhotoId: undefined
      });
    }
  };


  // Se não houver quartos ou fotos
  if (rooms.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Nenhum cômodo definido</AlertTitle>
        <AlertDescription>
          Você precisa definir os cômodos e adicionar fotos no passo anterior
          ("Cômodos e Fotos") para visualizar o tour aqui.
        </AlertDescription>
      </Alert>
    );
  }

  const hasAnyPhoto = rooms.some((r) => r.photos.length > 0);

  if (!hasAnyPhoto) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border-2 border-dashed rounded-lg bg-muted/20">
        <div className="p-4 bg-muted rounded-full">
          <Camera className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Sem fotos ainda</h3>
          <p className="text-muted-foreground max-w-sm">
            Volte para o passo "Cômodos e Fotos" para fazer upload das imagens
            de cada ambiente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* CONFIRMATION DIALOG */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Definir Foto de Capa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja definir esta foto como capa do imóvel?
              Ela será movida para o destaque no topo da página.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingCoverPhoto && (
            <div className="my-4 aspect-video relative rounded-md overflow-hidden bg-black/10 border">
              <img
                src={pendingCoverPhoto.url}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingCoverPhoto(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSetCover}>Sim, definir capa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Tour Visual da Propriedade
          </h2>
          <p className="text-sm text-muted-foreground">
            Confira como as fotos serão exibidas para os hóspedes.
          </p>
        </div>
      </div>

      {/* 🆕 COVER PHOTO HERO SECTION */}
      {currentCoverPhoto && (
        <div className="bg-muted/30 p-6 rounded-xl border border-yellow-500/30 ring-1 ring-yellow-500/10">
          <div className="flex items-center gap-2 mb-4 text-yellow-600 dark:text-yellow-500 font-semibold">
            <Star className="h-5 w-5 fill-current" />
            <h3>Foto de Capa do Anúncio</h3>
          </div>

          <div className="relative aspect-video w-full max-w-3xl mx-auto bg-black/5 rounded-lg overflow-hidden border shadow-sm group">
            <img
              src={currentCoverPhoto.url}
              alt="Cover View"
              className="w-full h-full object-contain"
            />

            {/* Overlay Actions for Cover */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
              <Badge className="bg-black/70 text-white hover:bg-black/80 cursor-default">
                Foto de Capa Ativa
              </Badge>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Esta imagem será o destaque principal do seu anúncio nas listagens.
          </p>
        </div>
      )}

      {!currentCoverPhoto && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/5 text-yellow-900 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Nenhuma capa definida!</AlertTitle>
          <AlertDescription>
            Selecione uma foto abaixo para ser a capa do seu anúncio.
          </AlertDescription>
        </Alert>
      )}


      {/* ROOMS LIST */}
      <div className="space-y-12">
        {rooms.map((room) => {
          // Filter out the current cover photo from the grid
          const photosToShow = room.photos.filter(p => p.id !== currentCoverId);

          if (photosToShow.length === 0) return null;

          return (
            <div key={room.id} className="space-y-4">
              {/* Room Header */}
              <div className="flex items-center gap-2 border-b pb-2 sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-lg">
                  {room.customName || room.typeName}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {photosToShow.length} fotos
                </Badge>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {photosToShow.map((photo) => {
                  const isValidating = validatingCover === photo.id;

                  return (
                    <div
                      key={photo.id}
                      className="group relative rounded-lg overflow-hidden border bg-black/5 border-border hover:border-primary/50 flex items-center justify-center transition-all"
                      style={{ height: '220px' }}
                    >
                      <img
                        src={photo.url}
                        alt="Room photo"
                        className="w-full h-full object-contain bg-neutral-100 dark:bg-neutral-900"
                      />

                      {/* Actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">

                        {/* Top Actions: View */}
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => setSelectedPhoto(photo)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                              <div className="relative w-full h-[80vh] flex items-center justify-center pointer-events-none">
                                <img
                                  src={photo.url}
                                  alt="Full view"
                                  className="max-w-full max-h-full object-contain pointer-events-auto rounded-md shadow-2xl"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>

                          {onRoomsUpdate && (
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-8 w-8 rounded-full"
                              onClick={() => handleDeletePhoto(room.id, photo.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Bottom Action: Set Cover */}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full max-w-[140px] text-xs font-medium mt-2 shadow-lg hover:bg-white"
                          onClick={() => handleInitiateSetCover(photo)}
                          disabled={isValidating}
                        >
                          {isValidating ? (
                            "Verificando..."
                          ) : (
                            <>
                              <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                              Definir como Capa
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div >
  );
}

export default ContentPhotosStep;
